export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import GenerateLabelButton from '@/components/GenerateLabelButton'
import PendingPayments from '@/components/PendingPayments'
import AdminSettings from '@/components/AdminSettings'
import AdminDashboardClient from './AdminDashboardClient'
import AnalyticsPanel from './AnalyticsPanel'
import CouponsPanel from './CouponsPanel'

async function getAdminData() {
  const [auctions, inventory, recentSpots] = await Promise.all([
    prisma.auction.findMany({
      include: {
        spots: { where: { paid: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryItem.findMany({ orderBy: [{ tier: 'asc' }] }),
    prisma.auctionSpot.findMany({
      where: { paid: true },
      include: {
        user: { select: { name: true, email: true } },
        auction: { select: { name: true, spotPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const totalRevenue = recentSpots.reduce((sum, s) => sum + s.auction.spotPrice, 0)
  const activeAuctions = auctions.filter((a) => a.status === 'active')

  const shippingQueue = await prisma.auctionSpot.findMany({
    where: { assignedItemId: { not: null }, shippingPaid: true, shipped: false },
    include: {
      user: { select: { name: true, email: true, address: true } },
      auction: { include: { items: { include: { item: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const awaitingShippingPayment = await prisma.auctionSpot.findMany({
    where: { assignedItemId: { not: null }, shippingPaid: false, paid: true },
    include: {
      user: { select: { name: true, email: true } },
      auction: { include: { items: { include: { item: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return { auctions, inventory, recentSpots, totalRevenue, activeAuctions, shippingQueue, awaitingShippingPayment }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect('/')

  const { auctions, inventory, recentSpots, totalRevenue, activeAuctions, shippingQueue, awaitingShippingPayment } =
    await getAdminData()

  const lowStock = inventory.filter((i) => i.qty <= 2 && i.tier !== 'EXCLUDE')

  // ── Overview Panel ───────────────────────────────────────────────
  const overviewPanel = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: formatCurrency(totalRevenue), color: 'text-gold' },
          { label: 'Active Raffles', value: activeAuctions.length,        color: 'text-green-400' },
          { label: 'Spots Sold',     value: recentSpots.length,           color: 'text-blue-400' },
          { label: 'Ship Queue',     value: shippingQueue.length,         color: 'text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className={`text-3xl font-heading ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading text-white text-lg mb-4">QUICK LINKS</h3>
          <div className="flex flex-col gap-2">
            <Link href="/admin/auctions/new" className="btn-gold text-center text-sm py-2">+ Create New Raffle</Link>
            <Link href="/admin/inventory" className="btn-outline text-center text-sm py-2">Manage Inventory</Link>
            <Link href="/admin/support" className="btn-outline text-center text-sm py-2">Support Inbox</Link>
          </div>
        </div>
        <div className="card">
          <h3 className="font-heading text-white text-lg mb-4">STATUS</h3>
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Active raffles',          value: activeAuctions.length,             color: 'text-green-400' },
              { label: 'Ready to ship',           value: shippingQueue.length,              color: 'text-blue-400' },
              { label: 'Awaiting ship payment',   value: awaitingShippingPayment.length,    color: 'text-purple-400' },
              { label: 'Low stock items',         value: lowStock.length,                   color: lowStock.length > 0 ? 'text-red-400' : 'text-gray-500' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-500">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Raffles Panel ────────────────────────────────────────────────
  const rafflesPanel = (
    <div className="space-y-4">
      {auctions.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🎰</p>
          <p className="mb-4">No raffles yet.</p>
          <Link href="/admin/auctions/new" className="btn-gold inline-block">+ Create First Raffle</Link>
        </div>
      ) : auctions.map((auction) => {
        const paid = auction.spots.length
        const pct = Math.round((paid / auction.totalSpots) * 100)
        return (
          <div key={auction.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading text-white text-lg">{auction.name}</h3>
                <p className="text-gray-500 text-xs">{formatDate(auction.createdAt)}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${
                auction.status === 'active'    ? 'text-green-400 border-green-400/30 bg-green-400/10'
                : auction.status === 'completed' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                : 'text-gray-400 border-gray-400/30 bg-gray-400/10'
              }`}>
                {auction.status}
              </span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{paid}/{auction.totalSpots} spots</span>
              <span className="text-gold font-bold">{formatCurrency(auction.spotPrice)}/spot</span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-yellow-600" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex gap-2 flex-wrap mb-3">
              <Link href={`/auction/${auction.id}`} className="flex-1 text-center border border-border text-gray-300 hover:text-white py-1.5 rounded text-xs font-semibold transition-colors">
                View Room
              </Link>
              <Link href={`/auction/${auction.id}/results`} className="flex-1 text-center border border-gold/30 text-gold hover:bg-gold/10 py-1.5 rounded text-xs font-semibold transition-colors">
                Results
              </Link>
              <Link href={`/admin/auctions/${auction.id}/edit`} className="flex-1 text-center border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 py-1.5 rounded text-xs font-semibold transition-colors">
                Edit Items
              </Link>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-gray-600 text-xs">Revenue: {formatCurrency(paid * auction.spotPrice)}</p>
              {auction.status !== 'completed' && auction.status !== 'cancelled' && (
                <div className="flex gap-2 flex-wrap">
                  <RenameAuctionForm auctionId={auction.id} currentName={auction.name} />
                  {auction.status === 'active' && (
                    <SetStatusForm auctionId={auction.id} newStatus="paused" label="Pause" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20" />
                  )}
                  {auction.status === 'paused' && (
                    <SetStatusForm auctionId={auction.id} newStatus="active" label="Reactivate" className="text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20" />
                  )}
                  <EndAuctionForm auctionId={auction.id} />
                </div>
              )}
              {auction.status === 'completed' && <ResetAuctionForm auctionId={auction.id} />}
              <ChangeCategoryForm auctionId={auction.id} currentCategory={(auction as any).category ?? 'raffle'} />
            </div>

            {/* Danger zone */}
            <details className="mt-3 pt-3 border-t border-red-900/30">
              <summary className="text-xs text-red-500/70 hover:text-red-400 cursor-pointer select-none transition-colors">
                Danger zone
              </summary>
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-2">
                  Permanently deletes this raffle and all its spots. This cannot be undone.
                </p>
                <DeleteAuctionForm auctionId={auction.id} auctionName={auction.name} />
              </div>
            </details>
          </div>
        )
      })}
    </div>
  )

  // ── Stock Panel ──────────────────────────────────────────────────
  const stockPanel = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{inventory.length} total items</p>
        <Link href="/admin/inventory" className="btn-gold text-xs py-1.5 px-4">Manage Inventory</Link>
      </div>

      {lowStock.length > 0 && (
        <div>
          <h3 className="text-xl font-heading text-red-400 mb-3">LOW STOCK ALERT</h3>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div key={item.id} className="card p-3 flex justify-between items-center border-red-500/20">
                <span className="text-white text-sm">{item.name}</span>
                <span className={`font-bold text-sm ${item.qty === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {item.qty === 0 ? 'SOLD OUT' : `${item.qty} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-heading text-white mb-3">ALL ITEMS</h3>
        <div className="space-y-px">
          {inventory
            .filter((i) => i.tier !== 'EXCLUDE')
            .map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <span className="text-gray-300 text-sm">{item.name}</span>
                <div className="flex items-center gap-6">
                  <span className="text-gray-600 text-xs">{formatCurrency(item.cost)}</span>
                  <span className={`text-xs font-bold w-20 text-right ${
                    item.qty === 0 ? 'text-red-400' : item.qty <= 2 ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {item.qty === 0 ? 'SOLD OUT' : `${item.qty} in stock`}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )

  // ── Spots Panel ──────────────────────────────────────────────────
  const spotsPanel = (
    <div className="space-y-8">
      <PendingPayments />

      {shippingQueue.length > 0 && (
        <div>
          <h3 className="text-xl font-heading text-blue-400 mb-3">SHIP NOW ({shippingQueue.length})</h3>
          <div className="space-y-3">
            {shippingQueue.map((spot) => {
              const auctionItem = spot.auction.items.find((ai) => ai.id === spot.assignedItemId)
              let addr: Record<string, string> = {}
              try { addr = JSON.parse(spot.user.address || '{}') } catch {}
              return (
                <div key={spot.id} className="card border-blue-500/20 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold text-sm">{spot.user.name || spot.user.email.split('@')[0]}</p>
                      <p className="text-gray-500 text-xs">{spot.user.email}</p>
                      <p className="text-blue-300 text-xs font-semibold mt-1">
                        {auctionItem?.item.name ?? 'Unknown item'} — Spot #{spot.spotNumber}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/30 px-2 py-1 rounded-full">
                      SHIPPING PAID
                    </span>
                  </div>
                  {addr.street && (
                    <div className="rounded-lg p-2 text-xs text-gray-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(30,30,53,0.8)' }}>
                      <p>{addr.street}</p>
                      <p>{addr.city}, {addr.state} {addr.zip}</p>
                      <p>{addr.country}</p>
                    </div>
                  )}
                  <GenerateLabelButton spotId={spot.id} />
                  <details className="text-xs text-gray-500 cursor-pointer">
                    <summary className="hover:text-gray-300 transition-colors">Manual tracking entry</summary>
                    <div className="mt-2"><MarkShippedForm spotId={spot.id} /></div>
                  </details>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {awaitingShippingPayment.length > 0 && (
        <div>
          <h3 className="text-xl font-heading text-purple-400 mb-3">
            AWAITING SHIPPING PAYMENT ({awaitingShippingPayment.length})
          </h3>
          <div className="space-y-2">
            {awaitingShippingPayment.map((spot) => {
              const auctionItem = spot.auction.items.find((ai) => ai.id === spot.assignedItemId)
              return (
                <div key={spot.id} className="card p-3 border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-semibold">{spot.user.name || spot.user.email.split('@')[0]}</p>
                      <p className="text-gray-500 text-xs">{auctionItem?.item.name} — Spot #{spot.spotNumber}</p>
                    </div>
                    <span className="text-purple-400 text-xs font-semibold">PENDING $</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-heading text-white mb-3">RECENT SPOTS SOLD</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentSpots.map((spot) => (
            <div key={spot.id} className="card p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-semibold">{spot.user.name || spot.user.email.split('@')[0]}</p>
                  <p className="text-gray-500 text-xs">{spot.auction.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-bold text-sm">{formatCurrency(spot.auction.spotPrice)}</p>
                  <p className="text-gray-500 text-xs">Spot #{spot.spotNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Settings Panel ───────────────────────────────────────────────
  const settingsPanel = <AdminSettings />

  // ── Inbox Panel ──────────────────────────────────────────────────
  const inboxPanel = (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">View and respond to customer support messages.</p>
      <Link href="/admin/support" className="btn-gold inline-block">Open Support Inbox</Link>
    </div>
  )

  return (
    <AdminDashboardClient
      adminEmail={session.user.email!}
      overviewPanel={overviewPanel}
      rafflesPanel={rafflesPanel}
      stockPanel={stockPanel}
      spotsPanel={spotsPanel}
      analyticsPanel={<AnalyticsPanel />}
      couponsPanel={<CouponsPanel />}
      settingsPanel={settingsPanel}
      inboxPanel={inboxPanel}
    />
  )
}

// ── Server Action Forms ──────────────────────────────────────────────────────

function MarkShippedForm({ spotId }: { spotId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const tracking = formData.get('tracking') as string
        if (!tracking?.trim()) return
        const { prisma } = await import('@/lib/prisma')
        await prisma.auctionSpot.update({
          where: { id: spotId },
          data: { shipped: true, trackingNumber: tracking.trim() },
        })
      }}
      className="flex gap-2"
    >
      <input name="tracking" required placeholder="Tracking number" className="input-field text-xs py-2 flex-1" />
      <button type="submit" className="text-xs bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:bg-blue-900 px-3 py-2 rounded font-semibold transition-colors whitespace-nowrap">
        Mark Shipped
      </button>
    </form>
  )
}

function RenameAuctionForm({ auctionId, currentName }: { auctionId: string; currentName: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const name = (formData.get('name') as string)?.trim()
        if (!name) return
        const { prisma } = await import('@/lib/prisma')
        await prisma.auction.update({ where: { id: auctionId }, data: { name } })
      }}
      className="flex gap-1 flex-1 min-w-0"
    >
      <input name="name" defaultValue={currentName} placeholder="Raffle name" className="input-field text-xs py-1 flex-1 min-w-0" />
      <button type="submit" className="text-xs bg-card border border-border text-gray-300 hover:text-white px-2 py-1 rounded font-semibold transition-colors whitespace-nowrap">
        Rename
      </button>
    </form>
  )
}

function SetStatusForm({ auctionId, newStatus, label, className }: {
  auctionId: string; newStatus: string; label: string; className: string
}) {
  return (
    <form action={async () => {
      'use server'
      const { prisma } = await import('@/lib/prisma')
      await prisma.auction.update({ where: { id: auctionId }, data: { status: newStatus } })
    }}>
      <button type="submit" className={`text-xs px-3 py-1 rounded border font-semibold transition-colors ${className}`}>
        {label}
      </button>
    </form>
  )
}

function EndAuctionForm({ auctionId }: { auctionId: string }) {
  return (
    <form action={async () => {
      'use server'
      const { prisma } = await import('@/lib/prisma')
      const { spinForSpot } = await import('@/lib/spinLogic')
      const unspun = await prisma.auctionSpot.findMany({
        where: { auctionId, paid: true, assignedItemId: null },
        select: { id: true },
      })
      for (const spot of unspun) {
        await spinForSpot(auctionId, spot.id)
      }
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'completed', completedAt: new Date() },
      })
    }}>
      <button type="submit" className="text-xs bg-red-900/50 border border-red-500/40 text-red-300 hover:bg-red-900 px-3 py-1 rounded font-semibold transition-colors">
        End Early
      </button>
    </form>
  )
}

function ResetAuctionForm({ auctionId }: { auctionId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const confirm = formData.get('confirm') as string
        if (confirm !== 'RESET') return
        const { prisma } = await import('@/lib/prisma')
        const spots = await prisma.auctionSpot.findMany({
          where: { auctionId, assignedItemId: { not: null } },
          select: { assignedItemId: true },
        })
        const counts: Record<string, number> = {}
        for (const s of spots) {
          if (s.assignedItemId) counts[s.assignedItemId] = (counts[s.assignedItemId] || 0) + 1
        }
        for (const [auctionItemId, count] of Object.entries(counts)) {
          const auctionItem = await prisma.auctionItem.findUnique({
            where: { id: auctionItemId },
            select: { itemId: true },
          })
          if (auctionItem) {
            await prisma.inventoryItem.update({
              where: { id: auctionItem.itemId },
              data: { qty: { increment: count } },
            })
          }
        }
        await prisma.auctionSpot.deleteMany({ where: { auctionId } })
        await prisma.auction.update({
          where: { id: auctionId },
          data: { status: 'active', completedAt: null },
        })
      }}
      className="flex gap-2 items-center flex-wrap"
    >
      <input name="confirm" placeholder="Type RESET to confirm" className="input-field text-xs py-1 w-40" />
      <button type="submit" className="text-xs bg-orange-900/50 border border-orange-500/40 text-orange-300 hover:bg-orange-900 px-3 py-1 rounded font-semibold transition-colors whitespace-nowrap">
        Reset Raffle
      </button>
    </form>
  )
}

function DeleteAuctionForm({ auctionId, auctionName }: { auctionId: string; auctionName: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const confirm = formData.get('confirm') as string
        if (confirm !== auctionName) return
        const { prisma } = await import('@/lib/prisma')
        await prisma.auctionSpot.deleteMany({ where: { auctionId } })
        await prisma.auctionItem.deleteMany({ where: { auctionId } })
        await prisma.auction.delete({ where: { id: auctionId } })
        const { revalidatePath } = await import('next/cache')
        revalidatePath('/admin')
        revalidatePath('/auctions')
        revalidatePath('/games')
        revalidatePath('/browse')
      }}
      className="flex gap-2 items-center flex-wrap"
    >
      <input
        name="confirm"
        placeholder={`Type raffle name to confirm`}
        className="input-field text-xs py-1 flex-1 min-w-36"
      />
      <button
        type="submit"
        className="text-xs bg-red-950/60 border border-red-600/40 text-red-400 hover:bg-red-900/60 px-3 py-1 rounded font-semibold transition-colors whitespace-nowrap"
      >
        Delete Raffle
      </button>
    </form>
  )
}

function ChangeCategoryForm({ auctionId, currentCategory }: { auctionId: string; currentCategory: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const category = formData.get('category') as string
        const { prisma } = await import('@/lib/prisma')
        await prisma.auction.update({ where: { id: auctionId }, data: { category } })
        const { revalidatePath } = await import('next/cache')
        revalidatePath('/admin')
        revalidatePath('/games')
        revalidatePath('/auctions')
        revalidatePath('/browse')
      }}
      className="flex gap-2 items-center flex-wrap"
    >
      <select name="category" defaultValue={currentCategory} className="input-field text-xs py-1 text-white">
        <option value="raffle"   className="text-black">Raffle</option>
        <option value="game"     className="text-black">Game</option>
        <option value="giveaway" className="text-black">Giveaway</option>
      </select>
      <button type="submit" className="text-xs bg-violet-900/50 border border-violet-500/40 text-violet-300 hover:bg-violet-900 px-3 py-1 rounded font-semibold transition-colors whitespace-nowrap">
        Set Category
      </button>
    </form>
  )
}
