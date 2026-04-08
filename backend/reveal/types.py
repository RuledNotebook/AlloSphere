"""Pydantic models for Reveal's public data contracts.

Shared models (PocketAtlas, PocketEntry, RevealManifest) are also imported by
Allos Dock via the top-level backend/shared/ package.  Keep field names and
types stable — changes are a breaking API change.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


# ── Per-pocket entry ──────────────────────────────────────────────────────────

class PocketEntry(BaseModel):
    pocket_id: str = Field(description="Unique identifier, e.g. 'P001'")
    rank: int = Field(ge=1, description="Rank by druggability score (1 = best)")
    residues: list[int] = Field(description="1-indexed residue numbers of pocket-lining residues")
    centroid_angstrom: list[float] = Field(
        min_length=3, max_length=3,
        description="Pocket centroid in Å (x, y, z)"
    )
    druggability_score: float = Field(ge=0.0, le=1.0)
    mean_volume_angstrom3: float = Field(ge=0.0)
    hydrophobicity: float = Field(ge=-4.5, le=4.5, description="Mean Kyte-Doolittle GRAVY index")
    fraction_time_open: float = Field(ge=0.0, le=1.0)
    k_open_per_ns: float = Field(ge=0.0)
    k_close_per_ns: float = Field(ge=0.0)
    mean_open_duration_ns: float = Field(ge=0.0)
    peak_open_frames: list[int] = Field(description="Frame indices of representative open conformations")
    probe_overlap: dict[str, float] = Field(
        default_factory=dict,
        description="Fraction of pocket volume overlapping each Scout probe grid"
    )
    cryptic_probability: float = Field(ge=0.0, le=1.0)
    likely_allosteric: bool
    orthosteric_distance_angstrom: float | None = Field(
        default=None,
        description="Cα centroid distance to known active site; None if active site is unknown"
    )
    classification: Literal[
        "cryptic_hydrophobic",
        "cryptic_polar",
        "cryptic_ppi",
        "surface_groove",
        "orthosteric_adjacent",
    ]


# ── Full pocket atlas ─────────────────────────────────────────────────────────

class PocketAtlas(BaseModel):
    protein_id: str
    scout_manifest_path: str
    reveal_version: str
    n_frames_analysed: int
    n_frames_total: int
    pockets: list[PocketEntry] = Field(default_factory=list)

    def get_pocket(self, pocket_id: str) -> PocketEntry | None:
        for p in self.pockets:
            if p.pocket_id == pocket_id:
                return p
        return None

    def top(self, n: int = 10) -> list[PocketEntry]:
        return sorted(self.pockets, key=lambda p: p.rank)[:n]


# ── Run configuration ─────────────────────────────────────────────────────────

class RevealConfig(BaseModel):
    # I/O
    scout_output_dir: Path
    output_dir: Path

    # Frame filtering
    rmsf_rigid_threshold: float = Field(default=0.5, ge=0.0)

    # GNN inference
    checkpoint_path: Path | None = Field(default=None)
    gpu_batch_size: int = Field(default=256, ge=1)
    device: str = Field(default="cuda", description="PyTorch device string, e.g. 'cuda', 'cpu'")

    # Pocket extraction
    hotspot_score_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    hotspot_min_cluster_size: int = Field(default=5, ge=1)
    min_pocket_volume: float = Field(default=150.0, ge=0.0)

    # Clustering
    dbscan_epsilon: float = Field(default=4.0, ge=0.0)
    dbscan_min_samples: int = Field(default=3, ge=1)

    # Scoring
    dscore_threshold: float = Field(default=0.0, ge=0.0, le=1.0)

    # Output
    top_n_pymol: int = Field(default=10, ge=1)
    write_pymol: bool = Field(default=True)


# ── Reveal manifest ───────────────────────────────────────────────────────────

class RevealManifest(BaseModel):
    reveal_version: str
    protein_id: str
    scout_manifest_path: str
    trajectory_path: str
    n_frames_total: int
    n_frames_analysed: int
    n_pockets_detected: int
    output_dir: str
    config: dict
