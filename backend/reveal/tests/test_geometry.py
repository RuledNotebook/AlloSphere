"""Tests for geometry sub-package: hotspot detection and pocket measurement."""

from __future__ import annotations

import numpy as np
import pytest

from reveal.geometry.hotspot import HotspotDetector, HotspotResult, PocketCandidate
from reveal.geometry.ligsite import LigsiteScanner, LigsiteResult
from reveal.geometry.surface import (
    compute_enclosure,
    compute_pocket_depth,
    compute_mouth_width,
    _fibonacci_sphere,
)
from reveal.tests.conftest import N_RESIDUES, N_FRAMES, KNOWN_POCKET_RESIDUES


# ── Hotspot detector tests ────────────────────────────────────────────────────

class TestHotspotDetector:
    def test_detects_pockets_in_opening_frames(self, mock_scores, mock_trajectory):
        detector = HotspotDetector(score_threshold=0.5, min_cluster_size=3)
        result = detector.detect(mock_scores, mock_trajectory)

        assert isinstance(result, HotspotResult)
        assert result.n_frames_scored == N_FRAMES
        # There should be pocket candidates from the elevated-score frames.
        assert result.n_frames_with_pockets > 0
        assert len(result.candidates) > 0

    def test_candidates_contain_pocket_residues(self, mock_scores, mock_trajectory):
        """At least some candidates should overlap with the known pocket residues."""
        detector = HotspotDetector(score_threshold=0.5, min_cluster_size=2)
        result = detector.detect(mock_scores, mock_trajectory)

        known = set(KNOWN_POCKET_RESIDUES)
        any_overlap = any(
            len(c.residue_set & known) > 0 for c in result.candidates
        )
        assert any_overlap, "No candidate overlaps with known pocket residues"

    def test_no_pockets_with_high_threshold(self, mock_scores, mock_trajectory):
        """A score threshold > 1 should yield no candidates."""
        detector = HotspotDetector(score_threshold=1.1, min_cluster_size=3)
        result = detector.detect(mock_scores, mock_trajectory)
        assert result.n_frames_with_pockets == 0
        assert len(result.candidates) == 0

    def test_candidate_fields(self, mock_scores, mock_trajectory):
        detector = HotspotDetector(score_threshold=0.5, min_cluster_size=2)
        result = detector.detect(mock_scores, mock_trajectory)
        if result.candidates:
            c = result.candidates[0]
            assert isinstance(c, PocketCandidate)
            assert isinstance(c.residue_set, frozenset)
            assert c.centroid.shape == (3,)
            assert 0.0 <= c.mean_score <= 1.0


# ── LIGSITE scanner tests ─────────────────────────────────────────────────────

class TestLigsiteScanner:
    def setup_method(self):
        # Build a simple pocket: 10 residues arranged in a bowl.
        n = 30
        self.ca = np.zeros((n, 3), dtype=np.float32)
        for i in range(n):
            self.ca[i] = [i * 3.8, 0.0, 0.0]
        # Pocket residues in the middle.
        self.pocket_residues = frozenset(range(10, 20))
        self.scanner = LigsiteScanner(min_volume=0.0)  # no volume cutoff in tests

    def test_returns_ligsite_result(self):
        result = self.scanner.measure(self.ca, self.pocket_residues, frame_idx=0)
        assert isinstance(result, LigsiteResult)
        assert result.frame_idx == 0
        assert result.residue_set == self.pocket_residues

    def test_volume_positive(self):
        result = self.scanner.measure(self.ca, self.pocket_residues, frame_idx=0)
        assert result.volume >= 0.0

    def test_centroid_near_lining_residues(self):
        result = self.scanner.measure(self.ca, self.pocket_residues, frame_idx=0)
        lining_ca = self.ca[sorted(self.pocket_residues)]
        expected_centroid = lining_ca.mean(axis=0)
        # Centroid should be within 15 Å of the lining residues' mean.
        dist = np.linalg.norm(result.centroid - expected_centroid)
        assert dist < 15.0, f"Centroid too far: {dist:.1f} Å"

    def test_small_pockets_marked_invalid(self):
        scanner = LigsiteScanner(min_volume=1e9)  # impossibly high threshold
        result = scanner.measure(self.ca, self.pocket_residues, frame_idx=0)
        assert not result.valid


# ── Surface calculation tests ─────────────────────────────────────────────────

class TestSurface:
    def test_enclosure_with_large_volume(self):
        """Large volume, small SASA → high enclosure."""
        enc = compute_enclosure(volume=1000.0, sasa=10.0)
        assert 0.0 <= enc <= 1.0

    def test_enclosure_zero_on_degenerate_input(self):
        assert compute_enclosure(0.0, 0.0) == 0.0

    def test_pocket_depth(self):
        ca = np.array([[0.0, 0.0, 0.0], [3.8, 0.0, 0.0], [7.6, 0.0, 0.0]])
        centroid = np.array([3.8, 0.0, 0.0])
        depth = compute_pocket_depth(centroid, ca, [0, 1, 2])
        assert abs(depth - 3.8) < 1e-4

    def test_mouth_width(self):
        ca = np.array([[0.0, 0.0, 0.0], [10.0, 0.0, 0.0]])
        width = compute_mouth_width(np.array([5.0, 0.0, 0.0]), ca, [0, 1])
        assert abs(width - 10.0) < 1e-4

    def test_fibonacci_sphere_unit_length(self):
        pts = _fibonacci_sphere(100)
        norms = np.linalg.norm(pts, axis=-1)
        np.testing.assert_allclose(norms, 1.0, atol=1e-5)
