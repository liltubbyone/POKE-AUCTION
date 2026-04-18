import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const item = await prisma.inventoryItem.create({ data: body })
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
