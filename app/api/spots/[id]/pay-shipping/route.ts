import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentIntentId } = await req.json()
  if (!paymentIntentId) return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })

  const spot = await prisma.auctionSpot.findUnique({ where: { id: params.id } })
  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  if (spot.userId !== session.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (spot.shippingPaid) return NextResponse.json({ error: 'Shipping already paid' }, { status: 400 })

  // Verify with Stripe that payment actually succeeded
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (intent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Shipping payment not confirmed by Stripe' }, { status: 402 })
  }
  if (intent.metadata?.spotId !== params.id) {
    return NextResponse.json({ error: 'Payment does not match this spot' }, { status: 400 })
  }

  const updated = await prisma.auctionSpot.update({
    where: { id: params.id },
    data: {
      shippingPaid: true,
      shippingPaymentId: paymentIntentId,
      shippingCost: intent.amount / 100,
    },
  })

  return NextResponse.json({ success: true, spot: updated })
}
