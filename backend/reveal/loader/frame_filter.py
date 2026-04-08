"""RMSF-based rigid-frame pre-filter.

Frames where all per-residue RMSF values fall below a threshold are labelled
"rigid" and excluded from GNN inference.  Rigid frames cannot contain open
cryptic pockets by definition, and skipping them reduces compute by ~30–40%.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from reveal.loader.trajectory import LoadedTrajectory

logger = logging.getLogger(__name__)


@dataclass
class FrameFilterResult:
    """Output of the RMSF-based frame filter.

    Attributes:
        active_frames:  Sorted array of frame indices that passed the filter.
        rigid_frames:   Sorted array of frame indices that were skipped.
        n_total:        Total frames in the trajectory.
        fraction_active: Fraction that passed.
    """
    active_frames: np.ndarray
    rigid_frames: np.ndarray
    n_total: int

    @property
    def n_active(self) -> int:
        return len(self.active_frames)

    @property
    def fraction_active(self) -> float:
        return self.n_active / self.n_total if self.n_total > 0 else 0.0


class FrameFilter:
    """Applies RMSF-based rigid-frame pre-filtering."""

    def __init__(self, rmsf_threshold: float = 0.5) -> None:
        self._threshold = rmsf_threshold

    def filter(
        self,
        trajectory: LoadedTrajectory,
        per_frame_path: Path | None,
    ) -> FrameFilterResult:
        """Identify which frames are worth running GNN inference on.

        Strategy:
        1. If Scout's per_frame.json is available, read per-residue RMSF
           annotations and use them to mark frames as rigid.
        2. Otherwise, compute an approximate per-frame displacement from the
           mean structure (max Cα deviation across all residues) and use that
           as a proxy.

        Args:
            trajectory:      Loaded protein trajectory.
            per_frame_path:  Path to Scout's per_frame.json, or None.

        Returns:
            FrameFilterResult with active and rigid frame index arrays.
        """
        n = trajectory.n_frames

        if per_frame_path is not None and per_frame_path.exists():
            active = self._filter_from_per_frame_json(
                per_frame_path, n, trajectory.ca_coords
            )
        else:
            logger.warning(
                "per_frame.json not found — using per-frame Cα deviation as rigid proxy"
            )
            active = self._filter_from_ca_deviation(trajectory.ca_coords)

        rigid = np.setdiff1d(np.arange(n), active)
        logger.info(
            "Frame filter: %d/%d active (%.1f%% of frames will be scored)",
            len(active), n, 100.0 * len(active) / n,
        )
        return FrameFilterResult(active_frames=active, rigid_frames=rigid, n_total=n)

    # ── private ───────────────────────────────────────────────────────────────

    def _filter_from_per_frame_json(
        self,
        per_frame_path: Path,
        n_frames: int,
        ca_coords: np.ndarray,
    ) -> np.ndarray:
        """Use Scout's per-frame RMSF annotations to identify mobile frames."""
        data: list[dict] = json.loads(per_frame_path.read_text())

        if len(data) != n_frames:
            logger.warning(
                "per_frame.json has %d entries but trajectory has %d frames — "
                "falling back to Cα deviation filter",
                len(data), n_frames,
            )
            return self._filter_from_ca_deviation(ca_coords)

        active: list[int] = []
        for frame_idx, frame_data in enumerate(data):
            # Scout annotates per-residue RMSF as a list under key "rmsf".
            rmsf_values = frame_data.get("rmsf")
            if rmsf_values is None:
                # No RMSF annotation — keep the frame.
                active.append(frame_idx)
                continue
            max_rmsf = float(np.max(rmsf_values))
            if max_rmsf >= self._threshold:
                active.append(frame_idx)

        return np.array(active, dtype=np.int64)

    def _filter_from_ca_deviation(self, ca_coords: np.ndarray) -> np.ndarray:
        """Proxy filter: frame is active if any residue deviates ≥ threshold from mean."""
        # ca_coords: (n_frames, n_residues, 3) in Å
        mean_coords = ca_coords.mean(axis=0, keepdims=True)  # (1, n_res, 3)
        deviations = np.linalg.norm(ca_coords - mean_coords, axis=2)  # (n_frames, n_res)
        max_deviation = deviations.max(axis=1)  # (n_frames,)
        active = np.where(max_deviation >= self._threshold)[0]
        return active.astype(np.int64)
