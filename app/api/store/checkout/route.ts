import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { calcShipping, parseRates } from '@/lib/shipping'

interface CartItem { id: string; quantity: number }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  const {
    items,
    couponCode,
    guestEmail,
    guestName,
    guestAddr,
  }: {
    items: CartItem[]
    couponCode?: string
    guestEmail?: string
    guestName?: string
    guestAddr?: string
  } = await req.json()

  if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

  // Guest validation
  if (!session?.user) {
    if (!guestEmail?.trim()) return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 })
    if (!guestName?.trim()) return NextResponse.json({ error: 'Name is required for guest checkout' }, { status: 400 })
    if (!guestAddr?.trim()) return NextResponse.json({ error: 'Shipping address is required for guest checkout' }, { status: 400 })
  }

  // Validate each item and compute subtotal
  const [inventoryItems, settings] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { id: { in: items.map((i) => i.id) }, forSale: true },
    }),
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
  ])

  if (inventoryItems.length !== items.length) {
    return NextResponse.json({ error: 'One or more items are not available' }, { status: 400 })
  }

  let subtotal = 0
  for (const cartItem of items) {
    const inv = inventoryItems.find((i) => i.id === cartItem.id)!
    if (!inv.storePrice) return NextResponse.json({ error: `${inv.name} has no price set` }, { status: 400 })
    if (inv.qty < cartItem.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${inv.name}` }, { status: 400 })
    }
    subtotal += inv.storePrice * cartItem.quantity
  }

  // Apply coupon if provided
  let discount = 0
  let couponId: string | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } })
    if (coupon && coupon.active && !(coupon.expiresAt && coupon.expiresAt < new Date()) &&
      (coupon.maxUses == null || coupon.usedCount < coupon.maxUses) && subtotal >= coupon.minOrder) {
      discount = coupon.type === 'percent'
        ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
        : Math.min(coupon.value, subtotal)
      couponId = coupon.id
    }
  }

  // Calculate shipping based on total weight
  const totalOz = items.reduce((sum, cartItem) => {
    const inv = inventoryItems.find((i) => i.id === cartItem.id)!
    return sum + (inv.weight ?? 0) * cartItem.quantity
  }, 0)

  const rates = parseRates(settings?.shippingRates ?? '[]')
  const threshold = settings?.freeShippingThreshold ?? 0
  const { amount: shipping, isFree: shippingIsFree } = calcShipping(totalOz, rates, threshold, subtotal - discount)

  const total = Math.max(0, subtotal - discount + shipping)
  const amountInCents = Math.round(total * 100)

  if (amountInCents < 50) {
    return NextResponse.json({ error: 'Order total too low' }, { status: 400 })
  }

  const stripe = getStripe()

  // Only create/retrieve Stripe customer for logged-in users
  let customerId: string | undefined
  if (session?.user) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.stripeCustomerId) {
      customerId = user.stripeCustomerId
    } else if (user) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined })
      customerId = customer.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    customer: customerId,
    metadata: {
      userId: session?.user?.id ?? '',
      guestEmail: guestEmail ?? '',
      guestName: guestName ?? '',
      guestAddr: guestAddr ?? '',
      couponId: couponId ?? '',
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      shipping: shipping.toString(),
      items: JSON.stringify(items),
    },
    description: `Cosmic Grails store order — ${items.length} item(s)`,
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    subtotal,
    discount,
    shipping,
    shippingIsFree,
    total,
  })
}
