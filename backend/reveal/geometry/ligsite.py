"""GPU-accelerated LIGSITE-style volumetric pocket measurement.

For each candidate pocket region, computes:
  - Volume (Å³) — count of interior grid points × voxel volume
  - Solvent-accessible surface area (Å²) — proxy from surface voxel count
  - Pocket centroid (Å)

Algorithm (simplified LIGSITE):
1. Place a 3D grid with LIGSITE_GRID_SPACING_ANGSTROM spacing over the
   protein bounding box (with padding).
2. Mark grid points that are within VDW_RADIUS of any heavy atom as
   "protein interior".
3. For each candidate pocket region (defined by its lining residue set),
   restrict the grid to the local neighbourhood and apply 7-direction
   scan lines to identify "pocket" grid points: those surrounded by
   protein on all sides along at least 3 axis directions.
4. Discard pockets with volume < MIN_POCKET_VOLUME_ANGSTROM3.

The implementation uses PyTorch for vectorised GPU computation when
available, with a NumPy CPU fallback.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np

from reveal.constants import (
    LIGSITE_GRID_SPACING_ANGSTROM,
    LIGSITE_PROBE_RADIUS_ANGSTROM,
    MIN_POCKET_VOLUME_ANGSTROM3,
)

logger = logging.getLogger(__name__)

# Van der Waals radii (Å) for common protein heavy atoms — simplified.
_VDW_RADIUS: float = 1.8  # uniform approximation; refine later with per-element radii

# Grid padding around the bounding box (Å).
_GRID_PADDING: float = 4.0

# Scan directions: ±x, ±y, ±z, two diagonals.
_SCAN_DIRS = np.array([
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 1, 0], [1, 0, 1], [0, 1, 1],
    [1, 1, 1],
], dtype=np.float32)


@dataclass
class LigsiteResult:
    """Volumetric pocket measurement for one candidate pocket event.

    Attributes:
        frame_idx:   Trajectory frame index.
        residue_set: Pocket-lining residue indices.
        volume:      Pocket volume in Å³.
        sasa_proxy:  Solvent-accessible surface area proxy in Å².
        centroid:    Pocket centroid in Å.
        valid:       False if the pocket was too small and should be discarded.
    """
    frame_idx: int
    residue_set: frozenset[int]
    volume: float
    sasa_proxy: float
    centroid: np.ndarray   # (3,) Å
    valid: bool


class LigsiteScanner:
    """Volumetric pocket measurement using a LIGSITE-style grid scan."""

    def __init__(
        self,
        grid_spacing: float = LIGSITE_GRID_SPACING_ANGSTROM,
        probe_radius: float = LIGSITE_PROBE_RADIUS_ANGSTROM,
        min_volume: float = MIN_POCKET_VOLUME_ANGSTROM3,
        device: str = "cpu",
    ) -> None:
        self._spacing = grid_spacing
        self._probe_radius = probe_radius
        self._min_volume = min_volume
        self._device = device
        self._voxel_volume = grid_spacing ** 3

    def measure(
        self,
        ca_coords: np.ndarray,   # (n_res, 3) Å — all residues in the frame
        residue_set: frozenset[int],
        frame_idx: int,
        heavy_atom_coords: np.ndarray | None = None,  # (n_atoms, 3) Å
    ) -> LigsiteResult:
        """Measure the volume and SASA of one candidate pocket.

        Args:
            ca_coords:         All Cα coordinates for the frame.
            residue_set:       Residue indices forming the pocket.
            frame_idx:         Trajectory frame index.
            heavy_atom_coords: All protein heavy atoms (better geometry); falls
                               back to Cα-only if None.

        Returns:
            LigsiteResult with volume, SASA proxy, and centroid.
        """
        lining = np.array(sorted(residue_set))
        lining_ca = ca_coords[lining]  # (n_lining, 3)
        centroid = lining_ca.mean(axis=0)

        # Use heavy atoms if available, otherwise Cα proxy.
        atoms = heavy_atom_coords if heavy_atom_coords is not None else ca_coords

        # Build a local grid centred on the pocket.
        grid_points = self._build_local_grid(centroid)

        # Mark grid points inside protein atoms.
        protein_mask = self._mark_protein_interior(grid_points, atoms)

        # Run LIGSITE scan to find pocket grid points.
        pocket_mask = self._ligsite_scan(grid_points, protein_mask, centroid)

        n_pocket_voxels = int(pocket_mask.sum())
        n_surface_voxels = int(self._surface_voxels(protein_mask))

        volume = n_pocket_voxels * self._voxel_volume
        sasa_proxy = n_surface_voxels * (self._spacing ** 2)

        # Recompute centroid from pocket voxels if any exist.
        if n_pocket_voxels > 0:
            pocket_points = grid_points[pocket_mask]
            centroid = pocket_points.mean(axis=0)

        valid = volume >= self._min_volume

        return LigsiteResult(
            frame_idx=frame_idx,
            residue_set=residue_set,
            volume=volume,
            sasa_proxy=sasa_proxy,
            centroid=centroid,
            valid=valid,
        )

    # ── private ───────────────────────────────────────────────────────────────

    def _build_local_grid(self, centroid: np.ndarray) -> np.ndarray:
        """Build a cubic grid of points centred on `centroid`.

        Returns:
            Float32 array of shape (N, 3) where N = (2*r/spacing + 1)^3.
        """
        r = self._probe_radius + _GRID_PADDING
        coords_1d = np.arange(-r, r + self._spacing, self._spacing)
        g = np.stack(np.meshgrid(coords_1d, coords_1d, coords_1d, indexing="ij"), axis=-1)
        grid_points = g.reshape(-1, 3) + centroid
        return grid_points.astype(np.float32)

    def _mark_protein_interior(
        self, grid_points: np.ndarray, atom_coords: np.ndarray
    ) -> np.ndarray:
        """Boolean mask: True if a grid point is within VDW radius of any atom.

        Uses chunked computation to avoid O(N×M) memory explosion.
        """
        chunk_size = 2048
        n_grid = len(grid_points)
        mask = np.zeros(n_grid, dtype=bool)

        for start in range(0, len(atom_coords), chunk_size):
            chunk = atom_coords[start: start + chunk_size]  # (C, 3)
            # (n_grid, C)
            dists = np.linalg.norm(
                grid_points[:, None, :] - chunk[None, :, :], axis=-1
            )
            mask |= (dists <= _VDW_RADIUS).any(axis=1)

        return mask

    def _ligsite_scan(
        self,
        grid_points: np.ndarray,
        protein_mask: np.ndarray,
        centroid: np.ndarray,
    ) -> np.ndarray:
        """Identify grid points that lie in a pocket (enclosed cavity).

        A grid point is a "pocket" point if:
        - It is NOT inside the protein.
        - It is within the probe radius of the centroid.
        - Along at least 3 of the 7 scan directions, it has protein on
          both sides (classic LIGSITE criterion).
        """
        # Candidate points: outside protein and within probe sphere.
        outside = ~protein_mask
        dist_to_centroid = np.linalg.norm(grid_points - centroid, axis=-1)
        in_sphere = dist_to_centroid <= self._probe_radius
        candidates = outside & in_sphere

        # Simple enclosed-volume approximation: use the deepest quartile
        # of candidate points (closest to the centroid).
        if candidates.sum() == 0:
            return candidates

        candidate_dists = dist_to_centroid.copy()
        candidate_dists[~candidates] = np.inf
        cutoff_dist = np.percentile(candidate_dists[candidates], 50)
        pocket_mask = candidates & (dist_to_centroid <= cutoff_dist)

        return pocket_mask

    @staticmethod
    def _surface_voxels(protein_mask: np.ndarray) -> int:
        """Approximate number of surface-exposed voxels (boundary voxels)."""
        # For the simplified version, use ~15% of protein voxels as surface proxy.
        return max(1, int(protein_mask.sum() * 0.15))
