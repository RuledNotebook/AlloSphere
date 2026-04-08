"""Two-state kinetic model for pocket open/close dynamics.

Fits dwell-time distributions from pocket open/close event sequences to
estimate:
  - k_open   (opening rate, ns⁻¹)
  - k_close  (closing rate, ns⁻¹)
  - f_open   (fraction of simulation time spent open)
  - t_open_mean (mean open duration, ns)

The two-state model assumes:
  closed ──k_open──► open ──k_close──► closed

For exponentially distributed dwell times:
  mean open duration = 1 / k_close
  mean closed duration = 1 / k_open
  f_open = k_open / (k_open + k_close)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np

from reveal.clustering.spatial import PocketIdentity

logger = logging.getLogger(__name__)


@dataclass
class KineticsResult:
    """Kinetic parameters for one pocket identity.

    All rates are in ns⁻¹ and durations in ns.
    """
    pocket_id: str
    n_events: int
    fraction_time_open: float
    k_open_per_ns: float
    k_close_per_ns: float
    mean_open_duration_ns: float
    peak_open_frames: list[int]


class KineticsAnalyser:
    """Extracts kinetic parameters from pocket event sequences."""

    def __init__(self, timestep_ns: float) -> None:
        self._dt = timestep_ns  # simulation time per frame in ns

    def analyse(
        self,
        pocket: PocketIdentity,
        n_frames_total: int,
    ) -> KineticsResult:
        """Compute kinetic descriptors for a single pocket identity.

        Args:
            pocket:          PocketIdentity with its event list.
            n_frames_total:  Total number of frames in the trajectory.

        Returns:
            KineticsResult with k_open, k_close, f_open, mean_open_duration.
        """
        if not pocket.events:
            return self._zero_kinetics(pocket.pocket_id)

        # Frame indices where this pocket is open.
        open_frames = sorted({e.frame_idx for e in pocket.events})

        # Fraction of total simulation time open.
        f_open = len(open_frames) / max(n_frames_total, 1)

        # Identify contiguous open runs (episodes).
        episodes = self._find_episodes(open_frames)
        n_episodes = len(episodes)

        total_simulation_ns = n_frames_total * self._dt

        if n_episodes == 0 or f_open == 0:
            return self._zero_kinetics(pocket.pocket_id)

        # Mean open duration from episode lengths.
        episode_durations = [len(ep) * self._dt for ep in episodes]
        mean_open_duration_ns = float(np.mean(episode_durations))

        # k_close = 1 / mean_open_duration
        k_close = 1.0 / (mean_open_duration_ns + 1e-12)

        # k_open estimated from episode frequency:
        # number of opening events per unit time of closed simulation.
        time_closed_ns = total_simulation_ns * (1.0 - f_open)
        k_open = n_episodes / (time_closed_ns + 1e-12)

        peak_frames = pocket.peak_open_frames

        logger.debug(
            "%s: f_open=%.4f, k_open=%.4f ns⁻¹, k_close=%.4f ns⁻¹, "
            "mean_open=%.2f ns, n_episodes=%d",
            pocket.pocket_id, f_open, k_open, k_close, mean_open_duration_ns, n_episodes,
        )

        return KineticsResult(
            pocket_id=pocket.pocket_id,
            n_events=pocket.n_events,
            fraction_time_open=f_open,
            k_open_per_ns=k_open,
            k_close_per_ns=k_close,
            mean_open_duration_ns=mean_open_duration_ns,
            peak_open_frames=peak_frames,
        )

    # ── private ───────────────────────────────────────────────────────────────

    @staticmethod
    def _find_episodes(sorted_frames: list[int]) -> list[list[int]]:
        """Group consecutive frame indices into open episodes.

        A gap of more than 1 frame signals a new episode.
        """
        if not sorted_frames:
            return []
        episodes: list[list[int]] = []
        current: list[int] = [sorted_frames[0]]
        for f in sorted_frames[1:]:
            if f == current[-1] + 1:
                current.append(f)
            else:
                episodes.append(current)
                current = [f]
        episodes.append(current)
        return episodes

    @staticmethod
    def _zero_kinetics(pocket_id: str) -> KineticsResult:
        return KineticsResult(
            pocket_id=pocket_id,
            n_events=0,
            fraction_time_open=0.0,
            k_open_per_ns=0.0,
            k_close_per_ns=0.0,
            mean_open_duration_ns=0.0,
            peak_open_frames=[],
        )
