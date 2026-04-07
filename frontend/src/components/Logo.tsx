import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  color?: string
}

export function LogoMark({ size = 36, color = 'rgba(255,255,255,0.9)' }: LogoProps) {
  const r = 28
  const cx = 50
  const cy = 52
  const spread = 18
  const centers = [
    { x: cx,          y: cy - spread },
    { x: cx - spread, y: cy + spread * 0.58 },
    { x: cx + spread, y: cy + spread * 0.58 },
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {centers.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={r} fill={color} fillOpacity={0.45} />
      ))}
    </svg>
  )
}

export function LogoWordmark({ dark = false }: { dark?: boolean }) {
  const light = dark ? '#aaa' : 'rgba(255,255,255,0.55)'
  const main  = dark ? '#1a0a0a' : '#ffffff'

  return (
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 21, lineHeight: 1, letterSpacing: '-0.3px', userSelect: 'none' }}>
      <span style={{ fontWeight: 300, color: light }}>A</span>
      <span style={{ fontWeight: 500, color: main }}>lloSphere</span>
    </span>
  )
}

const letters = ['l', 'l', 'o', 'S', 'p', 'h', 'e', 'r', 'e']

export function LogoWordmarkAnimated() {
  return (
    <span style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1, userSelect: 'none', display: 'inline-flex', alignItems: 'baseline' }}>
      <motion.span
        style={{ fontWeight: 300, color: '#c0c0c0', fontSize: 56, letterSpacing: '-2px', display: 'inline-block' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        A
      </motion.span>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          style={{ fontWeight: 600, color: '#1a0a0a', fontSize: 56, letterSpacing: '-2px', display: 'inline-block' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}
