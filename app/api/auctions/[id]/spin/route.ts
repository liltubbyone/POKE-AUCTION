import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spinForSpot } from '@/lib/spinLogic'

// Admin can manually spin for a specific spot (fallback if auto-spin failed)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { spotId } = body

    if (!spotId) {
      return NextResponse.json({ error: 'spotId required' }, { status: 400 })
    }

    const spot = await prisma.auctionSpot.findUnique({
      where: { id: spotId },
    })

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }
    if (!spot.paid) {
      return NextResponse.json({ error: 'Payment not verified for this spot' }, { status: 400 })
    }
    if (spot.assignedItemId) {
      return NextResponse.json({ error: 'Spot already has an item assigned' }, { status: 400 })
    }

    const result = await spinForSpot(params.id, spotId)

    if (!result) {
      return NextResponse.json({ error: 'No items remaining in this auction' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Spin error:', err)
    return NextResponse.json({ error: 'Failed to spin' }, { status: 500 })
  }
}
