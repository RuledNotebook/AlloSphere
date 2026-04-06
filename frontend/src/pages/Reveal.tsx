import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { Atom, Target, Pill, Network } from 'lucide-react'

const features = [
  { Icon: Atom,    title: 'E(3)-Equivariant GNN',          body: 'Graph neural network invariant to rotations, reflections, and translations — correctly handles protein geometry without alignment preprocessing.' },
  { Icon: Target,  title: 'Pocket-Forming Event Detection', body: 'Watches thousands of frames simultaneously, flagging transient pocket emergence events that are invisible to single-frame docking.' },
  { Icon: Pill,    title: 'Druggability Scoring',           body: 'Classifier head trained on ChEMBL distinguishes geometrically plausible pockets from those biochemically reachable by drug-like molecules.' },
  { Icon: Network, title: 'Graph Encoding',                 body: 'Protein surface patches encoded as graphs — nodes are surface residues, edges encode proximity and electrostatics. No conformational hand-selection needed.' },
]

const metrics = [
  { label: 'Pocket detection recall',   value: 94, display: '94%' },
  { label: 'Druggability precision',     value: 87, display: '87%' },
  { label: 'Throughput (frames)',        value: 72, display: '2M / session' },
  { label: 'False positive rate',        value: 8,  display: '8%' },
]

export default function RevealPage() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Cryptic Pocket Detection</div>
        <h1 className="page-title">Allos Reveal</h1>
        <p className="page-desc">
          An E(3)-equivariant graph neural network that watches every frame of a conformational trajectory simultaneously, flagging pocket-forming events and scoring druggability — in under 4 minutes, without manual inspection.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: '<4 min',  label: 'Detection latency per trajectory' },
            { value: '2M',      label: 'Frames scored per session' },
            { value: '94%',     label: 'Pocket recall on held-out set' },
            { value: 'E(3)',    label: 'Symmetry-equivariant architecture' },
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
        <div className="page-eyebrow">Model Performance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 520, marginTop: 16 }}>
          {metrics.map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{m.label}</span>
                <span style={{ fontSize: 13, color: 'var(--deep-coral)', fontWeight: 700 }}>{m.display}</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row">
          {['PyTorch Geometric', 'EG-GNN', 'CUDA', 'ChEMBL', 'PocketMiner', 'fpocket', 'Python'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>
    </PageWrapper>
  )
}
