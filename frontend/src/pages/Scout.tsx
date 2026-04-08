import { motion } from 'framer-motion'
import { Dna, Zap, Monitor, Ruler, RefreshCw } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const RMSF = [2,3,4,3,2,2,5,8,12,9,6,4,3,2,3,5,7,10,14,11,8,5,3,2,2,3,4,6,5,3]
const ENERGY = [-320,-318,-322,-319,-325,-328,-324,-330,-334,-331,-336,-338,-335,-340,-337,-342,-339,-344,-341,-346]

function EnergyLine() {
  const min = Math.min(...ENERGY), max = Math.max(...ENERGY)
  const w = 340, h = 60
  const pts = ENERGY.map((v, i) => {
    const x = (i / (ENERGY.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="#d97272" strokeWidth={1.5} strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(217,114,114,0.12)" stroke="none" />
    </svg>
  )
}

function RMSFBars() {
  const max = Math.max(...RMSF)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
      {RMSF.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 2,
          background: v > 8 ? 'var(--deep-coral)' : v > 5 ? 'var(--coral)' : 'var(--salmon)',
          height: `${(v / max) * 100}%`,
          opacity: 0.85,
        }} />
      ))}
    </div>
  )
}

const RESIDUES = Array.from({ length: 80 }, (_, i) => ({
  x: (i % 10) * 28 + 14,
  y: Math.floor(i / 10) * 22 + 11,
  r: 8 + Math.random() * 5,
  flex: Math.random() > 0.7,
  pocket: i >= 22 && i <= 28,
}))

function ProteinViewer() {
  return (
    <svg width="100%" height={200} style={{ background: '#0f1117', borderRadius: 6 }}>
      {RESIDUES.map((r, i) => (
        <circle
          key={i} cx={`${(r.x / 280) * 100}%`} cy={r.y}
          r={r.r}
          fill={r.pocket ? '#d97272' : r.flex ? '#e8a8a8' : '#334'}
          fillOpacity={r.pocket ? 0.9 : r.flex ? 0.7 : 0.5}
        />
      ))}
      <text x="8" y="192" fontSize={9} fill="#666" fontFamily="monospace">
        Frame 412 / 500 · 4.8 μs · HSP90-N
      </text>
    </svg>
  )
}

const features = [
  { Icon: Zap,       title: 'AI-Steered Collective Variables', body: 'A lightweight neural network runs alongside the simulation, continuously assessing which regions of conformational space remain under-sampled. It adjusts the metadynamics bias in real time, ensuring every GPU cycle explores new territory rather than re-sampling visited states.' },
  { Icon: Monitor,   title: '12 μs/Day on a Single Workstation', body: 'Leverages OpenMM with GPU-optimized CUDA kernels and REST2 (Replica Exchange with Solute Tempering) to achieve throughput previously requiring 400-node HPC clusters. Runs on a single NVIDIA A100 or H100 with 40–80 GB VRAM.' },
  { Icon: Ruler,     title: 'Per-Residue Flexibility Annotation', body: 'Every trajectory frame is automatically annotated with per-residue RMSF, backbone dihedral distributions, contact maps, and solvent accessibility scores. These annotations feed directly into Reveal\'s pocket detection GNN without manual preprocessing.' },
  { Icon: RefreshCw, title: 'REST2 Replica Exchange', body: 'Runs up to 8 temperature replicas in parallel. Periodic swaps between replicas allow the system to escape kinetic traps and explore cryptic-open conformations that single-replica simulations reliably miss, especially in loop regions and allosteric cores.' },
]

