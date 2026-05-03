'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'

const DEFAULT_SEGMENTS = ['pokeball', '🚀', '⭐', '🌙', '☄️', '🌌', '🪐', '💫']

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
  galaxy:  { a: '20,184,166',  b: '59,130,246',  pointer: '#2dd4bf', center: '#042f2e' },
  solar:   { a: '249,115,22',  b: '234,179,8',   pointer: '#fb923c', center: '#431407' },
  nebula:  { a: '236,72,153',  b: '139,92,246',  pointer: '#f472b6', center: '#2d1b4e' },
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
    return { a, b: '200,200,220', pointer: customColor, center: '#07050f' }
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
) {
  const dpr = window.devicePixelRatio || 1
  const cssSize = 320
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cx = cssSize / 2
  const cy = cssSize / 2
  const rimR = cssSize / 2 - 10
  const radius = rimR - 2
  const n = 8
  const arc = (2 * Math.PI) / n

  ctx.clearRect(0, 0, cssSize, cssSize)

  // ── Deep space background ──
  const bgGrad = ctx.createRadialGradient(cx, cy * 0.65, 0, cx, cy, rimR)
  bgGrad.addColorStop(0, '#090920')
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

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius)
    grad.addColorStop(0,    `rgba(${rgb},0.05)`)
    grad.addColorStop(0.45, `rgba(${rgb},0.15)`)
    grad.addColorStop(1,    `rgba(${rgb},0.44)`)

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Divider line
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start))
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    ctx.stroke()

    // White dot near outer rim
    const midAngle = start + arc / 2
    const dotDist = radius - 12
    ctx.beginPath()
    ctx.arc(cx + dotDist * Math.cos(midAngle), cy + dotDist * Math.sin(midAngle), 3, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.shadowColor = 'rgba(255,255,255,0.4)'
    ctx.shadowBlur = 5
    ctx.fill()
    ctx.shadowBlur = 0

    // Icon (emoji or pokeball image)
    const iconDist = radius * 0.67
    const ix = cx + iconDist * Math.cos(midAngle)
    const iy = cy + iconDist * Math.sin(midAngle)
    const iconR = 19

    ctx.save()
    // Icon backing circle
    ctx.beginPath()
    ctx.arc(ix, iy, iconR, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(5,4,14,0.6)'
    ctx.shadowColor = `rgba(${rgb},0.5)`
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0

    if (segments[i] === 'pokeball' && pokeballImg) {
      ctx.beginPath()
      ctx.arc(ix, iy, iconR - 1, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(pokeballImg, ix - iconR, iy - iconR, iconR * 2, iconR * 2)
    } else {
      ctx.font = `${Math.round(iconR * 1.25)}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(segments[i] || '⭐', ix, iy + 1)
    }
    ctx.restore()
  }

  // ── Neon rim glow (4 layered passes) ──
  for (const { lw, alpha } of [
    { lw: 22, alpha: 0.04 },
    { lw: 14, alpha: 0.09 },
    { lw: 8,  alpha: 0.18 },
    { lw: 4,  alpha: 0.32 },
  ]) {
    ctx.beginPath()
    ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
    ctx.strokeStyle = `rgba(${t.a},${alpha})`
    ctx.lineWidth = lw
    ctx.stroke()
  }
  // Bright rim line
  ctx.beginPath()
  ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
  ctx.strokeStyle = `rgba(${t.a},0.9)`
  ctx.lineWidth = 2.5
  ctx.shadowColor = `rgba(${t.a},0.8)`
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.shadowBlur = 0

  // ── Pokeball center ──
  const cr = 28
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(cx, cy, cr, Math.PI, 2 * Math.PI)
  ctx.fillStyle = '#CC0000'
  ctx.fill()
  ctx.fillStyle = '#111111'
  ctx.fillRect(cx - cr, cy - 3, cr * 2, 6)
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, Math.round(cr * 0.32), 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx + 3, cy - 7, 3, 0, 2 * Math.PI)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()

  // ── Gold pointer triangle ──
  ctx.beginPath()
  ctx.moveTo(cx - 13, 3)
  ctx.lineTo(cx + 13, 3)
  ctx.lineTo(cx, 26)
  ctx.closePath()
  ctx.fillStyle = t.pointer
  ctx.shadowColor = t.pointer
  ctx.shadowBlur = 12
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = 1.2
  ctx.stroke()
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

  // Preload the pokeball logo image
  useEffect(() => {
    const img = new Image()
    img.src = '/logo.png'
    img.onload = () => {
      pokeballImgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const currentT = getMysteryTheme('cosmic', '#7C3AED')
      drawMysteryWheel(canvas, ctx, wheelRef.current, DEFAULT_SEGMENTS, currentT, img)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session?.user) { setLoading(false); return }
    fetch('/api/daily-spin')
      .then((r) => r.json())
      .then((d) => { setSpinStatus(d); setLoading(false) })
  }, [session, authStatus])

  // Redraw wheel when status (segments / theme) changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const currentT = getMysteryTheme(spinStatus?.mysteryWheelTheme ?? 'cosmic', spinStatus?.customMysteryColor ?? '#7C3AED')
    let segs: string[]
    try { const s = JSON.parse(spinStatus?.wheelSegments ?? '[]'); segs = s.length === 8 ? s : DEFAULT_SEGMENTS } catch { segs = DEFAULT_SEGMENTS }
    drawMysteryWheel(canvas, ctx, wheelRef.current, segs, currentT, pokeballImgRef.current)
  }, [spinStatus])

  // Live countdown
  useEffect(() => {
    setResetTimer(timeUntilReset())
    const id = setInterval(() => setResetTimer(timeUntilReset()), 30000)
    return () => clearInterval(id)
  }, [])

  // Spin animation — canvas-based
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
      if (ctx) drawMysteryWheel(canvas, ctx, wheelRef.current, segs, currentT, pokeballImgRef.current)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-400 text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  const alreadySpun = spinStatus?.hasSpunToday && !spinning && result === null
  const t = getMysteryTheme(spinStatus?.mysteryWheelTheme ?? 'cosmic', spinStatus?.customMysteryColor ?? '#7C3AED')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Space photo bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
        }}
      />
      {/* Radial glow behind wheel */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: spinning
            ? `radial-gradient(circle, rgba(${t.a},0.25) 0%, transparent 65%)`
            : `radial-gradient(circle, rgba(${t.a},0.10) 0%, transparent 65%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Header */}
      <div className="relative text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Free Daily</p>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          COSMIC <span className="cosmic-gradient-text">SPIN</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto text-sm">
          One free spin per day. One lucky spin wins the mystery gift. Resets at midnight Central.
        </p>
      </div>

      {/* Stats */}
      {spinStatus && (
        <div className="relative flex items-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-heading text-white">
              {Math.max(0, (spinStatus.spinsLimit ?? 1) - (spinStatus.spinsUsed ?? 0))}
            </p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Spins Left</p>
          </div>
          <div className="h-10 w-px" style={{ background: `rgba(${t.a},0.4)` }} />
          <div className="text-center">
            <p className="text-3xl font-heading text-violet-400">{resetTimer}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Until Reset</p>
          </div>
        </div>
      )}

      {/* ── Wheel (canvas) ── */}
      <div
        className="relative mb-10"
        style={{
          filter: spinning
            ? `drop-shadow(0 0 32px rgba(${t.a},0.8)) drop-shadow(0 0 14px rgba(${t.a},0.5))`
            : `drop-shadow(0 0 10px rgba(${t.a},0.3))`,
          transition: 'filter 0.5s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '320px', height: '320px', maxWidth: '90vw', display: 'block', borderRadius: '50%' }}
        />
      </div>

      {/* Action area */}
      {!session?.user ? (
        <div className="relative text-center space-y-4">
          <p className="text-gray-400">Sign in to get your free daily spin.</p>
          <button onClick={() => signIn()} className="btn-gold px-8 py-3">Sign In to Spin</button>
        </div>
      ) : result ? (
        <div
          className="relative rounded-2xl p-7 text-center max-w-sm w-full"
          style={{
            background: result.won ? 'rgba(124,58,237,0.08)' : 'rgba(10,10,24,0.85)',
            border: `1px solid ${result.won ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.2)'}`,
            boxShadow: result.won ? '0 0 40px rgba(124,58,237,0.2)' : 'none',
          }}
        >
          {result.won ? (
            <>
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))' }}>🌟</div>
              <p className="font-heading text-3xl mb-2 gold-gradient-text">YOU WON!</p>
              <p className="text-gray-300 text-sm mb-5">A cosmic event just occurred — you were today&apos;s lucky spin!</p>
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
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
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))' }}>🪐</div>
              <p className="font-heading text-2xl text-white mb-2">NOT THIS TIME</p>
              <p className="text-gray-400 text-sm mb-5">The cosmos wasn&apos;t aligned today. Come back tomorrow!</p>
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <p className="text-gray-500 text-xs">Resets in <span className="text-violet-300 font-semibold">{resetTimer}</span></p>
              </div>
            </>
          )}
        </div>
      ) : alreadySpun ? (
        <div
          className="relative rounded-2xl p-7 text-center max-w-sm w-full"
          style={{ background: 'rgba(10,10,24,0.85)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          {spinStatus?.won ? (
            <>
              <div className="text-6xl mb-3" style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))' }}>🌟</div>
              <p className="font-heading text-2xl gold-gradient-text mb-2">YOU WON TODAY!</p>
              {spinStatus?.mysteryGiftImage && (
                <img src={spinStatus.mysteryGiftImage} alt="Mystery Gift" className="w-24 h-24 object-contain mx-auto mb-3 rounded-lg" referrerPolicy="no-referrer" />
              )}
              <p className="text-gold font-semibold">{spinStatus?.mysteryGiftName}</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))' }}>🪐</div>
              <p className="font-heading text-xl text-white mb-2">ALREADY SPUN TODAY</p>
              <p className="text-gray-400 text-sm mb-3">Come back tomorrow — the cosmos resets at midnight Central.</p>
              <p className="text-gray-500 text-xs">Resets in <span className="text-violet-300 font-semibold">{resetTimer}</span></p>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="relative btn-gold text-lg px-12 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: spinning ? '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(124,58,237,0.3)' : undefined }}
        >
          {spinning ? '✨ SPINNING...' : '🪐 SPIN THE COSMOS'}
        </button>
      )}

      {spinStatus && !result && !alreadySpun && (
        <div className="relative mt-8 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Today&apos;s Mystery Gift</p>
          <p className="text-gray-500 text-sm">??? — Revealed to the winner only</p>
        </div>
      )}
    </div>
  )
}
