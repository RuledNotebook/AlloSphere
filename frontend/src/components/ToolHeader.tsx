import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { LogoMark } from './Logo'

interface Stat { value: string; label: string }

interface Props {
  eyebrow: string
  title: string
  subtitle: string
  Icon: LucideIcon
  stats: Stat[]
}

export default function ToolHeader({ eyebrow, title, subtitle, Icon, stats }: Props) {
  return (
    <motion.div
      style={{ textAlign: 'center', padding: '40px 40px 32px' }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <LogoMark size={28} color="rgba(204,98,98,0.7)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--coral)', letterSpacing: '0.2px' }}>
          AlloSphere
        </span>
      </div>

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--blush)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <Icon size={20} strokeWidth={1.6} color="var(--coral)" />
      </div>

      <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 600, marginBottom: 8 }}>
        {eyebrow}
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.6px', marginBottom: 12 }}>
        {title}
      </h1>

      <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 28px' }}>
        {subtitle}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid var(--blush)', borderBottom: '1px solid var(--blush)', background: '#fff', margin: '0 -36px' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{
            flex: 1, padding: '18px 8px', textAlign: 'center',
            borderRight: i < stats.length - 1 ? '1px solid var(--blush)' : 'none',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--deep-coral)', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
