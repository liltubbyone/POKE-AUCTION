'use client'

import { useEffect, useRef, useState } from 'react'

interface WheelSegment {
  label: string
  tier: string
  quantity: number
}

interface SpinWheelProps {
  segments: WheelSegment[]
  spinning: boolean
  onSpinComplete?: () => void
  winnerLabel?: string | null
  theme?: string
  customPalette?: string
}

type TierPalette = Record<string, { bg: string; alt: string; text: string }>

const THEMES: Record<string, { rim: string; outer: string; pointer: string; tiers: TierPalette }> = {
  cosmic: {
    rim: '#8B5CF6',
    outer: '#03030F',
    pointer: '#FFD700',
    tiers: {
      S: { bg: '#C88A0A', alt: '#7A5205', text: '#FFFFFF' },
      A: { bg: '#1A4D72', alt: '#0F3050', text: '#FFFFFF' },
      B: { bg: '#0E3B55', alt: '#092839', text: '#FFFFFF' },
      C: { bg: '#0C2D46', alt: '#081E30', text: '#FFFFFF' },
      EXCLUDE: { bg: '#1A1A3A', alt: '#101028', text: '#666688' },
    },
  },
  galaxy: {
    rim: '#A855F7',
    outer: '#02020E',
    pointer: '#FFD700',
    tiers: {
      S: { bg: '#7C3AED', alt: '#4C1D95', text: '#FFFFFF' },
      A: { bg: '#1E3A8A', alt: '#122060', text: '#FFFFFF' },
      B: { bg: '#1D4ED8', alt: '#1034A8', text: '#FFFFFF' },
      C: { bg: '#0C2780', alt: '#081860', text: '#FFFFFF' },
      EXCLUDE: { bg: '#1E1B4B', alt: '#141233', text: '#8877AA' },
    },
  },
  solar: {
    rim: '#F97316',
    outer: '#0A0300',
    pointer: '#FFD700',
    tiers: {
      S: { bg: '#DC2626', alt: '#7F1D1D', text: '#FFFFFF' },
      A: { bg: '#C2410C', alt: '#7C2D12', text: '#FFFFFF' },
      B: { bg: '#B45309', alt: '#6B2E0B', text: '#FFFFFF' },
      C: { bg: '#92400E', alt: '#4D2106', text: '#FFFFFF' },
      EXCLUDE: { bg: '#2C1810', alt: '#1A0F08', text: '#AA8855' },
    },
  },
  nebula: {
    rim: '#22D3EE',
    outer: '#02080A',
    pointer: '#FFD700',
    tiers: {
      S: { bg: '#BE185D', alt: '#6D1040', text: '#FFFFFF' },
      A: { bg: '#0F766E', alt: '#084040', text: '#FFFFFF' },
      B: { bg: '#1D4ED8', alt: '#0F2880', text: '#FFFFFF' },
      C: { bg: '#0C4A6E', alt: '#06253A', text: '#FFFFFF' },
      EXCLUDE: { bg: '#0A1A22', alt: '#050E14', text: '#6688BB' },
    },
  },
}

function hexDarken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const to = (v: number) => Math.max(0, Math.round(v * factor)).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}

function getTheme(theme?: string, customPalette?: string) {
  if (theme === 'custom' && customPalette) {
    try {
      const p = JSON.parse(customPalette)
      if (p.rim && p.tiers) return p
    } catch {}
  }
  return THEMES[theme ?? 'cosmic'] ?? THEMES.cosmic
}

function getPalette(tier: string, tiers: TierPalette) {
  return tiers[tier] || tiers.C
}

