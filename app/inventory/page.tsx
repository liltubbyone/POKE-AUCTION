import { prisma } from '@/lib/prisma'
import { formatCurrency, getTierColor } from '@/lib/utils'

async function getInventory() {
  return prisma.inventoryItem.findMany({
    orderBy: [{ tier: 'asc' }, { name: 'asc' }],
  })
}

const TIER_ORDER = ['S', 'A', 'B', 'C', 'EXCLUDE']

const TIER_LABELS: Record<string, string> = {
  S: 'S-Tier — Premium Hits',
  A: 'A-Tier — High Value',
  B: 'B-Tier — Solid Pulls',
  C: 'C-Tier — Good Value',
  EXCLUDE: 'Not In Wheel Pool',
}

export default async function InventoryPage() {
  const items = await getInventory()

  const grouped = TIER_ORDER.reduce(
    (acc, tier) => {
      acc[tier] = items.filter((i) => i.tier === tier)
      return acc
    },
    {} as Record<string, typeof items>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          INVENTORY <span className="gold-gradient-text">CATALOG</span>
        </h1>
        <p className="text-gray-400 max-w-2xl leading-relaxed">
          All items available for current and future auctions. Tiers indicate rarity and value.
          Items marked <strong className="text-red-400">SOLD OUT</strong> have zero quantity remaining.
          Items in the EXCLUDE tier are not wheeled — they are sold separately.
        </p>
      </div>

      {/* Tier Legend */}
      <div className="flex flex-wrap gap-3 mb-10">
        {['S', 'A', 'B', 'C'].map((tier) => (
          <div key={tier} className={`tier-badge px-3 py-1.5 text-sm ${getTierColor(tier)}`}>
            {tier}-Tier
          </div>
        ))}
        <div className="text-gray-500 text-sm self-center ml-2">= item rarity in wheel pool</div>
      </div>

      {/* Inventory by Tier */}
      {TIER_ORDER.filter((t) => grouped[t]?.length > 0).map((tier) => (
        <div key={tier} className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-heading text-white">{TIER_LABELS[tier]}</h2>
            <div className={`tier-badge ${getTierColor(tier)}`}>{tier}</div>
            <span className="text-gray-500 text-sm">{grouped[tier].length} item type(s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped[tier].map((item) => {
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

                  {/* Tier badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`tier-badge ${getTierColor(item.tier)}`}>{item.tier}</span>
                    <span className="text-gray-500 text-xs font-semibold">
                      QTY: <span className={soldOut ? 'text-red-400' : 'text-white'}>{item.qty}</span>
                    </span>
                  </div>

                  {/* Item name */}
                  <h3 className="font-semibold text-white mb-3 leading-tight text-sm">{item.name}</h3>

                  {/* Price info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Cost</span>
                      <span className="text-gray-300">{formatCurrency(item.cost)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Resell Range</span>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(item.resellMin)} – {formatCurrency(item.resellMax)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Est. Shipping</span>
                      <span className="text-gray-300">~{formatCurrency(item.shippingCost)}</span>
                    </div>
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="mt-3 bg-gold/5 border border-gold/20 rounded px-2 py-1">
                      <p className="text-gold text-xs">{item.note}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

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
