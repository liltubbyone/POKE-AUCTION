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
    return Array.from({ length: 180 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() > 0.92 ? 2 : 1,
      opacity: 0.2 + rng() * 0.6,
      duration: 2 + rng() * 4,
      delay: rng() * 6,
    }))
  }, [])

  const shootingStars = useMemo(() => {
    const rng = seededRandom(77)
    return Array.from({ length: 6 }, (_, i) => ({
      top: 3 + rng() * 48,
      left: 5 + rng() * 58,
      delay: i * 5 + rng() * 12,
      duration: 20 + rng() * 16,   // 20–36s full cycle
      length: 90 + Math.floor(rng() * 90), // 90–180px tail length
      brightness: 0.7 + rng() * 0.3,       // slight brightness variation
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">

      {/* Nebula orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%',
        width: '60vw', height: '60vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(88,28,235,0.12) 0%, rgba(59,7,100,0.06) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'nebula-drift 25s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(3,105,161,0.05) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'nebula-drift 30s ease-in-out infinite alternate-reverse',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '20%',
        width: '30vw', height: '30vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'nebula-drift 20s ease-in-out infinite alternate',
        animationDelay: '5s',
      }} />

      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: star.size === 2 ? '#c4b5fd' : 'white',
            opacity: star.opacity,
            boxShadow: star.size === 2 ? '0 0 4px rgba(196,181,253,0.8)' : 'none',
            animation: `twinkle ${star.duration}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Shooting stars — occasional, vertical comet style */}
      {shootingStars.map((s, i) => (
        <div
          key={`ss-${i}`}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            animation: `shooting-star-occ ${s.duration}s ease-in ${s.delay}s infinite`,
            opacity: 0,
          }}
        >
          {/* Inner wrapper — slight natural tilt */}
          <div style={{ transform: 'rotate(15deg)', transformOrigin: 'bottom center' }}>
            {/* Tail — vertical, transparent at top fading to bright at bottom (head) */}
            <div style={{
              width: '1.5px',
              height: `${s.length}px`,
              background: `linear-gradient(to bottom,
                transparent 0%,
                rgba(200,215,255,0.04) 15%,
                rgba(200,215,255,0.2) 40%,
                rgba(220,230,255,${0.55 * s.brightness}) 65%,
                rgba(255,255,255,${0.85 * s.brightness}) 85%,
                rgba(255,255,255,${s.brightness}) 100%
              )`,
            }} />
            {/* Soft glow along tail */}
            <div style={{
              position: 'absolute',
              top: '30%',
              bottom: 0,
              left: '-2px',
              width: '5px',
              background: `linear-gradient(to bottom,
                transparent,
                rgba(180,200,255,${0.12 * s.brightness}) 50%,
                rgba(200,220,255,${0.3 * s.brightness}) 100%
              )`,
              filter: 'blur(2px)',
            }} />
            {/* Bright head — glowing dot at the leading tip (bottom) */}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-3px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,${s.brightness}) 15%, rgba(200,220,255,0.7) 55%, transparent 100%)`,
              boxShadow: `
                0 0 4px 1px rgba(220,230,255,${0.8 * s.brightness}),
                0 0 10px 3px rgba(180,200,255,${0.5 * s.brightness}),
                0 0 20px 6px rgba(160,180,255,${0.2 * s.brightness})
              `,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}
