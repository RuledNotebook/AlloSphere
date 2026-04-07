import { motion } from 'framer-motion'
import { ListOrdered, BrainCircuit, SlidersHorizontal, FileText, BarChart3 } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const HITS = [
  { rank: 1, id: 'ALO-0042', dg: -10.1, signal: 0.91, admet: 'Pass', sa: 'Easy',   overall: 94 },
  { rank: 2, id: 'ALO-0017', dg: -9.6,  signal: 0.87, admet: 'Pass', sa: 'Medium', overall: 88 },
  { rank: 3, id: 'ALO-0103', dg: -9.2,  signal: 0.84, admet: 'Flag', sa: 'Easy',   overall: 81 },
  { rank: 4, id: 'ALO-0055', dg: -8.7,  signal: 0.79, admet: 'Pass', sa: 'Hard',   overall: 76 },
  { rank: 5, id: 'ALO-0298', dg: -8.3,  signal: 0.74, admet: 'Pass', sa: 'Medium', overall: 71 },
]

const DIMENSIONS = ['ΔG', 'Signal', 'ADMET', 'SA', 'Selectivity']
const RADAR_VALUES = [0.94, 0.91, 1.0, 0.9, 0.82]

function RadarChart() {
  const cx = 70, cy = 70, r = 50
  const angleStep = (2 * Math.PI) / DIMENSIONS.length
  const points = RADAR_VALUES.map((v, i) => {
    const angle = i * angleStep - Math.PI / 2
    return { x: cx + Math.cos(angle) * r * v, y: cy + Math.sin(angle) * r * v }
  })
  const gridPts = (scale: number) => DIMENSIONS.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2
    return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`
  }).join(' ')
  const polyPts = points.map(p => `${p.x},${p.y}`).join(' ')
  return (
    <svg width={140} height={140}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={gridPts(s)} fill="none" stroke="#e8e0e0" strokeWidth={0.8} />
      ))}
      {DIMENSIONS.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="#e8e0e0" strokeWidth={0.8} />
      })}
      <polygon points={polyPts} fill="rgba(204,98,98,0.18)" stroke="#cc6262" strokeWidth={1.5} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#cc6262" />)}
      {DIMENSIONS.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2
        const lx = cx + Math.cos(angle) * (r + 14)
        const ly = cy + Math.sin(angle) * (r + 14)
        return <text key={i} x={lx} y={ly + 3} textAnchor="middle" fontSize={7} fill="#888" fontFamily="Inter, sans-serif">{d}</text>
      })}
    </svg>
  )
}

const features = [
  { Icon: BrainCircuit,      title: 'LLM Scientific Rationale',       body: 'For each top-ranked compound, a fine-tuned language model retrieves the 5 most structurally similar known allosteric drugs from ChEMBL and drafts a 3-paragraph rationale explaining the mechanism prediction, structural analogues, and suggested next experiments. Output is citation-grounded, not templated.' },
  { Icon: SlidersHorizontal, title: 'Multi-Objective Pareto Frontier', body: 'No single weighting scheme is correct for all drug programs. Rank computes the Pareto frontier across 5 objectives — binding ΔG, allosteric signal score, ADMET composite, synthetic accessibility, and predicted selectivity — returning the full non-dominated set so medicinal chemists can apply program-specific filters.' },
  { Icon: FileText,          title: 'ELN-Ready PDF Reports',          body: 'The ranked list exports as a structured PDF with compound structures, all scores, radar charts, and LLM rationale — formatted to paste directly into Benchling, Dotmatics, or paper lab notebooks. No figures to manually assemble or tables to reformat.' },
  { Icon: BarChart3,         title: 'Integrated Score Aggregation',   body: 'Aggregates Vina ΔG, GNN re-score, allosteric pathway score, SwissADME / ADMETlab 2.0 flags, SAscore, and predicted kinase selectivity panel into a single normalized rank. Each upstream score is individually retrievable for custom post-hoc analysis.' },
]

export default function Rank() {
  return (
    <div>
      <ToolHeader
        eyebrow="Hit Prioritization"
        title="Allos Rank"
        subtitle="Pareto-optimal multi-objective ranking of docking hits across binding affinity, allosteric signal, ADMET, synthetic accessibility, and selectivity — with LLM-written scientific rationale per compound."
        Icon={ListOrdered}
        stats={[
          { value: 'Pareto',    label: 'Ranking method' },
          { value: '5',         label: 'Scoring dimensions' },
          { value: 'PDF + CSV', label: 'Output formats' },
          { value: '≤2 min',    label: '10k compound ranking' },
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
        <div style={{ background: '#f5f0f0', borderRadius: 10, overflow: 'hidden', fontSize: 11 }}>
          <div style={{ background: '#e8e0e0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #ddd' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Rank — 1.34M hits · Pareto frontier · LLM rationale</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>● COMPLETE · 1m 48s</div>
          </div>
          <div style={{ display: 'flex', height: 310 }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                <thead style={{ background: '#eee8e8', position: 'sticky', top: 0 }}>
                  <tr>
                    {['#', 'Compound', 'GNN ΔG', 'Signal', 'ADMET', 'SA', 'Score'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' ? 'center' : 'left', color: '#888', fontWeight: 600, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HITS.map((h, i) => (
                    <tr key={h.id} style={{ borderTop: '1px solid #ece4e4', background: i === 0 ? 'rgba(204,98,98,0.05)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#cc6262' }}>#{h.rank}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: i === 0 ? 700 : 400 }}>{h.id}</td>
                      <td style={{ padding: '8px 10px', color: '#cc6262', fontWeight: 600 }}>{h.dg}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{h.signal}</span>
                          <div style={{ width: 40, height: 3, background: '#e8e0e0', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${h.signal * 100}%`, background: '#cc6262', borderRadius: 2 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: h.admet === 'Pass' ? 'rgba(40,200,64,0.1)' : 'rgba(254,188,46,0.15)', color: h.admet === 'Pass' ? '#28c840' : '#d97000' }}>
                          {h.admet}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#888' }}>{h.sa}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#333' }}>{h.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ width: 190, borderLeft: '1px solid #ddd', background: '#eee8e8', padding: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>ALO-0042 · Score Profile</div>
              <RadarChart />
              <div style={{ marginTop: 8, padding: '8px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e8e0e0', fontSize: 10, color: '#666', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                <strong style={{ color: '#333' }}>LLM:</strong> Structurally analogous to geldanamycin (IC50 = 1.2 nM vs. HSP90). Predicted agonist modulation at N-terminal ATPase pocket. Recommend HDX-MS validation.
              </div>
            </div>
          </div>
          <div style={{ background: '#d97272', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            <span>Pareto frontier</span><span>5 objectives</span><span>LLM rationale</span><span style={{ marginLeft: 'auto' }}>Top 5 of 1.34M · export ready</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Rank takes all scored compounds from Dock and Signal, appends ADMET predictions from SwissADME and ADMETlab 2.0, computes the synthetic accessibility score, and runs a kinase selectivity panel prediction. It then computes the Pareto frontier across all five objectives, assigns a weighted composite score, and triggers the LLM rationale pipeline for the top 20 compounds.
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
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['Pareto optimization', 'SwissADME', 'ADMETlab 2.0', 'SAscore', 'ChEMBL', 'LLM (fine-tuned)', 'Benchmarking API', 'PDF export'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
