import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        items: { include: { item: true } },
        spots: { where: { paid: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(auctions)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, spotPrice, totalSpots, items, expiresInDays, shippingRate } = body

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    const auction = await prisma.auction.create({
      data: {
        name,
        description,
        spotPrice: parseFloat(spotPrice),
        totalSpots: parseInt(totalSpots),
        shippingRate: shippingRate != null ? parseFloat(shippingRate) : 8,
        expiresAt,
        items: {
          create: items.map((item: { itemId: string; quantity: number }) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { item: true } } },
    })

    return NextResponse.json(auction, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create auction' }, { status: 500 })
  }
}
