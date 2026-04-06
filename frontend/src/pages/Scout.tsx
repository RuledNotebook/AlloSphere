import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { Zap, Monitor, Ruler, RefreshCw } from 'lucide-react'

const features = [
  { Icon: Zap,       title: 'AI-Steered Sampling',      body: 'Model learns which regions of conformational space remain unexplored and biases collective variables in real time — no wasted compute on already-sampled geometries.' },
  { Icon: Monitor,   title: 'Desktop-Class Throughput', body: 'Runs on a single NVIDIA GPU via OpenMM + REST2. Achieves 12 μs/day — equivalent to a 400-node cluster job from two years ago.' },
  { Icon: Ruler,     title: 'Per-Residue Flexibility',  body: 'Every frame annotated with per-residue RMSF and flexibility scores, feeding directly into Reveal pocket detection network.' },
  { Icon: RefreshCw, title: 'Replica Exchange',         body: 'REST2 protocol exchanges configurations across temperature replicas to escape local minima and find the cryptic-open state faster.' },
]

export default function Scout() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Conformational Sampling</div>
        <h1 className="page-title">Allos Scout</h1>
        <p className="page-desc">
          GPU-accelerated enhanced sampling MD with AI-steered collective variable bias. Generates a dense conformational landscape of the target protein in hours — every frame annotated with per-residue flexibility for downstream pocket detection.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: '12 μs/day', label: 'MD throughput on 1× GPU' },
            { value: '<4 min',    label: 'Pocket detection latency' },
            { value: '500+',      label: 'Frames per trajectory' },
            { value: '1 node',    label: 'vs. 400-node cluster' },
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
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row">
          {['OpenMM', 'CUDA', 'REST2', 'NVIDIA A100 / H100', 'VMD', 'MDAnalysis', 'Python', 'PyTorch'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Output Format</div>
        <table className="data-table">
          <thead>
            <tr><th>Field</th><th>Format</th><th>Downstream use</th></tr>
          </thead>
          <tbody>
            {[
              ['Trajectory frames', '.xtc / .dcd / .h5', 'Reveal pocket GNN'],
              ['Per-residue RMSF',  'JSON array',         'Scout flexibility map'],
              ['Collective vars',   'CSV time series',    'Bias history & analysis'],
              ['Annotations',       'RMSD, RMSF, contact', 'Dock ensemble builder'],
            ].map(([f, fmt, use]) => (
              <tr key={f}><td>{f}</td><td><code>{fmt}</code></td><td>{use}</td></tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </PageWrapper>
  )
}
