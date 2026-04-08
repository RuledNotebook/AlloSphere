"""Reveal loader sub-package: trajectory reading, manifest parsing, frame filtering."""

from reveal.loader.trajectory import TrajectoryLoader, LoadedTrajectory
from reveal.loader.manifest import ScoutManifest, load_scout_manifest
from reveal.loader.frame_filter import FrameFilter, FrameFilterResult

__all__ = [
    "TrajectoryLoader",
    "LoadedTrajectory",
    "ScoutManifest",
    "load_scout_manifest",
    "FrameFilter",
    "FrameFilterResult",
]
