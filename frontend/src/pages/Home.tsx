import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dna, ScanSearch, Layers, Radio, ListOrdered, FlaskConical, ArrowDown, type LucideIcon } from 'lucide-react'
import { LogoMark, LogoWordmark } from '../components/Logo'

interface ToolDef {
  id: string
  step: number
  Icon: LucideIcon
  name: string
  badge: string
  tagline: string
  stat: string
  statLabel: string
  input: string
  output: string
  accentBg: string
  accentBorder: string
}

const TOOLS: ToolDef[] = [
  {
    id: 'scout', step: 1, Icon: Dna, name: 'Allos Scout', badge: 'MD',
    tagline: 'AI-steered metadynamics generates a full conformational landscape in hours not weeks.',
    stat: '12 μs/day', statLabel: 'on 1× GPU',
    input: 'PDB file', output: 'Trajectory + manifest',
    accentBg: '#fdf0f0', accentBorder: '#f0d0d0',
  },
  {
    id: 'reveal', step: 2, Icon: ScanSearch, name: 'Allos Reveal', badge: 'GVP-GNN',
    tagline: 'GVP-GNN scans every frame simultaneously and scores each pocket with a five-component Dscore.',
    stat: '<4 min', statLabel: 'detection latency',
    input: 'Scout trajectory', output: 'PocketAtlas',
    accentBg: '#fdf4f0', accentBorder: '#f0d8cc',
  },
  {
    id: 'dock', step: 3, Icon: Layers, name: 'Allos Dock', badge: '2M/hr',
    tagline: 'Full ensemble docking 2 million poses per hour scored with a hybrid physics + GNN function.',
    stat: '10M+', statLabel: 'compound capacity',
    input: 'PocketAtlas + library', output: 'Scored pose library',
    accentBg: '#faf0fd', accentBorder: '#e0ccf0',
  },
  {
    id: 'signal', step: 4, Icon: Radio, name: 'Allos Signal', badge: 'Graph',
    tagline: 'Graph transformer predicts whether binding propagates a signal to the functional site.',
    stat: '8 min', statLabel: 'vs. days of MD',
    input: 'Pocket + docked hits', output: 'Pathway map',
    accentBg: '#f0f4fd', accentBorder: '#ccd8f0',
  },
  {
    id: 'rank', step: 5, Icon: ListOrdered, name: 'Allos Rank', badge: 'LLM',
    tagline: 'Pareto-optimal ranking across five objectives with LLM-written rationale for each compound.',
    stat: 'Pareto', statLabel: '5-objective frontier',
    input: 'Signal + Dock scores', output: 'Ranked shortlist',
    accentBg: '#f0fdf4', accentBorder: '#ccf0d8',
  },
  {
    id: 'validate', step: 6, Icon: FlaskConical, name: 'Allos Validate', badge: 'SOP',
    tagline: 'ML-designed wet-lab SOPs with predicted assay signatures before touching the bench.',
    stat: '5', statLabel: 'assay modalities',
    input: 'Ranked hits', output: 'Compound-specific SOP',
    accentBg: '#fdfaf0', accentBorder: '#f0e8cc',
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
    const SPACING = 22, RADIUS = 1.5, MAX_DIST = 80, MAX_PUSH = 18
    let dots: { ox: number; oy: number }[] = []

    function build() {
      const W = canvas!.offsetWidth, H = canvas!.offsetHeight
      canvas!.width = W; canvas!.height = H; dots = []
      for (let x = SPACING / 2; x < W; x += SPACING)
        for (let y = SPACING / 2; y < H; y += SPACING)
          dots.push({ ox: x, oy: y })
    }

    function draw() {
      const W = canvas!.width, H = canvas!.height
      ctx.clearRect(0, 0, W, H)
      const mx = mouse.current.x, my = mouse.current.y
      for (const d of dots) {
        const dx = d.ox - mx, dy = d.oy - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        let px = d.ox, py = d.oy
        if (dist < MAX_DIST && dist > 0) {
          const force = (1 - dist / MAX_DIST) * MAX_PUSH
          px += (dx / dist) * force; py += (dy / dist) * force
        }
        const alpha = dist < MAX_DIST ? 0.08 + (1 - dist / MAX_DIST) * 0.22 : 0.08
        ctx.beginPath(); ctx.arc(px, py, RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(204,98,98,${alpha.toFixed(3)})`; ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => build())
    ro.observe(canvas); build(); draw()
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const parent = canvas.parentElement!
    parent.addEventListener('mousemove', onMouseMove)
    parent.addEventListener('mouseleave', () => { mouse.current = { x: -9999, y: -9999 } })
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); parent.removeEventListener('mousemove', onMouseMove) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 0 }} />
}

const REVEAL_POCKETS = [
  { id: 'P001', dscore: 0.91, classification: 'cryptic_hydrophobic', vol: 312, open: 38, allosteric: true },
  { id: 'P002', dscore: 0.62, classification: 'cryptic_polar', vol: 188, open: 19, allosteric: true },
  { id: 'P003', dscore: 0.34, classification: 'surface_groove', vol: 94, open: 8, allosteric: false },
]
const CLASS_COLOR: Record<string, string> = { cryptic_hydrophobic: '#cc6262', cryptic_polar: '#d97272', surface_groove: '#888' }
const CLASS_SHORT: Record<string, string> = { cryptic_hydrophobic: 'Crypt·Hydrophobic', cryptic_polar: 'Crypt·Polar', surface_groove: 'Surface Groove' }

function ToolPreview({ tool }: { tool: ToolDef }) {
  if (tool.id === 'scout') {
    const ENERGY = [-121, -118, -123, -119, -125, -128, -131, -127, -133, -136, -134, -138, -141, -139, -143, -140, -145, -142, -147, -144]
    const min = Math.min(...ENERGY), max = Math.max(...ENERGY)
    const w = 200, h = 44
    const pts = ENERGY.map((v, i) => `${(i / (ENERGY.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ')
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif' }}>Potential energy · frame 0–500</div>
          <svg width={w} height={h}>
            <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(204,98,98,0.12)" stroke="none" />
            <polyline points={pts} fill="none" stroke="#cc6262" strokeWidth={1.5} strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['A100', '92%'], ['REST2', '4×'], ['MD', '12 μs']].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(204,98,98,0.15)', borderRadius: 4, padding: '2px 6px' }}>
                <span style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif' }}>{k} </span>
                <span style={{ fontSize: 11, color: '#cc6262', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 90, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>Per-residue RMSF</div>
          {[['His24', 3.2], ['Asp88', 2.8], ['Lys91', 1.4], ['Gly55', 0.9]].map(([res, v]) => (
            <div key={res as string} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', width: 38 }}>{res}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${((v as number) / 3.5) * 100}%`, background: '#cc6262', borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#28c840', fontFamily: 'monospace', marginTop: 3 }}>● RUNNING</div>
        </div>
      </div>
    )
  }

  if (tool.id === 'reveal') {
    const SCORES = [0.12,0.18,0.15,0.22,0.19,0.31,0.28,0.45,0.62,0.79,0.88,0.91,0.85,0.73,0.68,0.72,0.80,0.87,0.92,0.89]
    const w = 170, h = 36
    const pts = SCORES.map((v, i) => `${(i / (SCORES.length - 1)) * w},${h - v * h}`).join(' ')
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif' }}>Dscore · P001</div>
          <svg width={w} height={h}>
            <line x1={0} y1={h * 0.35} x2={w} y2={h * 0.35} stroke="#e8a8a855" strokeWidth={1} strokeDasharray="3,3" />
            <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(204,98,98,0.12)" stroke="none" />
            <polyline points={pts} fill="none" stroke="#cc6262" strokeWidth={1.5} strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['GVP-GNN','#cc6262'],['LigSite','#e8a8a8'],['DBSCAN','#888']].map(([l,c]) => (
              <span key={l} style={{ fontSize: 11, color: c as string, fontFamily: 'monospace' }}>● {l}</span>
            ))}
          </div>
        </div>
        <div style={{ width: 128, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {REVEAL_POCKETS.map(p => (
            <div key={p.id} style={{ background: p.allosteric ? 'rgba(204,98,98,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.allosteric ? 'rgba(204,98,98,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 5, padding: '4px 6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#eee', fontFamily: 'Inter, sans-serif' }}>{p.id}</span>
                <span style={{ fontSize: 11, color: CLASS_COLOR[p.classification], fontWeight: 600, fontFamily: 'monospace' }}>{p.dscore.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>{CLASS_SHORT[p.classification]}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${p.dscore * 100}%`, background: CLASS_COLOR[p.classification], borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#28c840', fontFamily: 'monospace', marginTop: 2 }}>● COMPLETE · 2.1 min</div>
        </div>
      </div>
    )
  }

  if (tool.id === 'dock') {
    const hits = [['ALO-0042', -9.4, 0.91], ['ALO-0118', -8.7, 0.84], ['ALO-0055', -8.1, 0.79]]
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif' }}>Top hits · P001 ensemble</span>
          <span style={{ fontSize: 11, color: '#febc2e', fontFamily: 'monospace' }}>● 1.3M / 2M poses</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {hits.map(([id, vina, gnn]) => (
            <div key={id as string} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '4px 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#eee', fontFamily: 'Inter, sans-serif', width: 70 }}>{id}</span>
              <span style={{ fontSize: 11, color: '#cc6262', fontFamily: 'monospace', width: 44 }}>{vina} kcal</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${(gnn as number) * 100}%`, background: 'linear-gradient(90deg,#e8a8a8,#cc6262)', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: '#d97272', fontFamily: 'monospace' }}>{gnn}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['poses/hr','2M'],['compounds','10M+'],['confs','412']].map(([k,v]) => (
            <div key={k} style={{ flex: 1, background: 'rgba(204,98,98,0.08)', border: '1px solid rgba(204,98,98,0.15)', borderRadius: 4, padding: '3px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#cc6262', fontWeight: 700, fontFamily: 'monospace' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#666', fontFamily: 'Inter, sans-serif' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tool.id === 'signal') {
    const nodes = [
      { id: 'His24', x: 40, y: 30, score: 0.91, active: true },
      { id: 'Asp88', x: 110, y: 20, score: 0.78 },
      { id: 'Lys91', x: 170, y: 45, score: 0.62 },
      { id: 'Glu101', x: 220, y: 25, score: 0.54 },
      { id: 'Arg145', x: 270, y: 50, score: 0.41 },
      { id: 'Ser201', x: 310, y: 30, score: 0.88, functional: true },
    ]
    const edges = [[0,1,0.9],[1,2,0.7],[2,3,0.6],[3,4,0.5],[4,5,0.8]]
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117' }}>
        <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>Allosteric pathway · P001 → active site</div>
        <svg width="100%" height={80} style={{ display: 'block', overflow: 'visible' }}>
          {edges.map(([a, b, w], i) => (
            <line key={i}
              x1={nodes[a as number].x} y1={nodes[a as number].y}
              x2={nodes[b as number].x} y2={nodes[b as number].y}
              stroke={`rgba(204,98,98,${w})`} strokeWidth={(w as number) * 3}
            />
          ))}
          {nodes.map(n => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.active || n.functional ? 8 : 6}
                fill={n.active ? '#cc6262' : n.functional ? '#28c840' : `rgba(204,98,98,${n.score * 0.6})`}
                stroke={n.active ? '#ff8888' : n.functional ? '#50e870' : 'rgba(204,98,98,0.3)'} strokeWidth={1.5} />
              <text x={n.x} y={n.y + 16} textAnchor="middle" fontSize={9} fill="#666" fontFamily="monospace">{n.id}</text>
            </g>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#cc6262', fontFamily: 'monospace' }}>● binding site</span>
          <span style={{ fontSize: 11, color: '#28c840', fontFamily: 'monospace' }}>● active site</span>
          <span style={{ fontSize: 11, color: '#28c840', fontFamily: 'monospace', marginLeft: 'auto' }}>signal: 0.88</span>
        </div>
      </div>
    )
  }

  if (tool.id === 'rank') {
    const compounds = [
      { id: 'ALO-0042', rank: 1, dscore: 0.91, signal: 0.88, admet: 'Pass', rationale: 'Cryptic hydrophobic pocket with high open fraction and strong allosteric signal.' },
      { id: 'ALO-0118', rank: 2, dscore: 0.84, signal: 0.76, admet: 'Pass', rationale: 'Polar pocket with moderate signal good ADMET profile.' },
    ]
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117' }}>
        <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>Pareto frontier · 5-objective ranking</div>
        {compounds.map(c => (
          <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(204,98,98,0.15)', borderRadius: 6, padding: '6px 8px', marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#eee', fontFamily: 'Inter, sans-serif' }}>#{c.rank} {c.id}</span>
              <span style={{ fontSize: 11, color: '#28c840', background: 'rgba(40,200,64,0.1)', padding: '1px 6px', borderRadius: 4, fontFamily: 'Inter, sans-serif' }}>{c.admet}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              {[['Dscore', c.dscore], ['Signal', c.signal]].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#666', fontFamily: 'Inter, sans-serif' }}>{k}: </span>
                  <span style={{ fontSize: 11, color: '#cc6262', fontWeight: 700, fontFamily: 'monospace' }}>{(v as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#777', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>{c.rationale}</div>
          </div>
        ))}
      </div>
    )
  }

  if (tool.id === 'validate') {
    return (
      <div style={{ padding: '10px 12px', background: '#0f1117', display: 'flex', gap: 10 }}>
        <div style={{ width: 160, fontFamily: 'monospace', fontSize: 11, color: '#ccc', lineHeight: 1.5 }}>
          {['# SOP-ALO-0042-HDX-MS', 'Target: HSP90-N', 'Pocket: P001', '', '## Protocol', '1. Pre-incubate 15 min', '2. Add compound 50 μM', '3. Initiate HDX in D₂O', '4. Quench: 0/30/300 s', '', '● Expected ΔD: 15–25%'].map((l, i) => (
            <div key={i} style={{ color: l.startsWith('#') ? '#cc6262' : l.startsWith('●') ? '#febc2e' : '#ccc', fontWeight: l.startsWith('#') ? 700 : 400, marginBottom: l === '' ? 4 : 1 }}>{l || '\u00A0'}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif' }}>Recommended assays</div>
          {[['HDX-MS', 0.94, true], ['NMR (HSQC)', 0.88, true], ['ITC', 0.72, false], ['TSA', 0.65, false]].map(([name, conf, rec]) => (
            <div key={name as string} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 4, background: rec ? 'rgba(204,98,98,0.08)' : 'transparent', border: `1px solid ${rec ? 'rgba(204,98,98,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: rec ? '#cc6262' : '#555', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: rec ? '#eee' : '#666', fontFamily: 'Inter, sans-serif', flex: 1 }}>{name}</span>
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${(conf as number) * 100}%`, background: '#cc6262', borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#28c840', fontFamily: 'monospace', marginTop: 2 }}>● SOP ready · export</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '14px 16px', background: '#0f1117' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {[1, 2, 3].map(j => (
          <div key={j} style={{ flex: j === 1 ? 2 : 1, height: 38, borderRadius: 6, background: j === 1 ? 'rgba(204,98,98,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(204,98,98,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {j === 1 && <span style={{ fontSize: 12, fontWeight: 700, color: '#d97272', fontFamily: 'monospace' }}>{tool.stat}</span>}
          </div>
        ))}
      </div>
      <div style={{ height: 52, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: '#d97272', fontFamily: 'monospace' }}>● {tool.badge} running…</span>
      </div>
    </div>
  )
}

function ToolCard({ tool, index }: { tool: ToolDef; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16,
        border: '1.5px solid var(--light-pink)',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '20px 22px 0',
        background: tool.accentBg,
        borderBottom: `1px solid ${tool.accentBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: `1px solid ${tool.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <tool.Icon size={15} strokeWidth={1.8} color="var(--coral)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>{tool.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Step {tool.step} of 6</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: '#fff', color: 'var(--deep-coral)', border: `1px solid ${tool.accentBorder}` }}>{tool.badge}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--deep-coral)', letterSpacing: '-0.5px', lineHeight: 1 }}>{tool.stat}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.statLabel}</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
          {tool.tagline}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#fff', border: `1px solid ${tool.accentBorder}`, borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ color: '#aaa' }}>in</span>
            <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{tool.input}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--deep-coral)', border: 'none', borderRadius: 6, fontSize: 11, color: '#fff' }}>
            <span style={{ opacity: 0.75 }}>out</span>
            <span style={{ fontWeight: 600 }}>{tool.output}</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #fdf6f6 0%, #f3eaea 100%)', padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <DotField />
        <motion.div
          drag dragMomentum={false} dragElastic={0}
          dragConstraints={{ top: -40, left: -60, right: 60, bottom: 40 }}
          style={{ width: '92%', background: '#fff', borderRadius: 10, border: '1px solid var(--light-pink)', boxShadow: '0 10px 32px rgba(180,80,80,0.12)', overflow: 'hidden', cursor: 'grab', userSelect: 'none', zIndex: 1, position: 'relative' }}
          whileDrag={{ cursor: 'grabbing', boxShadow: '0 18px 48px rgba(180,80,80,0.2)' }}
        >
          <div style={{ height: 28, background: 'linear-gradient(180deg, #1c1c1f 0%, #141417 100%)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, cursor: 'grab' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <tool.Icon size={9} strokeWidth={2} color="#d97272" />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#ccc', fontFamily: 'Inter, sans-serif' }}>{tool.name}</span>
            </div>
            <div style={{ width: 28 }} />
          </div>
          <ToolPreview tool={tool} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  return (
    <div style={{ background: 'var(--surface)' }}>

      <section style={{ padding: '72px 80px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--light-pink)', position: 'relative', overflow: 'hidden' }}>
        <DotField />
        <div style={{ position: 'absolute', width: 600, height: 600, top: -260, right: -180, background: 'rgba(240,200,200,0.22)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, position: 'relative' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <LogoMark size={28} color="rgba(204,98,98,0.75)" />
          <LogoWordmark dark />
        </motion.div>

        <motion.h1 style={{ fontSize: 46, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 18, maxWidth: 600, position: 'relative' }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          Cryptic allosteric site discovery,{' '}
          <span style={{ color: 'var(--deep-coral)' }}>end to end</span>
        </motion.h1>

        <motion.p style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.75, maxWidth: 500, marginBottom: 36, position: 'relative' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          GPU-accelerated MD, AI pocket detection, ensemble docking, allosteric signal prediction, and automated experimental design on one workstation, in hours.
        </motion.p>

        <motion.div style={{ display: 'flex', gap: 10, position: 'relative' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <button className="btn-primary">Read the Science</button>
          <button className="btn-secondary">View Pipeline</button>
        </motion.div>
      </section>

      <section style={{ padding: '64px 80px 80px' }}>
        {[[0, 1], [2, 3], [4, 5]].map((pair, rowIdx) => (
          <div key={rowIdx}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {pair.map(i => <ToolCard key={TOOLS[i].id} tool={TOOLS[i]} index={i} />)}
            </div>

            {rowIdx < 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}
              >
                <div style={{ flex: 1, height: 1, background: 'var(--light-pink)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <ArrowDown size={14} color="var(--coral)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--deep-coral)', background: 'var(--blush)', border: '1px solid var(--light-pink)', padding: '3px 12px', borderRadius: 20 }}>
                    {rowIdx === 0 ? 'Trajectory + manifest' : rowIdx === 1 ? 'PocketAtlas + scored poses' : ''}
                  </span>
                  <ArrowDown size={14} color="var(--coral)" />
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--light-pink)' }} />
              </motion.div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
