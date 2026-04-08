"""VRAM budget estimation and batch size management.

Automatically selects an appropriate GPU batch size (frames per forward pass)
to stay within available VRAM headroom, accounting for:
  - GVP-GNN model weights (~150 MB for 128s+16v, 4 layers)
  - Per-frame graph tensors (scales with n_residues and n_edges)
  - Output score buffer

Default batch size is 256 frames, which fits within 8 GB VRAM headroom
on an RTX 5070 Ti after model load.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import torch

logger = logging.getLogger(__name__)

# Approximate model memory footprint in bytes.
_MODEL_VRAM_BYTES = 150 * 1024 * 1024  # 150 MB

# Per-frame memory: node tensors + edge tensors + output.
# Scales with n_residues (~350 for typical protein) and n_edges (~7×n_res).
# Empirically: ~2 MB per frame for a 350-residue protein.
_BYTES_PER_FRAME = 2 * 1024 * 1024  # 2 MB — conservative estimate

# Safety margin: reserve 20% of VRAM for OS and other processes.
_VRAM_SAFETY_MARGIN = 0.20


@dataclass
class VramBudget:
    """VRAM budget information for the current device."""
    device: str
    total_bytes: int
    available_bytes: int
    model_bytes: int
    headroom_bytes: int
    recommended_batch_size: int

    @property
    def total_gb(self) -> float:
        return self.total_bytes / (1024 ** 3)

    @property
    def available_gb(self) -> float:
        return self.available_bytes / (1024 ** 3)


class BatchManager:
    """Estimates VRAM budget and recommends an inference batch size."""

    def __init__(
        self,
        device: str = "cuda",
        default_batch_size: int = 256,
        bytes_per_frame: int = _BYTES_PER_FRAME,
    ) -> None:
        self._device = device
        self._default_batch_size = default_batch_size
        self._bytes_per_frame = bytes_per_frame

    def estimate(self, n_residues: int = 350) -> VramBudget:
        """Estimate VRAM budget and compute recommended batch size.

        Args:
            n_residues: Protein size (scales memory per frame).

        Returns:
            VramBudget with recommended_batch_size.
        """
        if not torch.cuda.is_available() or self._device == "cpu":
            return VramBudget(
                device="cpu",
                total_bytes=0,
                available_bytes=0,
                model_bytes=_MODEL_VRAM_BYTES,
                headroom_bytes=0,
                recommended_batch_size=self._default_batch_size,
            )

        try:
            device_idx = torch.cuda.current_device()
            total_bytes = torch.cuda.get_device_properties(device_idx).total_memory
            reserved_bytes = torch.cuda.memory_reserved(device_idx)
            allocated_bytes = torch.cuda.memory_allocated(device_idx)
            available_bytes = total_bytes - reserved_bytes

            headroom_bytes = int(
                (available_bytes - _MODEL_VRAM_BYTES) * (1 - _VRAM_SAFETY_MARGIN)
            )
            # Scale bytes_per_frame by protein size relative to 350 residues.
            size_factor = max(1.0, n_residues / 350.0)
            scaled_bpf = int(self._bytes_per_frame * size_factor)
            recommended = max(1, headroom_bytes // scaled_bpf)
            recommended = min(recommended, self._default_batch_size)

            budget = VramBudget(
                device=f"cuda:{device_idx}",
                total_bytes=total_bytes,
                available_bytes=available_bytes,
                model_bytes=_MODEL_VRAM_BYTES,
                headroom_bytes=max(0, headroom_bytes),
                recommended_batch_size=recommended,
            )
            logger.info(
                "VRAM: %.1f GB total, %.1f GB available → batch_size=%d "
                "(protein=%d residues)",
                budget.total_gb, budget.available_gb,
                recommended, n_residues,
            )
            return budget

        except Exception as exc:
            logger.warning("VRAM estimation failed (%s) — using default batch size", exc)
            return VramBudget(
                device=self._device,
                total_bytes=0,
                available_bytes=0,
                model_bytes=_MODEL_VRAM_BYTES,
                headroom_bytes=0,
                recommended_batch_size=self._default_batch_size,
            )
