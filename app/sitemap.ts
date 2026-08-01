import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://poke-auction-wheat.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const auctions = await prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] } },
    select: { id: true, createdAt: true },
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                       lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE}/browse`,           lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/auctions`,         lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/inventory`,        lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE}/games`,            lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/giveaways`,        lastModified: new Date(), changeFrequency: 'daily',  priority: 0.7 },
    { url: `${BASE}/results`,          lastModified: new Date(), changeFrequency: 'daily',  priority: 0.6 },
    { url: `${BASE}/poke-flap`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/word-search`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/daily-spin`,       lastModified: new Date(), changeFrequency: 'daily',  priority: 0.5 },
  ]

  const auctionRoutes: MetadataRoute.Sitemap = auctions.map((a) => ({
    url: `${BASE}/auction/${a.id}`,
    lastModified: a.createdAt,
    changeFrequency: 'hourly' as const,
    priority: 0.85,
  }))

  return [...staticRoutes, ...auctionRoutes]
}
