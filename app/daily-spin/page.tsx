'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'

const DEFAULT_SEGMENTS = ['pikachu', 'pikachu', 'pikachu', 'pikachu', 'pikachu', 'pikachu', 'pikachu', 'pikachu']

interface SpinStatus {
  hasSpunToday: boolean
  won: boolean
  spinNumber: number | null
  spinsUsed: number
  spinsLimit: number
  totalSpinsToday: number
  winnerSpinNumber: number
  mysteryGiftName: string
  mysteryGiftImage: string | null
  wheelSegments: string
  mysteryWheelTheme: string
  customMysteryColor: string
}

const MYSTERY_THEMES: Record<string, { a: string; b: string; pointer: string; center: string }> = {
  cosmic:  { a: '124,58,237',  b: '6,182,212',   pointer: '#FFD700', center: '#1e0a4e' },
  galaxy:  { a: '20,184,166',  b: '59,130,246',  pointer: '#FFD700', center: '#042f2e' },
  solar:   { a: '249,115,22',  b: '234,179,8',   pointer: '#FFD700', center: '#431407' },
  nebula:  { a: '236,72,153',  b: '139,92,246',  pointer: '#FFD700', center: '#2d1b4e' },
}

function hexToRgbStr(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function getMysteryTheme(theme: string, customColor: string) {
  if (theme === 'custom') {
    const a = hexToRgbStr(customColor || '#7C3AED')
    return { a, b: '200,200,220', pointer: '#FFD700', center: '#07050f' }
  }
  return MYSTERY_THEMES[theme] ?? MYSTERY_THEMES.cosmic
}

function timeUntilReset() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(now)
  const h = parseInt(parts.find((p) => p.type === 'hour')!.value)
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value)
  const s = parseInt(parts.find((p) => p.type === 'second')!.value)
  const secsLeft = 24 * 3600 - (h * 3600 + m * 60 + s)
  return `${Math.floor(secsLeft / 3600)}h ${Math.floor((secsLeft % 3600) / 60)}m`
}

