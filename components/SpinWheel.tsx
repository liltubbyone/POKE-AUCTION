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

// Space/galaxy aesthetic — segments use radial gradients, rim glows neon
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
    pointer: '#A855F7',
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
    pointer: '#F97316',
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
    pointer: '#22D3EE',
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
    const cssSize = 400
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr
    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const size = cssSize
    const cx = size / 2
    const cy = size / 2
    const rimR = size / 2 - 10   // where the neon rim sits
    const radius = rimR - 3      // segment outer edge (just inside rim)
    const n = expanded.length
    const arc = (2 * Math.PI) / n

    ctx.clearRect(0, 0, size, size)

    // ── 1. Deep space background ──
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, rimR)
    bgGrad.addColorStop(0, '#0a0a20')
    bgGrad.addColorStop(1, palette.outer)
    ctx.beginPath()
    ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
    ctx.fillStyle = bgGrad
    ctx.fill()

    // ── 2. Segments with galaxy radial gradient ──
    for (let i = 0; i < n; i++) {
      const start = rotation + i * arc
      const end = start + arc
      const seg = expanded[i]
      const pal = getPalette(seg.tier, palette.tiers)
      const baseColor = i % 2 === 0 ? pal.bg : pal.alt

      // Radial gradient: very dark at center → vivid color at outer rim
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius)
      grad.addColorStop(0,    hexDarken(baseColor, 0.35))
      grad.addColorStop(0.45, hexDarken(baseColor, 0.60))
      grad.addColorStop(1,    baseColor)

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Divider line (soft white)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start))
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'
      ctx.lineWidth = 1
      ctx.stroke()

      // White dot near outer edge of each segment
      const midAngle = start + arc / 2
      const dotDist = radius - 13
      ctx.beginPath()
      ctx.arc(
        cx + dotDist * Math.cos(midAngle),
        cy + dotDist * Math.sin(midAngle),
        3.5, 0, 2 * Math.PI
      )
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.shadowColor = 'rgba(255,255,255,0.5)'
      ctx.shadowBlur = 5
      ctx.fill()
      ctx.shadowBlur = 0

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      const fs = Math.max(8, Math.min(13, 290 / n))
      ctx.font = `700 ${fs}px Arial, sans-serif`
      ctx.fillStyle = '#FFFFFF'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'
      ctx.shadowBlur = 5
      const label = seg.label.length > 13 ? seg.label.slice(0, 12) + '\u2026' : seg.label
      ctx.fillText(label, radius - 18, fs / 3)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // ── 3. Neon glowing rim (multiple glow passes) ──
    const glowLayers = [
      { lw: 24, alpha: 0.04 },
      { lw: 16, alpha: 0.08 },
      { lw: 10, alpha: 0.16 },
      { lw: 5,  alpha: 0.30 },
    ]
    for (const { lw, alpha } of glowLayers) {
      ctx.beginPath()
      ctx.arc(cx, cy, rimR, 0, 2 * Math.PI)
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
    ctx.shadowBlur = 16
    ctx.stroke()
    ctx.shadowBlur = 0

    // ── 4. Pokeball center ──
    const cr = 34
    // White base
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0
    // Red top half
    ctx.beginPath()
    ctx.arc(cx, cy, cr, Math.PI, 2 * Math.PI)
    ctx.fillStyle = '#CC0000'
    ctx.fill()
    // Black band
    ctx.fillStyle = '#111111'
    ctx.fillRect(cx - cr, cy - 4, cr * 2, 8)
    // Border
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 3
    ctx.stroke()
    // Center button
    ctx.beginPath()
    ctx.arc(cx, cy, 11, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2.5
    ctx.stroke()
    // Shine
    ctx.beginPath()
    ctx.arc(cx + 4, cy - 9, 4, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fill()

    // ── 5. Gold pointer triangle ──
    ctx.beginPath()
    ctx.moveTo(cx - 15, 4)
    ctx.lineTo(cx + 15, 4)
    ctx.lineTo(cx, 32)
    ctx.closePath()
    ctx.fillStyle = palette.pointer
    ctx.shadowColor = palette.pointer
    ctx.shadowBlur = 14
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.lineWidth = 1.5
    ctx.stroke()
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
          ? `drop-shadow(0 0 32px ${palette.rim}) drop-shadow(0 0 14px ${palette.rim})`
          : `drop-shadow(0 0 10px ${palette.rim}55)`,
        transition: 'filter 0.4s ease',
      }}>
        <canvas
          ref={canvasRef}
          className="rounded-full"
          style={{ width: '400px', height: '400px', maxWidth: '100%' }}
        />
      </div>

      {spinning && (
        <div className="mt-4 text-center animate-pulse">
          <p className="text-gold font-heading text-2xl tracking-widest">SPINNING!</p>
          <p className="text-gray-400 text-sm">The Pokéball decides your fate…</p>
        </div>
      )}

      {done && winnerLabel && !spinning && (
        <div className="mt-4 text-center px-5 py-3 rounded-xl border border-gold bg-gold/10 w-full max-w-xs animate-bounce-once">
          <p className="text-gold font-heading text-lg tracking-widest">YOU GOT:</p>
          <p className="text-white font-bold text-base">{winnerLabel}</p>
        </div>
      )}
    </div>
  )
}
