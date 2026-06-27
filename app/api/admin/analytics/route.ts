import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7)
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30)

  const [
    allPaidSpots,
    allAuctions,
    totalUsers,
    newUsers7d,
    newUsers30d,
    uniqueBuyers,
    allSpins,
    spins7d,
    allWS,
    ws7d,
  ] = await Promise.all([
    // All paid spots with auction price info
    prisma.auctionSpot.findMany({
      where: { paid: true },
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        auctionId: true,
        auction: { select: { spotPrice: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    // All auctions with their paid spot count
    prisma.auction.findMany({
      include: { spots: { where: { paid: true }, select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.auctionSpot.findMany({
      where: { paid: true },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.dailySpin.count(),
    prisma.dailySpin.count({ where: { createdAt: { gte: d7 } } }),
    prisma.wordSearchCompletion.count(),
    prisma.wordSearchCompletion.count({ where: { createdAt: { gte: d7 } } }),
  ])

  // ── Revenue totals ───────────────────────────────────────────────
  const totalRevenue = allPaidSpots.reduce((s, sp) => s + sp.auction.spotPrice, 0)
  const revenue7d    = allPaidSpots.filter(sp => sp.createdAt >= d7).reduce((s, sp) => s + sp.auction.spotPrice, 0)
  const revenue30d   = allPaidSpots.filter(sp => sp.createdAt >= d30).reduce((s, sp) => s + sp.auction.spotPrice, 0)
  const avgPerSpot   = allPaidSpots.length > 0 ? totalRevenue / allPaidSpots.length : 0

  // ── Daily data — last 14 days ────────────────────────────────────
  const dailyData: { date: string; revenue: number; spots: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const daySpots = allPaidSpots.filter(sp => sp.createdAt.toISOString().slice(0, 10) === dateStr)
    dailyData.push({
      date: dateStr,
      revenue: daySpots.reduce((s, sp) => s + sp.auction.spotPrice, 0),
      spots: daySpots.length,
    })
  }

  // ── Payment breakdown ────────────────────────────────────────────
  const paymentBreakdown: Record<string, number> = {}
  for (const sp of allPaidSpots) {
    const method = (sp.paymentMethod || 'unknown').toLowerCase()
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + 1
  }

  // ── Raffle performance ───────────────────────────────────────────
  const raffles = allAuctions.map((a) => {
    const sold = a.spots.length
    return {
      id:        a.id,
      name:      a.name,
      status:    a.status,
      totalSpots: a.totalSpots,
      soldSpots: sold,
      fillRate:  a.totalSpots > 0 ? Math.round((sold / a.totalSpots) * 100) : 0,
      revenue:   sold * a.spotPrice,
      spotPrice: a.spotPrice,
      createdAt: a.createdAt.toISOString(),
    }
  })

  // ── Conversion funnel ────────────────────────────────────────────
  // We track: registered users → buyers (users who bought ≥1 spot)
  const totalBuyers    = uniqueBuyers.length
  const conversionRate = totalUsers > 0 ? (totalBuyers / totalUsers) * 100 : 0

  // ── Spot count ───────────────────────────────────────────────────
  const totalSpots = allPaidSpots.length
  const spots7d    = allPaidSpots.filter(sp => sp.createdAt >= d7).length
  const spots30d   = allPaidSpots.filter(sp => sp.createdAt >= d30).length

  return NextResponse.json({
    revenue:  { total: totalRevenue, last7d: revenue7d, last30d: revenue30d, avgPerSpot },
    spots:    { total: totalSpots,   last7d: spots7d,   last30d: spots30d },
    users:    { total: totalUsers,   newLast7d: newUsers7d, newLast30d: newUsers30d, buyers: totalBuyers, conversionRate },
    dailyData,
    paymentBreakdown,
    raffles,
    engagement: { totalSpins: allSpins, spins7d, totalWordSearch: allWS, ws7d },
  })
}
