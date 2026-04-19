import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spinForSpot } from '@/lib/spinLogic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'You must be logged in to buy a spot' }, { status: 401 })
  }

  try {
    const { auctionId, paymentMethod, paymentId } = await req.json()

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { spots: { where: { paid: true } } },
    })

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'This auction is not accepting new spots' }, { status: 400 })
    }

    const paidSpots = auction.spots.length
    if (paidSpots >= auction.totalSpots) {
      return NextResponse.json({ error: 'All spots are sold out!' }, { status: 400 })
    }

    // Find next available spot number
    const takenNumbers = auction.spots.map((s) => s.spotNumber)
    let nextSpot = 1
    while (takenNumbers.includes(nextSpot)) {
      nextSpot++
    }

    // For Stripe/PayPal - payment must be verified
    // For Venmo/CashApp - mark as unpaid, admin confirms
    const isPaid = paymentMethod === 'stripe' || paymentMethod === 'paypal'

    const spot = await prisma.auctionSpot.create({
      data: {
        auctionId,
        userId: session.user.id,
        spotNumber: nextSpot,
        paymentMethod,
        paymentId,
        paid: isPaid,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Spin immediately for paid spots
    let spinResult = null
    if (isPaid) {
      spinResult = await spinForSpot(auctionId, spot.id)
    }

    return NextResponse.json({ spot, spinResult }, { status: 201 })
  } catch (err) {
    console.error('Buy spot error:', err)
    return NextResponse.json({ error: 'Failed to purchase spot' }, { status: 500 })
  }
}