export default function Scout() {
  return (
    <div>
      <ToolHeader
        eyebrow="Conformational Sampling"
        title="Allos Scout"
        subtitle="GPU-accelerated enhanced sampling molecular dynamics with AI-steered collective variable bias. Generates a dense, annotated conformational landscape of any target protein in hours, not weeks."
        Icon={Dna}
        stats={[
          { value: '12 μs/day', label: 'MD throughput' },
          { value: '<4 min',    label: 'Pocket latency' },
          { value: '500+',      label: 'Frames / run' },
          { value: '1 GPU',     label: 'Required hardware' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
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
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Scout HSP90-N · REST2 · 8 replicas</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 11 }}>● RUNNING</div>
          </div>

          <div style={{ display: 'flex', height: 320 }}>
            <div style={{ width: 160, background: '#eee8e8', borderRight: '1px solid #ddd', padding: 12, flexShrink: 0, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>System</div>
              {[['Protein', 'HSP90-N'], ['Chain', 'A'], ['Residues', '229'], ['Water', '12,418'], ['Ions', 'Na⁺ Cl⁻']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#444' }}>
                  <span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#ddd', margin: '10px 0' }} />
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>GPU</div>
              {[['Device', 'A100'], ['VRAM', '38.2 GB'], ['Util', '97%'], ['Temp', '74°C']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#444' }}>
                  <span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 600, color: v === '97%' ? '#d97272' : '#444' }}>{v}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#ddd', margin: '10px 0' }} />
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>Progress</div>
              {[['Frames', '412 / 500'], ['Time', '4.82 μs'], ['Est. done', '38 min']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#444' }}>
                  <span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Conformation Viewer · Frame 412</div>
                <ProteinViewer />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 4 }}>Potential Energy (kcal/mol)</div>
                  <EnergyLine />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 2 }}>
                    <span>Frame 0</span><span>−346</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 4 }}>Per-Residue RMSF (Å)</div>
                  <RMSFBars />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 2 }}>
                    <span>Res 1</span><span>Max 14Å</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: 180, background: '#0f1117', padding: 10, fontFamily: 'monospace', fontSize: 11.5, color: '#8a9', overflowY: 'auto', flexShrink: 0 }}>
              {['[00:00] REST2 init 8 replicas', '[00:12] Frame 1 complete', '[01:44] Bias update Δ=0.12', '[03:22] Replica swap R3↔R4', '[05:01] Frame 100 · 1.0μs', '[08:40] New pocket detected!', '[09:11] Bias update Δ=0.31', '[12:30] Frame 200 · 2.1μs', '[14:02] Replica swap R1↔R2', '[18:55] Frame 300 · 3.2μs', '[21:30] Bias update Δ=0.08', '[25:12] Frame 400 · 4.3μs', '[26:44] Frame 412 · 4.8μs'].map((l, i) => (
                <div key={i} style={{ marginBottom: 4, color: l.includes('pocket') ? '#d97272' : '#8a9' }}>{l}</div>
              ))}
              <div style={{ color: '#febc2e', marginTop: 4 }}>▸ Sampling…</div>
            </div>
          </div>

          <div style={{ background: '#d97272', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 11.5, fontFamily: 'Inter, sans-serif' }}>
            <span>OpenMM 8.1</span><span>CUDA 12.2</span><span>REST2 · 8T</span><span>Frame 412</span><span style={{ marginLeft: 'auto' }}>4.82 μs complete</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Scout launches an OpenMM simulation with REST2 temperature replicas. A co-running AI model monitors the visited conformational space and incrementally adjusts the metadynamics bias to steer sampling away from already-explored geometries. Every frame is written to disk with full per-residue annotations ready for Reveal's pocket GNN without any manual preprocessing.
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
          <thead><tr><th>Field</th><th>Format</th><th>Downstream</th></tr></thead>
          <tbody>
            {[
              ['Trajectory frames', '.xtc / .dcd / .h5', 'Reveal pocket GNN'],
              ['Per-residue RMSF',  'JSON float[]',       'Flexibility heatmap'],
              ['Collective vars',   'CSV time series',    'Bias analysis'],
              ['Contact maps',      'NumPy .npy',         'Dock ensemble builder'],
              ['Energy log',        'CSV (step, E, T)',   'Convergence check'],
            ].map(([f, fmt, use]) => (
              <tr key={f}><td>{f}</td><td><code>{fmt}</code></td><td>{use}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="section-divider" />

        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['OpenMM 8.1', 'CUDA 12.2', 'REST2', 'Metadynamics', 'PyTorch', 'MDAnalysis', 'VMD', 'NVIDIA A100 / H100'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
