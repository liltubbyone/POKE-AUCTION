import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    return NextResponse.json(spot)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update spot' }, { status: 500 })
  }
}
