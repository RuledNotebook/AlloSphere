"""Reveal-specific exceptions."""


class RevealError(RuntimeError):
    """Base class for all Reveal errors."""


class IncompatibleScoutVersionError(RevealError):
    """Scout manifest version is not supported by this version of Reveal."""

    def __init__(self, scout_version: str, min_supported: str) -> None:
        super().__init__(
            f"Scout version '{scout_version}' is not supported. "
            f"Minimum required: '{min_supported}'. Re-run Scout to regenerate the manifest."
        )


class TrajectoryLoadError(RevealError):
    """Failed to load or parse the HDF5 trajectory file."""


class MissingScoutOutputError(RevealError):
    """A required Scout output file is absent from the input directory."""

    def __init__(self, path: str) -> None:
        super().__init__(f"Required Scout output not found: {path}")


class CheckpointNotFoundError(RevealError):
    """GVP-GNN checkpoint file is missing."""

    def __init__(self, path: str) -> None:
        super().__init__(
            f"Model checkpoint not found: {path}. "
            "Download via `reveal download-weights` or check Git LFS status."
        )


class InsufficientGPUMemoryError(RevealError):
    """VRAM budget is too small for the requested batch configuration."""


class NoPocketsFoundError(RevealError):
    """No druggable pockets were detected in the trajectory."""
