'use client'

import { useMemo } from 'react'

// Seeded deterministic LCG so SSR/client always match
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
    return Array.from({ length: 180 }, (_, i) => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() > 0.92 ? 2 : 1,
      opacity: 0.2 + rng() * 0.6,
      duration: 2 + rng() * 4,
      delay: rng() * 6,
    }))
  }, [])

  const shootingStars = useMemo(() => {
    const rng = seededRandom(99)
    return Array.from({ length: 3 }, (_, i) => ({
      top: 10 + rng() * 40,
      left: rng() * 60,
      delay: i * 7 + rng() * 5,
      duration: 1.5 + rng() * 1,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep nebula orbs */}
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
            boxShadow: star.size === 2 ? `0 0 4px rgba(196,181,253,0.8)` : 'none',
            animation: `twinkle ${star.duration}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((s, i) => (
        <div
          key={`ss-${i}`}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: '120px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            transform: 'rotate(-35deg)',
            animation: `shooting-star ${s.duration}s ease-in ${s.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
