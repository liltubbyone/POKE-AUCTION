'use client'

import { useMemo } from 'react'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export default function StarField() {
  const stars = useMemo(() => {
    const rng = seededRandom(42)
    return Array.from({ length: 220 }, () => ({
      x:        rng() * 100,
      y:        rng() * 100,
      size:     rng() > 0.90 ? 2 : 1,
      opacity:  0.15 + rng() * 0.65,
      duration: 2.5 + rng() * 5,
      delay:    rng() * 8,
      purple:   rng() > 0.75,
    }))
  }, [])

  const shootingStars = useMemo(() => {
    const rng = seededRandom(77)
    return Array.from({ length: 6 }, (_, i) => ({
      top:        3 + rng() * 48,
      left:       5 + rng() * 58,
      delay:      i * 5 + rng() * 12,
      duration:   20 + rng() * 16,
      length:     90 + Math.floor(rng() * 90),
      brightness: 0.7 + rng() * 0.3,
      angle:      5 + rng() * 30,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">

      {/* ── Nebula orbs — 5 layers for richer depth ── */}
      {/* Purple top-left (large) */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '65vw', height: '65vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(88,28,235,0.13) 0%, rgba(59,7,100,0.06) 40%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'nebula-drift 28s ease-in-out infinite alternate',
      }} />

      {/* Cyan bottom-right */}
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '55vw', height: '55vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, rgba(3,105,161,0.04) 40%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'nebula-drift 32s ease-in-out infinite alternate-reverse',
      }} />

      {/* Pink center-right */}
      <div style={{
        position: 'absolute', top: '35%', right: '15%',
        width: '35vw', height: '35vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        filter: 'blur(55px)',
        animation: 'nebula-drift 22s ease-in-out infinite alternate',
        animationDelay: '4s',
      }} />

      {/* Blue-indigo top-right */}
      <div style={{
        position: 'absolute', top: '5%', right: '5%',
        width: '30vw', height: '30vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'nebula-drift 18s ease-in-out infinite alternate-reverse',
        animationDelay: '8s',
      }} />

      {/* Subtle magenta bottom-left */}
      <div style={{
        position: 'absolute', bottom: '10%', left: '5%',
        width: '28vw', height: '28vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)',
        filter: 'blur(55px)',
        animation: 'nebula-drift 25s ease-in-out infinite alternate',
        animationDelay: '12s',
      }} />

      {/* ── Stars ── */}
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left:    `${star.x}%`,
            top:     `${star.y}%`,
            width:   `${star.size}px`,
            height:  `${star.size}px`,
            borderRadius: '50%',
            background: star.purple
              ? (star.size === 2 ? '#c4b5fd' : '#a78bfa')
              : (star.size === 2 ? '#e2e8f0' : 'white'),
            opacity: star.opacity,
            boxShadow: star.size === 2
              ? (star.purple ? '0 0 4px rgba(196,181,253,0.9)' : '0 0 4px rgba(226,232,240,0.8)')
              : 'none',
            animation: `twinkle ${star.duration}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* ── Shooting stars ── */}
      {shootingStars.map((s, i) => (
        <div
          key={`ss-${i}`}
          style={{
            position: 'absolute',
            top:  `${s.top}%`,
            left: `${s.left}%`,
            animation: `shooting-star-occ ${s.duration}s ease-in ${s.delay}s infinite`,
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        >
          <div style={{ transform: `rotate(${s.angle}deg)`, transformOrigin: 'bottom center' }}>
            <div style={{
              width: '1.5px',
              height: `${s.length}px`,
              background: `linear-gradient(to bottom,
                transparent 0%,
                rgba(200,215,255,0.04) 15%,
                rgba(200,215,255,0.20) 40%,
                rgba(220,230,255,${0.55 * s.brightness}) 65%,
                rgba(255,255,255,${0.85 * s.brightness}) 85%,
                rgba(255,255,255,${s.brightness}) 100%)`,
            }} />
            <div style={{
              position: 'absolute', top: '30%', bottom: 0, left: '-2px', width: '5px',
              background: `linear-gradient(to bottom, transparent, rgba(180,200,255,${0.12 * s.brightness}) 50%, rgba(200,220,255,${0.3 * s.brightness}) 100%)`,
              filter: 'blur(2px)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-4px', left: '-3px', width: '7px', height: '7px', borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,${s.brightness}) 15%, rgba(200,220,255,0.7) 55%, transparent 100%)`,
              boxShadow: `0 0 4px 1px rgba(220,230,255,${0.8 * s.brightness}), 0 0 10px 3px rgba(180,200,255,${0.5 * s.brightness}), 0 0 20px 6px rgba(160,180,255,${0.2 * s.brightness})`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}
