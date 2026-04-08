"""Pocket type classification.

Assigns each pocket one of five classification labels:
  - cryptic_hydrophobic: GNN score ≥ 0.6 and high hydrophobicity (GRAVY ≥ 0.5)
  - cryptic_polar:        GNN score ≥ 0.6 and low hydrophobicity
  - cryptic_ppi:          Large pocket (> 800 Å³) near a predicted PPI interface
  - surface_groove:       Low enclosure (< 0.2) shallow groove
  - orthosteric_adjacent: Centroid within 8 Å of the known active site

Classification is applied after Dscore computation.
"""

from __future__ import annotations

from typing import Literal

import numpy as np

from reveal.constants import GRAVY_INDEX

PocketClassification = Literal[
    "cryptic_hydrophobic",
    "cryptic_polar",
    "cryptic_ppi",
    "surface_groove",
    "orthosteric_adjacent",
]

_GRAVY_HYDROPHOBIC_THRESHOLD = 0.5
_GNN_CRYPTIC_THRESHOLD = 0.6
_ENCLOSURE_GROOVE_MAX = 0.2
_PPI_VOLUME_THRESHOLD = 800.0
_ORTHOSTERIC_ADJACENT_DISTANCE = 8.0


class PocketClassifier:
    """Rule-based pocket type classifier."""

    def classify(
        self,
        residue_names: list[str],
        gnn_mean_score: float,
        mean_volume: float,
        enclosure: float,
        centroid: np.ndarray,
        active_site_centroid: np.ndarray | None = None,
    ) -> PocketClassification:
        """Assign a pocket type label.

        Args:
            residue_names:       Three-letter codes of lining residues.
            gnn_mean_score:      Mean GNN cryptic probability.
            mean_volume:         Mean pocket volume in Å³.
            enclosure:           Enclosure fraction.
            centroid:            Pocket centroid in Å.
            active_site_centroid: Known active site centroid (or None).

        Returns:
            Classification string.
        """
        # Orthosteric adjacent check (highest priority when active site is known).
        if active_site_centroid is not None:
            dist = float(np.linalg.norm(centroid - active_site_centroid))
            if dist <= _ORTHOSTERIC_ADJACENT_DISTANCE:
                return "orthosteric_adjacent"

        # Surface groove: low enclosure.
        if enclosure < _ENCLOSURE_GROOVE_MAX:
            return "surface_groove"

        # PPI: large volume regardless of hydrophobicity.
        if mean_volume > _PPI_VOLUME_THRESHOLD and gnn_mean_score < _GNN_CRYPTIC_THRESHOLD:
            return "cryptic_ppi"

        # Cryptic classification: split by hydrophobicity.
        mean_gravy = float(np.mean([GRAVY_INDEX.get(r.upper(), 0.0) for r in residue_names]))
        if gnn_mean_score >= _GNN_CRYPTIC_THRESHOLD:
            if mean_gravy >= _GRAVY_HYDROPHOBIC_THRESHOLD:
                return "cryptic_hydrophobic"
            return "cryptic_polar"

        # Fallback for moderate GNN scores.
        return "surface_groove"

    def is_likely_allosteric(
        self,
        classification: PocketClassification,
        orthosteric_distance: float | None,
        gnn_mean_score: float,
    ) -> bool:
        """Predict whether the pocket is allosteric (not orthosteric).

        A pocket is likely allosteric if:
          - Classification is cryptic_* or surface_groove (not orthosteric_adjacent)
          - GNN score ≥ 0.5
          - Distance to active site > 12 Å (if known)
        """
        if classification == "orthosteric_adjacent":
            return False
        if gnn_mean_score < 0.5:
            return False
        if orthosteric_distance is not None and orthosteric_distance < 12.0:
            return False
        return True
