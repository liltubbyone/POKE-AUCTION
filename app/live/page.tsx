export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AuctionCard from '@/components/AuctionCard'
import Link from 'next/link'

async function getLiveAuctions() {
  return prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] } },
    include: {
      items: { include: { item: true } },
      spots: { where: { paid: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function LivePage() {
  const auctions = await getLiveAuctions()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live Now
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          LIVE <span className="gold-gradient-text">EVENTS</span>
        </h1>
        <p className="text-gray-400 max-w-xl leading-relaxed">
          These events are open right now. Buy a spot before they fill up.
        </p>
      </div>

      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl py-24 text-center"
          style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(30,30,53,0.8)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.12)' }}
          >
            <svg className="w-8 h-8 text-gold opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-heading text-gray-400 mb-2">No Live Events Right Now</h3>
          <p className="text-gray-600 text-sm mb-6">Check back soon — new drops happen regularly.</p>
          <Link href="/results" className="btn-outline text-sm py-2 px-6">View Past Results</Link>
        </div>
      )}
    </div>
  )
}
