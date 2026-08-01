export const dynamic = 'force-dynamic'

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://poke-auction-wheat.vercel.app'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const auction = await getAuction(params.id)
  if (!auction) return { title: 'Auction Not Found' }
  const firstImage = auction.items[0]?.item?.imageUrl || undefined
  return {
    title: auction.name,
    description: auction.description || `${auction.items.map((i: any) => i.item.name).join(', ')} — ${auction.totalSpots} spots at $${auction.spotPrice} each.`,
    openGraph: {
      title: `${auction.name} — Cosmic Grails`,
      description: auction.description || `Win this raffle for $${auction.spotPrice} per spot.`,
      images: firstImage ? [{ url: firstImage }] : [{ url: `${SITE_URL}/logo.png` }],
    },
  }
}

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const [auction, settings] = await Promise.all([
    getAuction(params.id),
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
  ])

  if (!auction) {
    notFound()
  }

  // Build JSON-LD: one Product entry per auction item that has a name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (auction as any).items.map((ai: any) => {
    const item = ai.item
    const product: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.name,
      description: `${item.name} available via raffle on Cosmic Grails. $${auction.spotPrice} per spot.`,
      offers: {
        '@type': 'Offer',
        price: auction.spotPrice,
        priceCurrency: 'USD',
        availability: auction.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${SITE_URL}/auction/${auction.id}`,
        seller: { '@type': 'Organization', name: 'Cosmic Grails' },
      },
    }
    if (item.imageUrl) product.image = item.imageUrl
    if (item.sku) product.sku = item.sku
    if (item.gtin) product.gtin = item.gtin
    return product
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <>
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(products.length === 1 ? products[0] : products) }} />
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AuctionRoom initialAuction={auction as any} customWheelTheme={(settings as any)?.customWheelTheme ?? '{}'} />
    </>
  )
}
