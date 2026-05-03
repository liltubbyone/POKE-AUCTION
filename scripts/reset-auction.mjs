import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env manually
try {
  const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of env.split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key?.trim() && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '')
    }
  }
} catch {}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const nameQuery = process.argv[2]
if (!nameQuery) {
  console.error('Usage: node scripts/reset-auction.mjs "<auction name or partial name>"')
  process.exit(1)
}

// Find auction by name (case-insensitive partial match)
const auctions = await prisma.auction.findMany({
  include: {
    items: { include: { item: true } },
    spots: { where: { assignedItemId: { not: null } }, select: { assignedItemId: true } },
  },
})

const auction = auctions.find((a) =>
  a.name.toLowerCase().includes(nameQuery.toLowerCase())
)

if (!auction) {
  console.error(`No auction found matching: "${nameQuery}"`)
  console.log('Available auctions:', auctions.map((a) => `${a.name} (${a.id})`).join('\n'))
  process.exit(1)
}

console.log(`\nResetting: "${auction.name}" (${auction.id})`)
console.log(`Status: ${auction.status}`)
console.log(`Spots to delete: ${(await prisma.auctionSpot.count({ where: { auctionId: auction.id } }))}`)

// Count how many times each auctionItem was assigned so we can restore inventory
const assignedCounts = {}
for (const spot of auction.spots) {
  if (spot.assignedItemId) {
    assignedCounts[spot.assignedItemId] = (assignedCounts[spot.assignedItemId] || 0) + 1
  }
}

// Restore inventory quantities
for (const [auctionItemId, count] of Object.entries(assignedCounts)) {
  const auctionItem = auction.items.find((ai) => ai.id === auctionItemId)
  if (auctionItem) {
    await prisma.inventoryItem.update({
      where: { id: auctionItem.itemId },
      data: { qty: { increment: count } },
    })
    console.log(`↑ Restored ${count}x ${auctionItem.item.name} to inventory`)
  }
}

// Delete all spots
await prisma.auctionSpot.deleteMany({ where: { auctionId: auction.id } })
console.log('✓ All spots deleted')

// Reset auction status
await prisma.auction.update({
  where: { id: auction.id },
  data: { status: 'active', completedAt: null },
})
console.log('✓ Auction reset to active')

console.log(`\n✅ "${auction.name}" is ready to go again!`)
await prisma.$disconnect()
