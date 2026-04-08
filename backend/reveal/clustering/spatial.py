"""DBSCAN spatial clustering of pocket centroids across trajectory frames.

Collapses the flat list of per-frame PocketCandidate events (each with a 3D
centroid) into a set of named pocket identities (P001, P002, …).  The same
physical pocket opening and closing many times is unified into a single entry.

Algorithm:
  - Input: pocket centroids in (x, y, z) Å from LigsiteResult objects.
  - DBSCAN with ε = DBSCAN_EPSILON_ANGSTROM (default 4 Å), min_samples = 3.
  - Each DBSCAN cluster → one PocketIdentity.
  - Noise points (cluster = -1) are discarded.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np
from sklearn.cluster import DBSCAN

from reveal.constants import DBSCAN_EPSILON_ANGSTROM, DBSCAN_MIN_SAMPLES
from reveal.geometry.hotspot import PocketCandidate
from reveal.geometry.ligsite import LigsiteResult

logger = logging.getLogger(__name__)


@dataclass
class PocketIdentity:
    """A named pocket with all its associated events across time.

    Attributes:
        pocket_id:     E.g. 'P001' — ranked by event frequency.
        cluster_label: DBSCAN cluster integer.
        events:        All LigsiteResult events belonging to this pocket.
        candidates:    Corresponding PocketCandidate objects (for residue sets).
        centroid:      Mean centroid of all open events, shape (3,) in Å.
        residue_union: Union of all residue sets across all events.
        residue_consensus: Residues present in ≥ 50% of events.
    """
    pocket_id: str
    cluster_label: int
    events: list[LigsiteResult] = field(default_factory=list)
    candidates: list[PocketCandidate] = field(default_factory=list)
    centroid: np.ndarray = field(default_factory=lambda: np.zeros(3))
    residue_union: frozenset[int] = field(default_factory=frozenset)
    residue_consensus: frozenset[int] = field(default_factory=frozenset)

    @property
    def n_events(self) -> int:
        return len(self.events)

    @property
    def peak_open_frames(self) -> list[int]:
        """Up to 5 frame indices with largest pocket volume."""
        sorted_events = sorted(self.events, key=lambda e: e.volume, reverse=True)
        return [e.frame_idx for e in sorted_events[:5]]

    @property
    def mean_volume(self) -> float:
        if not self.events:
            return 0.0
        return float(np.mean([e.volume for e in self.events]))

    @property
    def mean_score(self) -> float:
        if not self.candidates:
            return 0.0
        return float(np.mean([c.mean_score for c in self.candidates]))


@dataclass
class ClusterResult:
    """Output of spatial clustering."""
    pockets: list[PocketIdentity]
    n_noise_events: int
    n_total_events: int


class SpatialClusterer:
    """Groups pocket events into pocket identities using DBSCAN."""

    def __init__(
        self,
        epsilon: float = DBSCAN_EPSILON_ANGSTROM,
        min_samples: int = DBSCAN_MIN_SAMPLES,
    ) -> None:
        self._epsilon = epsilon
        self._min_samples = min_samples

    def cluster(
        self,
        candidates: list[PocketCandidate],
        ligsite_results: list[LigsiteResult],
    ) -> ClusterResult:
        """Cluster pocket events into pocket identities.

        Args:
            candidates:      PocketCandidate objects from hotspot detection.
            ligsite_results: LigsiteResult objects from volumetric scanning.
                             Must correspond 1:1 with `candidates`.

        Returns:
            ClusterResult with one PocketIdentity per DBSCAN cluster.
        """
        # Filter out invalid (too small) pockets.
        valid_pairs = [
            (c, r) for c, r in zip(candidates, ligsite_results) if r.valid
        ]

        if not valid_pairs:
            logger.warning("No valid pocket events to cluster")
            return ClusterResult(pockets=[], n_noise_events=0, n_total_events=0)

        valid_candidates, valid_results = zip(*valid_pairs)
        centroids = np.array([r.centroid for r in valid_results])

        db = DBSCAN(eps=self._epsilon, min_samples=self._min_samples, metric="euclidean")
        labels = db.fit_predict(centroids)

        unique_labels = sorted(set(labels) - {-1})
        n_noise = int((labels == -1).sum())

        logger.info(
            "DBSCAN clustering: %d pocket identities from %d events (%d noise)",
            len(unique_labels), len(labels), n_noise,
        )

        pockets: list[PocketIdentity] = []
        for rank, label in enumerate(unique_labels, start=1):
            mask = labels == label
            pocket_candidates = [valid_candidates[i] for i in range(len(mask)) if mask[i]]
            pocket_events = [valid_results[i] for i in range(len(mask)) if mask[i]]

            centroid = np.array([e.centroid for e in pocket_events]).mean(axis=0)
            residue_union = frozenset().union(*[c.residue_set for c in pocket_candidates])

            # Consensus residues: appear in ≥ 50% of events.
            from collections import Counter
            counts = Counter(r for c in pocket_candidates for r in c.residue_set)
            threshold = max(1, len(pocket_candidates) // 2)
            residue_consensus = frozenset(r for r, cnt in counts.items() if cnt >= threshold)

            pocket = PocketIdentity(
                pocket_id=f"P{rank:03d}",
                cluster_label=label,
                events=list(pocket_events),
                candidates=list(pocket_candidates),
                centroid=centroid,
                residue_union=residue_union,
                residue_consensus=residue_consensus,
            )
            pockets.append(pocket)

        return ClusterResult(
            pockets=pockets,
            n_noise_events=n_noise,
            n_total_events=len(valid_pairs),
        )
