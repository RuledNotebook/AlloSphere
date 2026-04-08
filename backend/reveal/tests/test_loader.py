"""Tests for the loader sub-package."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from reveal.loader.manifest import load_scout_manifest, ScoutManifest
from reveal.loader.frame_filter import FrameFilter, FrameFilterResult
from reveal.exceptions import (
    MissingScoutOutputError,
    IncompatibleScoutVersionError,
)
from reveal.tests.conftest import N_FRAMES, N_RESIDUES, TIMESTEP_NS


# ── Manifest tests ────────────────────────────────────────────────────────────

class TestManifest:
    def test_load_valid_manifest(self, scout_output_dir: Path):
        manifest = load_scout_manifest(scout_output_dir)
        assert isinstance(manifest, ScoutManifest)
        assert manifest.protein_id == "t4_lysozyme_l99a"
        assert manifest.n_frames == N_FRAMES
        assert manifest.scout_version == "0.1.0"
        assert abs(manifest.timestep_ns - TIMESTEP_NS) < 1e-6

    def test_missing_manifest_raises(self, tmp_path: Path):
        with pytest.raises(MissingScoutOutputError):
            load_scout_manifest(tmp_path)

    def test_incompatible_version_raises(self, tmp_path: Path):
        manifest = {
            "protein_id": "test", "n_frames": 100, "timestep_ps": 2.0,
            "force_field": "ff14SB", "scout_version": "0.0.1",
            "trajectory_path": "trajectory.h5",
        }
        (tmp_path / "manifest.json").write_text(json.dumps(manifest))
        with pytest.raises(IncompatibleScoutVersionError):
            load_scout_manifest(tmp_path)

    def test_extra_fields_captured(self, tmp_path: Path):
        manifest = {
            "protein_id": "test", "n_frames": 10, "timestep_ps": 2.0,
            "force_field": "ff14SB", "scout_version": "0.1.0",
            "trajectory_path": "trajectory.h5",
            "custom_field": "hello",
        }
        (tmp_path / "manifest.json").write_text(json.dumps(manifest))
        result = load_scout_manifest(tmp_path)
        assert result.extra.get("custom_field") == "hello"


# ── Frame filter tests ────────────────────────────────────────────────────────

class TestFrameFilter:
    def test_rigid_frames_excluded(self, mock_trajectory):
        """Frames where all residues barely move should be excluded."""
        filt = FrameFilter(rmsf_threshold=0.5)
        result = filt.filter(mock_trajectory, per_frame_path=None)
        assert isinstance(result, FrameFilterResult)
        assert result.n_total == N_FRAMES
        assert result.n_active <= N_FRAMES
        assert result.n_active > 0

    def test_all_active_at_zero_threshold(self, mock_trajectory):
        """A threshold of 0 Å should retain all frames (any motion passes)."""
        filt = FrameFilter(rmsf_threshold=0.0)
        result = filt.filter(mock_trajectory, per_frame_path=None)
        assert result.n_active == N_FRAMES

    def test_frame_filter_from_per_frame_json(self, tmp_path: Path, mock_trajectory):
        """When per_frame.json is provided, use its RMSF annotations."""
        # Create per_frame.json where every frame has rmsf > threshold.
        per_frame = [
            {"rmsf": [1.0] * N_RESIDUES} for _ in range(N_FRAMES)
        ]
        per_frame_path = tmp_path / "per_frame.json"
        per_frame_path.write_text(json.dumps(per_frame))

        filt = FrameFilter(rmsf_threshold=0.5)
        result = filt.filter(mock_trajectory, per_frame_path=per_frame_path)
        assert result.n_active == N_FRAMES  # all frames pass (rmsf=1.0 > 0.5)

    def test_active_and_rigid_are_disjoint(self, mock_trajectory):
        filt = FrameFilter(rmsf_threshold=0.5)
        result = filt.filter(mock_trajectory, per_frame_path=None)
        intersection = np.intersect1d(result.active_frames, result.rigid_frames)
        assert len(intersection) == 0

    def test_active_union_rigid_covers_all(self, mock_trajectory):
        filt = FrameFilter(rmsf_threshold=0.5)
        result = filt.filter(mock_trajectory, per_frame_path=None)
        combined = np.sort(np.concatenate([result.active_frames, result.rigid_frames]))
        assert np.array_equal(combined, np.arange(N_FRAMES))
