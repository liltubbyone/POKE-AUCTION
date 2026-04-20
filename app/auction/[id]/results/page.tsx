export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TIER_COLORS: Record<string, string> = {
  S: 'text-red-400 bg-red-400/10 border-red-400/30',
  A: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  C: 'text-green-400 bg-green-400/10 border-green-400/30',
}

export default async function AuctionResultsPage({ params }: { params: { id: string } }) {
  const auction = await prisma.auction.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { item: true } },
      spots: {
        where: { paid: true },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { spotNumber: 'asc' },
      },
    },
  })

  if (!auction) notFound()

  // Map auctionItem id → item details
  const itemMap = Object.fromEntries(auction.items.map((ai) => [ai.id, ai.item]))

  const spotsWithItems = auction.spots.map((spot) => ({
    ...spot,
    item: spot.assignedItemId ? itemMap[spot.assignedItemId] : null,
  }))

  const totalSpots = spotsWithItems.length
  const assignedCount = spotsWithItems.filter((s) => s.item).length
  const isComplete = auction.status === 'completed'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/auction/${auction.id}`} className="text-gray-500 text-sm hover:text-gold transition-colors">
          ← Back to Auction Room
        </Link>
        <div className="flex items-start justify-between mt-3 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-heading text-white mb-1">{auction.name}</h1>
            <p className="text-gray-500 text-sm">
              {totalSpots} spot{totalSpots !== 1 ? 's' : ''} sold
              {auction.completedAt
                ? ` · Completed ${new Date(auction.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : ''}
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full border uppercase ${
              isComplete
                ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                : 'text-green-400 border-green-400/30 bg-green-400/10'
            }`}
          >
            {isComplete ? 'Completed' : auction.status}
          </span>
        </div>
      </div>

      {/* Progress bar if still in progress */}
      {!isComplete && (
        <div className="card mb-6 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Draws completed</span>
            <span className="text-white font-semibold">{assignedCount} / {totalSpots}</span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all"
              style={{ width: totalSpots > 0 ? `${(assignedCount / totalSpots) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-heading text-white">RESULTS</h2>
        </div>

        {spotsWithItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">No paid spots yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {spotsWithItems.map((spot) => (
              <div key={spot.id} className="flex items-center justify-between px-6 py-4 gap-4">
                {/* Spot number */}
                <div className="w-10 shrink-0 text-center">
                  <span className="text-gold font-heading text-lg">#{spot.spotNumber}</span>
                </div>

                {/* Winner */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {spot.user.name || spot.user.email.split('@')[0]}
                  </p>
                </div>

                {/* Item won */}
                <div className="flex items-center gap-2 shrink-0">
                  {spot.item ? (
                    <>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${TIER_COLORS[spot.item.tier] ?? TIER_COLORS.C}`}
                      >
                        {spot.item.tier}
                      </span>
                      <span className="text-white text-sm font-semibold">{spot.item.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm italic">Pending draw…</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
