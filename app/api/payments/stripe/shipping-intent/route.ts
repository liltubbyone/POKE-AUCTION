import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getFedexRate } from '@/lib/fedex'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { spotId } = await req.json()
  if (!spotId) return NextResponse.json({ error: 'spotId required' }, { status: 400 })

  const spot = await prisma.auctionSpot.findUnique({
    where: { id: spotId },
    include: {
      auction: { include: { items: { include: { item: true } } } },
      user: true,
    },
  })

  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  if (spot.userId !== session.user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (!spot.assignedItemId) return NextResponse.json({ error: 'No item assigned to this spot yet' }, { status: 400 })
  if (spot.shippingPaid) return NextResponse.json({ error: 'Shipping already paid' }, { status: 400 })

  const auctionItem = spot.auction.items.find((ai) => ai.id === spot.assignedItemId)

  // Get live FedEx Ground rate using buyer's saved address
  let shippingCost = auctionItem?.item.shippingCost ?? 10
  try {
    let addr: Record<string, string> = {}
    try { addr = JSON.parse(spot.user.address || '{}') } catch {}
    if (addr.street && addr.city && addr.state && addr.zip) {
      shippingCost = await getFedexRate({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
      })
    }
  } catch (err) {
    console.error('FedEx rate fetch failed, falling back to flat rate:', err)
  }

  const amountInCents = Math.round(shippingCost * 100)
  const stripe = getStripe()

  // Get or create Stripe customer
  let customerId = spot.user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: spot.user.email,
      name: spot.user.name || undefined,
    })
    customerId = customer.id
    await prisma.user.update({ where: { id: spot.user.id }, data: { stripeCustomerId: customerId } })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    customer: customerId,
    metadata: { spotId, userId: session.user.id, type: 'shipping' },
    description: `Shipping for ${auctionItem?.item.name ?? 'auction item'} — Spot #${spot.spotNumber}`,
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    shippingCost,
    itemName: auctionItem?.item.name,
  })
}
