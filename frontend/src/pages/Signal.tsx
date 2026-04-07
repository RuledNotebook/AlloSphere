import { motion } from 'framer-motion'
import { Radio, GitBranch, Timer, ArrowRightLeft, Microscope } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const NODES = [
  { id: 'A24',  x: 50,  y: 20,  score: 0.91, label: 'Pocket' },
  { id: 'L34',  x: 72,  y: 35,  score: 0.74 },
  { id: 'K28',  x: 30,  y: 40,  score: 0.68 },
  { id: 'V102', x: 60,  y: 55,  score: 0.55 },
  { id: 'T88',  x: 40,  y: 65,  score: 0.47 },
  { id: 'R210', x: 75,  y: 70,  score: 0.38 },
  { id: 'F318', x: 25,  y: 80,  score: 0.29 },
  { id: 'E401', x: 55,  y: 88,  score: 0.82, label: 'Active' },
]

const EDGES = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[3,7]]

function SignalGraph() {
  return (
    <svg width="100%" height={180} style={{ background: '#0f1117', borderRadius: 6 }}>
      {EDGES.map(([a, b], i) => {
        const na = NODES[a], nb = NODES[b]
        return (
          <line key={i}
            x1={`${na.x}%`} y1={na.y * 1.7}
            x2={`${nb.x}%`} y2={nb.y * 1.7}
            stroke={`rgba(204,98,98,${(na.score + nb.score) / 2})`}
            strokeWidth={1.5 + na.score}
          />
        )
      })}
      {NODES.map((n, i) => (
        <g key={i}>
          <circle cx={`${n.x}%`} cy={n.y * 1.7} r={n.label ? 10 : 6}
            fill={`rgba(204,98,98,${n.score})`} stroke={n.label ? '#febc2e' : 'none'} strokeWidth={1.5} />
          <text x={`${n.x}%`} y={n.y * 1.7 + 3} textAnchor="middle" fontSize={7} fill="#fff" fontFamily="monospace">{n.id}</text>
          {n.label && (
            <text x={`${n.x + 4}%`} y={n.y * 1.7 - 13} fontSize={8} fill="#febc2e" fontFamily="Inter, sans-serif">{n.label} site</text>
          )}
        </g>
      ))}
      <text x="8" y={172} fontSize={9} fill="#666" fontFamily="monospace">Allosteric pathway · 8 residues · score 0.91</text>
    </svg>
  )
}

function PathwayScoreBar() {
  const residues = NODES.map(n => n.score)
  const max = Math.max(...residues)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
      {residues.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', borderRadius: 2,
            background: v > 0.7 ? '#cc6262' : v > 0.4 ? '#d97272' : '#e8a8a8',
            height: `${(v / max) * 100}%`,
          }} />
          <span style={{ fontSize: 7, color: '#aaa', fontFamily: 'monospace' }}>{NODES[i].id.slice(0,3)}</span>
        </div>
      ))}
    </div>
  )
}

const features = [
  { Icon: GitBranch,      title: 'Residue-Level Communication Graph', body: 'Every protein is modelled as a weighted graph where nodes are residues and edge weights encode dynamic cross-correlation from the MD trajectory. The graph transformer learns to trace signal propagation from the cryptic pocket to the functional site across this network — identifying bottleneck residues that are critical for allosteric transmission.' },
  { Icon: Timer,          title: '8-Minute Forward Pass',             body: 'A full perturbation MD calculation — which involves running dozens of independent simulations with perturbed residues and computing the resulting changes in dynamics — takes 2–4 days on a cluster. Reveal replaces this with a single graph transformer forward pass: 8 minutes on one GPU, with uncertainty estimates included.' },
  { Icon: ArrowRightLeft, title: 'Binding-to-Function Propagation',   body: 'The key scientific question Dock cannot answer is: does binding at the cryptic pocket actually change anything at the functional site? Signal computes the predicted delta in functional-site dynamics caused by binding, expressed as a ΔΔG and a per-residue pathway score map.' },
  { Icon: Microscope,     title: 'GPCR & Kinase Benchmarking',        body: 'The model was trained and validated on 1,200 confirmed allosteric modulators across GPCRs, kinases, and nuclear receptors from the ATLAS database. It achieves 84% accuracy at classifying agonist, antagonist, and neutral modulator outcomes on held-out receptors not seen during training.' },
]

