import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, type, value, minOrder, maxUses, expiresAt } = await req.json()

  if (!code?.trim()) return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  if (!['percent', 'fixed'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (!value || value <= 0) return NextResponse.json({ error: 'Value must be positive' }, { status: 400 })
  if (type === 'percent' && value > 100) return NextResponse.json({ error: 'Percent cannot exceed 100' }, { status: 400 })

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: parseFloat(minOrder ?? 0) || 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return NextResponse.json(coupon)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A coupon with that code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
