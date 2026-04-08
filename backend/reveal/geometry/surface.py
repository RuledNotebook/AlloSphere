"""Solvent-accessible surface area, pocket depth, and mouth width calculations."""

from __future__ import annotations

import numpy as np


# Shrake-Rupley sphere point count.
_N_SPHERE_POINTS = 100


def compute_sasa_residue(
    ca_coords: np.ndarray,     # (n_res, 3) Å
    residue_indices: list[int],
    probe_radius: float = 1.4,
    vdw_radius: float = 1.8,
) -> float:
    """Estimate the solvent-accessible surface area (Å²) for a residue set.

    Uses a simplified Shrake-Rupley approach with uniform atomic radii.

    Args:
        ca_coords:      All Cα coordinates (used as atom positions).
        residue_indices: Residue indices to compute SASA for.
        probe_radius:   Probe sphere radius in Å (water ≈ 1.4 Å).
        vdw_radius:     Uniform VDW radius per atom in Å.

    Returns:
        Approximate SASA in Å².
    """
    sphere_pts = _fibonacci_sphere(n=_N_SPHERE_POINTS)
    r = vdw_radius + probe_radius

    total_sasa = 0.0
    all_coords = ca_coords  # simplified: treat Cα as atom representative

    for res_idx in residue_indices:
        centre = ca_coords[res_idx]
        # Points on the solvent-accessible sphere.
        test_pts = centre + r * sphere_pts  # (N, 3)

        # Check which test points are buried by other atoms.
        other = np.delete(all_coords, res_idx, axis=0)  # (n_res-1, 3)
        dists = np.linalg.norm(test_pts[:, None, :] - other[None, :, :], axis=-1)
        buried = (dists < r).any(axis=1)

        exposed_fraction = (~buried).mean()
        surface_area = 4.0 * np.pi * r ** 2 * exposed_fraction
        total_sasa += surface_area

    return float(total_sasa)


def compute_pocket_depth(
    centroid: np.ndarray,      # (3,) Å
    ca_coords: np.ndarray,     # (n_res, 3)
    residue_indices: list[int],
) -> float:
    """Estimate pocket depth as the maximum distance from centroid to lining Cα.

    Args:
        centroid:        Pocket centroid.
        ca_coords:       All Cα coordinates.
        residue_indices: Pocket-lining residue indices.

    Returns:
        Depth in Å.
    """
    lining_ca = ca_coords[residue_indices]  # (n_lining, 3)
    distances = np.linalg.norm(lining_ca - centroid, axis=-1)
    return float(distances.max()) if len(distances) > 0 else 0.0


def compute_mouth_width(
    centroid: np.ndarray,
    ca_coords: np.ndarray,
    residue_indices: list[int],
) -> float:
    """Estimate mouth width as the diameter of the convex hull of lining Cα projected
    onto the plane perpendicular to the pocket axis.

    Simplified version: uses the maximum pairwise distance among lining residues.

    Returns:
        Mouth width in Å.
    """
    if len(residue_indices) < 2:
        return 0.0
    lining_ca = ca_coords[residue_indices]
    # Pairwise distances among lining residues.
    delta = lining_ca[:, None, :] - lining_ca[None, :, :]
    pairwise = np.linalg.norm(delta, axis=-1)
    return float(pairwise.max())


def compute_enclosure(volume: float, sasa: float) -> float:
    """Enclosure ratio: fraction of the pocket surface that is enclosed.

    Defined as 1 - (SASA / total_surface), where total_surface is estimated
    from the volume of a sphere with the same volume.

    Returns a value in [0, 1] where 1.0 = fully enclosed.
    """
    if volume <= 0 or sasa <= 0:
        return 0.0
    sphere_radius = (3 * volume / (4 * np.pi)) ** (1 / 3)
    sphere_surface = 4 * np.pi * sphere_radius ** 2
    return float(max(0.0, 1.0 - sasa / (sphere_surface + 1e-8)))


# ── helpers ───────────────────────────────────────────────────────────────────

def _fibonacci_sphere(n: int = 100) -> np.ndarray:
    """Generate `n` approximately evenly spaced points on the unit sphere."""
    golden_ratio = (1 + np.sqrt(5)) / 2
    i = np.arange(n, dtype=float)
    theta = np.arccos(1 - 2 * (i + 0.5) / n)
    phi = 2 * np.pi * i / golden_ratio
    return np.stack([
        np.sin(theta) * np.cos(phi),
        np.sin(theta) * np.sin(phi),
        np.cos(theta),
    ], axis=-1).astype(np.float32)
