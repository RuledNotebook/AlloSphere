import { motion } from 'framer-motion'
import { FlaskConical, ClipboardList, TestTube2, Telescope, BookOpen } from 'lucide-react'
import ToolHeader from '../components/ToolHeader'

const ASSAYS = [
  { name: 'HDX-MS',        recommended: true,  timeline: '2–3 days', readout: 'Δ deuterium uptake', confidence: 94 },
  { name: 'NMR (15N-HSQC)',recommended: true,  timeline: '1 day',    readout: 'Δ chemical shift',   confidence: 88 },
  { name: 'ITC',           recommended: false, timeline: '2 hrs',    readout: 'ΔH, Ka, ΔG',        confidence: 72 },
  { name: 'Thermal Shift', recommended: false, timeline: '1 hr',     readout: 'ΔTm',               confidence: 65 },
]

function PredictedReadout() {
  const values = [0.1, 0.15, 0.12, 0.18, 0.14, 0.32, 0.45, 0.61, 0.58, 0.64, 0.71, 0.68, 0.72]
  const max = Math.max(...values)
  const w = 300, h = 60
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <line x1={0} y1={h * 0.22} x2={w} y2={h * 0.22} stroke="#febc2e" strokeWidth={1} strokeDasharray="3,3" />
      <text x={w - 2} y={h * 0.22 - 3} fontSize={7.5} fill="#febc2e" textAnchor="end" fontFamily="monospace">expected signal</text>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(217,114,114,0.15)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#cc6262" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

const SOP_LINES = [
  '# SOP-ALO-0042-HDX-MS',
  'Compound: ALO-0042 · Target: HSP90-N · Pocket: P-001',
  '',
  '## Reagents',
  '· ALO-0042 stock: 10 mM in DMSO',
  '· HSP90-N (residues 1–236): 5 μM in PBS',
  '· D₂O exchange buffer: 50 mM HEPES pH 7.4',
  '',
  '## Protocol',
  '1. Pre-incubate protein 15 min at 25°C',
  '2. Add compound to 50 μM (10-fold excess)',
  '3. Initiate HDX: dilute 1:19 into D₂O buffer',
  '4. Quench at 0, 30, 300, 3000 s timepoints',
  '5. Inject onto immobilized pepsin column',
  '',
  '## Expected Readout',
  '· Binding: ΔD 15–25% at residues 24–31',
  '· Non-binding control: ΔD < 3%',
  '· Allosteric: ΔD 8–14% at E401 region',
]

const features = [
  { Icon: ClipboardList, title: 'Compound-Specific SOP Generation',  body: 'The LLM receives the allosteric pathway from Signal, the pocket residues from Reveal, and the compound structure from Rank, then drafts a fully populated SOP: reagent list, concentrations, timepoints, quench conditions, and expected readout ranges. It is grounded in the specific mechanism, not a generic template.' },
  { Icon: TestTube2,     title: 'Assay Modality Recommendation',     body: 'Validate selects the most informative assay modality based on which residues are in the allosteric pathway. Backbone-dominated pathways are routed to HDX-MS; sidechain-dominated ones to NMR; fast binding kinetics to SPR. Multiple assays are ranked by expected information gain per experimental cost.' },
  { Icon: Telescope,     title: 'Predicted Assay Signatures',        body: 'Before running a single experiment, Validate predicts the expected readout for both bound and unbound states — the ΔD profile for HDX-MS, the chemical shift perturbation map for NMR, the thermogram shape for ITC. Researchers know exactly what a positive result looks like before touching the bench.' },
  { Icon: BookOpen,      title: 'ELN-Ready Wet-Lab Output',          body: 'Every SOP exports as a structured Markdown document compatible with Benchling, Dotmatics, and LabArchives. Binding and non-binding control predictions are always included — so researchers can distinguish true allosteric activity from compound aggregation or assay artifacts.' },
]

export default function Validate() {
  return (
    <div>
      <ToolHeader
        eyebrow="Experimental Validation"
        title="Allos Validate"
        subtitle="ML-designed wet-lab protocols with predicted assay signatures — so researchers go from ranked compounds to pipette-ready SOPs with confidence in what a positive result looks like."
        Icon={FlaskConical}
        stats={[
          { value: '5',    label: 'Assay modalities' },
          { value: 'SOP',  label: 'Per-compound protocol' },
          { value: 'ELN',  label: 'Direct paste-in' },
          { value: 'LLM',  label: 'Reasoning engine' },
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
            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Validate — ALO-0042 · HSP90-N · SOP generation</span>
            <div style={{ marginLeft: 'auto', padding: '2px 10px', background: '#28c840', borderRadius: 4, color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>● COMPLETE</div>
          </div>
          <div style={{ display: 'flex', height: 310 }}>
            <div style={{ width: 260, background: '#0f1117', padding: 14, fontFamily: 'monospace', fontSize: 9.5, color: '#ccc', overflowY: 'auto', flexShrink: 0, borderRight: '1px solid #333' }}>
              {SOP_LINES.map((line, i) => (
                <div key={i} style={{
                  color: line.startsWith('#') ? '#cc6262' : line.startsWith('·') ? '#e8a8a8' : line.startsWith('Expected') ? '#febc2e' : '#ccc',
                  fontWeight: line.startsWith('#') ? 700 : 400,
                  marginBottom: line === '' ? 8 : 3,
                  lineHeight: 1.4,
                }}>{line || '\u00A0'}</div>
              ))}
            </div>
            <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Predicted HDX-MS Readout (ALO-0042 bound)</div>
                <PredictedReadout />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb', marginTop: 2 }}>
                  <span>t = 0s</span><span>t = 3000s</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>Recommended Assays</div>
                {ASSAYS.map(a => (
                  <div key={a.name} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 7, marginBottom: 5,
                    background: a.recommended ? 'rgba(204,98,98,0.07)' : 'transparent',
                    border: a.recommended ? '1px solid rgba(204,98,98,0.2)' : '1px solid #ece4e4',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.recommended ? '#cc6262' : '#ddd', flexShrink: 0 }} />
                    <span style={{ fontWeight: a.recommended ? 600 : 400, color: '#333', fontFamily: 'Inter, sans-serif', fontSize: 10.5 }}>{a.name}</span>
                    <span style={{ fontSize: 9, color: '#999', fontFamily: 'Inter, sans-serif' }}>{a.timeline}</span>
                    <div style={{ marginLeft: 'auto', width: 36, height: 3, background: '#e8e0e0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${a.confidence}%`, background: '#cc6262', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#d97272', padding: '4px 14px', display: 'flex', gap: 20, color: '#fff', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            <span>LLM reasoning</span><span>HDX-MS recommended</span><span>SOP ready</span><span style={{ marginLeft: 'auto' }}>Export to Benchling / PDF</span>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '48px 36px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <div className="page-eyebrow">How It Works</div>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Validate receives the Signal pathway map and Rank output for a given compound, identifies which residues in the allosteric path are most experimentally accessible, and selects the assay that gives the highest signal-to-noise for that specific mechanism. The LLM then populates the full SOP — concentrations, timepoints, controls — and generates quantitative predictions for each readout so the wet-lab team has a clear falsifiable hypothesis before starting.
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
        <div className="page-eyebrow">Supported Assays</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead><tr><th>Assay</th><th>Signal type</th><th>Predicted readout</th><th>Timeline</th></tr></thead>
          <tbody>
            {[
              ['HDX-MS',          'Backbone amide exchange',  'Δ deuterium uptake map',  '2–3 days'],
              ['NMR (15N-HSQC)',  'Sidechain perturbation',  'Δ chemical shift (ppm)',  '1 day'],
              ['SPR',             'Binding kinetics',         'kon, koff, KD',           '3 hrs'],
              ['ITC',             'Binding thermodynamics',   'ΔH, Ka, stoichiometry',   '2 hrs'],
              ['Thermal Shift',   'Protein stability',        'ΔTm (°C)',                '1 hr'],
            ].map(([a, s, r, t]) => (
              <tr key={a}><td><strong>{a}</strong></td><td>{s}</td><td><code>{r}</code></td><td>{t}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="section-divider" />
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row" style={{ marginTop: 12 }}>
          {['LLM (fine-tuned)', 'HDX-MS', 'NMR', 'SPR', 'ITC', 'Thermal Shift', 'Benchling export', 'PDF / Markdown'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
