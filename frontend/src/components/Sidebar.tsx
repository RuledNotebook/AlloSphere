import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Dna,
  ScanSearch,
  Layers,
  Radio,
  ListOrdered,
  FlaskConical,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { LogoMark, LogoWordmark } from './Logo'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  path: string
  Icon: LucideIcon
  label: string
  badge?: string
}

const navItems: NavItem[] = [
  { path: '/', Icon: LayoutDashboard, label: 'Overview' },
]

const tools: NavItem[] = [
  { path: '/scout',    Icon: Dna,          label: 'Scout',    badge: 'MD' },
  { path: '/reveal',   Icon: ScanSearch,   label: 'Reveal',   badge: 'GNN' },
  { path: '/dock',     Icon: Layers,       label: 'Dock',     badge: '2M/hr' },
  { path: '/signal',   Icon: Radio,        label: 'Signal',   badge: 'Graph' },
  { path: '/rank',     Icon: ListOrdered,  label: 'Rank',     badge: 'LLM' },
  { path: '/validate', Icon: FlaskConical, label: 'Validate', badge: 'SOP' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-logo-row">
          <LogoMark size={34} color="rgba(255,255,255,0.88)" />
          <LogoWordmark />
        </div>
        <div className="sidebar-logo-sub">Allosteric Discovery Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Platform</div>
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
        ))}

        <AnimatePresence>
          {user ? (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="nav-section-label">Sub-Tools</div>
              {tools.map((item) => (
                <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                margin: '16px 12px 8px',
                padding: '14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={12} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Sub-Tools
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, margin: 0 }}>
                Sign in to access Scout, Reveal, Dock, Signal, Rank, and Validate.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="sidebar-footer">
        AlloSphere v0.1 &middot; GPU-native
      </div>
    </motion.aside>
  )
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const { Icon, label, badge } = item
  return (
    <motion.div
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.14 }}
    >
      <span className="nav-icon">
        <Icon size={15} strokeWidth={1.8} />
      </span>
      {label}
      {badge && <span className="nav-badge">{badge}</span>}
    </motion.div>
  )
}
