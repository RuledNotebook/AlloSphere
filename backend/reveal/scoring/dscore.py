"""Composite druggability score (Dscore) computation.

Dscore ∈ [0, 1] is a weighted logistic combination of five pocket features:

  1. Volume score:     How close the pocket volume is to the optimal range (300–1000 Å³).
  2. Hydrophobicity:   Normalised mean Kyte-Doolittle GRAVY index of lining residues.
  3. Enclosure:        Fraction of pocket that is enclosed (not solvent-exposed).
  4. Probe overlap:    Mean overlap of pocket volume with Scout fragment probe grids.
  5. GNN score:        Mean per-residue cryptic pocket probability from the GVP-GNN.

Weights are loaded from dscore_weights.json (trained on ChEMBL allosteric data).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from reveal.constants import (
    GRAVY_INDEX,
    DSCORE_OPTIMAL_VOLUME_MIN,
    DSCORE_OPTIMAL_VOLUME_MAX,
    DSCORE_WEIGHTS_PATH,
    STANDARD_AMINO_ACIDS,
)

logger = logging.getLogger(__name__)

# Normalise GRAVY to [0, 1]: range is [-4.5, 4.5].
_GRAVY_MIN = -4.5
_GRAVY_MAX = 4.5


@dataclass
class DscoreResult:
    """Druggability score components for one pocket."""
    pocket_id: str
    dscore: float
    volume_score: float
    hydrophobicity_score: float
    enclosure_score: float
    probe_score: float
    gnn_score: float
    mean_volume: float
    hydrophobicity: float
    enclosure: float


class DscoreCalculator:
    """Computes Dscore from pocket geometry and feature vectors."""

    def __init__(self, weights_path: Path = DSCORE_WEIGHTS_PATH) -> None:
        self._weights = self._load_weights(weights_path)

    def compute(
        self,
        pocket_id: str,
        residue_names: list[str],        # three-letter codes of lining residues
        mean_volume: float,              # Å³
        enclosure: float,                # [0, 1]
        probe_overlap: dict[str, float], # {'benzene': 0.82, ...}
        gnn_mean_score: float,           # mean per-residue GNN score [0, 1]
    ) -> DscoreResult:
        """Compute Dscore for one pocket.

        Args:
            pocket_id:       Pocket identifier string.
            residue_names:   Three-letter residue codes of lining residues.
            mean_volume:     Mean pocket volume across open frames (Å³).
            enclosure:       Enclosure fraction from SurfaceCalculator.
            probe_overlap:   Scout probe overlap fractions (empty dict if no probes).
            gnn_mean_score:  Mean GNN cryptic probability of lining residues.

        Returns:
            DscoreResult with Dscore and all component scores.
        """
        w = self._weights

        # Volume component: bell-shaped peak at optimal range.
        v_score = self._volume_score(mean_volume)

        # Hydrophobicity component.
        hydro = self._mean_hydrophobicity(residue_names)
        hydro_norm = (hydro - _GRAVY_MIN) / (_GRAVY_MAX - _GRAVY_MIN)  # [0, 1]

        # Probe overlap component: mean overlap across all available probes.
        probe_score = float(np.mean(list(probe_overlap.values()))) if probe_overlap else 0.0

        # Logistic combination.
        logit = (
            w["w0"]
            + w["w_volume"] * v_score
            + w["w_hydrophobic"] * hydro_norm
            + w["w_enclosure"] * enclosure
            + w["w_probe"] * probe_score
            + w["w_gnn"] * gnn_mean_score
        )
        dscore = float(self._sigmoid(logit))

        return DscoreResult(
            pocket_id=pocket_id,
            dscore=dscore,
            volume_score=v_score,
            hydrophobicity_score=hydro_norm,
            enclosure_score=enclosure,
            probe_score=probe_score,
            gnn_score=gnn_mean_score,
            mean_volume=mean_volume,
            hydrophobicity=hydro,
            enclosure=enclosure,
        )

    # ── private ───────────────────────────────────────────────────────────────

    def _volume_score(self, volume: float) -> float:
        """Bell curve peaked at [V_min, V_max] optimal volume range."""
        v_min = self._weights.get("volume_optimal_min", DSCORE_OPTIMAL_VOLUME_MIN)
        v_max = self._weights.get("volume_optimal_max", DSCORE_OPTIMAL_VOLUME_MAX)
        v_mid = (v_min + v_max) / 2.0
        v_sigma = (v_max - v_min) / 4.0  # ±2σ spans the optimal range
        return float(np.exp(-((volume - v_mid) ** 2) / (2 * v_sigma ** 2)))

    @staticmethod
    def _mean_hydrophobicity(residue_names: list[str]) -> float:
        values = [GRAVY_INDEX.get(name.upper(), 0.0) for name in residue_names]
        return float(np.mean(values)) if values else 0.0

    @staticmethod
    def _sigmoid(x: float) -> float:
        return 1.0 / (1.0 + np.exp(-x))

    @staticmethod
    def _load_weights(path: Path) -> dict:
        if not path.exists():
            logger.warning("Dscore weights not found at %s — using defaults", path)
            return {
                "w0": -2.1, "w_volume": 1.8, "w_hydrophobic": 1.4,
                "w_enclosure": 1.6, "w_probe": 2.0, "w_gnn": 2.5,
                "volume_optimal_min": 300.0, "volume_optimal_max": 1000.0,
            }
        return json.loads(path.read_text())
