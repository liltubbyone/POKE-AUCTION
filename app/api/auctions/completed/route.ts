import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Returns all auctions so the Results dropdown is always populated
export async function GET() {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning', 'completed'] } },
    select: { id: true, name: true, status: true, completedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(auctions)
}
