import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spinForSpot } from '@/lib/spinLogic'

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
        auction: true,
      },
    })

    // Auto-spin when payment is verified and no item assigned yet
    if (body.paid === true && !spot.assignedItemId) {
      const spinResult = await spinForSpot(spot.auctionId, spot.id)
      return NextResponse.json({ spot, spinResult })
    }

    return NextResponse.json(spot)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update spot' }, { status: 500 })
  }
}
