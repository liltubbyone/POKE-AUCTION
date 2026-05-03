'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'

const DEFAULT_SEGMENTS = ['pokeball', '🚀', '⭐', '🌙', '☄️', '🌌', '🪐', '💫']

interface SpinStatus {
  hasSpunToday: boolean
  won: boolean
  spinNumber: number | null
  totalSpinsToday: number
  winnerSpinNumber: number
  mysteryGiftName: string
  mysteryGiftImage: string | null
  wheelSegments: string
}

// Time until midnight America/Chicago
function timeUntilReset() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = parseInt(parts.find((p) => p.type === 'hour')!.value)
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value)
  const s = parseInt(parts.find((p) => p.type === 'second')!.value)
  const secsLeft = 24 * 3600 - (h * 3600 + m * 60 + s)
  const hLeft = Math.floor(secsLeft / 3600)
  const mLeft = Math.floor((secsLeft % 3600) / 60)
  return `${hLeft}h ${mLeft}m`
}

const SEGMENT_COLORS = [
  'rgba(124,58,237,0.18)',
  'rgba(6,182,212,0.10)',
  'rgba(88,28,235,0.20)',
  'rgba(3,105,161,0.12)',
  'rgba(139,92,246,0.15)',
  'rgba(6,182,212,0.08)',
  'rgba(59,7,100,0.22)',
  'rgba(0,180,216,0.10)',
]

