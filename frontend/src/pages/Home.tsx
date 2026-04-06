import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Dna, ScanSearch, Layers, Radio, ListOrdered, FlaskConical, ArrowRight, type LucideIcon } from 'lucide-react'
import { LogoMark, LogoWordmarkLarge } from '../components/Logo'

interface Tool {
  path: string
  Icon: LucideIcon
  name: string
  desc: string
}

const tools: Tool[] = [
  { path: '/scout',    Icon: Dna,          name: 'Scout',    desc: 'AI-steered metadynamics MD at 12 μs/day on a single GPU workstation' },
  { path: '/reveal',   Icon: ScanSearch,   name: 'Reveal',   desc: 'E(3)-equivariant GNN flags pocket-forming events across thousands of frames' },
  { path: '/dock',     Icon: Layers,       name: 'Dock',     desc: 'Full ensemble docking — 2M poses/hr across every conformation simultaneously' },
  { path: '/signal',   Icon: Radio,        name: 'Signal',   desc: 'Graph transformer predicts allosteric communication in 8 min vs. days of perturbation MD' },
  { path: '/rank',     Icon: ListOrdered,  name: 'Rank',     desc: 'Multi-objective Pareto ranking with LLM-written scientific rationale per compound' },
  { path: '/validate', Icon: FlaskConical, name: 'Validate', desc: 'ML-designed experimental protocols with predicted assay readouts and controls' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const container: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const item: any = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-hero">
      {/* Background blobs */}
      <div className="home-bg-blob" style={{ width: 500, height: 500, top: -180, right: -160, background: 'rgba(240,200,200,0.35)' }} />
      <div className="home-bg-blob" style={{ width: 300, height: 300, bottom: -100, left: -80, background: 'rgba(217,114,114,0.12)' }} />

      {/* Logo + wordmark */}
      <motion.div
        className="home-logo-wrap"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <LogoMark size={64} color="rgba(204,98,98,0.75)" />
        <LogoWordmarkLarge />
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="home-tagline"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        The first GPU-accelerated, AI-native platform for{' '}
        <strong>cryptic allosteric site discovery</strong> and ligand binding prediction —
        compressing weeks of expert compute into hours on a single workstation.
      </motion.p>

      {/* CTA */}
      <motion.div
        className="home-cta-row"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="btn-primary" onClick={() => navigate('/scout')}>
          Explore the Pipeline <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
        </button>
        <button className="btn-secondary">Read the Science</button>
      </motion.div>

      {/* Tools grid */}
      <motion.div className="home-tools-grid" variants={container} initial="hidden" animate="visible">
        {tools.map((t) => (
          <motion.div
            key={t.path}
            className="home-tool-card"
            variants={item}
            onClick={() => navigate(t.path)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="home-tool-icon">
              <t.Icon size={20} strokeWidth={1.6} color="var(--coral)" />
            </div>
            <div className="home-tool-name">{t.name}</div>
            <div className="home-tool-desc">{t.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
