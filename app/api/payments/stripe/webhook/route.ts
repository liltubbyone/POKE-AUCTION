import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { spinForSpot } from '@/lib/spinLogic'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature error:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const { auctionId, userId } = intent.metadata

    if (auctionId && userId) {
      // Idempotency check
      const existing = await prisma.auctionSpot.findFirst({
        where: { paymentId: intent.id },
      })

      if (!existing) {
        const auction = await prisma.auction.findUnique({
          where: { id: auctionId },
          include: { spots: { where: { paid: true } } },
        })

        if (auction) {
          const takenNumbers = auction.spots.map((s) => s.spotNumber)
          let nextSpot = 1
          while (takenNumbers.includes(nextSpot)) nextSpot++

          const newSpot = await prisma.auctionSpot.create({
            data: {
              auctionId,
              userId,
              spotNumber: nextSpot,
              paymentMethod: 'stripe',
              paymentId: intent.id,
              paid: true,
            },
          })

          // Immediately spin for this spot
          await spinForSpot(auctionId, newSpot.id)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
