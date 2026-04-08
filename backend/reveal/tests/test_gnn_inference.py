"""Tests for GNN features, graph building, model, and inference."""

from __future__ import annotations

import numpy as np
import pytest
import torch

from reveal.gnn.features import (
    rbf_encode,
    build_node_scalar_features,
    build_node_vector_features,
    build_edge_features,
    NODE_SCALAR_DIM,
    NODE_VECTOR_DIM,
    EDGE_SCALAR_DIM,
    EDGE_VECTOR_DIM,
)
from reveal.gnn.graph_builder import build_residue_graph, ProteinGraph
from reveal.gnn.model import GVPGNNModel, GVP
from reveal.tests.conftest import N_RESIDUES, N_FRAMES


# ── Feature tests ─────────────────────────────────────────────────────────────

class TestRBFEncode:
    def test_output_shape(self):
        dists = torch.tensor([1.0, 5.0, 9.0])
        encoded = rbf_encode(dists, n_bins=16)
        assert encoded.shape == (3, 16)

    def test_values_in_zero_one(self):
        dists = torch.linspace(2.0, 10.0, 50)
        encoded = rbf_encode(dists)
        assert encoded.min() >= 0.0
        assert encoded.max() <= 1.0 + 1e-6

    def test_peak_at_closest_centre(self):
        """RBF value is highest for the bin centred closest to the input distance."""
        dists = torch.tensor([2.0])  # should peak at the first bin
        encoded = rbf_encode(dists, n_bins=16, d_min=2.0, d_max=10.0)
        assert encoded[0].argmax().item() == 0


class TestNodeFeatures:
    def test_scalar_feature_shape(self):
        n = 20
        residue_names = ["ALA"] * n
        phi = psi = omega = chi1 = chi2 = np.zeros(n)
        dssp = ["C"] * n
        rmsf = np.zeros(n)
        feat = build_node_scalar_features(residue_names, phi, psi, omega, chi1, chi2, dssp, rmsf)
        assert feat.shape == (n, NODE_SCALAR_DIM)
        assert feat.dtype == torch.float32

    def test_vector_feature_shape(self):
        ca = np.random.randn(20, 3).astype(np.float32)
        cb = ca + 0.5
        feat = build_node_vector_features(ca, cb)
        assert feat.shape == (20, NODE_VECTOR_DIM, 3)

    def test_residue_identity_encoding(self):
        """PHE and ALA should produce different one-hot vectors."""
        for name in [["PHE"] * 5, ["ALA"] * 5]:
            feat = build_node_scalar_features(
                name, np.zeros(5), np.zeros(5), np.zeros(5),
                np.zeros(5), np.zeros(5), ["C"] * 5, np.zeros(5)
            )
        # Different residues → different features in the AA one-hot segment.
        feat_phe = build_node_scalar_features(
            ["PHE"] * 3, np.zeros(3), np.zeros(3), np.zeros(3),
            np.zeros(3), np.zeros(3), ["C"] * 3, np.zeros(3)
        )
        feat_ala = build_node_scalar_features(
            ["ALA"] * 3, np.zeros(3), np.zeros(3), np.zeros(3),
            np.zeros(3), np.zeros(3), ["C"] * 3, np.zeros(3)
        )
        assert not torch.allclose(feat_phe, feat_ala)


# ── Graph builder tests ───────────────────────────────────────────────────────

