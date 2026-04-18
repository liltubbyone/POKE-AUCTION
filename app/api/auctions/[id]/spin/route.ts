import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSpinSeed, seededShuffle } from '@/lib/utils'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { item: true } },
        spots: { where: { paid: true }, orderBy: { spotNumber: 'asc' } },
      },
    })

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    const paidSpots = auction.spots.filter((s) => s.paid)
    if (paidSpots.length < auction.totalSpots) {
      return NextResponse.json(
        { error: `Not all spots are filled. ${paidSpots.length}/${auction.totalSpots} sold.` },
        { status: 400 }
      )
    }

    // Build the item pool (expand by quantity)
    const itemPool: string[] = []
    for (const ai of auction.items) {
      for (let i = 0; i < ai.quantity; i++) {
        itemPool.push(ai.id)
      }
    }

    if (itemPool.length !== auction.totalSpots) {
      return NextResponse.json(
        { error: `Item count mismatch: ${itemPool.length} items vs ${auction.totalSpots} spots` },
        { status: 400 }
      )
    }

    // Generate seed and shuffle
    const seed = generateSpinSeed()
    const shuffledItems = seededShuffle(itemPool, seed)

    // Mark auction as spinning
    await prisma.auction.update({
      where: { id: params.id },
      data: { status: 'spinning', spinSeed: seed },
    })

    // Assign items to spots
    for (let i = 0; i < paidSpots.length; i++) {
      const spot = paidSpots[i]
      const assignedAuctionItemId = shuffledItems[i]

      await prisma.auctionSpot.update({
        where: { id: spot.id },
        data: { assignedItemId: assignedAuctionItemId },
      })
    }

    // Mark auction as completed
    const completedAuction = await prisma.auction.update({
      where: { id: params.id },
      data: { status: 'completed', completedAt: new Date() },
      include: {
        items: { include: { item: true } },
        spots: {
          where: { paid: true },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { spotNumber: 'asc' },
        },
      },
    })

    // Decrement inventory quantities
    for (const ai of auction.items) {
      await prisma.inventoryItem.update({
        where: { id: ai.itemId },
        data: { qty: { decrement: ai.quantity } },
      })
    }

    return NextResponse.json({
      success: true,
      seed,
      auction: completedAuction,
    })
  } catch (err) {
    console.error('Spin error:', err)
    return NextResponse.json({ error: 'Failed to spin' }, { status: 500 })
  }
}
