import { prisma } from './prisma'

/**
 * Spins for a single spot immediately upon payment verification.
 * Picks a random remaining item from the auction pool, assigns it
 * to the spot, and decrements inventory.
 */
export async function spinForSpot(auctionId: string, spotId: string) {
  // Get all auction items
  const auctionItems = await prisma.auctionItem.findMany({
    where: { auctionId },
    include: { item: true },
  })

  // Count how many times each auction item has already been assigned
  const assignedSpots = await prisma.auctionSpot.findMany({
    where: { auctionId, assignedItemId: { not: null } },
    select: { assignedItemId: true },
  })

  const assignedCounts: Record<string, number> = {}
  for (const s of assignedSpots) {
    if (s.assignedItemId) {
      assignedCounts[s.assignedItemId] = (assignedCounts[s.assignedItemId] || 0) + 1
    }
  }

  // Build pool of remaining items (expanded by remaining quantity)
  const pool: string[] = []
  for (const ai of auctionItems) {
    const assigned = assignedCounts[ai.id] || 0
    const remaining = ai.quantity - assigned
    for (let i = 0; i < remaining; i++) {
      pool.push(ai.id)
    }
  }

  if (pool.length === 0) return null

  // Cryptographically random pick
  const randomIndex = Math.floor(Math.random() * pool.length)
  const pickedAuctionItemId = pool[randomIndex]
  const pickedAuctionItem = auctionItems.find((ai) => ai.id === pickedAuctionItemId)!

  // Assign item to spot
  const updatedSpot = await prisma.auctionSpot.update({
    where: { id: spotId },
    data: { assignedItemId: pickedAuctionItemId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      auction: true,
    },
  })

  // Decrement live inventory quantity
  await prisma.inventoryItem.update({
    where: { id: pickedAuctionItem.itemId },
    data: { qty: { decrement: 1 } },
  })

  // Mark auction complete if all items are now assigned
  const totalItems = auctionItems.reduce((sum, ai) => sum + ai.quantity, 0)
  const totalAssigned = assignedSpots.length + 1
  if (totalAssigned >= totalItems) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'completed', completedAt: new Date() },
    })
  }

  return {
    spot: updatedSpot,
    auctionItemId: pickedAuctionItemId,
    itemName: pickedAuctionItem.item.name,
    itemTier: pickedAuctionItem.item.tier,
    remaining: pool.length - 1,
  }
}
