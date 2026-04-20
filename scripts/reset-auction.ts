require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function resetAuction() {
  // Find the active/most recent auction
  const auction = await prisma.auction.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      spots: { where: { assignedItemId: { not: null } }, select: { assignedItemId: true } },
      items: { include: { item: true } },
    },
  })

  if (!auction) {
    console.log('No auction found.')
    return
  }

  console.log(`Resetting auction: "${auction.name}" (${auction.id})`)
  console.log(`  Status: ${auction.status}`)
  console.log(`  Spots to clear: ${auction.spots.length}`)

  // Count how many times each auction item was assigned (to restore inventory)
  const assignedCounts: Record<string, number> = {}
  for (const spot of auction.spots) {
    if (spot.assignedItemId) {
      assignedCounts[spot.assignedItemId] = (assignedCounts[spot.assignedItemId] || 0) + 1
    }
  }

  // Restore inventory quantities
  for (const [auctionItemId, count] of Object.entries(assignedCounts)) {
    const auctionItem = auction.items.find((ai: any) => ai.id === auctionItemId)
    if (auctionItem) {
      await prisma.inventoryItem.update({
        where: { id: auctionItem.itemId },
        data: { qty: { increment: count } },
      })
      console.log(`  Restored ${count}x ${auctionItem.item.name}`)
    }
  }

  // Delete all spots for this auction
  const deleted = await prisma.auctionSpot.deleteMany({
    where: { auctionId: auction.id },
  })
  console.log(`  Deleted ${deleted.count} spots`)

  // Reset auction to active
  await prisma.auction.update({
    where: { id: auction.id },
    data: {
      status: 'active',
      spinSeed: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Auction reset successfully — ready for fresh spots!')
}

resetAuction()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
