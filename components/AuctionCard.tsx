import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface AuctionCardProps {
  auction: {
    id: string
    name: string
    description?: string | null
    status: string
    spotPrice: number
    totalSpots: number
    spots: { paid: boolean }[]
    items: {
      quantity: number
      item: { name: string; tier: string }
    }[]
  }
}

const statusColors: Record<string, { text: string; bg: string; border: string }> = {
  active:    { text: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)'  },
  spinning:  { text: '#FFD700', bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.3)'    },
  completed: { text: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)'  },
  cancelled: { text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
}

const tierColors: Record<string, { text: string; bg: string; border: string }> = {
  S: { text: '#fca5a5', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  A: { text: '#fdba74', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  B: { text: '#93c5fd', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  C: { text: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.2)' },
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const soldSpots = auction.spots.filter((s) => s.paid).length
  const pctFilled = Math.round((soldSpots / auction.totalSpots) * 100)
  const spotsLeft = auction.totalSpots - soldSpots
  const status = statusColors[auction.status] ?? statusColors.active

  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300 active-glow"
      style={{
        background: 'linear-gradient(145deg, #0d0d1a 0%, #0a0a16 100%)',
        border: '1px solid rgba(30,30,53,1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,215,0,0.2)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.1)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30,30,53,1)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-heading text-white leading-tight group-hover:text-gold-light transition-colors duration-200">
          {auction.name}
        </h3>
        <span
          className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{
            color: status.text,
            background: status.bg,
            border: `1px solid ${status.border}`,
          }}
        >
          {auction.status}
        </span>
      </div>

      {/* Description */}
      {auction.description && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 -mt-1">
          {auction.description}
        </p>
      )}

      {/* Items preview */}
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2 font-semibold">Items in Pool</p>
        <div className="flex flex-wrap gap-1.5">
          {auction.items.slice(0, 4).map((ai, i) => {
            const tier = tierColors[ai.item.tier] ?? tierColors.C
            return (
              <span
                key={i}
                className="text-xs font-bold px-2.5 py-1 rounded-lg font-body tracking-wide"
                style={{
                  color: tier.text,
                  background: tier.bg,
                  border: `1px solid ${tier.border}`,
                }}
              >
                {ai.item.tier} — {ai.item.name}{ai.quantity > 1 ? ` ×${ai.quantity}` : ''}
              </span>
            )
          })}
          {auction.items.length > 4 && (
            <span className="text-xs text-gray-600 px-2 py-1">+{auction.items.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500">
            <span className="text-white font-bold text-sm">{soldSpots}</span>
            <span className="text-gray-600"> / {auction.totalSpots} spots filled</span>
          </span>
          <span
            className="font-bold"
            style={{ color: spotsLeft === 0 ? '#FFD700' : '#6b7280' }}
          >
            {spotsLeft === 0 ? 'READY TO SPIN' : `${spotsLeft} left`}
          </span>
        </div>
        <div
          className="w-full rounded-full h-2 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pctFilled}%`,
              background: pctFilled === 100
                ? 'linear-gradient(90deg, #FFD700, #FFE44D)'
                : 'linear-gradient(90deg, #B8860B, #FFD700)',
              boxShadow: pctFilled > 0 ? '0 0 8px rgba(255,215,0,0.4)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Per Spot</p>
          <p className="text-2xl font-heading" style={{ color: '#FFD700' }}>
            {formatCurrency(auction.spotPrice)}
          </p>
        </div>
        <Link
          href={`/auction/${auction.id}`}
          className="btn-gold text-sm py-2.5 px-5"
        >
          {auction.status === 'active' ? 'Join Now' : 'View Results'}
          <svg className="w-4 h-4 ml-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
