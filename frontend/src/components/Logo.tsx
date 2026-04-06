interface LogoProps {
  size?: number
  color?: string
}

/** Three overlapping circles — the AlloSphere mark */
export function LogoMark({ size = 36, color = 'rgba(255,255,255,0.9)' }: LogoProps) {
  // Use a fixed internal coordinate space of 100×100 for easy math,
  // then let the SVG viewBox scale it to `size`.
  const r = 28          // radius — circles fit within 100×100 with padding
  const cx = 50
  const cy = 52
  const spread = 18     // distance from center to each circle center
  const centers = [
    { x: cx,              y: cy - spread },               // top
    { x: cx - spread,     y: cy + spread * 0.58 },        // bottom-left
    { x: cx + spread,     y: cy + spread * 0.58 },        // bottom-right
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {centers.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={r}
          fill={color}
          fillOpacity={0.45}
        />
      ))}
    </svg>
  )
}

/** Full wordmark: light "A" + regular "lloSphere" */
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

/** Home-page large wordmark */
export function LogoWordmarkLarge() {
  return (
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 56, lineHeight: 1, letterSpacing: '-2px', userSelect: 'none' }}>
      <span style={{ fontWeight: 300, color: '#b0b0b0' }}>A</span>
      <span style={{ fontWeight: 600, color: '#1a0a0a' }}>lloSphere</span>
    </span>
  )
}