function drawMysteryWheel(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  rotation: number,
  segments: string[],
  t: { a: string; b: string; pointer: string; center: string },
  pokeballImg: HTMLImageElement | null,
  pikachuImg: HTMLImageElement | null,
) {
  const dpr = window.devicePixelRatio || 1
  const cssSize = 360
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cx = cssSize / 2
  const cy = cssSize / 2
  const rimR = cssSize / 2 - 12
  const radius = rimR - 4
  const n = 8
  const arc = (2 * Math.PI) / n

  ctx.clearRect(0, 0, cssSize, cssSize)

  // ── Deep space background ──
  const bgGrad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, rimR)
  bgGrad.addColorStop(0, '#0d0921')
  bgGrad.addColorStop(0.5, '#07061a')
  bgGrad.addColorStop(1, '#020208')
  ctx.beginPath()
  ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
  ctx.fillStyle = bgGrad
  ctx.fill()

  // ── Segments with galaxy radial gradient ──
  for (let i = 0; i < n; i++) {
    const start = rotation + i * arc
    const end = start + arc
    const rgb = i % 2 === 0 ? t.a : t.b

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius)
    grad.addColorStop(0,    `rgba(${rgb},0.04)`)
    grad.addColorStop(0.40, `rgba(${rgb},0.14)`)
    grad.addColorStop(0.80, `rgba(${rgb},0.40)`)
    grad.addColorStop(1,    `rgba(${rgb},0.50)`)

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Subtle star texture (deterministic)
    for (let s = 0; s < 3; s++) {
      const af = ((i * 7 + s * 13) % 89) / 89
      const rf = 0.12 + ((i * 11 + s * 19) % 71) / 142
      const sa = start + af * arc
      const sr = radius * rf
      ctx.beginPath()
      ctx.arc(cx + sr * Math.cos(sa), cy + sr * Math.sin(sa), 0.7 + (s % 2) * 0.5, 0, 2 * Math.PI)
      ctx.fillStyle = `rgba(255,255,255,${0.18 + (s % 3) * 0.10})`
      ctx.fill()
    }

    // Divider line
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start))
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Icon (emoji or pokeball image)
    const iconDist = radius * 0.65
    const midAngle = start + arc / 2
    const ix = cx + iconDist * Math.cos(midAngle)
    const iy = cy + iconDist * Math.sin(midAngle)
    const iconR = 22

    ctx.save()
    // Icon backing circle with glow
    ctx.beginPath()
    ctx.arc(ix, iy, iconR, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(5,4,14,0.65)'
    ctx.shadowColor = `rgba(${rgb},0.6)`
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0

    if (segments[i] === 'pokeball' && pokeballImg) {
      ctx.beginPath()
      ctx.arc(ix, iy, iconR - 1, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(pokeballImg, ix - iconR, iy - iconR, iconR * 2, iconR * 2)
    } else if (segments[i] === 'pikachu' && pikachuImg) {
      ctx.beginPath()
      ctx.arc(ix, iy, iconR - 1, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(pikachuImg, ix - iconR, iy - iconR, iconR * 2, iconR * 2)
    } else {
      ctx.font = `${Math.round(iconR * 1.2)}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(segments[i] || '⭐', ix, iy + 1)
    }
    ctx.restore()
  }

  // ── Evenly-spaced glow dots around wheel edge (36 dots) ──
  const dotCount = 36
  for (let d = 0; d < dotCount; d++) {
    const angle = (d / dotCount) * 2 * Math.PI
    const dx = cx + (rimR - 6) * Math.cos(angle)
    const dy = cy + (rimR - 6) * Math.sin(angle)
    const isBright = d % 4 === 0
    ctx.beginPath()
    ctx.arc(dx, dy, isBright ? 3 : 1.8, 0, 2 * Math.PI)
    ctx.fillStyle = isBright ? `rgba(${t.a},1)` : `rgba(${t.a},0.50)`
    ctx.shadowColor = `rgba(${t.a},1)`
    ctx.shadowBlur = isBright ? 10 : 4
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // ── Neon rim glow ──
  for (const { r, lw, alpha } of [
    { r: rimR + 8, lw: 34, alpha: 0.03 },
    { r: rimR,     lw: 22, alpha: 0.06 },
    { r: rimR,     lw: 12, alpha: 0.14 },
    { r: rimR,     lw: 6,  alpha: 0.28 },
  ]) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.strokeStyle = `rgba(${t.a},${alpha})`
    ctx.lineWidth = lw
    ctx.stroke()
  }
  // Bright rim line
  ctx.beginPath()
  ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
  ctx.strokeStyle = `rgba(${t.a},0.92)`
  ctx.lineWidth = 2.5
  ctx.shadowColor = `rgba(${t.a},0.9)`
  ctx.shadowBlur = 20
  ctx.stroke()
  ctx.shadowBlur = 0

  // ── Pokéball center ──
  const cr = 30
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 10
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(cx, cy, cr, Math.PI, 2 * Math.PI)
  ctx.fillStyle = '#CC0000'
  ctx.fill()
  ctx.fillStyle = '#111111'
  ctx.fillRect(cx - cr, cy - 4, cr * 2, 8)
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, Math.round(cr * 0.33), 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 2
  ctx.stroke()
  // Glossy highlight
  const gloss = ctx.createRadialGradient(cx + cr * 0.22, cy - cr * 0.48, 0, cx, cy, cr * 1.05)
  gloss.addColorStop(0,   'rgba(255,255,255,0.42)')
  gloss.addColorStop(0.4, 'rgba(255,255,255,0.08)')
  gloss.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
  ctx.fillStyle = gloss
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 3.5, cy - 8, 3.5, 0, 2 * Math.PI)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()

  // ── Gold pointer triangle ──
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx - 18, 0)
  ctx.lineTo(cx + 18, 0)
  ctx.lineTo(cx, 38)
  ctx.closePath()
  ctx.fillStyle = t.pointer
  ctx.shadowColor = t.pointer
  ctx.shadowBlur = 22
  ctx.fill()
  ctx.shadowBlur = 0
  // Inner lighter triangle for depth
  ctx.beginPath()
  ctx.moveTo(cx - 10, 4)
  ctx.lineTo(cx + 10, 4)
  ctx.lineTo(cx, 22)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.fill()
  // Outline
  ctx.beginPath()
  ctx.moveTo(cx - 18, 0)
  ctx.lineTo(cx + 18, 0)
  ctx.lineTo(cx, 38)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(0,0,0,0.40)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

export default function DailySpinPage() {
  const { data: session, status: authStatus } = useSession()
  const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ won: boolean; spinNumber: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetTimer, setResetTimer] = useState('')
  const wheelRef = useRef<number>(0)
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pokeballImgRef = useRef<HTMLImageElement | null>(null)
  const pikachuImgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const pokeball = new Image()
    pokeball.src = '/logo.png'
    pokeball.onload = () => {
      pokeballImgRef.current = pokeball
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const currentT = getMysteryTheme('cosmic', '#7C3AED')
      drawMysteryWheel(canvas, ctx, wheelRef.current, DEFAULT_SEGMENTS, currentT, pokeball, pikachuImgRef.current)
    }

    const pikachu = new Image()
    pikachu.crossOrigin = 'anonymous'
    pikachu.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
    pikachu.onload = () => {
      pikachuImgRef.current = pikachu
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const currentT = getMysteryTheme('cosmic', '#7C3AED')
      drawMysteryWheel(canvas, ctx, wheelRef.current, DEFAULT_SEGMENTS, currentT, pokeballImgRef.current, pikachu)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session?.user) { setLoading(false); return }
    fetch('/api/daily-spin')
      .then((r) => r.json())
      .then((d) => { setSpinStatus(d); setLoading(false) })
  }, [session, authStatus])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const currentT = getMysteryTheme(spinStatus?.mysteryWheelTheme ?? 'cosmic', spinStatus?.customMysteryColor ?? '#7C3AED')
    let segs: string[]
    try { const s = JSON.parse(spinStatus?.wheelSegments ?? '[]'); segs = s.length === 8 ? s : DEFAULT_SEGMENTS } catch { segs = DEFAULT_SEGMENTS }
    drawMysteryWheel(canvas, ctx, wheelRef.current, segs, currentT, pokeballImgRef.current, pikachuImgRef.current)
  }, [spinStatus])

  useEffect(() => {
    setResetTimer(timeUntilReset())
    const id = setInterval(() => setResetTimer(timeUntilReset()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!spinning) return
    const currentT = getMysteryTheme(spinStatus?.mysteryWheelTheme ?? 'cosmic', spinStatus?.customMysteryColor ?? '#7C3AED')
    let segs: string[]
    try { const s = JSON.parse(spinStatus?.wheelSegments ?? '[]'); segs = s.length === 8 ? s : DEFAULT_SEGMENTS } catch { segs = DEFAULT_SEGMENTS }

    const canvas = canvasRef.current
    if (!canvas) return

    const start = performance.now()
    const duration = 3500
    const startAngle = wheelRef.current
    const segSize = (Math.PI * 2) / 8
    const rawTarget = startAngle + Math.PI * 2 * 9
    const snapped = Math.round((rawTarget - segSize / 2) / segSize) * segSize + segSize / 2

    const animate = (now: number) => {
      const elapsed = Math.min(now - start, duration)
      const eased = 1 - Math.pow(1 - elapsed / duration, 4)
      wheelRef.current = startAngle + (snapped - startAngle) * eased
      const ctx = canvas.getContext('2d')
      if (ctx) drawMysteryWheel(canvas, ctx, wheelRef.current, segs, currentT, pokeballImgRef.current, pikachuImgRef.current)
      if (elapsed < duration) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [spinning]) // eslint-disable-line

  const handleSpin = async () => {
    if (spinning || !session?.user) return
    setSpinning(true)
    setResult(null)
    const res = await fetch('/api/daily-spin', { method: 'POST' })
    const data = await res.json()
    setTimeout(() => {
      setSpinning(false)
      setResult({ won: data.won, spinNumber: data.spinNumber })
      setSpinStatus((prev) => prev ? { ...prev, hasSpunToday: true, won: data.won, spinNumber: data.spinNumber } : prev)
    }, 3600)
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020208' }}>
        <div className="text-violet-400 text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  const alreadySpun = spinStatus?.hasSpunToday && !spinning && result === null
  const t = getMysteryTheme(spinStatus?.mysteryWheelTheme ?? 'cosmic', spinStatus?.customMysteryColor ?? '#7C3AED')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#020208' }}>

      {/* ── Nebula clouds ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 90% 70% at 10% 15%, rgba(139,92,246,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 80% 60% at 90% 80%, rgba(236,72,153,0.14) 0%, transparent 55%),
          radial-gradient(ellipse 70% 80% at 80% 10%, rgba(6,182,212,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 20% 85%, rgba(79,70,229,0.12) 0%, transparent 55%)
        `,
      }} />

      {/* ── Star field overlay ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(1.5px 1.5px at 8% 18%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 15% 42%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 22% 7%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 30% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 30%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 45% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 55% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 62% 55%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 70% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 78% 70%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 85% 22%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 92% 48%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 5% 60%, rgba(255,255,255,0.35) 0%, transparent 100%),
          radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 68% 88%, rgba(255,255,255,0.55) 0%, transparent 100%),
          radial-gradient(1px 1px at 25% 95%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 88% 5%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 42% 15%, rgba(255,255,255,0.6) 0%, transparent 100%)
        `,
      }} />

      {/* ── Radial glow behind wheel ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: spinning
            ? `radial-gradient(circle, rgba(${t.a},0.28) 0%, rgba(${t.a},0.06) 45%, transparent 65%)`
            : `radial-gradient(circle, rgba(${t.a},0.12) 0%, transparent 55%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* ── Header ── */}
      <div className="relative text-center mb-8 z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FFD700', letterSpacing: '0.25em' }}>
          Free Daily
        </p>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          COSMIC <span className="cosmic-gradient-text">SPIN</span>
        </h1>
        <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
          One free spin per day. One lucky spin wins the mystery gift.<br />Resets at midnight Central.
        </p>
      </div>

      {/* ── Stats (glassmorphism) ── */}
      {spinStatus && (
        <div className="relative z-10 flex items-center gap-3 mb-8">
          <div
            className="text-center px-6 py-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: `0 0 20px rgba(${t.a},0.08)`,
            }}
          >
            <p className="text-3xl font-heading text-white">
              {Math.max(0, (spinStatus.spinsLimit ?? 1) - (spinStatus.spinsUsed ?? 0))}
            </p>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">Spins Left</p>
          </div>

          <div className="h-10 w-px" style={{ background: `rgba(${t.a},0.35)` }} />

          <div
            className="text-center px-6 py-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: `0 0 20px rgba(${t.a},0.08)`,
            }}
          >
            <p className="text-3xl font-heading" style={{ color: `rgba(${t.a},1)` }}>{resetTimer}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">Until Reset</p>
          </div>
        </div>
      )}

      {/* ── Wheel (canvas) ── */}
      <div
        className="relative z-10 mb-10"
        style={{
          filter: spinning
            ? `drop-shadow(0 0 40px rgba(${t.a},0.9)) drop-shadow(0 0 18px rgba(${t.a},0.6))`
            : `drop-shadow(0 0 14px rgba(${t.a},0.35))`,
          transition: 'filter 0.5s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '360px', height: '360px', maxWidth: '92vw', display: 'block', borderRadius: '50%' }}
        />
      </div>

      {/* ── Action area ── */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {!session?.user ? (
          <div className="text-center space-y-4">
            <p className="text-gray-400 text-sm">Sign in to get your free daily spin.</p>
            <button onClick={() => signIn()} className="btn-gold px-10 py-3 text-base">
              Sign In to Spin
            </button>
          </div>
        ) : result ? (
          <div
            className="rounded-2xl p-7 text-center w-full"
            style={{
              background: result.won ? 'rgba(124,58,237,0.08)' : 'rgba(8,5,20,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${result.won ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: result.won ? '0 0 50px rgba(124,58,237,0.25)' : '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {result.won ? (
              <>
                <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.9))' }}>🌟</div>
                <p className="font-heading text-3xl mb-2 gold-gradient-text">YOU WON!</p>
                <p className="text-gray-300 text-sm mb-5">A cosmic event just occurred — you were today&apos;s lucky spin!</p>
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.22)' }}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Mystery Gift</p>
                  {spinStatus?.mysteryGiftImage && (
                    <img src={spinStatus.mysteryGiftImage} alt="Mystery Gift" className="w-32 h-32 object-contain mx-auto mb-3 rounded-lg" referrerPolicy="no-referrer" />
                  )}
                  <p className="text-gold font-heading text-xl">{spinStatus?.mysteryGiftName}</p>
                </div>
                <p className="text-gray-500 text-xs">We&apos;ll reach out to ship your prize!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4" style={{ filter: `drop-shadow(0 0 10px rgba(${t.a},0.6))` }}>🪐</div>
                <p className="font-heading text-2xl text-white mb-2">NOT THIS TIME</p>
                <p className="text-gray-400 text-sm mb-5">The cosmos weren&apos;t aligned today. Come back tomorrow!</p>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: `rgba(${t.a},0.06)`, border: `1px solid rgba(${t.a},0.20)` }}
                >
                  <p className="text-gray-500 text-xs">Resets in <span className="font-semibold" style={{ color: `rgba(${t.a},1)` }}>{resetTimer}</span></p>
                </div>
              </>
            )}
          </div>
        ) : alreadySpun ? (
          <div
            className="rounded-2xl p-7 text-center w-full"
            style={{
              background: 'rgba(8,5,20,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid rgba(${t.a},0.22)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {spinStatus?.won ? (
              <>
                <div className="text-6xl mb-3" style={{ filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.9))' }}>🌟</div>
                <p className="font-heading text-2xl gold-gradient-text mb-2">YOU WON TODAY!</p>
                {spinStatus?.mysteryGiftImage && (
                  <img src={spinStatus.mysteryGiftImage} alt="Mystery Gift" className="w-24 h-24 object-contain mx-auto mb-3 rounded-lg" referrerPolicy="no-referrer" />
                )}
                <p className="text-gold font-semibold">{spinStatus?.mysteryGiftName}</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3" style={{ filter: `drop-shadow(0 0 10px rgba(${t.a},0.6))` }}>🪐</div>
                <p className="font-heading text-xl text-white mb-2">ALREADY SPUN TODAY</p>
                <p className="text-gray-400 text-sm mb-3">Come back tomorrow — the cosmos resets at midnight Central.</p>
                <p className="text-gray-500 text-xs">
                  Resets in <span className="font-semibold" style={{ color: `rgba(${t.a},1)` }}>{resetTimer}</span>
                </p>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full rounded-2xl py-5 font-heading text-xl tracking-widest disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
            style={{
              background: spinning
                ? `rgba(${t.a},0.15)`
                : `linear-gradient(135deg, rgba(${t.a},0.25) 0%, rgba(${t.a},0.10) 100%)`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid rgba(${t.a},0.45)`,
              color: '#FFD700',
              boxShadow: spinning
                ? `0 0 50px rgba(${t.a},0.4), 0 0 100px rgba(${t.a},0.15)`
                : `0 0 24px rgba(${t.a},0.20), 0 4px 16px rgba(0,0,0,0.4)`,
              textShadow: '0 0 16px rgba(255,215,0,0.8)',
            }}
          >
            {spinning ? '✨ SPINNING...' : '🪐 SPIN THE COSMOS'}
          </button>
        )}
      </div>

      {spinStatus && !result && !alreadySpun && (
        <div className="relative z-10 mt-8 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Today&apos;s Mystery Gift</p>
          <p className="text-gray-500 text-sm">??? — Revealed to the winner only</p>
        </div>
      )}
    </div>
  )
}
