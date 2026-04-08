"""Tests for temporal clustering and kinetics analysis."""

from __future__ import annotations

import numpy as np
import pytest

from reveal.clustering.spatial import SpatialClusterer, ClusterResult, PocketIdentity
from reveal.clustering.kinetics import KineticsAnalyser, KineticsResult
from reveal.clustering.merge import PocketMerger
from reveal.geometry.hotspot import PocketCandidate
from reveal.geometry.ligsite import LigsiteResult


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_candidate(frame_idx: int, centroid: list[float], residues: set[int]) -> PocketCandidate:
    return PocketCandidate(
        frame_idx=frame_idx,
        residue_set=frozenset(residues),
        centroid=np.array(centroid, dtype=np.float32),
        mean_score=0.75,
    )


def make_ligsite(frame_idx: int, centroid: list[float], volume: float = 400.0) -> LigsiteResult:
    return LigsiteResult(
        frame_idx=frame_idx,
        residue_set=frozenset({1, 2, 3}),
        volume=volume,
        sasa_proxy=100.0,
        centroid=np.array(centroid, dtype=np.float32),
        valid=volume >= 150.0,
    )


# ── SpatialClusterer tests ────────────────────────────────────────────────────

class TestSpatialClusterer:
    def test_clusters_nearby_events_into_one_pocket(self):
        """Events within 4 Å should form a single pocket identity."""
        candidates = [make_candidate(i, [0.0, 0.0, float(i)], {1, 2, 3}) for i in range(10)]
        results = [make_ligsite(i, [0.0, 0.0, float(i)]) for i in range(10)]

        clusterer = SpatialClusterer(epsilon=4.0, min_samples=3)
        result = clusterer.cluster(candidates, results)

        assert isinstance(result, ClusterResult)
        assert len(result.pockets) == 1
        assert result.pockets[0].pocket_id == "P001"

    def test_distant_events_form_separate_pockets(self):
        """Events 50 Å apart should form two distinct pocket identities."""
        candidates_a = [make_candidate(i, [0.0, 0.0, 0.0], {1, 2}) for i in range(5)]
        results_a = [make_ligsite(i, [0.0, 0.0, 0.0]) for i in range(5)]
        candidates_b = [make_candidate(i + 5, [50.0, 0.0, 0.0], {10, 11}) for i in range(5)]
        results_b = [make_ligsite(i + 5, [50.0, 0.0, 0.0]) for i in range(5)]

        clusterer = SpatialClusterer(epsilon=4.0, min_samples=3)
        result = clusterer.cluster(candidates_a + candidates_b, results_a + results_b)

        assert len(result.pockets) == 2

    def test_invalid_events_excluded(self):
        """Events with volume < min_volume should not form a pocket."""
        candidates = [make_candidate(i, [0.0, 0.0, 0.0], {1, 2, 3}) for i in range(10)]
        results = [make_ligsite(i, [0.0, 0.0, 0.0], volume=50.0) for i in range(10)]  # too small

        clusterer = SpatialClusterer(epsilon=4.0, min_samples=3)
        result = clusterer.cluster(candidates, results)
        assert len(result.pockets) == 0

    def test_pocket_identity_fields(self):
        candidates = [make_candidate(i, [0.0, 0.0, 0.0], {1, 2, 3}) for i in range(5)]
        results = [make_ligsite(i, [0.0, 0.0, 0.0]) for i in range(5)]

        clusterer = SpatialClusterer(epsilon=4.0, min_samples=3)
        result = clusterer.cluster(candidates, results)

        if result.pockets:
            p = result.pockets[0]
            assert isinstance(p, PocketIdentity)
            assert p.n_events == 5
            assert p.centroid.shape == (3,)


# ── KineticsAnalyser tests ────────────────────────────────────────────────────

class TestKineticsAnalyser:
    def _make_pocket(self, frame_indices: list[int]) -> PocketIdentity:
        pocket = PocketIdentity(pocket_id="P001", cluster_label=0)
        for f in frame_indices:
            pocket.events.append(make_ligsite(f, [0.0, 0.0, 0.0]))
        return pocket

    def test_fraction_time_open(self):
        pocket = self._make_pocket(list(range(100)))  # 100 out of 1000 frames open
        analyser = KineticsAnalyser(timestep_ns=0.002)
        result = analyser.analyse(pocket, n_frames_total=1000)
        assert abs(result.fraction_time_open - 0.1) < 1e-6

    def test_contiguous_episode_detection(self):
        """A 10-frame open episode should give mean_open_duration = 10 * timestep."""
        pocket = self._make_pocket(list(range(10, 20)))  # one episode of 10 frames
        analyser = KineticsAnalyser(timestep_ns=0.002)
        result = analyser.analyse(pocket, n_frames_total=1000)
        expected_duration = 10 * 0.002  # 0.02 ns
        assert abs(result.mean_open_duration_ns - expected_duration) < 1e-6

    def test_zero_kinetics_for_empty_pocket(self):
        pocket = self._make_pocket([])
        analyser = KineticsAnalyser(timestep_ns=0.002)
        result = analyser.analyse(pocket, n_frames_total=1000)
        assert result.fraction_time_open == 0.0
        assert result.k_open_per_ns == 0.0

    def test_kinetics_result_type(self):
        pocket = self._make_pocket([1, 2, 3, 10, 11, 12])
        analyser = KineticsAnalyser(timestep_ns=0.002)
        result = analyser.analyse(pocket, n_frames_total=200)
        assert isinstance(result, KineticsResult)


# ── PocketMerger tests ────────────────────────────────────────────────────────

class TestPocketMerger:
    def _make_pocket_identity(
        self,
        pocket_id: str,
        centroid: list[float],
        residues: frozenset,
        n_events: int = 5,
    ) -> PocketIdentity:
        p = PocketIdentity(
            pocket_id=pocket_id,
            cluster_label=int(pocket_id[1:]) - 1,
            centroid=np.array(centroid, dtype=np.float32),
            residue_union=residues,
            residue_consensus=residues,
        )
        for i in range(n_events):
            p.events.append(make_ligsite(i, centroid))
        return p

    def test_nearby_overlapping_pockets_merged(self):
        p1 = self._make_pocket_identity("P001", [0.0, 0.0, 0.0], frozenset({1, 2, 3, 4}))
        p2 = self._make_pocket_identity("P002", [2.0, 0.0, 0.0], frozenset({2, 3, 4, 5}))

        merger = PocketMerger(distance_threshold=6.0, overlap_threshold=0.3)
        result = merger.merge([p1, p2])
        assert len(result) == 1

    def test_distant_pockets_not_merged(self):
        p1 = self._make_pocket_identity("P001", [0.0, 0.0, 0.0], frozenset({1, 2}))
        p2 = self._make_pocket_identity("P002", [50.0, 0.0, 0.0], frozenset({10, 11}))

        merger = PocketMerger(distance_threshold=6.0, overlap_threshold=0.5)
        result = merger.merge([p1, p2])
        assert len(result) == 2

    def test_merged_pockets_reranked(self):
        """After merge, pockets should be re-ranked 1, 2, ... consecutively."""
        p1 = self._make_pocket_identity("P001", [0.0, 0.0, 0.0], frozenset({1, 2}), n_events=10)
        p2 = self._make_pocket_identity("P002", [50.0, 0.0, 0.0], frozenset({10, 11}), n_events=5)
        merger = PocketMerger()
        result = merger.merge([p1, p2])
        ids = [p.pocket_id for p in result]
        assert "P001" in ids
        assert "P002" in ids
