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
}

const TIER_COLORS: Record<string, { bg: string; alt: string; text: string }> = {
  S: { bg: '#FF4500', alt: '#FF6B35', text: '#FFFFFF' },
  A: { bg: '#FFD700', alt: '#FFC200', text: '#1a1a00' },
  B: { bg: '#4488FF', alt: '#2266DD', text: '#FFFFFF' },
  C: { bg: '#44CC77', alt: '#229955', text: '#FFFFFF' },
  EXCLUDE: { bg: '#555577', alt: '#333355', text: '#AAAACC' },
}

function getPalette(tier: string) {
  return TIER_COLORS[tier] || TIER_COLORS.C
}

export default function SpinWheel({ segments, spinning, onSpinComplete, winnerLabel }: SpinWheelProps) {
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

    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 16
    const n = expanded.length
    const arc = (2 * Math.PI) / n

    ctx.clearRect(0, 0, size, size)

    // Outer dark ring
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
    ctx.fillStyle = '#0d0d1a'
    ctx.fill()

    // Gold rim
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 4
    ctx.stroke()

    // Segments
    for (let i = 0; i < n; i++) {
      const start = rotation + i * arc
      const end = start + arc
      const seg = expanded[i]
      const pal = getPalette(seg.tier)
      const fill = i % 2 === 0 ? pal.bg : pal.alt

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, start, end)
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()

      // Divider
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start))
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Rim dot
      const dotAngle = start + arc / 2
      const dotDist = radius - 11
      ctx.beginPath()
      ctx.arc(cx + dotDist * Math.cos(dotAngle), cy + dotDist * Math.sin(dotAngle), 4, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fill()

      // Label
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      const fs = Math.max(8, Math.min(13, 300 / n))
      ctx.font = `bold ${fs}px Rajdhani, sans-serif`
      ctx.fillStyle = pal.text
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      const label = seg.label.length > 13 ? seg.label.slice(0, 12) + '\u2026' : seg.label
      ctx.fillText(label, radius - 18, fs / 3)
      ctx.restore()
    }

    // Pokeball center
    const cr = 34
    // White base
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
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
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()

    // Arrow pointer at top
    ctx.beginPath()
    ctx.moveTo(cx - 14, 1)
    ctx.lineTo(cx + 14, 1)
    ctx.lineTo(cx, 30)
    ctx.closePath()
    ctx.fillStyle = '#FFD700'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 14
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  useEffect(() => {
    draw(rotationRef.current)
  }, [segments]) // eslint-disable-line

  useEffect(() => {
    if (!spinning) return
    setDone(false)

    const n = expanded.length
    const arc = (2 * Math.PI) / n
    const startRot = rotationRef.current

    // Find which segment the server actually picked so the wheel lands on it
    let totalRot: number
    if (winnerLabel && n > 0) {
      // Find all indices matching the winner (item may appear multiple times)
      const matchingIndices = expanded
        .map((seg, i) => (seg.label === winnerLabel ? i : -1))
        .filter((i) => i >= 0)
      const targetIndex =
        matchingIndices.length > 0
          ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
          : Math.floor(Math.random() * n)

      // Pointer is at the top of canvas = angle -π/2 in canvas coords.
      // Center of segment i is at: rotation + i*arc + arc/2
      // We need: finalRotation + targetIndex*arc + arc/2 ≡ -π/2 (mod 2π)
      const pointerAngle = -Math.PI / 2
      const targetFinalRot = pointerAngle - targetIndex * arc - arc / 2
      // How much extra rotation needed from startRot to reach targetFinalRot
      const delta = ((targetFinalRot - startRot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      // Add at least 10 full rotations so it looks like a real spin
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

  return (
    <div className="flex flex-col items-center">
      <div style={{
        filter: spinning
          ? 'drop-shadow(0 0 28px #FFD700) drop-shadow(0 0 8px #FF4500)'
          : 'drop-shadow(0 0 8px rgba(255,215,0,0.25))',
        transition: 'filter 0.4s ease',
      }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="max-w-full rounded-full"
          style={{ maxWidth: '400px' }}
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
