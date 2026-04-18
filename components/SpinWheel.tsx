'use client'

import { useEffect, useRef, useState } from 'react'
import { getTierWheelColor } from '@/lib/utils'

interface WheelSegment {
  label: string
  tier: string
  quantity: number
}

interface SpinWheelProps {
  segments: WheelSegment[]
  spinning: boolean
  onSpinComplete?: () => void
}

export default function SpinWheel({ segments, spinning, onSpinComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const [, setFinalAngle] = useState(0)

  // Expand segments by quantity for wheel display
  const expandedSegments = segments.flatMap((seg) =>
    Array.from({ length: seg.quantity }, () => seg)
  )

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas || expandedSegments.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 10

    ctx.clearRect(0, 0, size, size)

    const numSegments = expandedSegments.length
    const anglePerSegment = (2 * Math.PI) / numSegments

    for (let i = 0; i < numSegments; i++) {
      const startAngle = rotation + i * anglePerSegment
      const endAngle = startAngle + anglePerSegment
      const seg = expandedSegments[i]

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = getTierWheelColor(seg.tier)
      ctx.fill()
      ctx.strokeStyle = '#0a0a0f'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + anglePerSegment / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.min(12, 280 / numSegments)}px Rajdhani, sans-serif`
      const text = seg.label.length > 14 ? seg.label.substring(0, 13) + '…' : seg.label
      ctx.fillText(text, radius - 12, 4)
      ctx.restore()
    }

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#0a0a0f'
    ctx.fill()
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.stroke()

    // Center logo text
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 10px Bebas Neue, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SPIN', cx, cy)

    // Pointer / arrow at top
    ctx.beginPath()
    ctx.moveTo(cx - 12, 2)
    ctx.lineTo(cx + 12, 2)
    ctx.lineTo(cx, 28)
    ctx.closePath()
    ctx.fillStyle = '#FFD700'
    ctx.fill()
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  }

  useEffect(() => {
    drawWheel(0)
  }, [segments])

  useEffect(() => {
    if (!spinning) return

    const totalRotation = Math.PI * 2 * 8 + Math.random() * Math.PI * 2
    const duration = 5000
    const startTime = performance.now()
    const startRotation = rotationRef.current

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const rotation = startRotation + totalRotation * eased

      rotationRef.current = rotation
      drawWheel(rotation)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setFinalAngle(rotation)
        onSpinComplete?.()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [spinning])

  if (expandedSegments.length === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-square bg-card border border-border rounded-full">
        <p className="text-gray-500 text-sm">No items in auction</p>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center">
      <div className={`wheel-glow ${spinning ? 'animate-pulse' : ''}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="max-w-full rounded-full"
          style={{ maxWidth: '400px' }}
        />
      </div>
    </div>
  )
}