export default function DailySpinPage() {
  const { data: session, status: authStatus } = useSession()
  const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ won: boolean; spinNumber: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetTimer, setResetTimer] = useState('')
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

  // Live countdown timer
  useEffect(() => {
    setResetTimer(timeUntilReset())
    const interval = setInterval(() => setResetTimer(timeUntilReset()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Spin animation
  useEffect(() => {
    if (!spinning) return
    const start = performance.now()
    const duration = 3500
    const startAngle = wheelRef.current

    // Snap final angle to nearest segment center so pointer lands in the middle of a slice
    const segmentSize = (Math.PI * 2) / 8
    const rawTarget = startAngle + Math.PI * 2 * 9
    const snappedTarget =
      Math.round((rawTarget - segmentSize / 2) / segmentSize) * segmentSize + segmentSize / 2

    const animate = (now: number) => {
      const elapsed = Math.min(now - start, duration)
      const progress = elapsed / duration
      const eased = 1 - Math.pow(1 - progress, 4)
      wheelRef.current = startAngle + (snappedTarget - startAngle) * eased
      setWheelAngle(wheelRef.current)
      if (elapsed < duration) animRef.current = requestAnimationFrame(animate)
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

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
    >
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
            ? 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)',
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
            <p className="text-3xl font-heading text-white">{spinStatus.totalSpinsToday}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Spins Today</p>
          </div>
          <div className="h-10 w-px" style={{ background: 'rgba(124,58,237,0.4)' }} />
          <div className="text-center">
            <p className="text-3xl font-heading text-violet-400">{resetTimer}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Until Reset</p>
          </div>
        </div>
      )}

      {/* ── Wheel ── */}
      <div className="relative mb-10" style={{ width: 300, height: 300 }}>

        {/* Outer orbital ring */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '-18px',
            borderRadius: '50%',
            border: '1px solid rgba(124,58,237,0.35)',
            boxShadow: spinning
              ? '0 0 30px rgba(124,58,237,0.5), inset 0 0 30px rgba(124,58,237,0.08)'
              : '0 0 10px rgba(124,58,237,0.15)',
            animation: spinning ? 'cosmic-spin 3s linear infinite' : undefined,
            transition: 'box-shadow 0.5s ease',
          }}
        />
        {/* Second orbital ring */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '-8px',
            borderRadius: '50%',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: spinning ? '0 0 15px rgba(6,182,212,0.3)' : 'none',
            animation: spinning ? 'cosmic-spin 5s linear infinite reverse' : undefined,
            transition: 'box-shadow 0.5s ease',
          }}
        />

        {/* Pointer — glowing cosmic spike */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
          <div style={{
            width: 0, height: 0,
            borderLeft: '11px solid transparent',
            borderRight: '11px solid transparent',
            borderTop: '26px solid #a78bfa',
            filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.9)) drop-shadow(0 0 16px rgba(124,58,237,0.6))',
          }} />
        </div>

        {/* Wheel */}
        <div
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #120a2e 0%, #07050f 60%, #020208 100%)',
            border: '3px solid',
            borderColor: spinning ? 'rgba(167,139,250,0.7)' : 'rgba(124,58,237,0.35)',
            transform: `rotate(${wheelAngle}rad)`,
            boxShadow: spinning
              ? '0 0 60px rgba(124,58,237,0.6), 0 0 120px rgba(124,58,237,0.2), inset 0 0 40px rgba(88,28,235,0.15)'
              : '0 0 25px rgba(124,58,237,0.2), inset 0 0 20px rgba(88,28,235,0.05)',
            transition: spinning ? 'none' : 'box-shadow 0.6s ease, border-color 0.6s ease',
          }}
        >
          {/* Conic segments */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from ${(i / 8) * 360}deg, ${SEGMENT_COLORS[i]} 0deg, transparent 45deg)`,
              }}
            />
          ))}

          {/* Divider lines between segments */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`line-${i}`}
              className="absolute"
              style={{
                top: '50%', left: '50%',
                width: '50%', height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.3))',
                transformOrigin: 'left center',
                transform: `rotate(${(i / 8) * 360}deg)`,
              }}
            />
          ))}

          {/* Icons in each segment */}
          {(() => {
            try {
              const saved = JSON.parse(spinStatus?.wheelSegments ?? '[]')
              return saved.length === 8 ? saved : DEFAULT_SEGMENTS
            } catch { return DEFAULT_SEGMENTS }
          })().map((symbol: string, i: number) => {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8 - Math.PI / 2
            const r = 95
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * r}px)`,
                  top: `calc(50% + ${Math.sin(angle) * r}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'rgba(7,5,15,0.6)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {symbol === 'pokeball' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/logo.png"
                    alt=""
                    style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{symbol}</span>
                )}
              </div>
            )
          })}

          {/* Planet center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
            style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #1e0a4e, #07050f)',
              border: '2px solid rgba(124,58,237,0.5)',
              boxShadow: '0 0 20px rgba(124,58,237,0.4), inset 0 0 15px rgba(88,28,235,0.3)',
              fontSize: '28px',
            }}
          >
            🪐
          </div>
        </div>
      </div>

      {/* Action area */}
      {!session?.user ? (
        <div className="relative text-center space-y-4">
          <p className="text-gray-400">Sign in to get your free daily spin.</p>
          <button onClick={() => signIn()} className="btn-gold px-8 py-3">
            Sign In to Spin
          </button>
        </div>
      ) : result ? (
        <div
          className="relative rounded-2xl p-7 text-center max-w-sm w-full"
          style={{
            background: result.won
              ? 'rgba(124,58,237,0.08)'
              : 'rgba(10,10,24,0.85)',
            border: `1px solid ${result.won ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.2)'}`,
            boxShadow: result.won ? '0 0 40px rgba(124,58,237,0.2)' : 'none',
          }}
        >
          {result.won ? (
            <>
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))' }}>🌟</div>
              <p className="font-heading text-3xl mb-2 gold-gradient-text">YOU WON!</p>
              <p className="text-gray-300 text-sm mb-5">A cosmic event just occurred — you were today&apos;s lucky spin!</p>
              <div
                className="rounded-xl p-4 mb-4"
                style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}
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
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))' }}>🪐</div>
              <p className="font-heading text-2xl text-white mb-2">NOT THIS TIME</p>
              <p className="text-gray-400 text-sm mb-5">The cosmos wasn&apos;t aligned today. Come back tomorrow for another shot!</p>
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <p className="text-gray-500 text-xs">Resets in <span className="text-violet-300 font-semibold">{resetTimer}</span></p>
              </div>
            </>
          )}
        </div>
      ) : alreadySpun ? (
        <div
          className="relative rounded-2xl p-7 text-center max-w-sm w-full"
          style={{
            background: 'rgba(10,10,24,0.85)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
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
              <p className="text-gray-400 text-sm mb-3">
                Come back tomorrow — the cosmos resets at midnight Central.
              </p>
              <p className="text-gray-500 text-xs">Resets in <span className="text-violet-300 font-semibold">{resetTimer}</span></p>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleSpin}
          disabled={spinning}
          className="relative btn-gold text-lg px-12 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            boxShadow: spinning
              ? '0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(124,58,237,0.3)'
              : undefined,
          }}
        >
          {spinning ? '✨ SPINNING...' : '🪐 SPIN THE COSMOS'}
        </button>
      )}

      {/* Mystery teaser */}
      {spinStatus && !result && !alreadySpun && (
        <div className="relative mt-8 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Today&apos;s Mystery Gift</p>
          <p className="text-gray-500 text-sm">??? — Revealed to the winner only</p>
        </div>
      )}
    </div>
  )
}
