import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createFedexLabel } from '@/lib/fedex'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { spotId } = await req.json()
  if (!spotId) return NextResponse.json({ error: 'spotId required' }, { status: 400 })

  const spot = await prisma.auctionSpot.findUnique({
    where: { id: spotId },
    include: {
      user: true,
      auction: { include: { items: { include: { item: true } } } },
    },
  })

  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
  if (!spot.shippingPaid) return NextResponse.json({ error: 'Shipping not paid yet' }, { status: 400 })
  if (spot.shipped) return NextResponse.json({ error: 'Already shipped' }, { status: 400 })

  let addr: Record<string, string> = {}
  try { addr = JSON.parse(spot.user.address || '{}') } catch {}

  if (!addr.street || !addr.city || !addr.state || !addr.zip) {
    return NextResponse.json({ error: 'Buyer address incomplete' }, { status: 400 })
  }

  const auctionItem = spot.auction.items.find((ai) => ai.id === spot.assignedItemId)
  const itemDescription = auctionItem?.item.name ?? 'Pokemon Cards'

  const { trackingNumber, labelBase64 } = await createFedexLabel(
    {
      name: spot.user.name || spot.user.email.split('@')[0],
      phone: addr.phone || '4174304228',
      email: spot.user.email,
      address: {
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
      },
    },
    itemDescription,
  )

  await prisma.auctionSpot.update({
    where: { id: spotId },
    data: { shipped: true, trackingNumber },
  })

  return NextResponse.json({ trackingNumber, labelBase64 })
}
