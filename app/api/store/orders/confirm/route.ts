import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentIntentId } = await req.json()
  if (!paymentIntentId) return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })

  const stripe = getStripe()
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  }
  if (pi.metadata.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Prevent duplicate order creation
  const existing = await prisma.storeOrder.findFirst({ where: { paymentId: paymentIntentId } })
  if (existing) return NextResponse.json({ orderId: existing.id })

  const items: { id: string; quantity: number }[] = JSON.parse(pi.metadata.items || '[]')
  const couponId = pi.metadata.couponId || null
  const subtotal = parseFloat(pi.metadata.subtotal || '0')
  const discount = parseFloat(pi.metadata.discount || '0')
  const total = subtotal - discount

  // Get prices from DB (don't trust client metadata for prices)
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { id: { in: items.map((i) => i.id) } },
  })

  // Create order + decrement stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    for (const cartItem of items) {
      const inv = inventoryItems.find((i) => i.id === cartItem.id)!
      await tx.inventoryItem.update({
        where: { id: cartItem.id },
        data: { qty: { decrement: cartItem.quantity } },
      })
      if (inv.qty - cartItem.quantity < 0) {
        throw new Error(`${inv.name} is out of stock`)
      }
    }

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } })
    }

    const newOrder = await tx.storeOrder.create({
      data: {
        userId: session.user.id,
        status: 'paid',
        subtotal,
        discount,
        total,
        couponId: couponId || null,
        paymentId: paymentIntentId,
        paymentMethod: 'stripe',
        shippingAddr: (await tx.user.findUnique({ where: { id: session.user.id }, select: { address: true } }))?.address || null,
        items: {
          create: items.map((cartItem) => {
            const inv = inventoryItems.find((i) => i.id === cartItem.id)!
            return { itemId: cartItem.id, quantity: cartItem.quantity, priceEach: inv.storePrice ?? 0 }
          }),
        },
      },
    })
    return newOrder
  })

  return NextResponse.json({ orderId: order.id })
}
