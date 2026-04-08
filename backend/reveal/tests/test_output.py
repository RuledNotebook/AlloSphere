"""Tests for output assembly: atlas, CSVs, and manifest."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from reveal.types import PocketAtlas, PocketEntry, RevealConfig, RevealManifest
from reveal.output.atlas import AtlasAssembler
from reveal.output.csv_writer import CsvWriter
from reveal.output.manifest import ManifestWriter
from reveal.scoring.classifier import PocketClassifier
from reveal.scoring.probe_overlap import ProbeOverlapCalculator


# ── Test fixtures ─────────────────────────────────────────────────────────────

def _make_pocket_entry(pocket_id: str = "P001", rank: int = 1, dscore: float = 0.82) -> PocketEntry:
    return PocketEntry(
        pocket_id=pocket_id,
        rank=rank,
        residues=[45, 46, 47, 89, 90],
        centroid_angstrom=[23.4, 11.2, -5.8],
        druggability_score=dscore,
        mean_volume_angstrom3=312.4,
        hydrophobicity=0.71,
        fraction_time_open=0.034,
        k_open_per_ns=0.012,
        k_close_per_ns=0.34,
        mean_open_duration_ns=2.9,
        peak_open_frames=[14203, 14891],
        probe_overlap={"benzene": 0.82, "phenol": 0.61},
        cryptic_probability=0.87,
        likely_allosteric=True,
        orthosteric_distance_angstrom=18.4,
        classification="cryptic_hydrophobic",
    )


def _make_atlas(n_pockets: int = 3) -> PocketAtlas:
    pockets = [_make_pocket_entry(f"P{i:03d}", rank=i, dscore=1.0 - i * 0.1) for i in range(1, n_pockets + 1)]
    return PocketAtlas(
        protein_id="t4_lysozyme_l99a",
        scout_manifest_path="/data/scout/manifest.json",
        reveal_version="0.1.0",
        n_frames_analysed=350,
        n_frames_total=500,
        pockets=pockets,
    )


# ── PocketAtlas model tests ───────────────────────────────────────────────────

class TestPocketAtlas:
    def test_atlas_roundtrip_json(self):
        """Serialise and deserialise the atlas — all fields preserved."""
        atlas = _make_atlas()
        json_str = atlas.model_dump_json()
        loaded = PocketAtlas.model_validate_json(json_str)
        assert loaded.protein_id == atlas.protein_id
        assert len(loaded.pockets) == len(atlas.pockets)
        assert loaded.pockets[0].druggability_score == atlas.pockets[0].druggability_score

    def test_top_n_returns_n_pockets(self):
        atlas = _make_atlas(n_pockets=5)
        assert len(atlas.top(3)) == 3

    def test_top_n_sorted_by_rank(self):
        atlas = _make_atlas(n_pockets=5)
        top = atlas.top(5)
        ranks = [p.rank for p in top]
        assert ranks == sorted(ranks)

    def test_get_pocket_by_id(self):
        atlas = _make_atlas()
        p = atlas.get_pocket("P001")
        assert p is not None
        assert p.pocket_id == "P001"

    def test_get_nonexistent_pocket_returns_none(self):
        atlas = _make_atlas()
        assert atlas.get_pocket("P999") is None


# ── CsvWriter tests ───────────────────────────────────────────────────────────

class TestCsvWriter:
    def test_atlas_summary_csv_created(self, tmp_path):
        atlas = _make_atlas()
        writer = CsvWriter()
        path = writer.write_atlas_summary(atlas, tmp_path)
        assert path.exists()

    def test_atlas_summary_csv_row_count(self, tmp_path):
        atlas = _make_atlas(n_pockets=3)
        writer = CsvWriter()
        path = writer.write_atlas_summary(atlas, tmp_path)
        lines = path.read_text().splitlines()
        assert len(lines) == 4  # 1 header + 3 data rows

    def test_druggability_scores_csv_created(self, tmp_path):
        atlas = _make_atlas()
        writer = CsvWriter()
        path = writer.write_druggability_scores(atlas, tmp_path)
        assert path.exists()

    def test_kinetics_csv_created(self, tmp_path):
        atlas = _make_atlas()
        writer = CsvWriter()
        path = writer.write_kinetics(atlas, tmp_path)
        assert path.exists()

    def test_kinetics_csv_has_correct_columns(self, tmp_path):
        import csv
        atlas = _make_atlas(n_pockets=1)
        writer = CsvWriter()
        path = writer.write_kinetics(atlas, tmp_path)
        with path.open() as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
        assert "k_open_per_ns" in fieldnames
        assert "k_close_per_ns" in fieldnames
        assert "mean_open_duration_ns" in fieldnames


# ── ManifestWriter tests ──────────────────────────────────────────────────────

class TestManifestWriter:
    def test_manifest_written(self, tmp_path, scout_output_dir):
        atlas = _make_atlas()
        config = RevealConfig(
            scout_output_dir=scout_output_dir,
            output_dir=tmp_path,
        )
        writer = ManifestWriter()
        path = writer.write(atlas, config, tmp_path / "trajectory.h5", tmp_path)
        assert path.exists()

    def test_manifest_json_valid(self, tmp_path, scout_output_dir):
        atlas = _make_atlas()
        config = RevealConfig(
            scout_output_dir=scout_output_dir,
            output_dir=tmp_path,
        )
        writer = ManifestWriter()
        path = writer.write(atlas, config, tmp_path / "trajectory.h5", tmp_path)
        data = json.loads(path.read_text())
        assert data["protein_id"] == "t4_lysozyme_l99a"
        assert data["n_pockets_detected"] == 3
        assert "reveal_version" in data

    def test_manifest_roundtrip(self, tmp_path, scout_output_dir):
        atlas = _make_atlas()
        config = RevealConfig(
            scout_output_dir=scout_output_dir,
            output_dir=tmp_path,
        )
        writer = ManifestWriter()
        path = writer.write(atlas, config, tmp_path / "trajectory.h5", tmp_path)
        manifest = RevealManifest.model_validate_json(path.read_text())
        assert manifest.n_frames_total == 500
