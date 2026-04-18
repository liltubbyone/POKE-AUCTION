const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const dbUrl = `file:${path.join(__dirname, 'dev.db')}`
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('changeme123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pokeauction.com' },
    update: {},
    create: {
      email: 'admin@pokeauction.com',
      name: 'PokeAuction Admin',
      password: hashedPassword,
      isAdmin: true,
    },
  })
  console.log('Admin user created:', admin.email)

  const inventoryData = [
    { name: 'Ascended Heroes ETB', tier: 'S', qty: 1, cost: 140.0, resellMin: 170, resellMax: 170, shippingCost: 12 },
    { name: 'Lucario Mega Evo ETB', tier: 'S', qty: 1, cost: 100.0, resellMin: 150, resellMax: 150, shippingCost: 12 },
    { name: 'Umbreon #41 Aquapolis', tier: 'S', qty: 1, cost: 155.0, resellMin: 160, resellMax: 190, note: 'Use in $60+ wheel only', shippingCost: 8 },
    { name: 'Perfect Order ETBs', tier: 'A', qty: 4, cost: 62.5, resellMin: 70, resellMax: 75, shippingCost: 12 },
    { name: 'Booster Boxes', tier: 'A', qty: 8, cost: 32.91, resellMin: 40, resellMax: 45, shippingCost: 15 },
    { name: 'Posters', tier: 'A', qty: 2, cost: 43.16, resellMin: 70, resellMax: 90, shippingCost: 8 },
    { name: 'Prismatic Evo Tech Sticker', tier: 'A', qty: 2, cost: 31.73, resellMin: 36, resellMax: 36, shippingCost: 5 },
    { name: 'PO 3-Pack Blisters', tier: 'B', qty: 14, cost: 19.08, resellMin: 25, resellMax: 25, shippingCost: 8 },
    { name: 'CVS Tins', tier: 'B', qty: 4, cost: 23.52, resellMin: 28, resellMax: 30, shippingCost: 10 },
    { name: 'Triple Whammy Tin (Slaking)', tier: 'B', qty: 2, cost: 23.52, resellMin: 25, resellMax: 26, shippingCost: 10 },
    { name: 'Pokemon Spark', tier: 'B', qty: 10, cost: 21.0, resellMin: 25, resellMax: 25, shippingCost: 8 },
    { name: 'Ascended Heroes S2.5 (A)', tier: 'B', qty: 2, cost: 8.98, resellMin: 25, resellMax: 30, shippingCost: 8 },
    { name: 'Ascended Heroes S2.5 (B)', tier: 'B', qty: 2, cost: 10.78, resellMin: 25, resellMax: 30, shippingCost: 8 },
    { name: 'PO Sleeves', tier: 'C', qty: 55, cost: 5.89, resellMin: 8, resellMax: 10, shippingCost: 5 },
    { name: 'Raikou 2-Pack Blister', tier: 'C', qty: 2, cost: 9.99, resellMin: 15, resellMax: 20, shippingCost: 8 },
    { name: 'Vileplume 2-Pack Blister', tier: 'C', qty: 5, cost: 14.02, resellMin: 15, resellMax: 20, shippingCost: 8 },
    { name: 'First Partner Illus. Coll.', tier: 'C', qty: 3, cost: 17.24, resellMin: 20, resellMax: 22, shippingCost: 8 },
    { name: 'Mega Evo Mini Tins', tier: 'C', qty: 2, cost: 14.02, resellMin: 18, resellMax: 20, shippingCost: 10 },
    { name: 'Onix/Steele Promos', tier: 'C', qty: 2, cost: 5.0, resellMin: 10, resellMax: 10, shippingCost: 5 },
    { name: 'Teal Mask Ogerpon SVP', tier: 'C', qty: 3, cost: 5.0, resellMin: 5, resellMax: 5, note: 'Breakeven only', shippingCost: 5 },
    { name: 'Violet EX Booster KOR', tier: 'EXCLUDE', qty: 2, cost: 20.87, resellMin: 2.25, resellMax: 2.25, note: 'SELL SEPARATELY - DO NOT WHEEL', shippingCost: 8 },
  ]

  const inventoryItems: Record<string, string> = {}

  for (const item of inventoryData) {
    const created = await prisma.inventoryItem.create({ data: item })
    inventoryItems[item.name] = created.id
    console.log(`  Created: ${item.name}`)
  }

  const auction = await prisma.auction.create({
    data: {
      name: '🔥 First Partner Flex',
      description: 'The inaugural PokeAuction surprise wheel! 29 spots at $45 each. One lucky spin decides who gets the First Partner Illustration Collection, Booster Boxes, 3-Pack Blisters, and PO Sleeves. ALL spots must fill before the wheel spins.',
      status: 'active',
      spotPrice: 45.0,
      totalSpots: 29,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })
  console.log('Created auction:', auction.name)

  await prisma.auctionItem.create({
    data: { auctionId: auction.id, itemId: inventoryItems['First Partner Illus. Coll.'], quantity: 1 },
  })
  await prisma.auctionItem.create({
    data: { auctionId: auction.id, itemId: inventoryItems['Booster Boxes'], quantity: 4 },
  })
  await prisma.auctionItem.create({
    data: { auctionId: auction.id, itemId: inventoryItems['PO 3-Pack Blisters'], quantity: 8 },
  })
  await prisma.auctionItem.create({
    data: { auctionId: auction.id, itemId: inventoryItems['PO Sleeves'], quantity: 16 },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
