import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const spots = await prisma.auctionSpot.findMany({
    where: { paid: false },
    include: {
      user: { select: { name: true, email: true } },
      auction: { select: { name: true, spotPrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(spots)
}
