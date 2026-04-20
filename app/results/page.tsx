export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ResultsPage() {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning', 'completed'] } },
    include: {
      spots: { where: { paid: true } },
      items: { include: { item: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusColors: Record<string, { text: string; bg: string; border: string }> = {
    active:    { text: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)'  },
    spinning:  { text: '#FFD700', bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.3)'    },
    completed: { text: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)'  },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">All Shows</p>
        <h1 className="text-5xl font-heading text-white">RESULTS</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Every spin is posted here in real time. Click any show to see the full breakdown.
        </p>
      </div>

      {auctions.length === 0 ? (
        <div
          className="rounded-2xl py-20 text-center"
          style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(30,30,53,0.8)' }}
        >
          <p className="text-gray-500 text-lg">No auctions yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => {
            const paidSpots = auction.spots.length
            const assignedSpots = auction.spots.filter((s) => s.assignedItemId).length
            const status = statusColors[auction.status] ?? statusColors.active
            const totalItems = auction.items.reduce((sum, ai) => sum + ai.quantity, 0)

            return (
              <Link
                key={auction.id}
                href={`/auction/${auction.id}/results`}
                className="block rounded-2xl p-6 transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: 'rgba(13,13,26,0.9)',
                  border: '1px solid rgba(30,30,53,0.8)',
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-xl font-heading text-white">{auction.name}</h2>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                        style={{ color: status.text, background: status.bg, border: `1px solid ${status.border}` }}
                      >
                        {auction.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {new Date(auction.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {auction.completedAt
                        ? ` · Completed ${new Date(auction.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right flex-shrink-0">
                    <div>
                      <p className="text-white font-heading text-2xl">{assignedSpots}<span className="text-gray-600 text-base font-body">/{totalItems}</span></p>
                      <p className="text-gray-600 text-xs uppercase tracking-wider">Spins Done</p>
                    </div>
                    <div>
                      <p className="text-white font-heading text-2xl">{paidSpots}</p>
                      <p className="text-gray-600 text-xs uppercase tracking-wider">Spots Sold</p>
                    </div>
                    <div className="text-gold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Spin progress bar */}
                {auction.status !== 'completed' && totalItems > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{assignedSpots} spins posted</span>
                      <span>{totalItems - assignedSpots} remaining</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalItems > 0 ? (assignedSpots / totalItems) * 100 : 0}%`,
                          background: 'linear-gradient(90deg, #B8860B, #FFD700)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
