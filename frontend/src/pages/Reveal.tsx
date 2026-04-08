import { motion } from 'framer-motion'
import { ScanSearch, Atom, Target, Pill, Network } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const POCKET_SCORES = [0.12,0.18,0.15,0.22,0.19,0.31,0.28,0.45,0.62,0.79,0.88,0.91,0.85,0.73,0.68,0.72,0.80,0.87,0.92,0.89]

const POCKETS = [
  {
    pocket_id: 'P001', rank: 1,
    druggability_score: 0.91,
    cryptic_probability: 0.88,
    likely_allosteric: true,
    classification: 'cryptic_hydrophobic',
    mean_volume_angstrom3: 312,
    hydrophobicity: 1.4,
    fraction_time_open: 0.38,
    k_open_per_ns: 2.1,
    k_close_per_ns: 3.4,
    mean_open_duration_ns: 0.29,
    orthosteric_distance_angstrom: 18.4,
    residues: '24–31, 88–92',
    dscore_components: { volume: 0.88, hydrophobicity: 0.91, enclosure: 0.79, probe_overlap: 0.85, gnn: 0.88 },
  },
  {
    pocket_id: 'P002', rank: 2,
    druggability_score: 0.62,
    cryptic_probability: 0.71,
    likely_allosteric: true,
    classification: 'cryptic_polar',
    mean_volume_angstrom3: 188,
    hydrophobicity: -0.3,
    fraction_time_open: 0.19,
    k_open_per_ns: 0.9,
    k_close_per_ns: 4.8,
    mean_open_duration_ns: 0.11,
    orthosteric_distance_angstrom: 22.1,
    residues: '104–110',
    dscore_components: { volume: 0.61, hydrophobicity: 0.54, enclosure: 0.72, probe_overlap: 0.58, gnn: 0.71 },
  },
  {
    pocket_id: 'P003', rank: 3,
    druggability_score: 0.34,
    cryptic_probability: 0.41,
    likely_allosteric: false,
    classification: 'surface_groove',
    mean_volume_angstrom3: 94,
    hydrophobicity: 0.2,
    fraction_time_open: 0.08,
    k_open_per_ns: 0.4,
    k_close_per_ns: 5.1,
    mean_open_duration_ns: 0.06,
    orthosteric_distance_angstrom: 9.3,
    residues: '55–58',
    dscore_components: { volume: 0.32, hydrophobicity: 0.38, enclosure: 0.28, probe_overlap: 0.31, gnn: 0.41 },
  },
]

const CLASSIFICATION_COLOR: Record<string, string> = {
  cryptic_hydrophobic: '#cc6262',
  cryptic_polar: '#d97272',
  cryptic_ppi: '#c08050',
  surface_groove: '#aaa',
  orthosteric_adjacent: '#8888cc',
}

const CLASSIFICATION_LABEL: Record<string, string> = {
  cryptic_hydrophobic: 'Cryptic · Hydrophobic',
  cryptic_polar: 'Cryptic · Polar',
  cryptic_ppi: 'Cryptic · PPI',
  surface_groove: 'Surface Groove',
  orthosteric_adjacent: 'Orthosteric Adjacent',
}

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
      <text x={w - 2} y={h * 0.35 - 3} fontSize={8} fill="#e8a8a8" textAnchor="end" fontFamily="monospace">dscore threshold</text>
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
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#febc2e" fontFamily="monospace">P001</text>
      <text x="8" y={142} fontSize={9} fill="#666" fontFamily="monospace">GVP-GNN surface heatmap · dscore: 0.91</text>
    </svg>
  )
}

