import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spinForSpot } from '@/lib/spinLogic'
import { getStripe } from '@/lib/stripe'

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

    // For Stripe — verify the PaymentIntent actually succeeded before marking paid
    let isPaid = false
    if (paymentMethod === 'stripe') {
      if (!paymentId) {
        return NextResponse.json({ error: 'Missing payment confirmation' }, { status: 400 })
      }
      const stripe = getStripe()
      const intent = await stripe.paymentIntents.retrieve(paymentId)
      if (intent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not confirmed by Stripe' }, { status: 402 })
      }
      // Idempotency: reject if this paymentId already has a spot
      const duplicate = await prisma.auctionSpot.findFirst({ where: { paymentId } })
      if (duplicate) {
        return NextResponse.json({ error: 'This payment has already been used' }, { status: 409 })
      }
      isPaid = true
    }
    // Venmo/CashApp — mark unpaid, admin confirms manually

    const spot = await prisma.auctionSpot.create({
      data: {
        auctionId,
        userId: session.user.id,
        spotNumber: nextSpot,
        paymentMethod,
        paymentId,
        paid: isPaid,
        // Shipping is bundled into the spot purchase price — mark paid when spot is paid
        shippingPaid: isPaid,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Spin immediately for paid spots
    let spinResult = null
    let finalSpot = spot
    if (isPaid) {
      spinResult = await spinForSpot(auctionId, spot.id)
      // Re-fetch the spot so assignedItemId is included in the response
      const updated = await prisma.auctionSpot.findUnique({
        where: { id: spot.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      if (updated) finalSpot = updated
    }

    return NextResponse.json({ spot: finalSpot, spinResult }, { status: 201 })
  } catch (err) {
    console.error('Buy spot error:', err)
    return NextResponse.json({ error: 'Failed to purchase spot' }, { status: 500 })
  }
}
