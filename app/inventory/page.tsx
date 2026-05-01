export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'

async function getInventory() {
  return prisma.inventoryItem.findMany({
    where: { tier: { not: 'EXCLUDE' } },
    orderBy: { name: 'asc' },
  })
}

export default async function InventoryPage() {
  const items = await getInventory()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          INVENTORY <span className="gold-gradient-text">CATALOG</span>
        </h1>
        <p className="text-gray-400 max-w-2xl leading-relaxed">
          All items available for current and future raffles.
          Items marked <strong className="text-red-400">SOLD OUT</strong> have zero quantity remaining.
        </p>
      </div>

      {/* Inventory grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
        {items.map((item) => {
          const soldOut = item.qty === 0
          return (
            <div
              key={item.id}
              className={`card relative ${soldOut ? 'opacity-60' : 'hover:border-gold/30'} transition-all`}
            >
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
                  <span className="text-red-400 font-heading text-2xl border border-red-400/50 px-4 py-2 rounded-lg">
                    SOLD OUT
                  </span>
                </div>
              )}

              {/* Product image */}
              {item.imageUrl ? (
                <div className="w-full h-36 flex items-center justify-center mb-3 rounded-lg overflow-hidden bg-black/20">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-36 max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-24 flex items-center justify-center mb-3 rounded-lg bg-black/20 text-gray-600 text-xs">
                  No photo
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-xs font-semibold">
                  QTY: <span className={soldOut ? 'text-red-400' : 'text-white'}>{item.qty}</span>
                </span>
              </div>

              <h3 className="font-semibold text-white mb-3 leading-tight text-sm">{item.name}</h3>

              {item.note && (
                <div className="mt-3 bg-gold/5 border border-gold/20 rounded px-2 py-1">
                  <p className="text-gold text-xs">{item.note}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Policies */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="no-refund-banner">ALL SALES FINAL — NO REFUNDS</div>
        <div className="bg-blue-950/30 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-lg text-sm font-semibold text-center">
          BUYER PAYS ACTUAL SHIPPING ($8–$15 est.)
        </div>
        <div className="bg-green-950/30 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm font-semibold text-center">
          100% RANDOMIZED — PROVABLY FAIR
        </div>
      </div>
    </div>
  )
}
