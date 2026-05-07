export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AuctionCard from '@/components/AuctionCard'
import WordSearchCard from '@/components/WordSearchCard'
import Link from 'next/link'

async function getGames() {
  return prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] }, category: 'game' },
    include: {
      items: { include: { item: true } },
      spots: { where: { paid: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function GamesPage() {
  const games = await getGames()

  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-16 md:py-24"
        style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">Cosmic Grails</p>
          <h1 className="text-6xl md:text-7xl font-heading text-white mb-3">
            <span className="cosmic-title-shimmer">GAMES</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Buy a spot, spin the wheel, win rare grails.
          </p>
        </div>
      </div>

      {/* Games grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => (
            <AuctionCard key={game.id} auction={game} />
          ))}
          <WordSearchCard />
        </div>
      </div>
    </div>
  )
}