export default function Signal() {
  return (
    <div>
      <ToolHeader
        eyebrow="Allostery Prediction"
        title="Allos Signal"
        subtitle="A GPU-accelerated graph transformer that predicts whether binding at a cryptic pocket propagates a conformational signal to the functional site — in 8 minutes instead of days of perturbation MD."
        Icon={Radio}
        stats={[
          { value: '8 min',   label: 'vs. 2–4 day perturbation MD' },
          { value: 'ATLAS',   label: 'Training dataset' },
          { value: '84%',     label: 'Modulator classification' },
          { value: '9–16 GB', label: 'VRAM' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        style={{ margin: '0 -36px', background: '#1c1c1f', padding: '16px 16px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3a3a3c', display: 'inline-block' }} />
        </div>
        <div style={{ background: '#f5f0f0', borderRadius: 10, overflow: 'hidden', fontSize: 11, fontFamily: 'monospace' }}>
          <div style={{ background: '#e8e0e0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #ddd' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Signal — ALO-0042 · HSP90-N · Pocket P-001</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>● COMPLETE · 7m 42s</div>
          </div>
          <div style={{ display: 'flex', height: 310 }}>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Allosteric Communication Network</div>
                <SignalGraph />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Per-Residue Pathway Score</div>
                <PathwayScoreBar />
              </div>
            </div>
            <div style={{ width: 200, borderLeft: '1px solid #ddd', padding: 14, background: '#eee8e8' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 12 }}>Prediction Output</div>
              {[
                ['Pathway score',    '0.91'],
                ['Predicted ΔΔG',   '−2.4 kcal/mol'],
                ['Effect class',    'Agonist'],
                ['Confidence',      '87%'],
                ['Key residues',    'A24, E401, V102'],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: k === 'Effect class' ? '#cc6262' : '#333', fontFamily: 'Inter, sans-serif' }}>{v}</div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(204,98,98,0.08)', borderRadius: 8, border: '1px solid rgba(204,98,98,0.2)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#cc6262', fontFamily: 'Inter, sans-serif', marginBottom: 3 }}>Recommendation</div>
                <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>Strong allosteric signal detected. Proceed to Rank and experimental HDX-MS validation.</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#d97272', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            <span>Graph Transformer v3</span><span>ATLAS 2024</span><span>CUDA 12.2</span><span style={{ marginLeft: 'auto' }}>Agonist · pathway score 0.91</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Signal constructs a dynamic residue graph from the Scout trajectory, weighting edges by cross-correlation coefficients computed across all frames. The graph transformer — trained on 1,200 ATLAS allosteric modulators — traces how a binding event at the Reveal pocket perturbs node features and propagates that perturbation to the functional site, predicting the resultant ΔΔG and modulator class.
          </p>
        </motion.div>
        <div className="card-grid">
          {features.map((f, i) => (
            <motion.div className="card" key={f.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}>
              <div className="card-icon"><f.Icon size={18} strokeWidth={1.6} color="var(--coral)" /></div>
              <div className="card-title">{f.title}</div>
              <div className="card-body">{f.body}</div>
            </motion.div>
          ))}
        </div>
        <div className="section-divider" />
        <div className="page-eyebrow">Output Schema</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead><tr><th>Field</th><th>Format</th><th>Meaning</th></tr></thead>
          <tbody>
            {[
              ['pathway_score',  'float [0–1]',                   'Overall allosteric communication strength'],
              ['residue_scores', 'float[]',                        'Per-residue transmission weight'],
              ['delta_gg',       'kcal/mol',                       'Predicted functional ΔΔG'],
              ['effect_class',   'agonist / antagonist / neutral', 'Modulator class'],
              ['confidence',     'float',                          'Calibrated model confidence'],
              ['pathway_nodes',  'str[]',                          'Key residues in transmission path'],
            ].map(([f, fmt, d]) => (
              <tr key={f}><td>{f}</td><td><code>{fmt}</code></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="section-divider" />
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['PyTorch', 'Graph Transformer', 'ATLAS 2024', 'GPCR validation', 'Kinase validation', 'CUDA', 'PyMOL export'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
