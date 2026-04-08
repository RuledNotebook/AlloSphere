"""Reveal module-wide constants and default thresholds."""

from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

REVEAL_DIR = Path(__file__).parent
CHECKPOINT_PATH = REVEAL_DIR / "gnn" / "checkpoints" / "gvp_gnn_v1.pt"
DSCORE_WEIGHTS_PATH = REVEAL_DIR / "scoring" / "dscore_weights.json"

# ── Frame pre-filter ─────────────────────────────────────────────────────────

# Frames where all residues have RMSF below this threshold (Å) are skipped.
RMSF_RIGID_THRESHOLD_ANGSTROM: float = 0.5

# ── GNN residue graph ────────────────────────────────────────────────────────

# Edges are drawn between residues whose Cα atoms are within this distance.
GRAPH_EDGE_CUTOFF_ANGSTROM: float = 10.0

# Number of RBF basis functions for distance encoding.
RBF_NUM_BINS: int = 16
RBF_MIN_DIST: float = 2.0
RBF_MAX_DIST: float = 10.0

# GVP-GNN layer dimensions: (scalar_channels, vector_channels)
GNN_NODE_HIDDEN_DIMS: tuple[int, int] = (128, 16)
GNN_EDGE_HIDDEN_DIMS: tuple[int, int] = (32, 1)
GNN_NUM_LAYERS: int = 4

# GPU batch size (frames per forward pass). 256 fits within ~8 GB VRAM headroom.
DEFAULT_GPU_BATCH_SIZE: int = 256

# ── Pocket extraction ─────────────────────────────────────────────────────────

# Minimum GNN score for a residue to be labelled "hot" in a given frame.
HOTSPOT_SCORE_THRESHOLD: float = 0.5

# Minimum number of connected hot residues to form a candidate pocket.
HOTSPOT_MIN_CLUSTER_SIZE: int = 5

# Ligsite grid spacing (Å).
LIGSITE_GRID_SPACING_ANGSTROM: float = 3.0

# Ligsite probe radius (Å).
LIGSITE_PROBE_RADIUS_ANGSTROM: float = 10.0

# Minimum pocket volume for it to be retained (Å³).
MIN_POCKET_VOLUME_ANGSTROM3: float = 150.0

# ── Temporal clustering ───────────────────────────────────────────────────────

# DBSCAN: maximum distance (Å) between pocket centroids to be in the same cluster.
DBSCAN_EPSILON_ANGSTROM: float = 4.0

# DBSCAN: minimum pocket events to form a named pocket identity.
DBSCAN_MIN_SAMPLES: int = 3

# ── Druggability scoring ──────────────────────────────────────────────────────

# Optimal volume range for the volume component of Dscore (Å³).
DSCORE_OPTIMAL_VOLUME_MIN: float = 300.0
DSCORE_OPTIMAL_VOLUME_MAX: float = 1000.0

# Minimum Dscore for a pocket to appear in the ranked atlas output.
DSCORE_REPORTING_THRESHOLD: float = 0.0

# Default Dscore threshold used by Allos Dock.
DOCK_DSCORE_THRESHOLD: float = 0.6

# Number of top pockets written to the PyMOL session.
PYMOL_TOP_N_POCKETS: int = 10

# ── Amino acid constants ──────────────────────────────────────────────────────

STANDARD_AMINO_ACIDS: list[str] = [
    "ALA", "ARG", "ASN", "ASP", "CYS",
    "GLN", "GLU", "GLY", "HIS", "ILE",
    "LEU", "LYS", "MET", "PHE", "PRO",
    "SER", "THR", "TRP", "TYR", "VAL",
]

# GRAVY hydrophobicity indices (Kyte-Doolittle) keyed by three-letter code.
GRAVY_INDEX: dict[str, float] = {
    "ALA": 1.8,  "ARG": -4.5, "ASN": -3.5, "ASP": -3.5, "CYS": 2.5,
    "GLN": -3.5, "GLU": -3.5, "GLY": -0.4, "HIS": -3.2, "ILE": 4.5,
    "LEU": 3.8,  "LYS": -3.9, "MET": 1.9,  "PHE": 2.8,  "PRO": -1.6,
    "SER": -0.8, "THR": -0.7, "TRP": -0.9, "TYR": -1.3, "VAL": 4.2,
}

# Scout manifest minimum supported version.
MIN_SCOUT_VERSION: str = "0.1.0"

# DSSP secondary structure codes → one-hot index (8-class).
DSSP_CODES: list[str] = ["H", "B", "E", "G", "I", "T", "S", "C"]
DSSP_CODE_TO_IDX: dict[str, int] = {c: i for i, c in enumerate(DSSP_CODES)}
