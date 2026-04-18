import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { item: true } },
        spots: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { spotNumber: 'asc' },
        },
      },
    })

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    return NextResponse.json(auction)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch auction' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const auction = await prisma.auction.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(auction)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update auction' }, { status: 500 })
  }
}
