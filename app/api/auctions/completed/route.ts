import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const auctions = await prisma.auction.findMany({
    where: { status: 'completed' },
    select: { id: true, name: true, completedAt: true, totalSpots: true },
    orderBy: { completedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json(auctions)
}
