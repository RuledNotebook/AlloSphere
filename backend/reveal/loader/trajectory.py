"""MDTraj HDF5 trajectory reader with protein-only extraction."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from reveal.exceptions import TrajectoryLoadError, MissingScoutOutputError

logger = logging.getLogger(__name__)

# Lazy import MDTraj so the module loads even without it installed (tests can mock).
try:
    import mdtraj as md
    _MDTRAJ_AVAILABLE = True
except ImportError:
    _MDTRAJ_AVAILABLE = False


@dataclass
class LoadedTrajectory:
    """Protein-only trajectory ready for GNN processing.

    Attributes:
        ca_coords:    Cα coordinates, shape (n_frames, n_residues, 3), in Å.
        cb_coords:    Cβ coordinates (Cα for Gly), same shape as ca_coords.
        residue_names: Three-letter residue names, length n_residues.
        residue_ids:  1-indexed residue sequence numbers, length n_residues.
        n_frames:     Total number of protein frames retained.
        n_residues:   Number of protein residues.
        timestep_ns:  Simulation timestep in nanoseconds.
        traj:         Raw MDTraj trajectory object (protein-only, all atoms).
    """
    ca_coords: np.ndarray          # (n_frames, n_res, 3) Å
    cb_coords: np.ndarray          # (n_frames, n_res, 3) Å
    residue_names: list[str]       # three-letter codes, len=n_res
    residue_ids: list[int]         # 1-indexed residue numbers
    n_frames: int
    n_residues: int
    timestep_ns: float
    traj: object = field(repr=False)  # md.Trajectory


class TrajectoryLoader:
    """Loads an MDTraj HDF5 trajectory and strips non-protein atoms."""

    def load(self, trajectory_path: Path, timestep_ns: float) -> LoadedTrajectory:
        """Load the HDF5 trajectory and return a protein-only LoadedTrajectory.

        Args:
            trajectory_path: Path to trajectory.h5 produced by Scout.
            timestep_ns:     Simulation timestep from the Scout manifest.

        Returns:
            LoadedTrajectory with Cα/Cβ coordinate arrays.

        Raises:
            MissingScoutOutputError: File not found.
            TrajectoryLoadError: MDTraj parse failure.
        """
        if not trajectory_path.exists():
            raise MissingScoutOutputError(str(trajectory_path))

        if not _MDTRAJ_AVAILABLE:
            raise TrajectoryLoadError(
                "MDTraj is not installed. Install it with: pip install mdtraj"
            )

        logger.info("Loading trajectory from %s", trajectory_path)
        try:
            traj: md.Trajectory = md.load(str(trajectory_path))
        except Exception as exc:
            raise TrajectoryLoadError(f"Failed to load {trajectory_path}: {exc}") from exc

        # Strip water, ions, and non-protein residues.
        protein_sel = traj.topology.select("protein")
        if len(protein_sel) == 0:
            raise TrajectoryLoadError(
                "No protein atoms found in trajectory. "
                "Check that the HDF5 file was produced by Allos Scout."
            )
        traj = traj.atom_slice(protein_sel)

        logger.info(
            "Protein-only trajectory: %d frames × %d atoms",
            traj.n_frames, traj.n_atoms,
        )

        residue_names, residue_ids = self._collect_residue_info(traj.topology)
        ca_coords = self._extract_ca_coords(traj)
        cb_coords = self._extract_cb_coords(traj)

        # Convert nm → Å (MDTraj uses nm internally).
        ca_coords = ca_coords * 10.0
        cb_coords = cb_coords * 10.0

        return LoadedTrajectory(
            ca_coords=ca_coords,
            cb_coords=cb_coords,
            residue_names=residue_names,
            residue_ids=residue_ids,
            n_frames=traj.n_frames,
            n_residues=len(residue_names),
            timestep_ns=timestep_ns,
            traj=traj,
        )

    # ── helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _collect_residue_info(
        topology: "md.Topology",
    ) -> tuple[list[str], list[int]]:
        residue_names: list[str] = []
        residue_ids: list[int] = []
        for res in topology.residues:
            residue_names.append(res.name.upper()[:3])
            residue_ids.append(res.resSeq)
        return residue_names, residue_ids

    @staticmethod
    def _extract_ca_coords(traj: "md.Trajectory") -> np.ndarray:
        """Extract Cα coordinates, shape (n_frames, n_residues, 3) in nm."""
        ca_indices = traj.topology.select("name CA")
        if len(ca_indices) == 0:
            raise TrajectoryLoadError("No Cα atoms found in protein topology.")
        return traj.xyz[:, ca_indices, :]  # nm

    @staticmethod
    def _extract_cb_coords(traj: "md.Trajectory") -> np.ndarray:
        """Extract Cβ coordinates (fall back to Cα for Gly), shape (n_frames, n_residues, 3) nm."""
        top = traj.topology
        n_residues = top.n_residues
        n_frames = traj.n_frames

        # Build per-residue CB index (None for Gly → use CA).
        cb_array = np.zeros((n_frames, n_residues, 3), dtype=np.float32)
        ca_by_res: dict[int, int] = {}
        cb_by_res: dict[int, int] = {}

        for atom in top.atoms:
            if atom.name == "CA":
                ca_by_res[atom.residue.index] = atom.index
            elif atom.name == "CB":
                cb_by_res[atom.residue.index] = atom.index

        for res_idx in range(n_residues):
            if res_idx in cb_by_res:
                cb_array[:, res_idx, :] = traj.xyz[:, cb_by_res[res_idx], :]
            elif res_idx in ca_by_res:
                cb_array[:, res_idx, :] = traj.xyz[:, ca_by_res[res_idx], :]

        return cb_array  # nm
