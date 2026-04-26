export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AuctionCard from '@/components/AuctionCard'
import Link from 'next/link'

async function getAuctions() {
  return prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] } },
    include: {
      items: { include: { item: true } },
      spots: { where: { paid: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getCompletedAuctions() {
  return prisma.auction.findMany({
    where: { status: 'completed' },
    include: { spots: { where: { paid: true } } },
    orderBy: { completedAt: 'desc' },
  })
}

export default async function AuctionsPage() {
  const [auctions, completed] = await Promise.all([getAuctions(), getCompletedAuctions()])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Live Now</p>
        <h1 className="text-4xl font-heading text-white">All Auctions</h1>
      </div>

      {/* Active / Spinning */}
      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl py-16 text-center mb-16"
          style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(30,30,53,0.8)' }}
        >
          <h3 className="text-2xl font-heading text-gray-400 mb-2">No Active Auctions</h3>
          <p className="text-gray-600 text-sm">Check back soon — new auctions are added regularly.</p>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Past Shows</p>
            <h2 className="text-2xl font-heading text-white">Completed Auctions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completed.map((auction) => (
              <div
                key={auction.id}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(30,30,53,0.8)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-heading text-white leading-tight">{auction.name}</h3>
                  <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full text-blue-400 bg-blue-400/10 border border-blue-400/30 uppercase">
                    Completed
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  {auction.spots.length} spot{auction.spots.length !== 1 ? 's' : ''} sold
                  {auction.completedAt
                    ? ` · ${new Date(auction.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : ''}
                </p>
                <Link href={`/auction/${auction.id}/results`} className="mt-auto text-center btn-gold text-sm py-2">
                  View Results →
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
