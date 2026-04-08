"""Reveal pipeline orchestrator — runs all six stages in sequence.

Usage::

    from reveal.pipeline import RevealPipeline
    from reveal.types import RevealConfig
    from pathlib import Path

    config = RevealConfig(
        scout_output_dir=Path("/data/scout_output"),
        output_dir=Path("/data/reveal_output"),
        device="cuda",
    )
    pipeline = RevealPipeline(config)
    atlas = pipeline.run()

Stage sequence
--------------
1. Trajectory loading and frame filtering  (loader/)
2. GVP-GNN per-residue scoring             (gnn/)
3. Geometric pocket extraction             (geometry/)
4. Temporal clustering                     (clustering/)
5. Druggability scoring                    (scoring/)
6. Output assembly                         (output/)
"""

from __future__ import annotations

import logging
import time
from pathlib import Path

import numpy as np

from reveal.__init__ import __version__
from reveal.types import PocketAtlas, RevealConfig
from reveal.exceptions import NoPocketsFoundError, MissingScoutOutputError

# Loader
from reveal.loader.manifest import load_scout_manifest
from reveal.loader.trajectory import TrajectoryLoader
from reveal.loader.frame_filter import FrameFilter

# GNN
from reveal.gnn.inference import GNNInferenceEngine
from reveal.gpu.batch_manager import BatchManager

# Geometry
from reveal.geometry.hotspot import HotspotDetector
from reveal.geometry.ligsite import LigsiteScanner, LigsiteResult
from reveal.geometry.surface import compute_enclosure

# Clustering
from reveal.clustering.spatial import SpatialClusterer
from reveal.clustering.kinetics import KineticsAnalyser
from reveal.clustering.merge import PocketMerger

# Scoring
from reveal.scoring.dscore import DscoreCalculator, DscoreResult
from reveal.scoring.classifier import PocketClassifier
from reveal.scoring.probe_overlap import ProbeOverlapCalculator

# Output
from reveal.output.atlas import AtlasAssembler
from reveal.output.csv_writer import CsvWriter
from reveal.output.pymol_session import PyMolSessionWriter
from reveal.output.manifest import ManifestWriter

logger = logging.getLogger(__name__)


