'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface AuctionCardProps {
  auction: {
    id: string
    name: string
    description?: string | null
    status: string
    category?: string | null
    spotPrice: number
    totalSpots: number
    spots: { paid: boolean }[]
    items: {
      quantity: number
      item: { name: string; tier: string }
    }[]
  }
}

const categoryThemes: Record<string, { accent: string; rgb: string; label: string; topLine: string }> = {
  raffle:   { accent: '#a78bfa', rgb: '124,58,237',   label: 'RAFFLE',   topLine: 'rgba(124,58,237,0.8)' },
  game:     { accent: '#38bdf8', rgb: '56,189,248',   label: 'GAME',     topLine: 'rgba(56,189,248,0.8)'  },
  giveaway: { accent: '#FFD700', rgb: '255,215,0',    label: 'GIVEAWAY', topLine: 'rgba(255,215,0,0.8)'   },
}

const statusDot: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  active:    { text: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.22)',  dot: '#4ade80' },
  spinning:  { text: '#FFD700', bg: 'rgba(255,215,0,0.07)',   border: 'rgba(255,215,0,0.28)',   dot: '#FFD700' },
  completed: { text: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)', dot: '#64748b' },
  cancelled: { text: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.22)', dot: '#f87171' },
}

const tierStyle: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: '#fca5a5', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.28)' },
  A: { text: '#fdba74', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.28)'  },
  B: { text: '#93c5fd', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)'  },
  C: { text: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)' },
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const soldSpots  = auction.spots.filter((s) => s.paid).length
  const pctFilled  = Math.round((soldSpots / auction.totalSpots) * 100)
  const spotsLeft  = auction.totalSpots - soldSpots
  const isFull     = spotsLeft === 0
  const status     = statusDot[auction.status] ?? statusDot.active
  const cat        = categoryThemes[auction.category ?? 'raffle'] ?? categoryThemes.raffle

  return (
    <div
      className="auction-card active-glow relative rounded-2xl p-5 flex flex-col gap-4 group"
      style={{ '--cat-rgb': cat.rgb } as React.CSSProperties}
    >
      {/* Top neon edge line (always visible, brightens on hover via CSS ::before) */}
      <div
        className="absolute top-0 left-8 right-8 h-px pointer-events-none transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${cat.topLine}, transparent)`, opacity: 0.55 }}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          {/* Category pill */}
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              color: cat.accent,
              background: `rgba(${cat.rgb},0.10)`,
              border: `1px solid rgba(${cat.rgb},0.28)`,
            }}
          >
            {cat.label}
          </span>
          <h3 className="text-xl font-heading text-white leading-tight group-hover:text-violet-300 transition-colors duration-200 truncate">
            {auction.name}
          </h3>
        </div>
        {/* Status pill */}
        <span
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ color: status.text, background: status.bg, border: `1px solid ${status.border}` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: status.dot,
              boxShadow: `0 0 5px ${status.dot}`,
              animation: auction.status === 'active' ? 'pulse 2s ease-in-out infinite' : undefined,
            }}
          />
          {auction.status}
        </span>
      </div>

      {/* ── Description ── */}
      {auction.description && (
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 -mt-1">
          {auction.description}
        </p>
      )}

      {/* ── Items in Pool ── */}
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Items in Pool</p>
        <div className="flex flex-wrap gap-1.5">
          {auction.items.slice(0, 4).map((ai, i) => {
            const tier = tierStyle[ai.item.tier] ?? tierStyle.C
            return (
              <span
                key={i}
                className="text-xs font-bold px-2.5 py-1 rounded-lg font-body tracking-wide"
                style={{ color: tier.text, background: tier.bg, border: `1px solid ${tier.border}` }}
              >
                {ai.item.name}{ai.quantity > 1 ? ` ×${ai.quantity}` : ''}
              </span>
            )
          })}
          {auction.items.length > 4 && (
            <span className="text-xs text-slate-600 px-2 py-1">+{auction.items.length - 4} more</span>
          )}
        </div>
      </div>

      {/* ── Fill progress ── */}
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-500">
            <span className="text-white font-bold text-sm">{soldSpots}</span>
            <span className="text-slate-600"> / {auction.totalSpots} spots filled</span>
          </span>
          <span
            className="font-bold text-[11px] uppercase tracking-wider"
            style={{ color: isFull ? '#FFD700' : '#64748b' }}
          >
            {isFull ? '🌀 READY TO SPIN' : `${spotsLeft} left`}
          </span>
        </div>
        {/* Track */}
        <div className="relative w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pctFilled}%`,
              background: isFull
                ? 'linear-gradient(90deg, #fde68a, #FFD700, #fde68a)'
                : `linear-gradient(90deg, rgba(${cat.rgb},0.7), rgba(${cat.rgb},1))`,
              boxShadow: pctFilled > 0
                ? isFull ? '0 0 10px rgba(255,215,0,0.55)' : `0 0 8px rgba(${cat.rgb},0.55)`
                : 'none',
            }}
          />
        </div>
        {/* Percentage tick */}
        <p className="text-[10px] text-slate-600 mt-1 text-right font-semibold">{pctFilled}%</p>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5 font-bold">Per Spot</p>
          <p className="text-2xl font-heading leading-none" style={{ color: '#FFD700', textShadow: '0 0 16px rgba(255,215,0,0.35)' }}>
            {formatCurrency(auction.spotPrice)}
          </p>
        </div>
        <Link
          href={auction.status === 'completed' ? `/auction/${auction.id}/results` : `/auction/${auction.id}`}
          className="btn-gold text-sm py-2.5 px-5 rounded-xl"
        >
          {auction.status === 'active' ? 'Claim Spot' : 'View Results'}
          <svg className="w-3.5 h-3.5 ml-1.5 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
