"""Shared pytest fixtures for Reveal tests.

The mini trajectory fixture creates a synthetic 500-frame T4 lysozyme-like
protein entirely in memory — no MDTraj or real trajectory file required.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import numpy as np
import pytest

from reveal.loader.trajectory import LoadedTrajectory
from reveal.gnn.inference import PerResidueScores

# ── Protein constants for the T4 lysozyme L99A proxy ─────────────────────────

N_RESIDUES = 164          # T4 lysozyme has 164 residues
N_FRAMES = 500
TIMESTEP_NS = 0.002       # 2 ps → 0.002 ns

# Residues forming the L99A cryptic pocket (0-indexed): F104, A108, L118, V149, F153
KNOWN_POCKET_RESIDUES = [103, 107, 117, 148, 152]


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def rng() -> np.random.Generator:
    return np.random.default_rng(seed=42)


@pytest.fixture(scope="session")
def synthetic_ca_coords(rng) -> np.ndarray:
    """Cα coordinate array for the synthetic trajectory, shape (N_FRAMES, N_RESIDUES, 3) Å."""
    # Start from a plausible extended chain and add Gaussian noise per frame.
    base_coords = np.zeros((N_RESIDUES, 3), dtype=np.float32)
    for i in range(N_RESIDUES):
        base_coords[i] = [i * 3.8, 0.0, 0.0]  # extended β-strand spacing

    # Add per-frame fluctuations: mostly small, but the known pocket residues
    # get larger fluctuations in 5% of frames (simulating pocket opening).
    coords = np.tile(base_coords, (N_FRAMES, 1, 1)).astype(np.float32)
    coords += rng.normal(0, 0.3, size=coords.shape).astype(np.float32)

    # Simulate pocket opening events in frames 100–120 and 300–320.
    for frame_range in [range(100, 121), range(300, 321)]:
        for f in frame_range:
            for r in KNOWN_POCKET_RESIDUES:
                coords[f, r] += rng.normal(0, 1.5, size=(3,)).astype(np.float32)

    return coords


@pytest.fixture(scope="session")
def residue_names() -> list[str]:
    """164 T4 lysozyme-like residue names (simplified: all ALA except pocket residues)."""
    standard = ["ALA"] * N_RESIDUES
    # Known pocket: phenylalanines and leucine/valine
    standard[103] = "PHE"  # F104
    standard[107] = "ALA"  # A108
    standard[117] = "LEU"  # L118
    standard[148] = "VAL"  # V149
    standard[152] = "PHE"  # F153
    return standard


@pytest.fixture(scope="session")
def residue_ids() -> list[int]:
    return list(range(1, N_RESIDUES + 1))


@pytest.fixture(scope="session")
def mock_trajectory(synthetic_ca_coords, residue_names, residue_ids) -> LoadedTrajectory:
    """A LoadedTrajectory built from synthetic data — no MDTraj required."""
    # Cβ = Cα + small sidechain direction offset
    cb_coords = synthetic_ca_coords + 0.5 * np.ones((N_FRAMES, N_RESIDUES, 3), dtype=np.float32)

    return LoadedTrajectory(
        ca_coords=synthetic_ca_coords,
        cb_coords=cb_coords,
        residue_names=residue_names,
        residue_ids=residue_ids,
        n_frames=N_FRAMES,
        n_residues=N_RESIDUES,
        timestep_ns=TIMESTEP_NS,
        traj=None,  # no real MDTraj trajectory — fine for unit tests
    )


@pytest.fixture(scope="session")
def rmsf(synthetic_ca_coords) -> np.ndarray:
    """Per-residue RMSF computed from the synthetic trajectory."""
    mean_ca = synthetic_ca_coords.mean(axis=0, keepdims=True)
    sq_dev = ((synthetic_ca_coords - mean_ca) ** 2).sum(axis=-1)
    return np.sqrt(sq_dev.mean(axis=0)).astype(np.float32)


@pytest.fixture(scope="session")
def mock_scores(rng) -> PerResidueScores:
    """Synthetic per-residue GNN scores — pocket residues have elevated scores."""
    active_frames = np.arange(N_FRAMES, dtype=np.int64)
    scores = rng.uniform(0.0, 0.3, size=(N_FRAMES, N_RESIDUES)).astype(np.float32)

    # Elevate scores for known pocket residues in the opening frames.
    for frame_range in [range(100, 121), range(300, 321)]:
        for f in frame_range:
            for r in KNOWN_POCKET_RESIDUES:
                scores[f, r] = rng.uniform(0.7, 1.0)

    scratch = Path(tempfile.mktemp(suffix=".h5"))
    return PerResidueScores(
        scores=scores,
        active_frames=active_frames,
        scratch_path=scratch,
    )


@pytest.fixture(scope="session")
def scout_output_dir(tmp_path_factory) -> Path:
    """Create a minimal Scout output directory with manifest.json."""
    d = tmp_path_factory.mktemp("scout_output")

    manifest = {
        "protein_id": "t4_lysozyme_l99a",
        "n_frames": N_FRAMES,
        "timestep_ps": TIMESTEP_NS * 1000,
        "force_field": "ff14SB",
        "scout_version": "0.1.0",
        "trajectory_path": "trajectory.h5",
    }
    (d / "manifest.json").write_text(json.dumps(manifest))

    return d