class RevealPipeline:
    """Top-level orchestrator: loads config, runs all stages, writes outputs."""

    def __init__(self, config: RevealConfig) -> None:
        self._config = config

    def run(
        self,
        active_site_centroid: np.ndarray | None = None,
        rmsf_override: np.ndarray | None = None,
    ) -> PocketAtlas:
        """Execute the full Reveal pipeline.

        Args:
            active_site_centroid: Known active-site centroid in Å (optional).
                                  Used for orthosteric distance and classification.
            rmsf_override:        External per-residue RMSF array (n_residues,) in Å.
                                  If None, per_frame.json or trajectory RMSF is used.

        Returns:
            Assembled PocketAtlas written to config.output_dir.

        Raises:
            NoPocketsFoundError: If no druggable pockets are detected.
        """
        cfg = self._config
        t_pipeline_start = time.perf_counter()

        cfg.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info("=" * 60)
        logger.info("Allos Reveal %s — starting pipeline", __version__)
        logger.info("Scout input : %s", cfg.scout_output_dir)
        logger.info("Output dir  : %s", cfg.output_dir)
        logger.info("=" * 60)

        # ── Stage 1: Load trajectory and filter frames ────────────────────────
        logger.info("[Stage 1/6] Trajectory loading + frame filtering")
        t0 = time.perf_counter()

        manifest = load_scout_manifest(cfg.scout_output_dir)
        trajectory_path = Path(manifest.trajectory_path)

        loader = TrajectoryLoader()
        trajectory = loader.load(trajectory_path, timestep_ns=manifest.timestep_ns)

        per_frame_path = (
            Path(manifest.per_frame_path) if manifest.per_frame_path else None
        )
        frame_filter = FrameFilter(rmsf_threshold=cfg.rmsf_rigid_threshold)
        filter_result = frame_filter.filter(trajectory, per_frame_path)

        logger.info(
            "  Loaded %d frames, %d residues. %d active after RMSF filter (%.1f sec)",
            trajectory.n_frames, trajectory.n_residues,
            filter_result.n_active, time.perf_counter() - t0,
        )

        # ── Stage 2: GVP-GNN inference ────────────────────────────────────────
        logger.info("[Stage 2/6] GVP-GNN per-residue pocket scoring")
        t0 = time.perf_counter()

        # Determine per-residue RMSF for node features.
        if rmsf_override is not None:
            rmsf = rmsf_override
        elif manifest.rmsf_path and Path(manifest.rmsf_path).exists():
            import csv as _csv
            with open(manifest.rmsf_path) as f:
                reader = _csv.DictReader(f)
                rmsf_vals = [float(row.get("rmsf", 0.0)) for row in reader]
            rmsf = np.array(rmsf_vals, dtype=np.float32)
            if len(rmsf) != trajectory.n_residues:
                logger.warning("RMSF CSV length mismatch — using zeros")
                rmsf = np.zeros(trajectory.n_residues, dtype=np.float32)
        else:
            # Compute approximate RMSF from the trajectory.
            rmsf = self._compute_rmsf(trajectory)

        # Auto-select batch size based on VRAM budget.
        batch_mgr = BatchManager(device=cfg.device)
        budget = batch_mgr.estimate(n_residues=trajectory.n_residues)
        batch_size = min(cfg.gpu_batch_size, budget.recommended_batch_size)

        engine = GNNInferenceEngine(
            checkpoint_path=cfg.checkpoint_path,
            device=cfg.device,
            batch_size=batch_size,
        )
        per_residue_scores = engine.run(
            trajectory=trajectory,
            active_frames=filter_result.active_frames,
            rmsf=rmsf,
            scratch_dir=cfg.output_dir,
        )
        logger.info("  GNN inference done (%.1f sec)", time.perf_counter() - t0)

        # ── Stage 3: Geometric pocket extraction ──────────────────────────────
        logger.info("[Stage 3/6] Geometric pocket extraction")
        t0 = time.perf_counter()

        hotspot_detector = HotspotDetector(
            score_threshold=cfg.hotspot_score_threshold,
            min_cluster_size=cfg.hotspot_min_cluster_size,
        )
        hotspot_result = hotspot_detector.detect(per_residue_scores, trajectory)

        ligsite_scanner = LigsiteScanner(
            min_volume=cfg.min_pocket_volume,
            device=cfg.device,
        )
        ligsite_results: list[LigsiteResult] = []
        for candidate in hotspot_result.candidates:
            ca_frame = trajectory.ca_coords[candidate.frame_idx]
            result = ligsite_scanner.measure(
                ca_coords=ca_frame,
                residue_set=candidate.residue_set,
                frame_idx=candidate.frame_idx,
            )
            ligsite_results.append(result)

        logger.info(
            "  Pocket extraction: %d candidates, %d valid (%.1f sec)",
            len(hotspot_result.candidates),
            sum(1 for r in ligsite_results if r.valid),
            time.perf_counter() - t0,
        )

        # ── Stage 4: Temporal clustering ──────────────────────────────────────
        logger.info("[Stage 4/6] Temporal clustering")
        t0 = time.perf_counter()

        clusterer = SpatialClusterer(
            epsilon=cfg.dbscan_epsilon,
            min_samples=cfg.dbscan_min_samples,
        )
        cluster_result = clusterer.cluster(hotspot_result.candidates, ligsite_results)

        merger = PocketMerger()
        pockets = merger.merge(cluster_result.pockets)

        kinetics_analyser = KineticsAnalyser(timestep_ns=manifest.timestep_ns)
        kinetics_results = [
            kinetics_analyser.analyse(p, n_frames_total=trajectory.n_frames)
            for p in pockets
        ]
        logger.info(
            "  Clustering: %d pocket identities after merge (%.1f sec)",
            len(pockets), time.perf_counter() - t0,
        )

        # ── Stage 5: Druggability scoring ─────────────────────────────────────
        logger.info("[Stage 5/6] Druggability scoring")
        t0 = time.perf_counter()

        probe_density_dir = (
            Path(manifest.probe_density_dir) if manifest.probe_density_dir else None
        )
        probe_calculator = ProbeOverlapCalculator(probe_density_dir)
        dscore_calc = DscoreCalculator()
        classifier = PocketClassifier()

        dscore_results: list[DscoreResult] = []
        for pocket in pockets:
            # Collect lining residue names.
            lining_idx = sorted(pocket.residue_consensus or pocket.residue_union)
            lining_names = [
                trajectory.residue_names[r]
                for r in lining_idx
                if r < trajectory.n_residues
            ]

            # Mean GNN score from mean_score across candidates.
            gnn_mean_score = pocket.mean_score

            # Mean volume from kinetics events.
            mean_volume = pocket.mean_volume

            # Enclosure: from mean of available ligsite results.
            enclosures = []
            for ev in pocket.events:
                enc = compute_enclosure(ev.volume, ev.sasa_proxy)
                enclosures.append(enc)
            mean_enclosure = float(np.mean(enclosures)) if enclosures else 0.0

            # Probe overlap.
            pocket_radius = (3 * mean_volume / (4 * np.pi)) ** (1 / 3) if mean_volume > 0 else 5.0
            probe_overlap = probe_calculator.compute_overlap(pocket.centroid, pocket_radius)

            ds = dscore_calc.compute(
                pocket_id=pocket.pocket_id,
                residue_names=lining_names,
                mean_volume=mean_volume,
                enclosure=mean_enclosure,
                probe_overlap=probe_overlap,
                gnn_mean_score=gnn_mean_score,
            )
            dscore_results.append(ds)

        logger.info("  Scoring done (%.1f sec)", time.perf_counter() - t0)

        # ── Stage 6: Output assembly ───────────────────────────────────────────
        logger.info("[Stage 6/6] Output assembly")
        t0 = time.perf_counter()

        assembler = AtlasAssembler(classifier, probe_calculator)
        atlas = assembler.assemble(
            pockets=pockets,
            dscore_results=dscore_results,
            kinetics_results=kinetics_results,
            trajectory=trajectory,
            manifest=manifest,
            n_frames_analysed=filter_result.n_active,
            active_site_centroid=active_site_centroid,
            reveal_version=__version__,
        )

        if not atlas.pockets:
            raise NoPocketsFoundError(
                f"No druggable pockets detected in {trajectory.n_frames}-frame "
                f"trajectory of {manifest.protein_id}. "
                "Try lowering dscore_threshold or min_pocket_volume in the config."
            )

        # Write atlas JSON.
        atlas_path = cfg.output_dir / "pocket_atlas.json"
        atlas_path.write_text(atlas.model_dump_json(indent=2))
        logger.info("  pocket_atlas.json written: %d pockets", len(atlas.pockets))

        # Write CSVs.
        csv_writer = CsvWriter()
        csv_writer.write_atlas_summary(atlas, cfg.output_dir)
        csv_writer.write_druggability_scores(atlas, cfg.output_dir)
        csv_writer.write_kinetics(atlas, cfg.output_dir)

        # Write PyMOL session (optional).
        if cfg.write_pymol:
            pymol_writer = PyMolSessionWriter(top_n=cfg.top_n_pymol)
            pymol_writer.write(atlas, cfg.output_dir, trajectory_path)

        # Write manifest.
        manifest_writer = ManifestWriter()
        manifest_writer.write(atlas, cfg, trajectory_path, cfg.output_dir)

        elapsed_total = time.perf_counter() - t_pipeline_start
        logger.info("=" * 60)
        logger.info(
            "Reveal pipeline complete: %d pockets in %.1f sec",
            len(atlas.pockets), elapsed_total,
        )
        logger.info("=" * 60)

        return atlas

    # ── helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _compute_rmsf(trajectory) -> np.ndarray:
        """Compute per-residue RMSF from Cα coordinates.

        RMSF = sqrt(mean over frames of |Cα - mean_Cα|²)

        Returns:
            Float32 array of shape (n_residues,) in Å.
        """
        ca = trajectory.ca_coords  # (n_frames, n_res, 3)
        mean_ca = ca.mean(axis=0, keepdims=True)  # (1, n_res, 3)
        sq_dev = ((ca - mean_ca) ** 2).sum(axis=-1)  # (n_frames, n_res)
        rmsf = np.sqrt(sq_dev.mean(axis=0)).astype(np.float32)  # (n_res,)
        return rmsf
