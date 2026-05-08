import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spinForSpot, spinAllUnassigned } from '@/lib/spinLogic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await prisma.auctionSpot.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const spot = await prisma.auctionSpot.update({
      where: { id: params.id },
      data: body,
      include: {
        user: { select: { id: true, name: true, email: true } },
        auction: { include: { items: true } },
      },
    })

    // Auto-spin when payment is verified and no item assigned yet
    if (body.paid === true && !spot.assignedItemId) {
      if (spot.auction.spinMode === 'all-filled') {
        const paidCount = await prisma.auctionSpot.count({ where: { auctionId: spot.auctionId, paid: true } })
        const auctionTotal = spot.auction.items.reduce((sum: number, ai: { quantity: number }) => sum + ai.quantity, 0) || spot.auction.totalSpots
        if (paidCount >= auctionTotal) {
          await spinAllUnassigned(spot.auctionId)
        }
        return NextResponse.json({ spot, spinResult: null })
      } else {
        const spinResult = await spinForSpot(spot.auctionId, spot.id)
        return NextResponse.json({ spot, spinResult })
      }
    }

    return NextResponse.json(spot)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update spot' }, { status: 500 })
  }
}
