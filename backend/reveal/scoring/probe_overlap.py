"""Cross-reference pocket volume with Scout fragment probe density grids.

Reads Scout's OpenDX probe density grids and computes the fraction of
pocket voxels that overlap with each probe's high-density region
(density > threshold).

The OpenDX format stores a scalar field on a regular grid with a header
describing origin, spacing, and dimensions.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

_PROBE_NAMES = ["benzene", "imidazole", "phenol", "acetonitrile", "dimethylether"]
_DENSITY_THRESHOLD_PERCENTILE = 75.0  # top 25% of density values are "high"


class ProbeOverlapCalculator:
    """Computes pocket–probe density overlap from Scout .dx grids."""

    def __init__(self, probe_density_dir: Path | None) -> None:
        self._probe_dir = probe_density_dir
        self._grids: dict[str, tuple[np.ndarray, np.ndarray, np.ndarray]] = {}
        if probe_density_dir and probe_density_dir.exists():
            self._load_grids()

    def compute_overlap(
        self,
        pocket_centroid: np.ndarray,  # (3,) Å
        pocket_radius: float,         # Å — approximate pocket radius
    ) -> dict[str, float]:
        """Compute probe overlap fractions for one pocket.

        Args:
            pocket_centroid: Pocket centroid in Å.
            pocket_radius:   Approximate pocket radius (sphere approximation).

        Returns:
            Dict mapping probe name → overlap fraction ∈ [0, 1].
            Empty dict if no probe grids are available.
        """
        if not self._grids:
            return {}

        overlaps: dict[str, float] = {}
        for probe_name, (density, origin, spacing) in self._grids.items():
            overlap = self._overlap_fraction(
                density, origin, spacing, pocket_centroid, pocket_radius
            )
            overlaps[probe_name] = overlap

        return overlaps

    # ── private ───────────────────────────────────────────────────────────────

    def _load_grids(self) -> None:
        assert self._probe_dir is not None
        for probe in _PROBE_NAMES:
            dx_path = self._probe_dir / f"{probe}.dx"
            if not dx_path.exists():
                logger.debug("Probe grid not found: %s", dx_path)
                continue
            try:
                density, origin, spacing = self._parse_dx(dx_path)
                self._grids[probe] = (density, origin, spacing)
                logger.debug("Loaded probe grid '%s': shape=%s", probe, density.shape)
            except Exception as exc:
                logger.warning("Failed to parse %s: %s", dx_path, exc)

    @staticmethod
    def _parse_dx(
        path: Path,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Parse an OpenDX scalar field file.

        Returns:
            density: Float32 array of shape (nx, ny, nz).
            origin:  Array of shape (3,) — grid origin in Å.
            spacing: Array of shape (3,) — grid spacings in Å.
        """
        lines = path.read_text().splitlines()
        nx = ny = nz = 0
        origin = np.zeros(3)
        spacing = np.zeros(3)
        data_start = 0

        for i, line in enumerate(lines):
            line = line.strip()
            if line.startswith("#"):
                continue
            if line.startswith("object 1 class gridpositions"):
                m = re.search(r"counts\s+(\d+)\s+(\d+)\s+(\d+)", line)
                if m:
                    nx, ny, nz = int(m.group(1)), int(m.group(2)), int(m.group(3))
            elif line.startswith("origin"):
                parts = line.split()
                origin = np.array([float(parts[1]), float(parts[2]), float(parts[3])])
            elif line.startswith("delta") and spacing[0] == 0:
                parts = line.split()
                spacing[0] = float(parts[1])
            elif line.startswith("delta") and spacing[1] == 0:
                parts = line.split()
                spacing[1] = float(parts[2])
            elif line.startswith("delta") and spacing[2] == 0:
                parts = line.split()
                spacing[2] = float(parts[3])
            elif line.startswith("object 3 class array"):
                data_start = i + 1
                break

        # Read data values.
        data_lines = lines[data_start:]
        values: list[float] = []
        for line in data_lines:
            if line.startswith("attribute") or line.startswith("object"):
                break
            values.extend(float(v) for v in line.split())

        density = np.array(values, dtype=np.float32).reshape(nx, ny, nz)
        return density, origin * 10.0, spacing * 10.0  # nm → Å

    @staticmethod
    def _overlap_fraction(
        density: np.ndarray,
        origin: np.ndarray,
        spacing: np.ndarray,
        centroid: np.ndarray,
        radius: float,
    ) -> float:
        """Fraction of pocket sphere volume with high probe density."""
        # Build grid of coordinates.
        nx, ny, nz = density.shape
        xs = origin[0] + np.arange(nx) * spacing[0]
        ys = origin[1] + np.arange(ny) * spacing[1]
        zs = origin[2] + np.arange(nz) * spacing[2]

        # Find grid indices within the pocket sphere.
        xi = np.searchsorted(xs, centroid[0] - radius), np.searchsorted(xs, centroid[0] + radius)
        yi = np.searchsorted(ys, centroid[1] - radius), np.searchsorted(ys, centroid[1] + radius)
        zi = np.searchsorted(zs, centroid[2] - radius), np.searchsorted(zs, centroid[2] + radius)

        xi = (max(0, xi[0]), min(nx, xi[1]))
        yi = (max(0, yi[0]), min(ny, yi[1]))
        zi = (max(0, zi[0]), min(nz, zi[1]))

        sub = density[xi[0]:xi[1], yi[0]:yi[1], zi[0]:zi[1]]
        if sub.size == 0:
            return 0.0

        threshold = float(np.percentile(density, _DENSITY_THRESHOLD_PERCENTILE))
        high_density_fraction = float((sub >= threshold).mean())
        return high_density_fraction
