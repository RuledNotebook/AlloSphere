"""Write reveal_manifest.json for the current run."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from reveal.types import PocketAtlas, RevealConfig, RevealManifest

logger = logging.getLogger(__name__)

_REVEAL_VERSION = "0.1.0"


class ManifestWriter:
    """Writes the Reveal run manifest for downstream modules (e.g. Allos Dock)."""

    def write(
        self,
        atlas: PocketAtlas,
        config: RevealConfig,
        trajectory_path: Path,
        output_dir: Path,
    ) -> Path:
        """Serialise and write reveal_manifest.json.

        Args:
            atlas:            The assembled pocket atlas.
            config:           The RevealConfig used for this run.
            trajectory_path:  Absolute path to the Scout trajectory.h5.
            output_dir:       Directory to write the manifest into.

        Returns:
            Path to the written manifest file.
        """
        manifest = RevealManifest(
            reveal_version=_REVEAL_VERSION,
            protein_id=atlas.protein_id,
            scout_manifest_path=str(config.scout_output_dir / "manifest.json"),
            trajectory_path=str(trajectory_path),
            n_frames_total=atlas.n_frames_total,
            n_frames_analysed=atlas.n_frames_analysed,
            n_pockets_detected=len(atlas.pockets),
            output_dir=str(output_dir),
            config=config.model_dump(mode="json"),
        )

        path = output_dir / "reveal_manifest.json"
        path.write_text(manifest.model_dump_json(indent=2))

        logger.info("Wrote reveal manifest: %s", path)
        return path
