"""Merge nearby pocket identities that represent the same physical pocket.

Two pocket identities are merged if their centroids are within
MERGE_DISTANCE_ANGSTROM and their residue consensus sets overlap by more
than MERGE_RESIDUE_OVERLAP_FRACTION.

This handles edge cases where DBSCAN splits a single pocket into two clusters
due to centroid drift during open/close cycles.
"""

from __future__ import annotations

import logging

import numpy as np

from reveal.clustering.spatial import PocketIdentity

logger = logging.getLogger(__name__)

MERGE_DISTANCE_ANGSTROM: float = 6.0
MERGE_RESIDUE_OVERLAP_FRACTION: float = 0.5


class PocketMerger:
    """Merges nearby, overlapping pocket identities."""

    def __init__(
        self,
        distance_threshold: float = MERGE_DISTANCE_ANGSTROM,
        overlap_threshold: float = MERGE_RESIDUE_OVERLAP_FRACTION,
    ) -> None:
        self._dist = distance_threshold
        self._overlap = overlap_threshold

    def merge(self, pockets: list[PocketIdentity]) -> list[PocketIdentity]:
        """Merge similar pockets and return a de-duplicated, re-ranked list.

        Args:
            pockets: List of PocketIdentity objects from SpatialClusterer.

        Returns:
            Merged list, re-ranked by total event count descending.
        """
        if len(pockets) <= 1:
            return pockets

        merged_flags = [False] * len(pockets)
        result: list[PocketIdentity] = []

        for i, p_i in enumerate(pockets):
            if merged_flags[i]:
                continue
            group = [p_i]
            for j, p_j in enumerate(pockets[i + 1:], start=i + 1):
                if merged_flags[j]:
                    continue
                if self._should_merge(p_i, p_j):
                    group.append(p_j)
                    merged_flags[j] = True
            if len(group) == 1:
                result.append(p_i)
            else:
                result.append(self._merge_group(group))

        # Re-rank by event count.
        result.sort(key=lambda p: p.n_events, reverse=True)
        for rank, pocket in enumerate(result, start=1):
            pocket.pocket_id = f"P{rank:03d}"

        if len(result) < len(pockets):
            logger.info(
                "Pocket merger: reduced %d → %d pockets", len(pockets), len(result)
            )

        return result

    # ── private ───────────────────────────────────────────────────────────────

    def _should_merge(self, a: PocketIdentity, b: PocketIdentity) -> bool:
        dist = float(np.linalg.norm(a.centroid - b.centroid))
        if dist > self._dist:
            return False
        intersection = len(a.residue_consensus & b.residue_consensus)
        union = len(a.residue_consensus | b.residue_consensus)
        if union == 0:
            return True
        return (intersection / union) >= self._overlap

    @staticmethod
    def _merge_group(group: list[PocketIdentity]) -> PocketIdentity:
        """Combine multiple pocket identities into one."""
        all_events = [e for p in group for e in p.events]
        all_candidates = [c for p in group for c in p.candidates]
        centroid = np.array([p.centroid for p in group]).mean(axis=0)
        residue_union = frozenset().union(*[p.residue_union for p in group])
        residue_consensus = frozenset().union(*[p.residue_consensus for p in group])

        return PocketIdentity(
            pocket_id=group[0].pocket_id,  # will be re-ranked after merge
            cluster_label=group[0].cluster_label,
            events=all_events,
            candidates=all_candidates,
            centroid=centroid,
            residue_union=residue_union,
            residue_consensus=residue_consensus,
        )
