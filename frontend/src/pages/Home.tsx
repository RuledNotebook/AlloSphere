import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dna, ScanSearch, Layers, Radio, ListOrdered, FlaskConical, type LucideIcon } from 'lucide-react'
import { LogoMark, LogoWordmark } from '../components/Logo'

interface ToolDef {
  id: string
  Icon: LucideIcon
  name: string
  badge: string
  tagline: string
  stat: string
  statLabel: string
  description: string
}

const TOOLS: ToolDef[] = [
  {
    id: 'scout', Icon: Dna, name: 'Allos Scout', badge: 'MD',
    tagline: 'AI-steered metadynamics that generates a full conformational landscape of any target protein in hours — not weeks.',
    stat: '12 μs/day', statLabel: 'on 1× GPU',
    description: 'Coming soon — upload a PDB and Scout will generate your conformational ensemble automatically.',
  },
  {
    id: 'reveal', Icon: ScanSearch, name: 'Allos Reveal', badge: 'GNN',
    tagline: 'E(3)-equivariant graph neural network that scans thousands of trajectory frames and flags every pocket-forming event.',
    stat: '<4 min', statLabel: 'detection latency',
    description: 'Coming soon — Reveal will ingest Scout trajectories and return a ranked list of cryptic pockets.',
  },
  {
    id: 'dock', Icon: Layers, name: 'Allos Dock', badge: '2M/hr',
    tagline: 'Full ensemble docking against every conformation at once — 2 million poses per hour with a hybrid physics + GNN score.',
    stat: '10M+', statLabel: 'compound capacity',
    description: 'Coming soon — screen your compound library against the full pocket ensemble in a single run.',
  },
  {
    id: 'signal', Icon: Radio, name: 'Allos Signal', badge: 'Graph',
    tagline: 'Graph transformer that predicts whether binding at a cryptic site actually propagates a signal to the functional site.',
    stat: '8 min', statLabel: 'vs. days of perturbation MD',
    description: 'Coming soon — Signal will map the allosteric communication pathway for every docked hit.',
  },
  {
    id: 'rank', Icon: ListOrdered, name: 'Allos Rank', badge: 'LLM',
    tagline: 'Pareto-optimal ranking across five objectives with an LLM-written scientific rationale for each top compound.',
    stat: 'Pareto', statLabel: '5-objective frontier',
    description: 'Coming soon — Rank consolidates all upstream scores into a prioritized shortlist with written rationale.',
  },
  {
    id: 'validate', Icon: FlaskConical, name: 'Allos Validate', badge: 'SOP',
    tagline: 'ML-designed wet-lab protocols with predicted assay signatures — so researchers know what a positive result looks like.',
    stat: '5', statLabel: 'assay modalities',
    description: 'Coming soon — Validate will generate compound-specific SOPs and predicted readouts for every top hit.',
  },
]

