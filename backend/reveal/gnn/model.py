"""GVP-GNN model architecture for per-residue pocket-forming probability.

Implements the Geometric Vector Perceptron message-passing network from
Jing et al. (2021) "Learning from Protein Structure with Geometric Vector
Perceptrons", adapted for the cryptic-pocket scoring task following PocketMiner
(Meller et al. 2023, ROC-AUC 0.87 on CryptoSite holdout).

Architecture:
  - Input embedding: linear projection of node scalars + vector features
  - 4 GVP message-passing layers, each with 128 scalar + 16 vector channels
  - Output MLP: (128,) → sigmoid → per-residue pocket probability
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

from reveal.gnn.features import NODE_SCALAR_DIM, NODE_VECTOR_DIM, EDGE_SCALAR_DIM, EDGE_VECTOR_DIM


# ── Geometric Vector Perceptron ───────────────────────────────────────────────

class GVP(nn.Module):
    """Single Geometric Vector Perceptron layer.

    Transforms (scalar, vector) feature pairs while preserving E(3) equivariance.
    Scalars transform as invariants; vectors transform equivariantly.

    Args:
        in_dims:  (n_scalar_in, n_vector_in)
        out_dims: (n_scalar_out, n_vector_out)
        activations: (scalar_act, vector_act) — None disables activation.
    """

    def __init__(
        self,
        in_dims: tuple[int, int],
        out_dims: tuple[int, int],
        activations: tuple[nn.Module | None, nn.Module | None] = (nn.ReLU(), nn.Sigmoid()),
    ) -> None:
        super().__init__()
        si, vi = in_dims
        so, vo = out_dims
        self.si, self.vi = si, vi
        self.so, self.so_v = so, vo

        # Vector pathway: maps vi → max(vi, vo) → vo via linear transforms in R^3
        self.W_v = nn.Linear(vi, max(vi, vo), bias=False)
        self.W_v2 = nn.Linear(max(vi, vo), vo, bias=False)

        # Scalar pathway: maps (si + norms_of_output_vectors) → so
        self.W_s = nn.Linear(si + max(vi, vo), so)

        self.scalar_act, self.vector_act = activations

    def forward(
        self,
        x_s: torch.Tensor,   # (*, si)
        x_v: torch.Tensor,   # (*, vi, 3)
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Returns:
            out_s: (*, so)
            out_v: (*, vo, 3)
        """
        # Vector branch (equivariant linear transform in R^3).
        v_h = torch.einsum("...ij,kj->...ki", x_v, self.W_v.weight)   # (*, max(vi,vo), 3)
        v_norms = v_h.norm(dim=-1)                                       # (*, max(vi,vo))
        v_out = torch.einsum("...ij,kj->...ki", v_h, self.W_v2.weight)  # (*, vo, 3)

        if self.vector_act is not None:
            gate = self.vector_act(v_out.norm(dim=-1, keepdim=True))    # (*, vo, 1)
            v_out = v_out * gate

        # Scalar branch: concatenate input scalars with norms of intermediate vectors.
        s_in = torch.cat([x_s, v_norms], dim=-1)  # (*, si + max(vi,vo))
        s_out = self.W_s(s_in)                     # (*, so)

        if self.scalar_act is not None:
            s_out = self.scalar_act(s_out)

        return s_out, v_out


# ── GVP Message-Passing Layer ─────────────────────────────────────────────────

