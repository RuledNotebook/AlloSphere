"""Write summary CSV files for the pocket atlas and kinetics."""

from __future__ import annotations

import csv
import logging
from pathlib import Path

from reveal.clustering.kinetics import KineticsResult
from reveal.types import PocketAtlas, PocketEntry

logger = logging.getLogger(__name__)


class CsvWriter:
    """Writes pocket_atlas_summary.csv, druggability_scores.csv, and kinetics.csv."""

    def write_atlas_summary(self, atlas: PocketAtlas, output_dir: Path) -> Path:
        """Write a one-row-per-pocket summary CSV.

        Columns: pocket_id, rank, druggability_score, mean_volume_angstrom3,
        hydrophobicity, fraction_time_open, likely_allosteric, classification,
        n_residues, centroid_x, centroid_y, centroid_z.
        """
        path = output_dir / "pocket_atlas_summary.csv"
        fieldnames = [
            "pocket_id", "rank", "druggability_score", "mean_volume_angstrom3",
            "hydrophobicity", "fraction_time_open", "k_open_per_ns", "k_close_per_ns",
            "mean_open_duration_ns", "cryptic_probability", "likely_allosteric",
            "orthosteric_distance_angstrom", "classification", "n_residues",
            "centroid_x", "centroid_y", "centroid_z",
        ]

        with path.open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for p in atlas.pockets:
                writer.writerow({
                    "pocket_id": p.pocket_id,
                    "rank": p.rank,
                    "druggability_score": p.druggability_score,
                    "mean_volume_angstrom3": p.mean_volume_angstrom3,
                    "hydrophobicity": p.hydrophobicity,
                    "fraction_time_open": p.fraction_time_open,
                    "k_open_per_ns": p.k_open_per_ns,
                    "k_close_per_ns": p.k_close_per_ns,
                    "mean_open_duration_ns": p.mean_open_duration_ns,
                    "cryptic_probability": p.cryptic_probability,
                    "likely_allosteric": p.likely_allosteric,
                    "orthosteric_distance_angstrom": p.orthosteric_distance_angstrom,
                    "classification": p.classification,
                    "n_residues": len(p.residues),
                    "centroid_x": p.centroid_angstrom[0],
                    "centroid_y": p.centroid_angstrom[1],
                    "centroid_z": p.centroid_angstrom[2],
                })

        logger.info("Wrote atlas summary: %s", path)
        return path

    def write_druggability_scores(self, atlas: PocketAtlas, output_dir: Path) -> Path:
        """Write druggability_scores.csv with per-component scores."""
        path = output_dir / "druggability_scores.csv"
        fieldnames = [
            "pocket_id", "rank", "druggability_score", "mean_volume_angstrom3",
            "hydrophobicity", "cryptic_probability",
            "probe_benzene", "probe_phenol", "probe_imidazole",
            "probe_acetonitrile", "probe_dimethylether",
        ]

        with path.open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for p in atlas.pockets:
                row: dict = {
                    "pocket_id": p.pocket_id,
                    "rank": p.rank,
                    "druggability_score": p.druggability_score,
                    "mean_volume_angstrom3": p.mean_volume_angstrom3,
                    "hydrophobicity": p.hydrophobicity,
                    "cryptic_probability": p.cryptic_probability,
                }
                for probe in ["benzene", "phenol", "imidazole", "acetonitrile", "dimethylether"]:
                    row[f"probe_{probe}"] = p.probe_overlap.get(probe, "")
                writer.writerow(row)

        logger.info("Wrote druggability scores: %s", path)
        return path

    def write_kinetics(self, atlas: PocketAtlas, output_dir: Path) -> Path:
        """Write kinetics.csv with per-pocket kinetic parameters."""
        path = output_dir / "kinetics.csv"
        fieldnames = [
            "pocket_id", "rank", "fraction_time_open",
            "k_open_per_ns", "k_close_per_ns", "mean_open_duration_ns",
            "n_peak_frames",
        ]

        with path.open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for p in atlas.pockets:
                writer.writerow({
                    "pocket_id": p.pocket_id,
                    "rank": p.rank,
                    "fraction_time_open": p.fraction_time_open,
                    "k_open_per_ns": p.k_open_per_ns,
                    "k_close_per_ns": p.k_close_per_ns,
                    "mean_open_duration_ns": p.mean_open_duration_ns,
                    "n_peak_frames": len(p.peak_open_frames),
                })

        logger.info("Wrote kinetics: %s", path)
        return path
