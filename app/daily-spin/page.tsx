'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'

interface SpinStatus {
  hasSpunToday: boolean
  won: boolean
  spinNumber: number | null
  totalSpinsToday: number
  winnerSpinNumber: number
  mysteryGiftName: string
  mysteryGiftImage: string | null
}

export default function DailySpinPage() {
  const { data: session, status: authStatus } = useSession()
  const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ won: boolean; spinNumber: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const wheelRef = useRef<number>(0)
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const [wheelAngle, setWheelAngle] = useState(0)

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session?.user) { setLoading(false); return }
    fetch('/api/daily-spin')
      .then((r) => r.json())
      .then((d) => { setSpinStatus(d); setLoading(false) })
  }, [session, authStatus])

  // Spin animation loop
  useEffect(() => {
    if (!spinning) return
    const start = performance.now()
    const duration = 3500
    const startAngle = wheelRef.current

    const animate = (now: number) => {
      const elapsed = Math.min(now - start, duration)
      const progress = elapsed / duration
      const eased = 1 - Math.pow(1 - progress, 4)
      const totalSpins = Math.PI * 2 * 8
      wheelRef.current = startAngle + totalSpins * eased
      setWheelAngle(wheelRef.current)
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [spinning])

  const handleSpin = async () => {
    if (spinning || !session?.user) return
    setSpinning(true)
    setResult(null)

    const res = await fetch('/api/daily-spin', { method: 'POST' })
    const data = await res.json()

    // Wait for animation to finish
    setTimeout(() => {
      setSpinning(false)
      setResult({ won: data.won, spinNumber: data.spinNumber })
      setSpinStatus((prev) => prev ? { ...prev, hasSpunToday: true, won: data.won, spinNumber: data.spinNumber } : prev)
    }, 3600)
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  const timeUntilReset = () => {
    const now = new Date()
    const midnight = new Date()
    midnight.setUTCDate(midnight.getUTCDate() + 1)
    midnight.setUTCHours(0, 0, 0, 0)
    const diff = midnight.getTime() - now.getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  const alreadySpun = spinStatus?.hasSpunToday && !spinning && result === null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Free Daily</p>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          MYSTERY <span className="gold-gradient-text">SPIN</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          One free spin per day. One lucky spin wins the mystery gift. Resets at midnight Central.
        </p>
      </div>

      {/* Spin counter */}
      {spinStatus && (
        <div className="flex items-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-heading text-white">{spinStatus.totalSpinsToday}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Spins Today</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-3xl font-heading text-purple-400">{timeUntilReset()}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Until Reset</p>
          </div>
        </div>
      )}

      {/* Wheel */}
      <div className="relative mb-8" style={{ width: 280, height: 280 }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div style={{
            width: 0, height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '24px solid #FFD700',
            filter: 'drop-shadow(0 0 6px #FFD700)',
          }} />
        </div>

        {/* Wheel circle */}
        <div
          className="w-full h-full rounded-full border-4 border-gold/60 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #1a1a2e 0%, #0d0d1a 100%)',
            transform: `rotate(${wheelAngle}rad)`,
            boxShadow: spinning
              ? '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2)'
              : '0 0 20px rgba(255,215,0,0.15)',
            transition: spinning ? 'none' : 'box-shadow 0.5s ease',
          }}
        >
          {/* Wheel segments (decorative) */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from ${(i / 8) * 360}deg, ${
                  i % 2 === 0 ? 'rgba(255,215,0,0.08)' : 'rgba(138,43,226,0.08)'
                } 0deg, transparent 45deg)`,
              }}
            />
          ))}

          {/* Question marks */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            const r = 90
            return (
              <div
                key={i}
                className="absolute text-2xl font-heading select-none"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * r}px)`,
                  top: `calc(50% + ${Math.sin(angle) * r}px)`,
                  transform: 'translate(-50%, -50%)',
                  color: i % 2 === 0 ? '#FFD700' : 'rgba(138,43,226,0.8)',
                  textShadow: '0 0 8px currentColor',
                }}
              >
                ?
              </div>
            )
          })}

          {/* Center */}
          <div className="w-16 h-16 rounded-full bg-background border-2 border-gold/40 flex items-center justify-center z-10">
            <span className="text-2xl">🎁</span>
          </div>
        </div>
      </div>

      {/* Action area */}
      {!session?.user ? (
        <div className="text-center space-y-4">
          <p className="text-gray-400">Sign in to get your free daily spin.</p>
          <button onClick={() => signIn()} className="btn-gold px-8 py-3">
            Sign In to Spin
          </button>
        </div>
      ) : result ? (
        // Result card
        <div className={`card text-center max-w-sm w-full border-2 ${result.won ? 'border-gold animate-pulse-once' : 'border-border'}`}>
          {result.won ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gold font-heading text-3xl mb-2">YOU WON!</p>
              <p className="text-gray-300 text-sm mb-4">You were spin #{result.spinNumber} today!</p>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Mystery Gift</p>
                {spinStatus?.mysteryGiftImage && (
                  <img src={spinStatus.mysteryGiftImage} alt="Mystery Gift" className="w-32 h-32 object-contain mx-auto mb-3 rounded-lg" referrerPolicy="no-referrer" />
                )}
                <p className="text-gold font-heading text-xl">{spinStatus?.mysteryGiftName}</p>
              </div>
              <p className="text-gray-400 text-xs">We&apos;ll reach out to ship your prize!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎲</div>
              <p className="text-white font-heading text-2xl mb-2">TRY AGAIN TOMORROW</p>
              <p className="text-gray-400 text-sm mb-4">You were spin #{result.spinNumber} today. Come back tomorrow for another chance!</p>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs">Resets in <span className="text-white font-semibold">{timeUntilReset()}</span></p>
              </div>
            </>
          )}
        </div>
      ) : alreadySpun ? (
        <div className="card text-center max-w-sm w-full">
          {spinStatus?.won ? (
            <>
              <div className="text-6xl mb-3">🏆</div>
              <p className="text-gold font-heading text-2xl mb-2">YOU WON TODAY!</p>
              {spinStatus?.mysteryGiftImage && (
                <img src={spinStatus.mysteryGiftImage} alt="Mystery Gift" className="w-24 h-24 object-contain mx-auto mb-3 rounded-lg" referrerPolicy="no-referrer" />
              )}
              <p className="text-gold font-semibold">{spinStatus?.mysteryGiftName}</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">🎲</div>
              <p className="text-white font-heading text-xl mb-2">ALREADY SPUN TODAY</p>
              <p className="text-gray-400 text-sm mb-3">
                You were spin #{spinStatus?.spinNumber}. Come back tomorrow for another shot!
              </p>
              <p className="text-gray-500 text-xs">Resets in <span className="text-white font-semibold">{timeUntilReset()}</span></p>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="btn-gold text-xl px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: spinning ? '0 0 30px rgba(255,215,0,0.5)' : undefined,
          }}
        >
          {spinning ? 'SPINNING...' : '🎁 SPIN FOR FREE'}
        </button>
      )}

      {/* Mystery gift teaser */}
      {spinStatus && !result && !alreadySpun && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Today&apos;s Mystery Gift</p>
          <p className="text-gray-500 text-sm">??? — Revealed to the winner only</p>
        </div>
      )}
    </div>
  )
}
