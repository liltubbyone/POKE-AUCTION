import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    where: { forSale: true, tier: { not: 'EXCLUDE' } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(items)
}
