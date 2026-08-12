import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcShipping, parseRates } from '@/lib/shipping'

export async function POST(req: Request) {
  const { items, subtotal }: { items: { id: string; quantity: number }[]; subtotal: number } = await req.json()

  if (!items?.length) {
    return NextResponse.json({ shipping: 0, isFree: false, totalOz: 0 })
  }

  const [inventoryItems, settings] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { id: { in: items.map((i) => i.id) } },
      select: { id: true, weight: true },
    }),
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
  ])

  const totalOz = items.reduce((sum, cartItem) => {
    const inv = inventoryItems.find((i) => i.id === cartItem.id)
    return sum + (inv?.weight ?? 0) * cartItem.quantity
  }, 0)

  const rates = parseRates(settings?.shippingRates ?? '[]')
  const threshold = settings?.freeShippingThreshold ?? 0
  const { amount, isFree } = calcShipping(totalOz, rates, threshold, subtotal)

  return NextResponse.json({ shipping: amount, isFree, totalOz })
}
