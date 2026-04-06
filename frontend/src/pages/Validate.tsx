import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { ClipboardList, TestTube2, Telescope, BookOpen } from 'lucide-react'

const features = [
  { Icon: ClipboardList, title: 'SOP Protocol Generation', body: 'Generates compound-specific SOP documents: assay type, concentration ranges, time points, and controls — grounded in the specific site and allosteric mechanism predicted.' },
  { Icon: TestTube2,     title: 'Assay Recommendation',   body: 'Recommends the correct assay modality (HDX-MS, NMR, FRET, SPR, ITC, thermal shift) based on whether the allosteric pathway involves backbone or sidechain motion.' },
  { Icon: Telescope,     title: 'Predicted Readouts',     body: 'Generates expected assay signatures — predicted ΔTm, ΔHSP70 binding, or ΔNMR shift — so researchers know exactly what a positive result looks like before running the experiment.' },
  { Icon: BookOpen,      title: 'Wet-Lab Ready Output',   body: 'Output pastes directly into lab ELN systems. Non-binding and binding condition predictions are provided so researchers can distinguish true allosteric activity from artifacts.' },
]

const assays = [
  { assay: 'HDX-MS',         signal: 'Backbone amide exchange', readout: 'Δ deuterium uptake', timeline: '2–3 days' },
  { assay: 'NMR (15N-HSQC)', signal: 'Sidechain perturbation',  readout: 'Δ chemical shift',  timeline: '1 day' },
  { assay: 'FRET',           signal: 'Conformational change',    readout: 'Δ FRET efficiency', timeline: '4 hrs' },
  { assay: 'ITC',            signal: 'Binding thermodynamics',   readout: 'ΔH, Ka, ΔG',       timeline: '2 hrs' },
  { assay: 'Thermal Shift',  signal: 'Protein stability',        readout: 'ΔTm',               timeline: '1 hr' },
]

export default function Validate() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Experimental Validation</div>
        <h1 className="page-title">Allos Validate</h1>
        <p className="page-desc">
          Takes the ranked hit list and allosteric pathway predictions and designs compound-specific experimental validation protocols — with predicted assay readouts and controls — so researchers can go straight to wet lab without a computational chemistry detour.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: 'SOP',  label: 'Compound-specific protocol' },
            { value: '5',    label: 'Assay modalities supported' },
            { value: 'ELN',  label: 'Direct paste-in compatible' },
            { value: 'LLM',  label: 'Reasoning engine' },
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
        <div className="page-eyebrow">Supported Assay Modalities</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Assay</th><th>Signal Type</th><th>Predicted Readout</th><th>Typical Timeline</th></tr>
          </thead>
          <tbody>
            {assays.map((a) => (
              <tr key={a.assay}>
                <td><strong>{a.assay}</strong></td>
                <td>{a.signal}</td>
                <td><code>{a.readout}</code></td>
                <td>{a.timeline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Tech Stack</div>
        <div className="chip-row">
          {['LLM reasoning', 'HDX-MS', 'NMR', 'SPR', 'ITC', 'FRET', 'Thermal Shift', 'ELN export', 'PDF report'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>
    </PageWrapper>
  )
}