export default function SpinWheel({ segments, spinning, onSpinComplete, winnerLabel, theme, customPalette }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const [done, setDone] = useState(false)

  const expanded = segments.flatMap((seg) =>
    Array.from({ length: seg.quantity }, () => seg)
  )

  const draw = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas || expanded.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = getTheme(theme, customPalette)
    const rimRgb = hexToRgb(palette.rim)

    const dpr = window.devicePixelRatio || 1
    const cssSize = 420
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr
    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const size = cssSize
    const cx = size / 2
    const cy = size / 2
    const rimR = size / 2 - 12
    const radius = rimR - 4
    const n = expanded.length
    const arc = (2 * Math.PI) / n

    ctx.clearRect(0, 0, size, size)

    // ── 1. Deep space background ──
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, rimR)
    bgGrad.addColorStop(0, '#0d0921')
    bgGrad.addColorStop(0.5, '#07061a')
    bgGrad.addColorStop(1, palette.outer)
    ctx.beginPath()
    ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
    ctx.fillStyle = bgGrad
    ctx.fill()

    // ── 2. Segments ──
    for (let i = 0; i < n; i++) {
      const start = rotation + i * arc
      const end = start + arc
      const seg = expanded[i]
      const pal = getPalette(seg.tier, palette.tiers)
      const baseColor = i % 2 === 0 ? pal.bg : pal.alt

      // Radial gradient: dark center → vivid outer
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius)
      grad.addColorStop(0,    hexDarken(baseColor, 0.28))
      grad.addColorStop(0.40, hexDarken(baseColor, 0.55))
      grad.addColorStop(0.80, baseColor)
      grad.addColorStop(1,    baseColor)

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Subtle star texture (deterministic per segment)
      const starCount = Math.max(2, Math.min(5, Math.round(n < 15 ? 4 : n < 30 ? 3 : 2)))
      for (let s = 0; s < starCount; s++) {
        const af = ((i * 7 + s * 13) % 89) / 89
        const rf = 0.12 + ((i * 11 + s * 19) % 71) / 142
        const sa = start + af * arc
        const sr = radius * rf
        const starAlpha = 0.20 + (s % 3) * 0.10
        const starR = 0.7 + (s % 2) * 0.5
        ctx.beginPath()
        ctx.arc(cx + sr * Math.cos(sa), cy + sr * Math.sin(sa), starR, 0, 2 * Math.PI)
        ctx.fillStyle = `rgba(255,255,255,${starAlpha})`
        ctx.fill()
      }

      // S-tier: gold glow arc at outer edge
      if (seg.tier === 'S') {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, radius - 3, start + 0.03, end - 0.03)
        ctx.strokeStyle = 'rgba(255,200,0,0.65)'
        ctx.lineWidth = 5
        ctx.shadowColor = 'rgba(255,200,0,1)'
        ctx.shadowBlur = 20
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.restore()
      }

      // Divider line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start))
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      const fs = Math.max(8, Math.min(13, 300 / n))
      ctx.font = `700 ${fs}px "Inter", Arial, sans-serif`
      ctx.fillStyle = '#FFFFFF'
      ctx.shadowColor = 'rgba(0,0,0,0.95)'
      ctx.shadowBlur = 6
      const label = seg.label.length > 13 ? seg.label.slice(0, 12) + '\u2026' : seg.label
      ctx.fillText(label, radius - 20, fs / 3)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // ── 3. Evenly-spaced glow dots around wheel edge ──
    const dotCount = 60
    for (let d = 0; d < dotCount; d++) {
      const angle = (d / dotCount) * 2 * Math.PI
      const dx = cx + (rimR - 6) * Math.cos(angle)
      const dy = cy + (rimR - 6) * Math.sin(angle)
      const isBright = d % 5 === 0
      ctx.beginPath()
      ctx.arc(dx, dy, isBright ? 3 : 1.8, 0, 2 * Math.PI)
      ctx.fillStyle = isBright ? `rgba(${rimRgb},1)` : `rgba(${rimRgb},0.55)`
      ctx.shadowColor = palette.rim
      ctx.shadowBlur = isBright ? 10 : 4
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // ── 4. Neon rim — wide halo + crisp bright line ──
    const rimLayers = [
      { r: rimR + 8, lw: 36, alpha: 0.03 },
      { r: rimR,     lw: 28, alpha: 0.05 },
      { r: rimR,     lw: 18, alpha: 0.09 },
      { r: rimR,     lw: 10, alpha: 0.17 },
      { r: rimR,     lw: 5,  alpha: 0.32 },
    ]
    for (const { r, lw, alpha } of rimLayers) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.strokeStyle = `rgba(${rimRgb},${alpha})`
      ctx.lineWidth = lw
      ctx.stroke()
    }
    // Bright rim line
    ctx.beginPath()
    ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
    ctx.strokeStyle = palette.rim
    ctx.lineWidth = 2.5
    ctx.shadowColor = palette.rim
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.shadowBlur = 0

    // ── 5. Pokéball center ──
    const cr = 36
    // Drop shadow
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0,0,0,0.7)'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0
    // Red top half
    ctx.beginPath()
    ctx.arc(cx, cy, cr, Math.PI, 2 * Math.PI)
    ctx.fillStyle = '#CC0000'
    ctx.fill()
    // Black band
    ctx.fillStyle = '#111111'
    ctx.fillRect(cx - cr, cy - 4.5, cr * 2, 9)
    // Outer border
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 3.5
    ctx.stroke()
    // Center button
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2.5
    ctx.stroke()
    // Glossy highlight on pokeball
    const gloss = ctx.createRadialGradient(cx + cr * 0.22, cy - cr * 0.48, 0, cx, cy, cr * 1.05)
    gloss.addColorStop(0,   'rgba(255,255,255,0.42)')
    gloss.addColorStop(0.4, 'rgba(255,255,255,0.08)')
    gloss.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.fillStyle = gloss
    ctx.fill()
    // Shine dot
    ctx.beginPath()
    ctx.arc(cx + 4, cy - 10, 4.5, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fill()

    // ── 6. Gold pointer triangle (top center) ──
    ctx.save()
    // Outer glow pass
    ctx.beginPath()
    ctx.moveTo(cx - 20, 0)
    ctx.lineTo(cx + 20, 0)
    ctx.lineTo(cx, 40)
    ctx.closePath()
    ctx.fillStyle = palette.pointer
    ctx.shadowColor = palette.pointer
    ctx.shadowBlur = 22
    ctx.fill()
    ctx.shadowBlur = 0
    // Inner lighter triangle for depth
    ctx.beginPath()
    ctx.moveTo(cx - 10, 4)
    ctx.lineTo(cx + 10, 4)
    ctx.lineTo(cx, 24)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.fill()
    // Crisp outline
    ctx.beginPath()
    ctx.moveTo(cx - 20, 0)
    ctx.lineTo(cx + 20, 0)
    ctx.lineTo(cx, 40)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
  }

  useEffect(() => {
    draw(rotationRef.current)
  }, [segments, theme, customPalette]) // eslint-disable-line

  useEffect(() => {
    if (!spinning) return
    setDone(false)

    const n = expanded.length
    const arc = (2 * Math.PI) / n
    const startRot = rotationRef.current

    let totalRot: number
    if (winnerLabel && n > 0) {
      const matchingIndices = expanded
        .map((seg, i) => (seg.label === winnerLabel ? i : -1))
        .filter((i) => i >= 0)
      const targetIndex =
        matchingIndices.length > 0
          ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
          : Math.floor(Math.random() * n)

      const pointerAngle = -Math.PI / 2
      const targetFinalRot = pointerAngle - targetIndex * arc - arc / 2
      const delta = ((targetFinalRot - startRot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      totalRot = delta + Math.PI * 2 * 10
    } else {
      totalRot = Math.PI * 2 * 10 + Math.random() * Math.PI * 2
    }

    const duration = 4500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 5)
      rotationRef.current = startRot + totalRot * eased
      draw(rotationRef.current)
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDone(true)
        onSpinComplete?.()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [spinning]) // eslint-disable-line

  if (expanded.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-square bg-card border border-border rounded-full">
        <div className="text-6xl mb-3">🏆</div>
        <p className="text-gray-400 text-sm font-semibold">All prizes assigned!</p>
      </div>
    )
  }

  const palette = getTheme(theme, customPalette)

  return (
    <div className="flex flex-col items-center">
      <div style={{
        filter: spinning
          ? `drop-shadow(0 0 40px ${palette.rim}) drop-shadow(0 0 18px ${palette.rim})`
          : `drop-shadow(0 0 14px ${palette.rim}66)`,
        transition: 'filter 0.4s ease',
      }}>
        <canvas
          ref={canvasRef}
          className="rounded-full"
          style={{ width: '420px', height: '420px', maxWidth: '100%' }}
        />
      </div>

      {spinning && (
        <div className="mt-5 text-center" style={{ animation: 'pulse 1.4s ease-in-out infinite' }}>
          <p className="font-heading text-2xl tracking-widest"
            style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)' }}>
            SPINNING!
          </p>
          <p className="text-gray-400 text-sm mt-1">The Pokéball decides your fate…</p>
        </div>
      )}

      {done && winnerLabel && !spinning && (
        <div
          className="mt-5 text-center px-6 py-4 rounded-2xl w-full max-w-xs"
          style={{
            background: 'rgba(8,4,24,0.80)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,215,0,0.35)',
            boxShadow: '0 0 32px rgba(255,215,0,0.12), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p className="font-heading text-lg tracking-widest" style={{ color: '#FFD700' }}>YOU GOT:</p>
          <p className="text-white font-bold text-base mt-1">{winnerLabel}</p>
        </div>
      )}
    </div>
  )
}
