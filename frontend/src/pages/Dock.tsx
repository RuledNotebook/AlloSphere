import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { Gauge, Scale, Grid3x3, FileDown } from 'lucide-react'

const features = [
  { Icon: Gauge,    title: '2M Poses / Hour',       body: 'AutoDock-GPU batches docking runs across all conformational frames in parallel — full 10M-compound library vs. entire ensemble overnight on one workstation.' },
  { Icon: Scale,    title: 'Physics-Based Scoring', body: 'Vina + GNN re-scoring corrects for non-orthosteric binding geometries that standard scoring functions systematically undervalue.' },
  { Icon: Grid3x3,  title: 'Ensemble-Aware Docking', body: 'Poses scored against every conformation simultaneously — no cherry-picked receptor. Compounds that bind multiple poses score higher.' },
  { Icon: FileDown, title: 'Schrodinger Export',    body: 'Direct .mae / .sdf export for compatibility with Glide, Phase, and downstream FEP workflows.' },
]

export default function Dock() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Ensemble Docking</div>
        <h1 className="page-title">Allos Dock</h1>
        <p className="page-desc">
          Full flexible docking run against an entire compound library across all conformations simultaneously. Every pose is scored with a physics-based hybrid scoring function — 2 million poses per hour, on one machine.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: '2M/hr',     label: 'Pose throughput' },
            { value: '10M+',      label: 'Compound library capacity' },
            { value: '16–28 GB',  label: 'VRAM footprint' },
            { value: '1× GPU',    label: 'Required hardware' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="card-grid">
          {features.map((f) => (
            <motion.div className="card" key={f.title} whileHover={{ y: -3 }}>
              <div className="card-icon"><f.Icon size={20} strokeWidth={1.6} color="var(--coral)" /></div>
              <div className="card-title">{f.title}</div>
              <div className="card-body">{f.body}</div>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Pose Library Output</div>
        <table className="data-table">
          <thead>
            <tr><th>Column</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            {[
              ['compound_id',   'str',   'Library identifier'],
              ['pose_rank',     'int',   'Rank within conformation'],
              ['vina_score',    'float', 'Vina ΔG estimate (kcal/mol)'],
              ['gnn_score',     'float', 'Re-scored binding affinity'],
              ['ensemble_rank', 'int',   'Rank across all conformations'],
              ['sdf_path',      'path',  'Schrodinger-compatible 3D pose'],
            ].map(([col, type, desc]) => (
              <tr key={col}><td>{col}</td><td><code>{type}</code></td><td>{desc}</td></tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row">
          {['AutoDock-GPU', 'CUDA C++', 'Vina', 'PDBbind', 'PyMOL', '.sdf export', 'Schrodinger-compatible'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>
    </PageWrapper>
  )
}