function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const SPACING = 22
    const RADIUS = 1.5
    const MAX_DIST = 80
    const MAX_PUSH = 18

    let dots: { ox: number; oy: number }[] = []

    function build() {
      const W = canvas!.offsetWidth
      const H = canvas!.offsetHeight
      canvas!.width = W
      canvas!.height = H
      dots = []
      for (let x = SPACING / 2; x < W; x += SPACING) {
        for (let y = SPACING / 2; y < H; y += SPACING) {
          dots.push({ ox: x, oy: y })
        }
      }
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      ctx.clearRect(0, 0, W, H)
      const mx = mouse.current.x
      const my = mouse.current.y
      for (const d of dots) {
        const dx = d.ox - mx
        const dy = d.oy - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        let px = d.ox
        let py = d.oy
        if (dist < MAX_DIST && dist > 0) {
          const force = (1 - dist / MAX_DIST) * MAX_PUSH
          px += (dx / dist) * force
          py += (dy / dist) * force
        }
        const alpha = dist < MAX_DIST ? 0.08 + (1 - dist / MAX_DIST) * 0.22 : 0.08
        ctx.beginPath()
        ctx.arc(px, py, RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(204,98,98,${alpha.toFixed(3)})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => { build(); })
    ro.observe(canvas)
    build()
    draw()

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const parent = canvas.parentElement!
    parent.addEventListener('mousemove', onMouseMove)
    parent.addEventListener('mouseleave', () => { mouse.current = { x: -9999, y: -9999 } })

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      parent.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

function InnerWindow({ tool }: { tool: ToolDef }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ top: -60, left: -80, right: 80, bottom: 60 }}
      style={{
        width: '85%',
        background: '#fff',
        borderRadius: 11,
        border: '1px solid var(--light-pink)',
        boxShadow: '0 12px 40px rgba(180,80,80,0.13), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: 1,
        position: 'relative',
      }}
      whileDrag={{ cursor: 'grabbing', boxShadow: '0 20px 56px rgba(180,80,80,0.22)' }}
    >
      <div style={{
        height: 30,
        background: 'linear-gradient(180deg, #1c1c1f 0%, #141417 100%)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
        cursor: 'grab',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <tool.Icon size={10} strokeWidth={2} color="#d97272" />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#ccc', fontFamily: 'Inter, sans-serif' }}>{tool.name}</span>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: '14px 16px', background: '#0f1117' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {[1, 2, 3].map(j => (
            <div key={j} style={{
              flex: j === 1 ? 2 : 1, height: 38, borderRadius: 6,
              background: j === 1 ? 'rgba(204,98,98,0.15)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(204,98,98,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {j === 1 && <span style={{ fontSize: 12, fontWeight: 700, color: '#d97272', fontFamily: 'monospace' }}>{tool.stat}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 3, height: 52, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#d97272', fontFamily: 'monospace' }}>● {tool.badge} running…</span>
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
            {[85, 60, 40].map((w, k) => (
              <div key={k} style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w}%`, background: 'rgba(204,98,98,0.5)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const pairs = [TOOLS.slice(0, 2), TOOLS.slice(2, 4), TOOLS.slice(4, 6)]

  return (
    <div style={{ background: 'var(--surface)' }}>

      <section style={{
        padding: '72px 80px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderBottom: '1px solid var(--light-pink)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <DotField />
        <div style={{ position: 'absolute', width: 600, height: 600, top: -260, right: -180, background: 'rgba(240,200,200,0.22)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <LogoMark size={28} color="rgba(204,98,98,0.75)" />
          <LogoWordmark dark />
        </motion.div>

        <motion.h1
          style={{ fontSize: 46, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 18, maxWidth: 600 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          Cryptic allosteric site discovery,{' '}
          <span style={{ color: 'var(--deep-coral)' }}>end to end</span>
        </motion.h1>

        <motion.p
          style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.75, maxWidth: 500, marginBottom: 36 }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          GPU-accelerated MD, AI pocket detection, ensemble docking, allosteric signal prediction, and automated experimental design — on one workstation, in hours.
        </motion.p>

        <motion.div
          style={{ display: 'flex', gap: 10 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="btn-primary">Read the Science</button>
          <button className="btn-secondary">View Pipeline</button>
        </motion.div>
      </section>

      <section style={{ padding: '56px 80px 80px' }}>
        {pairs.map((pair, rowIdx) => (
          <div key={rowIdx} style={{ marginBottom: 56 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
              {pair.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    borderRadius: 14,
                    border: '1.5px solid var(--light-pink)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <div style={{
                    height: 38,
                    background: 'linear-gradient(180deg, #fdf0f0 0%, #f9e8e8 100%)',
                    borderBottom: '1px solid var(--light-pink)',
                    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      <tool.Icon size={12} strokeWidth={2} color="var(--coral)" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', letterSpacing: '-0.1px' }}>{tool.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: 'var(--blush)', color: 'var(--deep-coral)', border: '1px solid var(--light-pink)' }}>{tool.badge}</span>
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #fdf6f6 0%, #f3eaea 100%)',
                    padding: '28px 24px',
                    minHeight: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <DotField />
                    <InnerWindow tool={tool} />
                  </div>

                  <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--light-pink)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff',
                  }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: '75%' }}>{tool.tagline}</div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--deep-coral)', lineHeight: 1 }}>{tool.stat}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{tool.statLabel}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ padding: '16px 4px', borderTop: '1px dashed var(--light-pink)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                {pair[0].description}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
