"""Hotspot residue thresholding and connected-component clustering.

Stage 3A of the Reveal pipeline:

1. Apply a score threshold to the per-residue GNN score map to identify
   "hot" residues in each frame.
2. Build a residue contact graph from Cα distances.
3. Extract connected components of hot residues — each component with
   ≥ MIN_CLUSTER_SIZE members is a candidate pocket.

Output is a list of PocketCandidate objects: (frame_idx, residue_set,
centroid), one entry per candidate pocket event across all active frames.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np

from reveal.constants import (
    HOTSPOT_SCORE_THRESHOLD,
    HOTSPOT_MIN_CLUSTER_SIZE,
    GRAPH_EDGE_CUTOFF_ANGSTROM,
)
from reveal.gnn.inference import PerResidueScores
from reveal.loader.trajectory import LoadedTrajectory

logger = logging.getLogger(__name__)


@dataclass
class PocketCandidate:
    """A candidate pocket in a single trajectory frame.

    Attributes:
        frame_idx:  Index into the full trajectory.
        residue_set: Set of residue indices (0-based) forming the pocket.
        centroid:   Mean Cα centroid of lining residues, shape (3,) in Å.
        mean_score: Mean GNN score of lining residues.
    """
    frame_idx: int
    residue_set: frozenset[int]
    centroid: np.ndarray       # (3,) Å
    mean_score: float


@dataclass
class HotspotResult:
    """All pocket candidates across all scored frames."""
    candidates: list[PocketCandidate] = field(default_factory=list)
    n_frames_with_pockets: int = 0
    n_frames_scored: int = 0


class HotspotDetector:
    """Identifies candidate pocket regions in each trajectory frame."""

    def __init__(
        self,
        score_threshold: float = HOTSPOT_SCORE_THRESHOLD,
        min_cluster_size: int = HOTSPOT_MIN_CLUSTER_SIZE,
        edge_cutoff: float = GRAPH_EDGE_CUTOFF_ANGSTROM,
    ) -> None:
        self._threshold = score_threshold
        self._min_size = min_cluster_size
        self._cutoff = edge_cutoff

    def detect(
        self,
        scores: PerResidueScores,
        trajectory: LoadedTrajectory,
    ) -> HotspotResult:
        """Run hotspot detection across all scored frames.

        Args:
            scores:     Output of GNNInferenceEngine.run().
            trajectory: Loaded trajectory for Cα coordinates.

        Returns:
            HotspotResult with all candidate pocket events.
        """
        candidates: list[PocketCandidate] = []
        n_frames_with_pockets = 0

        for i, frame_idx in enumerate(scores.active_frames):
            frame_scores = scores.scores[i]  # (n_residues,)
            ca = trajectory.ca_coords[frame_idx]  # (n_res, 3)

            frame_candidates = self._detect_in_frame(frame_idx, frame_scores, ca)
            if frame_candidates:
                n_frames_with_pockets += 1
                candidates.extend(frame_candidates)

        logger.info(
            "Hotspot detection: %d pocket candidates from %d/%d frames",
            len(candidates),
            n_frames_with_pockets,
            len(scores.active_frames),
        )

        return HotspotResult(
            candidates=candidates,
            n_frames_with_pockets=n_frames_with_pockets,
            n_frames_scored=len(scores.active_frames),
        )

    # ── private ───────────────────────────────────────────────────────────────

    def _detect_in_frame(
        self,
        frame_idx: int,
        frame_scores: np.ndarray,
        ca_coords: np.ndarray,
    ) -> list[PocketCandidate]:
        """Extract pocket candidates from one frame's score map."""
        hot_mask = frame_scores >= self._threshold
        hot_indices = np.where(hot_mask)[0]

        if len(hot_indices) < self._min_size:
            return []

        components = self._connected_components(hot_indices, ca_coords)
        candidates: list[PocketCandidate] = []

        for component in components:
            if len(component) < self._min_size:
                continue
            residue_set = frozenset(component)
            component_arr = np.array(list(component))
            centroid = ca_coords[component_arr].mean(axis=0)
            mean_score = float(frame_scores[component_arr].mean())
            candidates.append(PocketCandidate(
                frame_idx=frame_idx,
                residue_set=residue_set,
                centroid=centroid,
                mean_score=mean_score,
            ))

        return candidates

    def _connected_components(
        self,
        hot_indices: np.ndarray,
        ca_coords: np.ndarray,
    ) -> list[list[int]]:
        """BFS connected-component analysis on the subgraph of hot residues.

        Two hot residues are adjacent if their Cα–Cα distance ≤ self._cutoff.
        """
        n = len(hot_indices)
        if n == 0:
            return []

        # Build adjacency among hot residues.
        hot_ca = ca_coords[hot_indices]  # (n, 3)
        delta = hot_ca[:, None, :] - hot_ca[None, :, :]  # (n, n, 3)
        dist = np.linalg.norm(delta, axis=-1)             # (n, n)
        adj = (dist <= self._cutoff) & (dist > 0.0)

        visited = [False] * n
        components: list[list[int]] = []

        for start in range(n):
            if visited[start]:
                continue
            component: list[int] = []
            queue = [start]
            visited[start] = True
            while queue:
                node = queue.pop()
                component.append(int(hot_indices[node]))
                for neighbour in range(n):
                    if not visited[neighbour] and adj[node, neighbour]:
                        visited[neighbour] = True
                        queue.append(neighbour)
            components.append(component)

        return components
