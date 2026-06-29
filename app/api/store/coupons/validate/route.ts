import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { code, subtotal } = await req.json()
  if (!code) return NextResponse.json({ error: 'Coupon code required' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 })
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
  }
  if (subtotal != null && subtotal < coupon.minOrder) {
    return NextResponse.json({
      error: `This coupon requires a minimum order of $${coupon.minOrder.toFixed(2)}`,
    }, { status: 400 })
  }

  const discount =
    coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal)

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  })
}
