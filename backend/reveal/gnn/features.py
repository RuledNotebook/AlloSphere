"""Node and edge feature extraction for the GVP-GNN residue graph.

Node features (per residue):
  - Backbone dihedrals φ, ψ, ω encoded as (sin, cos) pairs → 6 scalars
  - Sidechain χ1, χ2 encoded as (sin, cos) pairs → 4 scalars (0 for Gly/Ala)
  - Secondary structure DSSP one-hot (8 classes) → 8 scalars
  - Residue identity one-hot (20 standard amino acids) → 20 scalars
  - B-factor proxy (normalised RMSF) → 1 scalar
  Total: 39 scalar features + 1 vector feature (unit Cα→Cβ direction)

Edge features (per residue pair within cutoff):
  - Cα–Cα distance encoded as RBF basis (16 bins) → 16 scalars
  - Unit vector Cα_i → Cα_j → 1 vector feature (3D)
"""

from __future__ import annotations

import numpy as np
import torch

from reveal.constants import (
    STANDARD_AMINO_ACIDS,
    DSSP_CODES,
    DSSP_CODE_TO_IDX,
    RBF_NUM_BINS,
    RBF_MIN_DIST,
    RBF_MAX_DIST,
)

_AA_TO_IDX: dict[str, int] = {aa: i for i, aa in enumerate(STANDARD_AMINO_ACIDS)}
_N_AA = len(STANDARD_AMINO_ACIDS)
_N_DSSP = len(DSSP_CODES)

NODE_SCALAR_DIM = 39  # 6 + 4 + 8 + 20 + 1
NODE_VECTOR_DIM = 1   # one 3D vector (Cα→Cβ direction)
EDGE_SCALAR_DIM = RBF_NUM_BINS  # 16
EDGE_VECTOR_DIM = 1   # one 3D vector (Cα_i→Cα_j direction)


# ── RBF basis ─────────────────────────────────────────────────────────────────

def rbf_encode(distances: torch.Tensor, n_bins: int = RBF_NUM_BINS,
               d_min: float = RBF_MIN_DIST, d_max: float = RBF_MAX_DIST) -> torch.Tensor:
    """Radial basis function encoding of distances.

    Args:
        distances: Tensor of shape (...,) containing distances in Å.
        n_bins:    Number of RBF Gaussian centres.
        d_min:     Minimum distance of first centre.
        d_max:     Maximum distance of last centre.

    Returns:
        Tensor of shape (..., n_bins).
    """
    centres = torch.linspace(d_min, d_max, n_bins, device=distances.device)
    sigma = (d_max - d_min) / (n_bins - 1)
    return torch.exp(-((distances.unsqueeze(-1) - centres) ** 2) / (2 * sigma ** 2))


# ── Dihedral helpers ──────────────────────────────────────────────────────────

def _sincos(angles: np.ndarray) -> np.ndarray:
    """(N,) → (N, 2) [sin, cos] encoding."""
    return np.stack([np.sin(angles), np.cos(angles)], axis=-1)


