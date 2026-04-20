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

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Shipping is included on the FIRST paid spot per user per auction.
    // Subsequent spots in the same show ship together — no extra shipping fee.
    const existingPaidSpot = await prisma.auctionSpot.findFirst({
      where: { auctionId, userId: session.user.id, paid: true },
    })
    const includeShipping = !existingPaidSpot
    const shippingRate = auction.shippingRate ?? 8
    const total = includeShipping ? auction.spotPrice + shippingRate : auction.spotPrice
    const amountInCents = Math.round(total * 100)

    const stripe = getStripe()

    // Get or create Stripe customer
    let customerId: string | undefined
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.stripeCustomerId) {
      customerId = user.stripeCustomerId
    } else if (user) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
      })
      customerId = customer.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        auctionId,
        userId: session.user.id,
        spotPrice: auction.spotPrice.toString(),
        shippingRate: includeShipping ? shippingRate.toString() : '0',
        includeShipping: includeShipping.toString(),
      },
      description: `PokeAuction spot${includeShipping ? ' + shipping' : ''} — ${auction.name}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      total,
      spotPrice: auction.spotPrice,
      shippingRate: includeShipping ? shippingRate : 0,
      includeShipping,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    console.error('Stripe error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
