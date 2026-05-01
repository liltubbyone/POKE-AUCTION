import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const winners = await prisma.auctionSpot.findMany({
    where: { assignedItemId: { not: null }, paid: true },
    include: {
      user: { select: { name: true, email: true } },
      auction: {
        include: {
          items: { include: { item: { select: { name: true, imageUrl: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const feed = winners.map((spot) => {
    const auctionItem = spot.auction.items.find((ai) => ai.id === spot.assignedItemId)
    const displayName = spot.user.name || spot.user.email.split('@')[0]
    const masked = displayName.length > 2
      ? displayName[0] + '*'.repeat(displayName.length - 2) + displayName[displayName.length - 1]
      : displayName

    return {
      id: spot.id,
      user: masked,
      item: auctionItem?.item.name ?? 'Mystery Item',
      itemImage: auctionItem?.item.imageUrl ?? null,
      raffle: spot.auction.name,
      spotNumber: spot.spotNumber,
      createdAt: spot.createdAt,
    }
  })

  return NextResponse.json(feed)
}
