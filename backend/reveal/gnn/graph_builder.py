"""Build protein residue graphs from Cα coordinate arrays.

Each node is a residue.  Edges connect pairs of residues whose Cα atoms are
within GRAPH_EDGE_CUTOFF_ANGSTROM (default 10 Å).  Both directions of each
edge are included (undirected → bidirectional edge list).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np
import torch

from reveal.constants import GRAPH_EDGE_CUTOFF_ANGSTROM
from reveal.gnn.features import (
    build_node_scalar_features,
    build_node_vector_features,
    build_edge_features,
    NODE_SCALAR_DIM,
    NODE_VECTOR_DIM,
    EDGE_SCALAR_DIM,
    EDGE_VECTOR_DIM,
)

logger = logging.getLogger(__name__)


@dataclass
class ProteinGraph:
    """A single-frame protein residue graph ready for GVP-GNN inference.

    Attributes:
        node_s:     Node scalar features, (n_res, NODE_SCALAR_DIM).
        node_v:     Node vector features, (n_res, NODE_VECTOR_DIM, 3).
        edge_s:     Edge scalar features, (n_edges, EDGE_SCALAR_DIM).
        edge_v:     Edge vector features, (n_edges, EDGE_VECTOR_DIM, 3).
        edge_index: COO edge indices, (2, n_edges).
        n_nodes:    Number of residue nodes.
    """
    node_s: torch.Tensor    # (n_res, NODE_SCALAR_DIM)
    node_v: torch.Tensor    # (n_res, NODE_VECTOR_DIM, 3)
    edge_s: torch.Tensor    # (n_edges, EDGE_SCALAR_DIM)
    edge_v: torch.Tensor    # (n_edges, EDGE_VECTOR_DIM, 3)
    edge_index: torch.Tensor  # (2, n_edges)
    n_nodes: int


def build_residue_graph(
    ca_coords: np.ndarray,        # (n_res, 3) Å
    cb_coords: np.ndarray,        # (n_res, 3) Å
    residue_names: list[str],
    rmsf: np.ndarray,             # (n_res,) Å
    phi: np.ndarray | None = None,
    psi: np.ndarray | None = None,
    omega: np.ndarray | None = None,
    chi1: np.ndarray | None = None,
    chi2: np.ndarray | None = None,
    dssp_codes: list[str] | None = None,
    edge_cutoff: float = GRAPH_EDGE_CUTOFF_ANGSTROM,
) -> ProteinGraph:
    """Construct a ProteinGraph for a single trajectory frame.

    Args:
        ca_coords:     Cα coordinates (n_res, 3) in Å.
        cb_coords:     Cβ coordinates (n_res, 3) in Å.
        residue_names: Three-letter residue codes, len=n_res.
        rmsf:          Per-residue RMSF in Å (used as B-factor proxy).
        phi, psi, omega: Backbone dihedrals in radians; zeros if None.
        chi1, chi2:    Sidechain dihedrals; zeros if None.
        dssp_codes:    DSSP secondary-structure codes; all 'C' if None.
        edge_cutoff:   Distance cutoff (Å) for drawing edges.

    Returns:
        A ProteinGraph ready for forward pass through the GVP-GNN.
    """
    n_res = len(residue_names)

    # Default to zero dihedrals and coil SS if annotations are unavailable.
    if phi is None:
        phi = np.zeros(n_res)
    if psi is None:
        psi = np.zeros(n_res)
    if omega is None:
        omega = np.zeros(n_res)
    if chi1 is None:
        chi1 = np.zeros(n_res)
    if chi2 is None:
        chi2 = np.zeros(n_res)
    if dssp_codes is None:
        dssp_codes = ["C"] * n_res

    # Build edges: all residue pairs within cutoff.
    edge_index = _radius_graph(ca_coords, edge_cutoff)

    # Build node features.
    node_s = build_node_scalar_features(
        residue_names, phi, psi, omega, chi1, chi2, dssp_codes, rmsf
    )
    node_v = build_node_vector_features(ca_coords, cb_coords)

    # Build edge features.
    edge_s, edge_v = build_edge_features(ca_coords, edge_index)

    return ProteinGraph(
        node_s=node_s,
        node_v=node_v,
        edge_s=edge_s,
        edge_v=edge_v,
        edge_index=edge_index,
        n_nodes=n_res,
    )


def _radius_graph(ca_coords: np.ndarray, cutoff: float) -> torch.Tensor:
    """Return bidirectional edge index for all Cα pairs within `cutoff` Å.

    Returns:
        LongTensor of shape (2, n_edges).
    """
    n = len(ca_coords)
    # Pairwise distance matrix (vectorised).
    delta = ca_coords[:, None, :] - ca_coords[None, :, :]  # (n, n, 3)
    dist = np.linalg.norm(delta, axis=-1)                  # (n, n)

    # All pairs within cutoff, excluding self-loops.
    mask = (dist <= cutoff) & (dist > 0.0)
    rows, cols = np.where(mask)

    edge_index = torch.from_numpy(
        np.stack([rows, cols], axis=0).astype(np.int64)
    )
    return edge_index