function DscoreBar({ components }: { components: Record<string, number> }) {
  const labels: Record<string, string> = {
    volume: 'Volume', hydrophobicity: 'Hydrophobicity', enclosure: 'Enclosure',
    probe_overlap: 'Probe Overlap', gnn: 'GNN Score',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(components).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', width: 100, flexShrink: 0 }}>{labels[k]}</span>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${v * 100}%`, background: 'linear-gradient(90deg, #e8a8a8, #cc6262)', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: '#cc6262', fontFamily: 'monospace', width: 30, textAlign: 'right' }}>{v.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

const features = [
  { Icon: Atom,    title: 'GVP-GNN Architecture',           body: 'Reveal uses a Geometric Vector Perceptron GNN E(3)-equivariant by construction. Scalar and vector features transform predictably under rotations, reflections, and translations, so the model learns pocket geometry once and applies it regardless of protein orientation or trajectory alignment.' },
  { Icon: Target,  title: 'Simultaneous Frame Scanning',    body: 'Reveal batches the entire trajectory through the GVP-GNN in parallel using a GPU BatchManager. Pocket-forming transitions spanning as few as 3–5 frames are never missed by strided sampling. Frame filtering uses per-residue RMSF to skip rigid frames and focus compute on dynamic regions.' },
  { Icon: Pill,    title: 'Five-Component Dscore',          body: 'Druggability is a weighted logistic combination of five signals: volume score (optimal 300–1000 Å³), hydrophobicity (Kyte-Doolittle GRAVY), enclosure fraction, Scout probe-grid overlap, and raw GNN cryptic probability. Weights are trained on ChEMBL allosteric data.' },
  { Icon: Network, title: 'Kinetics-Aware Pocket Ranking',  body: 'Beyond druggability, Reveal reports opening rate (k_open), closing rate (k_close), and mean open duration for each pocket. Pockets with high fraction_time_open and long open durations are prioritised a pocket that opens rarely is a poor drug target regardless of Dscore.' },
]

export default function RevealPage() {
  const top = POCKETS[0]

  return (
    <div>
      <ToolHeader
        eyebrow="Cryptic Pocket Detection"
        title="Allos Reveal"
        subtitle="A GVP-GNN that scans every frame of a conformational trajectory simultaneously scoring druggability with a five-component Dscore and reporting opening kinetics for every detected pocket."
        Icon={ScanSearch}
        stats={[
          { value: '<4 min', label: 'Detection latency' },
          { value: '94%',    label: 'Pocket recall' },
          { value: '8%',     label: 'False positive rate' },
          { value: '5',      label: 'Dscore components' },
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
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Reveal HSP90-N · 500 frames · GVP-GNN</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>● COMPLETE</div>
          </div>

          <div style={{ display: 'flex', height: 340 }}>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Surface Druggability Heatmap</div>
                <PocketHeatmap />
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 4 }}>Dscore Over Trajectory · P001</div>
                <PocketTimeline />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginTop: 2 }}>
                  <span>Frame 0</span><span>pocket opens @ frame 9 →</span><span>Frame 500</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Dscore Components · {top.pocket_id}</div>
                <DscoreBar components={top.dscore_components} />
              </div>
            </div>

            <div style={{ width: 230, borderLeft: '1px solid #ddd', background: '#eee8e8', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 0 }}>Detected Pockets</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {POCKETS.map(p => (
                  <div key={p.pocket_id} style={{
                    background: '#fff', borderRadius: 8, padding: '10px 10px', marginBottom: 8,
                    border: p.rank === 1 ? '1.5px solid #d97272' : '1px solid #e8e0e0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#333', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>{p.pocket_id}</span>
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#aaa', fontFamily: 'Inter, sans-serif' }}>#{p.rank}</span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        color: p.likely_allosteric ? '#28c840' : '#aaa',
                        background: p.likely_allosteric ? 'rgba(40,200,64,0.08)' : 'rgba(0,0,0,0.04)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {p.likely_allosteric ? '✓ Allosteric' : 'Not allosteric'}
                      </span>
                    </div>

                    <div style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 600, marginBottom: 6,
                      color: CLASSIFICATION_COLOR[p.classification], fontFamily: 'Inter, sans-serif',
                      background: `${CLASSIFICATION_COLOR[p.classification]}18`,
                      padding: '1px 7px', borderRadius: 4,
                    }}>
                      {CLASSIFICATION_LABEL[p.classification]}
                    </div>

                    <div style={{ fontSize: 11, color: '#777', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                      Res {p.residues}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginBottom: 7 }}>
                      {[
                        ['Dscore',    p.druggability_score.toFixed(2)],
                        ['Cryptic P', p.cryptic_probability.toFixed(2)],
                        ['Volume',    `${p.mean_volume_angstrom3} Å³`],
                        ['GRAVY',     p.hydrophobicity.toFixed(1)],
                        ['Open %',    `${(p.fraction_time_open * 100).toFixed(0)}%`],
                        ['τ open',    `${p.mean_open_duration_ns} ns`],
                        ['k_open',    `${p.k_open_per_ns} ns⁻¹`],
                        ['k_close',   `${p.k_close_per_ns} ns⁻¹`],
                        ['Dist. AS',  `${p.orthosteric_distance_angstrom} Å`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ fontSize: 11, color: '#666', fontFamily: 'Inter, sans-serif' }}>
                          <span style={{ color: '#bbb' }}>{k}: </span>
                          <span style={{ color: '#333', fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
                        <span>Dscore</span><span style={{ color: '#cc6262', fontWeight: 700 }}>{p.druggability_score.toFixed(2)}</span>
                      </div>
                      <div style={{ height: 3, background: '#eee', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${p.druggability_score * 100}%`, background: 'linear-gradient(90deg,#e8a8a8,#cc6262)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
                        <span>Cryptic probability</span><span style={{ color: '#d97272', fontWeight: 700 }}>{p.cryptic_probability.toFixed(2)}</span>
                      </div>
                      <div style={{ height: 3, background: '#eee', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${p.cryptic_probability * 100}%`, background: 'linear-gradient(90deg,#f0c0c0,#d97272)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: '6px 0', borderTop: '1px solid #ddd', fontFamily: 'Inter, sans-serif' }}>
                3 pockets · 2.1 min elapsed
              </div>
            </div>
          </div>

          <div style={{ background: '#cc6262', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
            <span>GVP-GNN</span><span>PyTorch Geometric</span><span>CUDA 12.2</span><span>fpocket · LigSite</span>
            <span style={{ marginLeft: 'auto' }}>3 pockets · PocketAtlas ready</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Reveal loads the Scout trajectory manifest, filters rigid frames by RMSF threshold, and batches the dynamic frames through a GVP-GNN in parallel. Per-residue cryptic pocket probabilities feed into LigSite and hotspot geometry extraction. Candidate pockets are clustered spatially and analysed for opening kinetics, then scored with a five-component Dscore and classified into one of five pocket types. Results are assembled into a PocketAtlas and exported for Dock.
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
          {[
            ['Pocket detection recall', 94],
            ['Druggability precision', 87],
            ['Cryptic pocket classification accuracy', 84],
            ['False positive rate (inverted)', 92],
          ].map(([label, v]) => (
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
        <div className="page-eyebrow">PocketEntry Schema</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
          <tbody>
            {[
              ['pocket_id', 'str', 'Unique identifier, e.g. P001'],
              ['druggability_score', 'float [0–1]', 'Weighted Dscore from five components'],
              ['cryptic_probability', 'float [0–1]', 'Raw GVP-GNN cryptic pocket score'],
              ['classification', 'enum', 'cryptic_hydrophobic · cryptic_polar · cryptic_ppi · surface_groove · orthosteric_adjacent'],
              ['mean_volume_angstrom3', 'float', 'Mean pocket volume across open frames (Å³)'],
              ['fraction_time_open', 'float [0–1]', 'Fraction of analysed frames where pocket is open'],
              ['k_open_per_ns', 'float', 'Opening rate constant (ns⁻¹)'],
              ['mean_open_duration_ns', 'float', 'Mean open-state lifetime (ns)'],
              ['peak_open_frames', 'list[int]', 'Frame indices of representative open conformations'],
            ].map(([f, t, d]) => (
              <tr key={f}><td><strong>{f}</strong></td><td><code>{t}</code></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="section-divider" />
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['GVP-GNN', 'PyTorch Geometric', 'CUDA 12.2', 'LigSite', 'fpocket', 'DBSCAN', 'ChEMBL', 'Pydantic', 'NumPy', 'Python 3.11'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
