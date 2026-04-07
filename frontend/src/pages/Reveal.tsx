import { motion } from 'framer-motion'
import { ScanSearch, Atom, Target, Pill, Network } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const POCKET_SCORES = [0.12,0.18,0.15,0.22,0.19,0.31,0.28,0.45,0.62,0.79,0.88,0.91,0.85,0.73,0.68,0.72,0.80,0.87,0.92,0.89]

function PocketTimeline() {
  const w = 340, h = 60
  const pts = POCKET_SCORES.map((v, i) => {
    const x = (i / (POCKET_SCORES.length - 1)) * w
    const y = h - v * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <line x1={0} y1={h * 0.35} x2={w} y2={h * 0.35} stroke="#e8a8a8" strokeWidth={1} strokeDasharray="3,3" />
      <text x={w - 2} y={h * 0.35 - 3} fontSize={8} fill="#e8a8a8" textAnchor="end" fontFamily="monospace">threshold</text>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(217,114,114,0.15)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#cc6262" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

function PocketHeatmap() {
  const grid = Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 20 }, (_, col) => {
      const cx = col * 14 + 7, cy = row * 14 + 7
      const dist = Math.sqrt((cx - 140) ** 2 + (cy - 70) ** 2)
      return Math.max(0, 1 - dist / 90)
    })
  )
  return (
    <svg width="100%" height={150} style={{ background: '#0f1117', borderRadius: 6 }}>
      {grid.map((row, ri) =>
        row.map((v, ci) => (
          <rect key={`${ri}-${ci}`}
            x={`${(ci / 20) * 100}%`} y={ri * 15} width="5%" height={14}
            fill={`rgba(204,98,98,${v * 0.9})`}
            rx={2}
          />
        ))
      )}
      <circle cx="50%" cy="50%" r={18} fill="none" stroke="#febc2e" strokeWidth={1.5} strokeDasharray="4,3" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#febc2e" fontFamily="monospace">pocket</text>
      <text x="8" y={142} fontSize={9} fill="#666" fontFamily="monospace">Surface patch heatmap · druggability score: 0.91</text>
    </svg>
  )
}

const POCKETS = [
  { id: 'P-001', residues: '24–31, 88–92', score: 0.91, drug: 'High',   vol: '312 Å³' },
  { id: 'P-002', residues: '104–110',       score: 0.62, drug: 'Medium', vol: '188 Å³' },
  { id: 'P-003', residues: '55–58',         score: 0.34, drug: 'Low',    vol: '94 Å³'  },
]

const features = [
  { Icon: Atom,    title: 'E(3)-Equivariant Architecture', body: 'The GNN is invariant to rotations, reflections, and translations of the protein frame — it correctly handles arbitrary orientations without alignment preprocessing. Nodes represent surface residue patches; edges encode pairwise distances and electrostatic complementarity.' },
  { Icon: Target,  title: 'Simultaneous Frame Scanning',   body: 'Rather than processing frames sequentially, Reveal batches the entire trajectory through the network in parallel. GPU memory is partitioned across frames so pocket-forming transitions — which may span just 3–5 frames — are never missed by strided sampling.' },
  { Icon: Pill,    title: 'Druggability Classification',   body: 'A secondary classifier head trained on 48,000 known drug–pocket pairs from ChEMBL scores each candidate pocket for ligandability. It distinguishes geometrically plausible pockets from those with the hydrophobic character and volume required for drug-like binding.' },
  { Icon: Network, title: 'Graph-Based Surface Encoding',  body: 'The protein surface is represented as a dynamic graph whose topology changes with each frame. Message-passing layers propagate local flexibility signals across the surface, allowing the model to detect distal pocket formation driven by allosteric conformational coupling.' },
]

export default function RevealPage() {
  return (
    <div>
      <ToolHeader
        eyebrow="Cryptic Pocket Detection"
        title="Allos Reveal"
        subtitle="An E(3)-equivariant graph neural network that scans every frame of a conformational trajectory simultaneously — flagging pocket-forming events and scoring druggability in under 4 minutes."
        Icon={ScanSearch}
        stats={[
          { value: '<4 min', label: 'Detection latency' },
          { value: '2M',     label: 'Frames / session' },
          { value: '94%',    label: 'Pocket recall' },
          { value: '8%',     label: 'False positive rate' },
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
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Reveal — HSP90-N · 500 frames · EG-GNN v2</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>● COMPLETE</div>
          </div>
          <div style={{ display: 'flex', height: 310 }}>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Surface Druggability Heatmap</div>
                <PocketHeatmap />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 4 }}>Pocket Score Over Trajectory</div>
                <PocketTimeline />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb', marginTop: 2 }}>
                  <span>Frame 0</span><span>Pocket opens @ frame 9 →</span><span>Frame 500</span>
                </div>
              </div>
            </div>
            <div style={{ width: 210, borderLeft: '1px solid #ddd', padding: 12, background: '#eee8e8' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>Detected Pockets</div>
              {POCKETS.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, border: p.id === 'P-001' ? '1.5px solid #d97272' : '1px solid #e8e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#333', fontFamily: 'Inter, sans-serif', fontSize: 11 }}>{p.id}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: p.drug === 'High' ? '#cc6262' : p.drug === 'Medium' ? '#d97272' : '#aaa', fontFamily: 'Inter, sans-serif' }}>{p.drug}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#888', marginBottom: 3 }}>Res {p.residues}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#666' }}>
                    <span>Vol: {p.vol}</span>
                    <span style={{ color: '#cc6262', fontWeight: 600 }}>Score: {p.score}</span>
                  </div>
                  <div style={{ marginTop: 6, height: 3, background: '#eee', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${p.score * 100}%`, background: 'linear-gradient(90deg,#e8a8a8,#cc6262)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>3 pockets · 2.1 min elapsed</div>
            </div>
          </div>
          <div style={{ background: '#cc6262', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            <span>EG-GNN v2</span><span>PyTorch Geometric</span><span>CUDA 12.2</span><span style={{ marginLeft: 'auto' }}>3 pockets detected · export ready</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Reveal receives the annotated trajectory from Scout and constructs a dynamic surface graph for each frame. The EG-GNN processes all frames in parallel, computing pocket probability scores per residue patch. Frames where scores cross the druggability threshold trigger a pocket event record, annotated with volume, polarity, and the residues that form the pocket wall.
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
        <div className="page-eyebrow">Model Performance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, marginTop: 14 }}>
          {[['Pocket detection recall', 94], ['Druggability precision', 87], ['Frame throughput (normalized)', 100], ['False positive rate (inverted)', 92]].map(([label, v]) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--deep-coral)', fontWeight: 700 }}>{v}%</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" style={{ width: `${v}%` }}
                  initial={{ width: 0 }} whileInView={{ width: `${v}%` }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="section-divider" />
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['PyTorch Geometric', 'EG-GNN v2', 'CUDA', 'ChEMBL', 'PocketMiner', 'fpocket', 'NumPy', 'Python 3.11'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
