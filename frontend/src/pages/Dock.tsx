import { motion } from 'framer-motion'
import { Layers, Gauge, Scale, Grid3x3, FileDown } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const POSES = [
  { id: 'ALO-0042', vina: -9.4, gnn: -10.1, conf: 3 },
  { id: 'ALO-0017', vina: -8.8, gnn: -9.6,  conf: 5 },
  { id: 'ALO-0103', vina: -8.6, gnn: -9.2,  conf: 4 },
  { id: 'ALO-0055', vina: -8.1, gnn: -8.7,  conf: 6 },
  { id: 'ALO-0298', vina: -7.9, gnn: -8.3,  conf: 2 },
  { id: 'ALO-0181', vina: -7.7, gnn: -7.9,  conf: 4 },
]

function DockingProgress() {
  return (
    <div style={{ padding: '10px 14px', background: '#1a1a1a', borderRadius: 6 }}>
      {['Conformation 1/500', 'Conformation 2/500', 'Conformation 3/500'].map((label, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', marginBottom: 3, fontFamily: 'monospace' }}>
            <span>{label}</span><span>{[100, 100, 67][i]}%</span>
          </div>
          <div style={{ height: 4, background: '#333', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${[100, 100, 67][i]}%`, background: 'linear-gradient(90deg, #e8a8a8, #cc6262)', borderRadius: 2 }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 9, color: '#febc2e', marginTop: 4, fontFamily: 'monospace' }}>▸ 1,340,000 / 2,000,000 poses complete</div>
    </div>
  )
}

function PoseViewer() {
  const atoms = Array.from({ length: 24 }, (_, i) => ({
    x: 50 + Math.cos((i / 24) * Math.PI * 2) * (20 + (i % 3) * 8),
    y: 50 + Math.sin((i / 24) * Math.PI * 2) * (15 + (i % 3) * 6),
    r: 3 + (i % 4),
    type: ['C', 'N', 'O', 'C'][i % 4],
  }))
  const colors: Record<string, string> = { C: '#aaa', N: '#6699ff', O: '#cc6262', S: '#ffcc44' }
  return (
    <svg width="100%" height={160} style={{ background: '#0f1117', borderRadius: 6 }}>
      {atoms.map((a, i) =>
        i > 0 ? <line key={`l${i}`} x1={`${atoms[i-1].x}%`} y1={atoms[i-1].y} x2={`${a.x}%`} y2={a.y} stroke="#333" strokeWidth={1.2} /> : null
      )}
      {atoms.map((a, i) => (
        <circle key={i} cx={`${a.x}%`} cy={a.y} r={a.r} fill={colors[a.type]} fillOpacity={0.85} />
      ))}
      <rect x="5" y="5" width={60} height={20} fill="#1a1a1a" rx={3} />
      <text x={35} y={19} textAnchor="middle" fontSize={9} fill="#e8a8a8" fontFamily="monospace">ΔG = −10.1</text>
      <text x="8" y={152} fontSize={9} fill="#666" fontFamily="monospace">ALO-0042 · Best pose · Conformation 87</text>
    </svg>
  )
}

const features = [
  { Icon: Gauge,    title: '2 Million Poses Per Hour',       body: 'AutoDock-GPU is compiled with custom CUDA kernels that batch ligand preparation, grid calculation, and scoring across all conformational frames simultaneously. The scheduler prioritizes frames where Scout identified high-RMSF regions, focusing compute where cryptic pockets are most likely open.' },
  { Icon: Scale,    title: 'Hybrid Physics + GNN Scoring',  body: 'Initial poses are scored with the Vina empirical force field, which is fast but poorly calibrated for cryptic sites with unusual geometry. A re-scoring GNN trained on 480,000 crystal structures corrects systematic errors in non-orthosteric geometries before the final ranking.' },
  { Icon: Grid3x3,  title: 'True Ensemble Docking',         body: 'Every compound is docked against all 500 conformational frames — not a single receptor or a hand-picked subset. The ensemble score is a Boltzmann-weighted average across frames, naturally down-weighting conformations where the pocket is partially closed.' },
  { Icon: FileDown, title: 'Schrodinger-Compatible Export', body: 'All top poses are exported as .mae and .sdf files compatible with Glide SP/XP re-scoring, Phase shape screening, and FEP+ relative binding free energy calculations. No manual format conversion needed.' },
]

export default function Dock() {
  return (
    <div>
      <ToolHeader
        eyebrow="Ensemble Docking"
        title="Allos Dock"
        subtitle="Full flexible ensemble docking against an entire conformational library at 2 million poses per hour. Physics-based scoring corrected by a GNN trained on 480k crystal structures."
        Icon={Layers}
        stats={[
          { value: '2M/hr',    label: 'Pose throughput' },
          { value: '10M+',     label: 'Library capacity' },
          { value: '16–28 GB', label: 'VRAM' },
          { value: '500',      label: 'Conformations docked' },
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
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Dock — 10M compounds · 500 conformations · AutoDock-GPU</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#febc2e', borderRadius: 4, color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>● RUNNING</div>
          </div>
          <div style={{ display: 'flex', height: 310 }}>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Best Pose — ALO-0042</div>
                <PoseViewer />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Docking Progress</div>
                <DockingProgress />
              </div>
            </div>
            <div style={{ width: 220, borderLeft: '1px solid #ddd', background: '#eee8e8' }}>
              <div style={{ padding: '10px 12px 6px', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#999' }}>Top Hits (Ensemble Rank)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ background: '#e8dede' }}>
                    <th style={{ padding: '5px 10px', textAlign: 'left', color: '#888', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right', color: '#888', fontWeight: 600 }}>Vina</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right', color: '#888', fontWeight: 600 }}>GNN</th>
                  </tr>
                </thead>
                <tbody>
                  {POSES.map((p, i) => (
                    <tr key={p.id} style={{ background: i === 0 ? 'rgba(217,114,114,0.08)' : 'transparent', borderTop: '1px solid #ece4e4' }}>
                      <td style={{ padding: '6px 10px', fontWeight: i === 0 ? 700 : 400, color: '#333' }}>{p.id}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right', color: '#888' }}>{p.vina}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right', color: '#cc6262', fontWeight: 600 }}>{p.gnn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', fontSize: 9, color: '#aaa', fontFamily: 'Inter, sans-serif' }}>6 of 1,340,000 shown · re-scored</div>
            </div>
          </div>
          <div style={{ background: '#d97272', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            <span>AutoDock-GPU 1.5</span><span>Vina 1.2</span><span>GNN re-scorer</span><span style={{ marginLeft: 'auto' }}>1.34M poses · 38 min elapsed</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Dock takes the pocket coordinates from Reveal and the full conformational ensemble from Scout, then launches AutoDock-GPU jobs across all receptor conformations simultaneously. The GNN re-scorer runs on completed pose batches in parallel, so re-scoring never bottlenecks the docking throughput. Final ensemble scores Boltzmann-weight each conformation by its Reveal pocket score before ranking.
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
          <thead><tr><th>Column</th><th>Type</th><th>Description</th></tr></thead>
          <tbody>
            {[
              ['compound_id',   'str',   'Library identifier'],
              ['vina_score',    'float', 'Vina ΔG (kcal/mol)'],
              ['gnn_score',     'float', 'Re-scored binding affinity'],
              ['ensemble_rank', 'int',   'Rank across all conformations'],
              ['conf_id',       'int',   'Best conformation index'],
              ['sdf_path',      'path',  'Schrodinger-compatible 3D pose'],
            ].map(([f, t, d]) => (
              <tr key={f}><td>{f}</td><td><code>{t}</code></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="section-divider" />
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['AutoDock-GPU 1.5', 'CUDA C++', 'Vina 1.2', 'PDBbind v2020', 'PyMOL', '.sdf / .mae export'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
