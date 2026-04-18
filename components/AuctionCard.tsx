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

const statusColors: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/30',
  spinning: 'text-gold bg-gold/10 border-gold/30',
  completed: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const tierColors: Record<string, string> = {
  S: 'bg-red-400/20 text-red-300 border-red-400/30',
  A: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  B: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  C: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const soldSpots = auction.spots.filter((s) => s.paid).length
  const pctFilled = Math.round((soldSpots / auction.totalSpots) * 100)
  const spotsLeft = auction.totalSpots - soldSpots

  return (
    <div className="card hover:border-gold/40 transition-all duration-300 active-glow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-heading text-white group-hover:text-gold transition-colors">
          {auction.name}
        </h3>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
            statusColors[auction.status] || statusColors.active
          }`}
        >
          {auction.status}
        </span>
      </div>

      {/* Description */}
      {auction.description && (
        <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
          {auction.description}
        </p>
      )}

      {/* Items preview */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Items in Pool</p>
        <div className="flex flex-wrap gap-2">
          {auction.items.slice(0, 4).map((ai, i) => (
            <span
              key={i}
              className={`tier-badge border px-2 py-0.5 text-xs ${tierColors[ai.item.tier] || tierColors.C}`}
            >
              {ai.item.tier} • {ai.item.name} {ai.quantity > 1 ? `x${ai.quantity}` : ''}
            </span>
          ))}
          {auction.items.length > 4 && (
            <span className="text-xs text-gray-500">+{auction.items.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Spot fill progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-400">
            <span className="text-white font-bold">{soldSpots}</span>/{auction.totalSpots} spots filled
          </span>
          <span className={spotsLeft === 0 ? 'text-gold font-bold' : 'text-gray-400'}>
            {spotsLeft === 0 ? 'READY TO SPIN!' : `${spotsLeft} left`}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctFilled}%`,
              background: pctFilled === 100 ? '#FFD700' : 'linear-gradient(90deg, #FFD700, #B8860B)',
            }}
          />
        </div>
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Spot Price</p>
          <p className="text-2xl font-heading text-gold">{formatCurrency(auction.spotPrice)}</p>
        </div>
        <Link
          href={`/auction/${auction.id}`}
          className="btn-gold text-sm"
        >
          {auction.status === 'active' ? 'Join Auction →' : 'View Results →'}
        </Link>
      </div>
    </div>
  )
}
