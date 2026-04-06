import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { GitBranch, Timer, ArrowRightLeft, Microscope } from 'lucide-react'

const features = [
  { Icon: GitBranch,      title: 'Allosteric Graph Transformer', body: 'Models the protein as a residue-level communication network. Trained on the ATLAS dataset of known allosteric mechanisms to learn signal propagation patterns.' },
  { Icon: Timer,          title: '8-Minute Prediction',          body: 'Replaces multi-day perturbation MD with a single forward pass. Given a docked pose, returns pathway scores and residue-level allosteric effect magnitudes.' },
  { Icon: ArrowRightLeft, title: 'Binding to Functional Site',   body: 'Predicts whether binding at the cryptic pocket propagates a conformational signal to the functional site — the question docking alone cannot answer.' },
  { Icon: Microscope,     title: 'GPCR & Kinase Validated',      body: 'Functional effect classifier validated on experimentally confirmed allosteric modulators from GPCR and kinase literature, with matched negative controls.' },
]

export default function Signal() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Allostery Prediction</div>
        <h1 className="page-title">Allos Signal</h1>
        <p className="page-desc">
          Given a docked pose, Allos Signal runs a GPU-accelerated perturbation graph transformer to determine whether binding at the cryptic site actually transmits an allosteric signal to the functional site — in 8 minutes, not days.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: '8 min',   label: 'vs. days of perturbation MD' },
            { value: 'ATLAS',   label: 'Training dataset' },
            { value: '≥2 nM',   label: 'Min ΔΔG sensitivity' },
            { value: '9–16 GB', label: 'VRAM footprint' },
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
        <div className="page-eyebrow">Signal Output Schema</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Field</th><th>Format</th><th>Meaning</th></tr>
          </thead>
          <tbody>
            {[
              ['pathway_score',  'float [0–1]',                    'Overall allosteric communication strength'],
              ['residue_scores', 'float[]',                         'Per-residue signal transmission weight'],
              ['delta_gg',       'kcal/mol',                        'Predicted functional ΔΔG at active site'],
              ['effect_class',   'agonist / antagonist / neutral',  'Predicted modulator class'],
              ['confidence',     'float',                           'Model calibrated confidence'],
            ].map(([f, fmt, desc]) => (
              <tr key={f}><td>{f}</td><td><code>{fmt}</code></td><td>{desc}</td></tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row">
          {['PyTorch', 'ATLAS', 'GPCR validation', 'Kinase validation', 'CUDA', 'Graph Transformer', 'PyMOL export'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>
    </PageWrapper>
  )
}
