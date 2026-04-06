import { PageWrapper, Reveal } from '../components/PageWrapper'
import { motion } from 'framer-motion'
import { BrainCircuit, SlidersHorizontal, FileText, BarChart3 } from 'lucide-react'

const features = [
  { Icon: BrainCircuit,      title: 'LLM Scientific Rationale',    body: 'Generates a per-compound narrative citing relevant literature — not a template. Grounds each recommendation in known allosteric drugs and mechanism-of-action precedent.' },
  { Icon: SlidersHorizontal, title: 'Multi-Objective Pareto Ranking', body: 'Balances docking ΔG, allosteric signal score, ADMET flags, selectivity, and synthetic accessibility via Pareto frontier — no arbitrary weighting.' },
  { Icon: FileText,          title: 'Plain-Language Lab Reports',   body: 'Output is a ranked hit list + PDF report in plain language — paste directly into a lab notebook without a computational chemistry PhD.' },
  { Icon: BarChart3,         title: 'Integrated Scoring',          body: 'Aggregates upstream scores from Dock, Signal, and ADMET tools into a single normalized rank per compound.' },
]

const sampleHits = [
  { rank: 1, id: 'ALO-0042', dg: '-9.4', signal: 0.91, admet: 'Pass', synthetic: 'Easy' },
  { rank: 2, id: 'ALO-0017', dg: '-8.8', signal: 0.87, admet: 'Pass', synthetic: 'Medium' },
  { rank: 3, id: 'ALO-0103', dg: '-8.6', signal: 0.84, admet: 'Flag', synthetic: 'Easy' },
  { rank: 4, id: 'ALO-0055', dg: '-8.1', signal: 0.79, admet: 'Pass', synthetic: 'Hard' },
]

export default function Rank() {
  return (
    <PageWrapper>
      <Reveal>
        <div className="page-eyebrow">Hit Prioritization</div>
        <h1 className="page-title">Allos Rank</h1>
        <p className="page-desc">
          Integrates all upstream scores — docking ΔG, allosteric pathway strength, predicted selectivity, ADMET flags, and synthetic accessibility — into a Pareto-ranked hit list with an LLM-written scientific rationale per compound.
        </p>
      </Reveal>

      <Reveal>
        <div className="stat-row">
          {[
            { value: '≤2 min',    label: 'Ranking latency for 10k hits' },
            { value: 'Pareto',    label: 'Multi-objective optimization' },
            { value: 'PDF + CSV', label: 'Output formats' },
            { value: 'LLM',       label: 'Rationale generation' },
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
        <div className="page-eyebrow">Sample Ranked Hit List</div>
        <table className="data-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Compound</th>
              <th>ΔG (kcal/mol)</th>
              <th>Signal Score</th>
              <th>ADMET</th>
              <th>Synthetic Access.</th>
            </tr>
          </thead>
          <tbody>
            {sampleHits.map((h) => (
              <tr key={h.id}>
                <td><strong style={{ color: 'var(--deep-coral)' }}>#{h.rank}</strong></td>
                <td><code>{h.id}</code></td>
                <td>{h.dg}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ minWidth: 30 }}>{h.signal}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--blush)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--salmon), var(--deep-coral))', borderRadius: 2 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${h.signal * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: h.admet === 'Pass' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.12)',
                    color: h.admet === 'Pass' ? '#059669' : '#d97706',
                  }}>
                    {h.admet}
                  </span>
                </td>
                <td>{h.synthetic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <div className="section-divider" />

      <Reveal>
        <div className="page-eyebrow">Scoring Inputs</div>
        <div className="chip-row">
          {['Docking ΔG', 'ADMET SwissADME', 'ADMETlab 2.0', 'Allosteric Score', 'Selectivity', 'Synthetic Score', 'Pareto Rank', 'Benchmarking API'].map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </Reveal>
    </PageWrapper>
  )
}
