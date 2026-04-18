import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AuctionRoom from './AuctionRoom'

async function getAuction(id: string) {
  return prisma.auction.findUnique({
    where: { id },
    include: {
      items: { include: { item: true } },
      spots: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { spotNumber: 'asc' },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const auction = await getAuction(params.id)
  if (!auction) return { title: 'Auction Not Found' }
  return {
    title: `${auction.name} — PokeAuction`,
    description: auction.description || `${auction.totalSpots} spots at $${auction.spotPrice} each`,
  }
}

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const auction = await getAuction(params.id)

  if (!auction) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AuctionRoom initialAuction={auction as any} />
}