def compute_dihedrals(traj, frame_idx: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute backbone φ, ψ, ω dihedral angles for a given frame.

    Returns three arrays of shape (n_residues,) in radians.
    Missing values (terminal residues) are filled with 0.0.
    """
    try:
        import mdtraj as md
        phi_ids, phi_vals = md.compute_phi(traj)   # (n_frames, n_phi_res)
        psi_ids, psi_vals = md.compute_psi(traj)
        omega_ids, omega_vals = md.compute_omega(traj)

        n_res = traj.n_residues
        phi = np.zeros(n_res)
        psi = np.zeros(n_res)
        omega = np.zeros(n_res)

        for i, atom_indices in enumerate(phi_ids):
            res_idx = traj.topology.atom(atom_indices[1]).residue.index
            phi[res_idx] = float(phi_vals[frame_idx, i])

        for i, atom_indices in enumerate(psi_ids):
            res_idx = traj.topology.atom(atom_indices[0]).residue.index
            psi[res_idx] = float(psi_vals[frame_idx, i])

        for i, atom_indices in enumerate(omega_ids):
            res_idx = traj.topology.atom(atom_indices[0]).residue.index
            omega[res_idx] = float(omega_vals[frame_idx, i])

    except Exception:
        n_res = traj.n_residues if traj is not None else 0
        phi = psi = omega = np.zeros(n_res)

    return phi, psi, omega


# ── Node features ─────────────────────────────────────────────────────────────

def build_node_scalar_features(
    residue_names: list[str],
    phi: np.ndarray,
    psi: np.ndarray,
    omega: np.ndarray,
    chi1: np.ndarray,
    chi2: np.ndarray,
    dssp_codes: list[str],
    rmsf: np.ndarray,
) -> torch.Tensor:
    """Assemble the (n_residues, NODE_SCALAR_DIM) node scalar feature tensor.

    Args:
        residue_names: Three-letter residue codes, len=n_res.
        phi, psi, omega: Backbone dihedrals in radians, shape (n_res,).
        chi1, chi2:    Sidechain dihedrals in radians, shape (n_res,).
        dssp_codes:    Per-residue DSSP code strings, len=n_res.
        rmsf:          Per-residue RMSF in Å, shape (n_res,), used as B-factor proxy.

    Returns:
        Float32 tensor of shape (n_res, NODE_SCALAR_DIM).
    """
    n = len(residue_names)

    # Backbone dihedrals: 6 features
    backbone = np.concatenate([_sincos(phi), _sincos(psi), _sincos(omega)], axis=-1)  # (n,6)

    # Sidechain dihedrals: 4 features
    sidechain = np.concatenate([_sincos(chi1), _sincos(chi2)], axis=-1)  # (n,4)

    # DSSP one-hot: 8 features
    dssp_oh = np.zeros((n, _N_DSSP), dtype=np.float32)
    for i, code in enumerate(dssp_codes):
        idx = DSSP_CODE_TO_IDX.get(code, DSSP_CODE_TO_IDX["C"])
        dssp_oh[i, idx] = 1.0

    # Residue identity one-hot: 20 features
    aa_oh = np.zeros((n, _N_AA), dtype=np.float32)
    for i, name in enumerate(residue_names):
        idx = _AA_TO_IDX.get(name, 0)
        aa_oh[i, idx] = 1.0

    # RMSF proxy: 1 feature (normalised to [0,1] using max)
    rmsf_norm = rmsf / (rmsf.max() + 1e-8)
    rmsf_feat = rmsf_norm.reshape(-1, 1)

    feat = np.concatenate([backbone, sidechain, dssp_oh, aa_oh, rmsf_feat], axis=-1)
    assert feat.shape == (n, NODE_SCALAR_DIM), f"Expected ({n},{NODE_SCALAR_DIM}), got {feat.shape}"
    return torch.from_numpy(feat.astype(np.float32))


def build_node_vector_features(
    ca_coords: np.ndarray,
    cb_coords: np.ndarray,
) -> torch.Tensor:
    """Build the (n_residues, NODE_VECTOR_DIM, 3) node vector feature tensor.

    The single vector feature is the unit vector from Cα to Cβ (sidechain direction).
    For Gly, Cβ == Cα so this defaults to a zero vector; handled in the GVP with layer norm.

    Args:
        ca_coords: Cα positions, shape (n_res, 3) in Å.
        cb_coords: Cβ positions (Cα for Gly), shape (n_res, 3) in Å.

    Returns:
        Float32 tensor of shape (n_res, NODE_VECTOR_DIM, 3).
    """
    diff = cb_coords - ca_coords  # (n_res, 3)
    norms = np.linalg.norm(diff, axis=-1, keepdims=True) + 1e-8
    unit = diff / norms
    return torch.from_numpy(unit.astype(np.float32)).unsqueeze(1)  # (n_res, 1, 3)


# ── Edge features ─────────────────────────────────────────────────────────────

def build_edge_features(
    ca_coords: np.ndarray,
    edge_index: torch.Tensor,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Build edge scalar and vector features.

    Args:
        ca_coords:   Cα positions, shape (n_res, 3) in Å.
        edge_index:  Edge indices, shape (2, n_edges) — src/dst residue indices.

    Returns:
        edge_s: Float32 tensor of shape (n_edges, EDGE_SCALAR_DIM) — RBF distances.
        edge_v: Float32 tensor of shape (n_edges, EDGE_VECTOR_DIM, 3) — unit direction vectors.
    """
    src, dst = edge_index[0], edge_index[1]
    ca = torch.from_numpy(ca_coords.astype(np.float32))

    diff = ca[dst] - ca[src]  # (n_edges, 3)
    dist = diff.norm(dim=-1)  # (n_edges,)
    unit = diff / (dist.unsqueeze(-1) + 1e-8)  # (n_edges, 3)

    edge_s = rbf_encode(dist)                # (n_edges, EDGE_SCALAR_DIM)
    edge_v = unit.unsqueeze(1)               # (n_edges, 1, 3)

    return edge_s, edge_v
