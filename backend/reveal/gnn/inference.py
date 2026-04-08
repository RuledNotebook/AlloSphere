"""GPU-batched GVP-GNN inference across all trajectory frames.

Processes frames in configurable batch sizes (default 256) to stay within
VRAM budget.  Outputs a per-residue score array of shape (n_active_frames,
n_residues), dtype float32.

Scores are written to a temporary HDF5 scratch file to avoid holding all
frames in VRAM simultaneously.
"""

from __future__ import annotations

import logging
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

import h5py
import numpy as np
import torch

from reveal.exceptions import CheckpointNotFoundError
from reveal.gnn.model import GVPGNNModel
from reveal.gnn.graph_builder import build_residue_graph
from reveal.loader.trajectory import LoadedTrajectory
from reveal.constants import CHECKPOINT_PATH, DEFAULT_GPU_BATCH_SIZE

logger = logging.getLogger(__name__)


@dataclass
class PerResidueScores:
    """Output of GNN inference.

    Attributes:
        scores:        Float32 array, shape (n_active, n_residues).
        active_frames: Frame indices that were scored (matches scores rows).
        scratch_path:  Path to the backing HDF5 scratch file.
    """
    scores: np.ndarray       # (n_active, n_residues)
    active_frames: np.ndarray  # (n_active,) int64
    scratch_path: Path


class GNNInferenceEngine:
    """Loads the GVP-GNN checkpoint and runs batched inference."""

    def __init__(
        self,
        checkpoint_path: Path | None = None,
        device: str = "cuda",
        batch_size: int = DEFAULT_GPU_BATCH_SIZE,
    ) -> None:
        self._checkpoint_path = checkpoint_path or CHECKPOINT_PATH
        self._device_str = device
        self._batch_size = batch_size
        self._model: GVPGNNModel | None = None
        self._device: torch.device | None = None

    # ── public API ────────────────────────────────────────────────────────────

    def run(
        self,
        trajectory: LoadedTrajectory,
        active_frames: np.ndarray,
        rmsf: np.ndarray,
        scratch_dir: Path | None = None,
    ) -> PerResidueScores:
        """Run per-residue GNN scoring across all active frames.

        Args:
            trajectory:    Protein trajectory with Cα/Cβ coordinates.
            active_frames: Frame indices to score (output of FrameFilter).
            rmsf:          Per-residue RMSF in Å (n_residues,).
            scratch_dir:   Directory for temporary HDF5 scratch file.

        Returns:
            PerResidueScores with score array and active frame indices.
        """
        self._ensure_model_loaded()

        n_active = len(active_frames)
        n_res = trajectory.n_residues
        logger.info(
            "GNN inference: %d frames × %d residues on device '%s', batch_size=%d",
            n_active, n_res, self._device_str, self._batch_size,
        )

        # Create scratch HDF5 for score storage.
        scratch_file = tempfile.NamedTemporaryFile(
            suffix="_reveal_scores.h5",
            dir=scratch_dir,
            delete=False,
        )
        scratch_path = Path(scratch_file.name)
        scratch_file.close()

        t0 = time.perf_counter()
        with h5py.File(scratch_path, "w") as h5:
            ds = h5.create_dataset(
                "scores",
                shape=(n_active, n_res),
                dtype="float32",
                chunks=(min(self._batch_size, n_active), n_res),
            )

            for batch_start in range(0, n_active, self._batch_size):
                batch_frames = active_frames[batch_start: batch_start + self._batch_size]
                batch_scores = self._score_batch(trajectory, batch_frames, rmsf)
                ds[batch_start: batch_start + len(batch_frames)] = batch_scores

                if logger.isEnabledFor(logging.DEBUG):
                    elapsed = time.perf_counter() - t0
                    fps = (batch_start + len(batch_frames)) / (elapsed + 1e-9)
                    logger.debug(
                        "  scored %d/%d frames (%.0f frames/sec)",
                        batch_start + len(batch_frames), n_active, fps,
                    )

        elapsed = time.perf_counter() - t0
        fps = n_active / (elapsed + 1e-9)
        logger.info(
            "GNN inference complete: %.1f sec, %.0f frames/sec",
            elapsed, fps,
        )

        # Load scores from scratch into a numpy array.
        with h5py.File(scratch_path, "r") as h5:
            scores = h5["scores"][:]

        return PerResidueScores(
            scores=scores,
            active_frames=active_frames,
            scratch_path=scratch_path,
        )

    # ── private ───────────────────────────────────────────────────────────────

    def _ensure_model_loaded(self) -> None:
        if self._model is not None:
            return

        # Resolve device — fall back to CPU if CUDA is unavailable.
        device_str = self._device_str
        if device_str == "cuda" and not torch.cuda.is_available():
            logger.warning("CUDA not available — falling back to CPU inference")
            device_str = "cpu"
        self._device = torch.device(device_str)

        self._model = GVPGNNModel()

        if self._checkpoint_path.exists():
            logger.info("Loading GVP-GNN checkpoint from %s", self._checkpoint_path)
            state = torch.load(
                self._checkpoint_path,
                map_location=self._device,
                weights_only=True,
            )
            # Accept both raw state_dict and {'model': state_dict} wrappers.
            if "model" in state:
                state = state["model"]
            self._model.load_state_dict(state)
        else:
            logger.warning(
                "Checkpoint not found at %s — using random weights. "
                "Scores will not be meaningful. Run `reveal download-weights` to fix.",
                self._checkpoint_path,
            )

        self._model.to(self._device)
        self._model.eval()

    def _score_batch(
        self,
        trajectory: LoadedTrajectory,
        frame_indices: np.ndarray,
        rmsf: np.ndarray,
    ) -> np.ndarray:
        """Score one batch of frames.

        Returns:
            Float32 array of shape (len(frame_indices), n_residues).
        """
        n_batch = len(frame_indices)
        n_res = trajectory.n_residues
        batch_scores = np.zeros((n_batch, n_res), dtype=np.float32)

        with torch.no_grad():
            for i, frame_idx in enumerate(frame_indices):
                ca = trajectory.ca_coords[frame_idx]  # (n_res, 3)
                cb = trajectory.cb_coords[frame_idx]  # (n_res, 3)

                graph = build_residue_graph(
                    ca_coords=ca,
                    cb_coords=cb,
                    residue_names=trajectory.residue_names,
                    rmsf=rmsf,
                )

                # Move tensors to device.
                node_s = graph.node_s.to(self._device)
                node_v = graph.node_v.to(self._device)
                edge_s = graph.edge_s.to(self._device)
                edge_v = graph.edge_v.to(self._device)
                edge_index = graph.edge_index.to(self._device)

                scores = self._model(node_s, node_v, edge_s, edge_v, edge_index)
                batch_scores[i] = scores.cpu().numpy()

        return batch_scores
