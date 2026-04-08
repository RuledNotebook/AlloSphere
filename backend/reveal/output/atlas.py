"""Assemble the final PocketAtlas JSON from all pipeline stage outputs."""

from __future__ import annotations

import logging

import numpy as np

from reveal.clustering.kinetics import KineticsResult
from reveal.clustering.spatial import PocketIdentity
from reveal.scoring.dscore import DscoreResult
from reveal.scoring.classifier import PocketClassifier
from reveal.scoring.probe_overlap import ProbeOverlapCalculator
from reveal.geometry.surface import compute_enclosure
from reveal.types import PocketAtlas, PocketEntry
from reveal.loader.manifest import ScoutManifest
from reveal.loader.trajectory import LoadedTrajectory
from reveal.constants import STANDARD_AMINO_ACIDS

logger = logging.getLogger(__name__)


class AtlasAssembler:
    """Builds the final PocketAtlas from pipeline stage outputs."""

    def __init__(
        self,
        classifier: PocketClassifier,
        probe_calculator: ProbeOverlapCalculator,
    ) -> None:
        self._classifier = classifier
        self._probe_calculator = probe_calculator

    def assemble(
        self,
        pockets: list[PocketIdentity],
        dscore_results: list[DscoreResult],
        kinetics_results: list[KineticsResult],
        trajectory: LoadedTrajectory,
        manifest: ScoutManifest,
        n_frames_analysed: int,
        active_site_centroid: np.ndarray | None = None,
        reveal_version: str = "0.1.0",
    ) -> PocketAtlas:
        """Assemble a PocketAtlas from pocket identities, scores, and kinetics.

        Args:
            pockets:              List of PocketIdentity objects (merged, ranked).
            dscore_results:       Dscore for each pocket (same order as `pockets`).
            kinetics_results:     Kinetics for each pocket (same order as `pockets`).
            trajectory:           Loaded protein trajectory.
            manifest:             Scout output manifest.
            n_frames_analysed:    Number of frames that passed the RMSF filter.
            active_site_centroid: Known active site centroid for orthosteric distance.
            reveal_version:       Reveal version string.

        Returns:
            Fully populated PocketAtlas.
        """
        dscore_map = {r.pocket_id: r for r in dscore_results}
        kinetics_map = {r.pocket_id: r for r in kinetics_results}

        entries: list[PocketEntry] = []
        for rank, pocket in enumerate(pockets, start=1):
            pocket_id = pocket.pocket_id
            ds = dscore_map.get(pocket_id)
            kin = kinetics_map.get(pocket_id)

            if ds is None or kin is None:
                logger.warning("Missing dscore or kinetics for pocket %s — skipping", pocket_id)
                continue

            # Residue info.
            lining_residues = sorted(pocket.residue_consensus or pocket.residue_union)
            lining_names = [
                trajectory.residue_names[r]
                for r in lining_residues
                if r < len(trajectory.residue_names)
            ]
            # Convert 0-based indices → 1-based residue sequence numbers.
            residue_seq_ids = [
                trajectory.residue_ids[r]
                for r in lining_residues
                if r < len(trajectory.residue_ids)
            ]

            # Probe overlap.
            pocket_radius = (3 * ds.mean_volume / (4 * np.pi)) ** (1 / 3) if ds.mean_volume > 0 else 5.0
            probe_overlap = self._probe_calculator.compute_overlap(pocket.centroid, pocket_radius)

            # Classification.
            classification = self._classifier.classify(
                residue_names=lining_names,
                gnn_mean_score=ds.gnn_score,
                mean_volume=ds.mean_volume,
                enclosure=ds.enclosure_score,
                centroid=pocket.centroid,
                active_site_centroid=active_site_centroid,
            )

            # Orthosteric distance.
            orth_dist: float | None = None
            if active_site_centroid is not None:
                orth_dist = float(np.linalg.norm(pocket.centroid - active_site_centroid))

            likely_allosteric = self._classifier.is_likely_allosteric(
                classification, orth_dist, ds.gnn_score
            )

            entry = PocketEntry(
                pocket_id=pocket_id,
                rank=rank,
                residues=residue_seq_ids,
                centroid_angstrom=pocket.centroid.tolist(),
                druggability_score=round(ds.dscore, 4),
                mean_volume_angstrom3=round(ds.mean_volume, 1),
                hydrophobicity=round(ds.hydrophobicity, 3),
                fraction_time_open=round(kin.fraction_time_open, 4),
                k_open_per_ns=round(kin.k_open_per_ns, 4),
                k_close_per_ns=round(kin.k_close_per_ns, 4),
                mean_open_duration_ns=round(kin.mean_open_duration_ns, 2),
                peak_open_frames=kin.peak_open_frames,
                probe_overlap={k: round(v, 3) for k, v in probe_overlap.items()},
                cryptic_probability=round(ds.gnn_score, 4),
                likely_allosteric=likely_allosteric,
                orthosteric_distance_angstrom=round(orth_dist, 1) if orth_dist is not None else None,
                classification=classification,
            )
            entries.append(entry)

        # Sort by Dscore descending, re-rank.
        entries.sort(key=lambda e: e.druggability_score, reverse=True)
        for new_rank, entry in enumerate(entries, start=1):
            entry.rank = new_rank
            entry.pocket_id = f"P{new_rank:03d}"

        logger.info("Atlas assembled: %d pockets", len(entries))

        return PocketAtlas(
            protein_id=manifest.protein_id,
            scout_manifest_path=str(manifest.model_fields_set),
            reveal_version=reveal_version,
            n_frames_analysed=n_frames_analysed,
            n_frames_total=trajectory.n_frames,
            pockets=entries,
        )
