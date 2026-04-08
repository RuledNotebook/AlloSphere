"""Tests for druggability scoring and pocket classification."""

from __future__ import annotations

import numpy as np
import pytest

from reveal.scoring.dscore import DscoreCalculator, DscoreResult
from reveal.scoring.classifier import PocketClassifier
from reveal.scoring.probe_overlap import ProbeOverlapCalculator


# ── DscoreCalculator tests ────────────────────────────────────────────────────

class TestDscoreCalculator:
    def setup_method(self):
        self.calc = DscoreCalculator()

    def _compute(self, residue_names=None, volume=500.0, enclosure=0.6,
                 probe_overlap=None, gnn_score=0.7):
        if residue_names is None:
            residue_names = ["LEU", "ILE", "VAL", "PHE", "ALA"]
        if probe_overlap is None:
            probe_overlap = {"benzene": 0.8, "phenol": 0.6}
        return self.calc.compute(
            pocket_id="P001",
            residue_names=residue_names,
            mean_volume=volume,
            enclosure=enclosure,
            probe_overlap=probe_overlap,
            gnn_mean_score=gnn_score,
        )

    def test_returns_dscore_result(self):
        result = self._compute()
        assert isinstance(result, DscoreResult)

    def test_dscore_in_zero_one(self):
        result = self._compute()
        assert 0.0 <= result.dscore <= 1.0

    def test_high_gnn_score_increases_dscore(self):
        low = self._compute(gnn_score=0.1)
        high = self._compute(gnn_score=0.9)
        assert high.dscore > low.dscore

    def test_hydrophobic_lining_increases_dscore(self):
        hydro = self._compute(residue_names=["LEU", "ILE", "VAL", "PHE", "TRP"])
        polar = self._compute(residue_names=["ASP", "GLU", "ARG", "LYS", "HIS"])
        assert hydro.dscore > polar.dscore

    def test_optimal_volume_gives_high_volume_score(self):
        """Volume 650 Å³ (optimal centre) should give volume_score near 1."""
        result = self._compute(volume=650.0)
        assert result.volume_score > 0.8

    def test_tiny_volume_gives_low_volume_score(self):
        result = self._compute(volume=10.0)
        assert result.volume_score < 0.1

    def test_no_probe_overlap_accepted(self):
        """Empty probe_overlap dict should not crash."""
        result = self._compute(probe_overlap={})
        assert isinstance(result, DscoreResult)

    def test_t4_lysozyme_l99a_pocket_score(self):
        """
        Validation: T4 lysozyme L99A pocket (F104, A108, L118, V149, F153).
        Must achieve Dscore ≥ 0.75.
        """
        result = self.calc.compute(
            pocket_id="P001",
            residue_names=["PHE", "ALA", "LEU", "VAL", "PHE"],
            mean_volume=312.0,
            enclosure=0.71,
            probe_overlap={"benzene": 0.82, "phenol": 0.61},
            gnn_mean_score=0.87,
        )
        assert result.dscore >= 0.75, (
            f"T4L L99A pocket Dscore {result.dscore:.3f} < 0.75 validation target"
        )


# ── PocketClassifier tests ────────────────────────────────────────────────────

class TestPocketClassifier:
    def setup_method(self):
        self.clf = PocketClassifier()
        self.centroid = np.array([0.0, 0.0, 0.0])

    def test_cryptic_hydrophobic_classification(self):
        cls = self.clf.classify(
            residue_names=["LEU", "ILE", "VAL", "PHE"],
            gnn_mean_score=0.8,
            mean_volume=400.0,
            enclosure=0.6,
            centroid=self.centroid,
        )
        assert cls == "cryptic_hydrophobic"

    def test_cryptic_polar_classification(self):
        cls = self.clf.classify(
            residue_names=["ASP", "GLU", "ARG", "LYS"],
            gnn_mean_score=0.8,
            mean_volume=400.0,
            enclosure=0.6,
            centroid=self.centroid,
        )
        assert cls == "cryptic_polar"

    def test_surface_groove_classification(self):
        cls = self.clf.classify(
            residue_names=["ALA"] * 5,
            gnn_mean_score=0.3,
            mean_volume=200.0,
            enclosure=0.05,  # very low enclosure
            centroid=self.centroid,
        )
        assert cls == "surface_groove"

    def test_orthosteric_adjacent_overrides_all(self):
        active_site = np.array([5.0, 0.0, 0.0])  # 5 Å away — within threshold
        cls = self.clf.classify(
            residue_names=["LEU"] * 5,
            gnn_mean_score=0.9,
            mean_volume=600.0,
            enclosure=0.8,
            centroid=self.centroid,
            active_site_centroid=active_site,
        )
        assert cls == "orthosteric_adjacent"

    def test_likely_allosteric_true(self):
        result = self.clf.is_likely_allosteric(
            classification="cryptic_hydrophobic",
            orthosteric_distance=20.0,
            gnn_mean_score=0.8,
        )
        assert result is True

    def test_likely_allosteric_false_for_orthosteric_adjacent(self):
        result = self.clf.is_likely_allosteric(
            classification="orthosteric_adjacent",
            orthosteric_distance=5.0,
            gnn_mean_score=0.9,
        )
        assert result is False

    def test_likely_allosteric_false_when_too_close(self):
        result = self.clf.is_likely_allosteric(
            classification="cryptic_hydrophobic",
            orthosteric_distance=8.0,  # within 12 Å
            gnn_mean_score=0.9,
        )
        assert result is False


# ── ProbeOverlapCalculator tests ──────────────────────────────────────────────

class TestProbeOverlapCalculator:
    def test_no_probe_dir_returns_empty(self, tmp_path):
        calc = ProbeOverlapCalculator(probe_density_dir=None)
        result = calc.compute_overlap(np.array([0.0, 0.0, 0.0]), 5.0)
        assert result == {}

    def test_missing_probe_dir_returns_empty(self, tmp_path):
        calc = ProbeOverlapCalculator(probe_density_dir=tmp_path / "nonexistent")
        result = calc.compute_overlap(np.array([0.0, 0.0, 0.0]), 5.0)
        assert result == {}

    def test_empty_dir_returns_empty(self, tmp_path):
        calc = ProbeOverlapCalculator(probe_density_dir=tmp_path)
        result = calc.compute_overlap(np.array([0.0, 0.0, 0.0]), 5.0)
        assert result == {}
