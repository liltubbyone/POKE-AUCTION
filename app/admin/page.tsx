import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

async function getAdminData() {
  const [auctions, inventory, recentSpots] = await Promise.all([
    prisma.auction.findMany({
      include: {
        spots: { where: { paid: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryItem.findMany({ orderBy: [{ tier: 'asc' }] }),
    prisma.auctionSpot.findMany({
      where: { paid: true },
      include: {
        user: { select: { name: true, email: true } },
        auction: { select: { name: true, spotPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const totalRevenue = recentSpots.reduce((sum, s) => sum + s.auction.spotPrice, 0)
  const activeAuctions = auctions.filter((a) => a.status === 'active')
  const pendingSpots = await prisma.auctionSpot.findMany({
    where: { paid: false },
    include: {
      user: { select: { name: true, email: true } },
      auction: { select: { name: true, spotPrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { auctions, inventory, recentSpots, totalRevenue, activeAuctions, pendingSpots }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    redirect('/')
  }

  const { auctions, inventory, recentSpots, totalRevenue, activeAuctions, pendingSpots } =
    await getAdminData()

  const lowStock = inventory.filter((i) => i.qty <= 2 && i.tier !== 'EXCLUDE')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-heading text-white mb-1">ADMIN DASHBOARD</h1>
          <p className="text-gray-400 text-sm">Logged in as {session.user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/inventory" className="btn-outline text-sm py-2 px-4">
            Manage Inventory
          </Link>
          <Link href="/admin/auctions/new" className="btn-gold text-sm py-2 px-4">
            + Create Auction
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-gold' },
          { label: 'Active Auctions', value: activeAuctions.length, color: 'text-green-400' },
          { label: 'Total Spots Sold', value: recentSpots.length, color: 'text-blue-400' },
          { label: 'Pending Payments', value: pendingSpots.length, color: 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className={`text-3xl font-heading ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Auctions */}
        <div>
          <h2 className="text-2xl font-heading text-white mb-4">ACTIVE AUCTIONS</h2>
          {auctions.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No auctions yet</div>
          ) : (
            <div className="space-y-3">
              {auctions.map((auction) => {
                const paid = auction.spots.length
                const pct = Math.round((paid / auction.totalSpots) * 100)
                return (
                  <div key={auction.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-heading text-white text-lg">{auction.name}</h3>
                        <p className="text-gray-500 text-xs">{formatDate(auction.createdAt)}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded border uppercase ${
                          auction.status === 'active'
                            ? 'text-green-400 border-green-400/30 bg-green-400/10'
                            : auction.status === 'completed'
                            ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                            : 'text-gray-400 border-gray-400/30 bg-gray-400/10'
                        }`}
                      >
                        {auction.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{paid}/{auction.totalSpots} spots</span>
                      <span className="text-gold font-bold">{formatCurrency(auction.spotPrice)}/spot</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/auction/${auction.id}`}
                        className="flex-1 text-center border border-border text-gray-300 hover:text-white py-1.5 rounded text-xs font-semibold transition-colors"
                      >
                        View Room
                      </Link>
                      <span className="text-gray-600 text-xs self-center">
                        Revenue: {formatCurrency(paid * auction.spotPrice)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending Payments */}
          {pendingSpots.length > 0 && (
            <div>
              <h2 className="text-2xl font-heading text-yellow-400 mb-4">
                PENDING PAYMENTS ({pendingSpots.length})
              </h2>
              <div className="space-y-2">
                {pendingSpots.map((spot) => (
                  <PendingSpotRow key={spot.id} spot={spot} />
                ))}
              </div>
            </div>
          )}

          {/* Low Stock */}
          {lowStock.length > 0 && (
            <div>
              <h2 className="text-2xl font-heading text-red-400 mb-4">LOW STOCK ALERT</h2>
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="card p-3 flex justify-between items-center">
                    <span className="text-white text-sm">{item.name}</span>
                    <span className={`font-bold text-sm ${item.qty === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {item.qty === 0 ? 'SOLD OUT' : `${item.qty} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          <div>
            <h2 className="text-2xl font-heading text-white mb-4">RECENT SPOTS SOLD</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentSpots.map((spot) => (
                <div key={spot.id} className="card p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {spot.user.name || spot.user.email.split('@')[0]}
                      </p>
                      <p className="text-gray-500 text-xs">{spot.auction.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-bold text-sm">{formatCurrency(spot.auction.spotPrice)}</p>
                      <p className="text-gray-500 text-xs">Spot #{spot.spotNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PendingSpotRow({ spot }: { spot: any }) {
  return (
    <div className="card p-3 border-yellow-500/20">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white text-sm">
            {spot.user.name || spot.user.email.split('@')[0]} — {spot.paymentMethod?.toUpperCase()}
          </p>
          <p className="text-gray-500 text-xs">{spot.auction.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-yellow-400 text-xs font-semibold">PENDING</span>
          <ApproveButton spotId={spot.id} />
        </div>
      </div>
    </div>
  )
}

function ApproveButton({ spotId }: { spotId: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { prisma } = await import('@/lib/prisma')
        await prisma.auctionSpot.update({
          where: { id: spotId },
          data: { paid: true },
        })
      }}
    >
      <button
        type="submit"
        className="text-xs bg-green-900/50 border border-green-500/40 text-green-300 hover:bg-green-900 px-3 py-1 rounded font-semibold transition-colors"
      >
        Approve
      </button>
    </form>
  )
}
