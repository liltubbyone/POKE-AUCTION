import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin: mark a spot as shipped with a tracking number
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trackingNumber } = await req.json()
  if (!trackingNumber?.trim()) return NextResponse.json({ error: 'Tracking number required' }, { status: 400 })

  const spot = await prisma.auctionSpot.findUnique({ where: { id: params.id } })
  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 })

  const updated = await prisma.auctionSpot.update({
    where: { id: params.id },
    data: { shipped: true, trackingNumber: trackingNumber.trim() },
    include: {
      user: { select: { email: true, name: true } },
      auction: { select: { name: true } },
    },
  })

  return NextResponse.json({ success: true, spot: updated })
}
