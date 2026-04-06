import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Dna,
  ScanSearch,
  Layers,
  Radio,
  ListOrdered,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react'
import { LogoMark, LogoWordmark } from './Logo'

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

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-logo-row">
          <LogoMark size={34} color="rgba(255,255,255,0.88)" />
          <LogoWordmark />
        </div>
        <div className="sidebar-logo-sub">Allosteric Discovery Platform</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Platform</div>
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
        ))}

        <div className="nav-section-label">Sub-Tools</div>
        {tools.map((item) => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
        ))}
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
