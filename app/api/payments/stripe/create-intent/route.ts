import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { auctionId } = await req.json()

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    })

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    const amountInCents = Math.round(auction.spotPrice * 100)
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        auctionId,
        userId: session.user.id,
        spotPrice: auction.spotPrice.toString(),
      },
      description: `PokeAuction spot - ${auction.name}`,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    console.error('Stripe error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