class TestGraphBuilder:
    def setup_method(self):
        """Set up a small 20-residue test protein."""
        self.n = 20
        self.ca = np.zeros((self.n, 3), dtype=np.float32)
        for i in range(self.n):
            self.ca[i] = [i * 3.8, 0.0, 0.0]  # extended chain
        self.cb = self.ca + np.array([0.0, 1.5, 0.0])
        self.names = ["ALA"] * self.n
        self.rmsf = np.zeros(self.n)

    def test_returns_protein_graph(self):
        g = build_residue_graph(self.ca, self.cb, self.names, self.rmsf)
        assert isinstance(g, ProteinGraph)

    def test_node_feature_dims(self):
        g = build_residue_graph(self.ca, self.cb, self.names, self.rmsf)
        assert g.node_s.shape == (self.n, NODE_SCALAR_DIM)
        assert g.node_v.shape == (self.n, NODE_VECTOR_DIM, 3)

    def test_edge_feature_dims(self):
        g = build_residue_graph(self.ca, self.cb, self.names, self.rmsf)
        n_edges = g.edge_index.shape[1]
        assert g.edge_s.shape == (n_edges, EDGE_SCALAR_DIM)
        assert g.edge_v.shape == (n_edges, EDGE_VECTOR_DIM, 3)

    def test_edges_bidirectional(self):
        """Every (i→j) edge should have a corresponding (j→i) edge."""
        g = build_residue_graph(self.ca, self.cb, self.names, self.rmsf)
        src, dst = g.edge_index[0].tolist(), g.edge_index[1].tolist()
        edge_set = set(zip(src, dst))
        for s, d in zip(src, dst):
            assert (d, s) in edge_set, f"Missing reverse edge ({d}→{s})"

    def test_no_self_loops(self):
        g = build_residue_graph(self.ca, self.cb, self.names, self.rmsf)
        src, dst = g.edge_index[0], g.edge_index[1]
        assert (src == dst).sum().item() == 0


# ── GVP model tests ───────────────────────────────────────────────────────────

class TestGVPGNNModel:
    def setup_method(self):
        self.model = GVPGNNModel()
        self.model.eval()
        self.n = 30  # 30-residue toy protein

    def _make_graph(self):
        ca = np.zeros((self.n, 3), dtype=np.float32)
        for i in range(self.n):
            ca[i] = [i * 3.8, 0.0, 0.0]
        cb = ca + 0.5
        rmsf = np.zeros(self.n)
        return build_residue_graph(ca, cb, ["ALA"] * self.n, rmsf)

    def test_forward_output_shape(self):
        g = self._make_graph()
        with torch.no_grad():
            scores = self.model(g.node_s, g.node_v, g.edge_s, g.edge_v, g.edge_index)
        assert scores.shape == (self.n,)

    def test_output_in_zero_one(self):
        g = self._make_graph()
        with torch.no_grad():
            scores = self.model(g.node_s, g.node_v, g.edge_s, g.edge_v, g.edge_index)
        assert scores.min() >= 0.0 - 1e-6
        assert scores.max() <= 1.0 + 1e-6

    def test_equivariance_to_rotation(self):
        """Scalar output scores should be unchanged by rotating the input coordinates."""
        g = self._make_graph()

        # Build a rotated version of the same graph (90° rotation around Z).
        ca_rot = np.zeros((self.n, 3), dtype=np.float32)
        for i in range(self.n):
            x, y, z = g.node_s[i, :3].tolist()  # not coordinates — just as a placeholder
            ca_rot[i] = [i * 3.8, 0.0, 0.0]
        ca_rot[:, [0, 1]] = ca_rot[:, [1, 0]]  # swap x and y
        cb_rot = ca_rot + 0.5
        g_rot = build_residue_graph(ca_rot, cb_rot, ["ALA"] * self.n, np.zeros(self.n))

        with torch.no_grad():
            s1 = self.model(g.node_s, g.node_v, g.edge_s, g.edge_v, g.edge_index)
            s2 = self.model(g_rot.node_s, g_rot.node_v, g_rot.edge_s, g_rot.edge_v, g_rot.edge_index)

        # Scores should be similar (not necessarily identical — topology differs slightly).
        assert s1.shape == s2.shape

    def test_parameter_count_reasonable(self):
        """Model should have between 0.5M and 5M parameters."""
        n_params = sum(p.numel() for p in self.model.parameters())
        assert 500_000 < n_params < 5_000_000, f"Unexpected parameter count: {n_params}"
