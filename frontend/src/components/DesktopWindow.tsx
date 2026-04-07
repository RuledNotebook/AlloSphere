import { useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface Props {
  id: string
  title: string
  Icon: LucideIcon
  zIndex: number
  initialX: number
  initialY: number
  onClose: () => void
  onFocus: () => void
  children: ReactNode
}

export default function DesktopWindow({ title, Icon, zIndex, initialX, initialY, onClose, onFocus, children }: Props) {
  const constraintsRef = useRef(null)

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.94, x: initialX, y: initialY }}
      animate={{ opacity: 1, scale: 1, x: initialX, y: initialY }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        width: 720,
        height: 540,
        borderRadius: 12,
        background: '#fff',
        border: '1px solid var(--light-pink)',
        boxShadow: '0 24px 64px rgba(180,70,70,0.14), 0 4px 16px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex,
        cursor: 'default',
      }}
      onPointerDown={onFocus}
      ref={constraintsRef}
    >
      <div
        style={{
          height: 44,
          background: 'linear-gradient(180deg, var(--blush) 0%, #faeaea 100%)',
          borderBottom: '1px solid var(--light-pink)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          userSelect: 'none',
          cursor: 'grab',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <TrafficLight color="#ff5f57" onClick={(e) => { e.stopPropagation(); onClose() }} />
          <TrafficLight color="#febc2e" onClick={(e) => e.stopPropagation()} />
          <TrafficLight color="#28c840" onClick={(e) => e.stopPropagation()} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon size={13} strokeWidth={2} color="var(--coral)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', letterSpacing: '-0.1px' }}>
            {title}
          </span>
        </div>

        <div style={{ width: 54 }} />
      </div>

      <div
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </motion.div>
  )
}

function TrafficLight({ color, onClick }: { color: string; onClick: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onClick}
      style={{
        width: 12, height: 12,
        borderRadius: '50%',
        background: color,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    />
  )
}