class GVPConvLayer(nn.Module):
    """One round of GVP message passing on a residue graph.

    Messages are formed by combining source node, edge, and target node features
    through a GVP, then aggregated (mean) at each target node, and refined through
    another GVP update.
    """

    def __init__(
        self,
        node_dims: tuple[int, int],   # (scalar, vector) for nodes
        edge_dims: tuple[int, int],   # (scalar, vector) for edges
        drop_rate: float = 0.1,
    ) -> None:
        super().__init__()
        ns, nv = node_dims
        es, ev = edge_dims

        # Message function: (src_node || edge || dst_node) → message
        message_in = (2 * ns + es, 2 * nv + ev)
        self.message_gvp = GVP(message_in, node_dims)

        # Update function applied after aggregation
        self.update_gvp = GVP(node_dims, node_dims)

        # Layer norms (invariant — applied to scalars only)
        self.layer_norm_s = nn.LayerNorm(ns)

        self.dropout = nn.Dropout(drop_rate)

    def forward(
        self,
        node_s: torch.Tensor,    # (n_res, ns)
        node_v: torch.Tensor,    # (n_res, nv, 3)
        edge_s: torch.Tensor,    # (n_edges, es)
        edge_v: torch.Tensor,    # (n_edges, ev, 3)
        edge_index: torch.Tensor,  # (2, n_edges)
    ) -> tuple[torch.Tensor, torch.Tensor]:
        src, dst = edge_index[0], edge_index[1]

        # Construct message inputs by concatenating source, edge, and target features.
        msg_s = torch.cat([node_s[src], edge_s, node_s[dst]], dim=-1)
        msg_v = torch.cat([node_v[src], edge_v, node_v[dst]], dim=1)

        # Transform messages through a GVP.
        msg_s, msg_v = self.message_gvp(msg_s, msg_v)

        # Aggregate: mean over incoming messages for each node.
        n_res = node_s.shape[0]
        agg_s = torch.zeros(n_res, msg_s.shape[-1], device=node_s.device)
        agg_v = torch.zeros(n_res, msg_v.shape[1], 3, device=node_v.device)
        count = torch.zeros(n_res, 1, device=node_s.device)

        agg_s.index_add_(0, dst, msg_s)
        agg_v.index_add_(0, dst, msg_v)
        count.index_add_(0, dst, torch.ones(len(dst), 1, device=count.device))
        count = count.clamp(min=1.0)
        agg_s = agg_s / count
        agg_v = agg_v / count

        # Residual update.
        delta_s, delta_v = self.update_gvp(agg_s, agg_v)
        delta_s = self.dropout(delta_s)

        node_s = self.layer_norm_s(node_s + delta_s)
        node_v = node_v + delta_v

        return node_s, node_v


# ── Full GVP-GNN Model ────────────────────────────────────────────────────────

class GVPGNNModel(nn.Module):
    """E(3)-equivariant GNN for per-residue cryptic pocket scoring.

    Input → 4 GVP message-passing layers → MLP output head → sigmoid score.

    Args:
        node_in_dims:   (scalar, vector) dimensions of raw node features.
        edge_in_dims:   (scalar, vector) dimensions of raw edge features.
        hidden_dims:    (scalar, vector) dimensions of hidden GVP layers.
        n_layers:       Number of GVP message-passing rounds.
        drop_rate:      Dropout rate applied within GVP layers.
    """

    def __init__(
        self,
        node_in_dims: tuple[int, int] = (NODE_SCALAR_DIM, NODE_VECTOR_DIM),
        edge_in_dims: tuple[int, int] = (EDGE_SCALAR_DIM, EDGE_VECTOR_DIM),
        hidden_dims: tuple[int, int] = (128, 16),
        n_layers: int = 4,
        drop_rate: float = 0.1,
    ) -> None:
        super().__init__()
        ns_in, nv_in = node_in_dims
        es_in, ev_in = edge_in_dims
        hs, hv = hidden_dims

        # Input embedding: project raw features to hidden dimensions.
        self.node_embed = GVP(
            (ns_in, nv_in), (hs, hv),
            activations=(nn.ReLU(), nn.Sigmoid()),
        )
        self.edge_embed = GVP(
            (es_in, ev_in), (hs // 4, 1),
            activations=(nn.ReLU(), nn.Sigmoid()),
        )
        edge_hidden = (hs // 4, 1)

        # Stack of GVP message-passing layers.
        self.layers = nn.ModuleList([
            GVPConvLayer((hs, hv), edge_hidden, drop_rate=drop_rate)
            for _ in range(n_layers)
        ])

        # Output head: scalars only → per-residue pocket probability.
        self.output_head = nn.Sequential(
            nn.Linear(hs, 64),
            nn.ReLU(),
            nn.Dropout(drop_rate),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(
        self,
        node_s: torch.Tensor,    # (n_res, NODE_SCALAR_DIM)
        node_v: torch.Tensor,    # (n_res, NODE_VECTOR_DIM, 3)
        edge_s: torch.Tensor,    # (n_edges, EDGE_SCALAR_DIM)
        edge_v: torch.Tensor,    # (n_edges, EDGE_VECTOR_DIM, 3)
        edge_index: torch.Tensor,  # (2, n_edges)
    ) -> torch.Tensor:
        """Run forward pass.

        Returns:
            Per-residue pocket-forming probability, shape (n_res,).
        """
        # Embed raw features to hidden dimensions.
        node_s, node_v = self.node_embed(node_s, node_v)
        edge_s, edge_v = self.edge_embed(edge_s, edge_v)

        # Message-passing rounds.
        for layer in self.layers:
            node_s, node_v = layer(node_s, node_v, edge_s, edge_v, edge_index)

        # Per-residue output.
        scores = self.output_head(node_s).squeeze(-1)  # (n_res,)
        return scores
