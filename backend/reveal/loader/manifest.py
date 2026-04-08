"""Parse and validate the Scout output manifest.json."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from reveal.exceptions import IncompatibleScoutVersionError, MissingScoutOutputError
from reveal.constants import MIN_SCOUT_VERSION


def _version_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(x) for x in v.split(".")[:3])


class ScoutManifest(BaseModel):
    """Typed representation of Scout's manifest.json."""
    protein_id: str
    n_frames: int
    timestep_ps: float = Field(description="Simulation timestep in picoseconds")
    force_field: str
    scout_version: str
    trajectory_path: str = Field(description="Absolute or relative path to trajectory.h5")
    per_frame_path: str | None = None
    rmsf_path: str | None = None
    probe_density_dir: str | None = None
    latent_umap_path: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)

    @property
    def timestep_ns(self) -> float:
        return self.timestep_ps / 1000.0


def load_scout_manifest(scout_output_dir: Path) -> ScoutManifest:
    """Load and validate manifest.json from a Scout output directory.

    Args:
        scout_output_dir: Path to the Scout output directory.

    Returns:
        Parsed ScoutManifest.

    Raises:
        MissingScoutOutputError: If manifest.json is not found.
        IncompatibleScoutVersionError: If the Scout version predates support.
    """
    manifest_path = scout_output_dir / "manifest.json"
    if not manifest_path.exists():
        raise MissingScoutOutputError(str(manifest_path))

    raw: dict[str, Any] = json.loads(manifest_path.read_text())

    # Resolve relative paths relative to the Scout output dir.
    for field in ("trajectory_path", "per_frame_path", "rmsf_path",
                  "probe_density_dir", "latent_umap_path"):
        val = raw.get(field)
        if val and not Path(val).is_absolute():
            raw[field] = str(scout_output_dir / val)

    # Pull out known fields; everything else goes into extra.
    known = {
        "protein_id", "n_frames", "timestep_ps", "force_field",
        "scout_version", "trajectory_path", "per_frame_path",
        "rmsf_path", "probe_density_dir", "latent_umap_path",
    }
    extra = {k: v for k, v in raw.items() if k not in known}
    raw["extra"] = extra

    manifest = ScoutManifest(**{k: v for k, v in raw.items() if k in known or k == "extra"})

    # Version gate.
    if _version_tuple(manifest.scout_version) < _version_tuple(MIN_SCOUT_VERSION):
        raise IncompatibleScoutVersionError(manifest.scout_version, MIN_SCOUT_VERSION)

    return manifest
