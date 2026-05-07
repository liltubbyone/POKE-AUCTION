'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function EditAuctionItemsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect('/')

  const [auction, inventory] = await Promise.all([
    prisma.auction.findUnique({
      where: { id: params.id },
      include: { items: { include: { item: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { tier: { not: 'EXCLUDE' }, qty: { gt: 0 } },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    }),
  ])

  if (!auction) redirect('/admin')

  const available = inventory

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-gold text-sm hover:underline">← Back to Dashboard</Link>
        <h1 className="text-4xl font-heading text-white mt-2">EDIT ITEMS</h1>
        <p className="text-gray-400 text-sm mt-1">{auction.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current items */}
        <div className="card">
          <h2 className="text-xl font-heading text-white mb-4">CURRENT ITEMS ({auction.items.length})</h2>
          {auction.items.length === 0 ? (
            <p className="text-gray-500 text-sm">No items assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {auction.items.map((ai) => (
                <div key={ai.id} className="bg-background border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{ai.item.name}</p>
                      <p className="text-gray-500 text-xs">Tier: {ai.item.tier}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quantity editor */}
                      <form
                        action={async (formData: FormData) => {
                          'use server'
                          const maxQty = ai.quantity + ai.item.qty
                          const newQty = Math.min(maxQty, Math.max(1, parseInt(formData.get('qty') as string) || 1))
                          const diff = newQty - ai.quantity
                          await prisma.auctionItem.update({
                            where: { id: ai.id },
                            data: { quantity: newQty },
                          })
                          if (diff !== 0) {
                            await prisma.inventoryItem.update({
                              where: { id: ai.itemId },
                              data: { qty: { decrement: diff } },
                            })
                          }
                          revalidatePath(`/admin/auctions/${params.id}/edit`)
                          revalidatePath('/admin')
                        }}
                        className="flex items-center gap-1"
                      >
                        <span className="text-gray-400 text-xs">Qty:</span>
                        <input
                          type="number"
                          name="qty"
                          defaultValue={ai.quantity}
                          min={1}
                          max={ai.quantity + ai.item.qty}
                          className="w-14 bg-card border border-border rounded px-2 py-0.5 text-white text-xs text-center focus:outline-none focus:border-gold"
                        />
                        <button
                          type="submit"
                          className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 bg-green-900/20 hover:bg-green-900/40 px-2 py-1 rounded font-semibold transition-colors"
                        >
                          Save
                        </button>
                      </form>
                      {/* Remove */}
                      <form
                        action={async () => {
                          'use server'
                          await prisma.auctionItem.delete({ where: { id: ai.id } })
                          await prisma.inventoryItem.update({
                            where: { id: ai.itemId },
                            data: { qty: { increment: ai.quantity } },
                          })
                          revalidatePath(`/admin/auctions/${params.id}/edit`)
                          revalidatePath('/admin')
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add items */}
        <div className="card">
          <h2 className="text-xl font-heading text-white mb-4">ADD ITEMS</h2>
          {available.length === 0 ? (
            <p className="text-gray-500 text-sm">No available inventory to add.</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {available.map((item) => (
                <form
                  key={item.id}
                  action={async () => {
                    'use server'
                    const existing = await prisma.auctionItem.findFirst({
                      where: { auctionId: params.id, itemId: item.id },
                    })
                    if (existing) {
                      await prisma.auctionItem.update({
                        where: { id: existing.id },
                        data: { quantity: { increment: 1 } },
                      })
                    } else {
                      await prisma.auctionItem.create({
                        data: { auctionId: params.id, itemId: item.id, quantity: 1 },
                      })
                    }
                    await prisma.inventoryItem.update({
                      where: { id: item.id },
                      data: { qty: { decrement: 1 } },
                    })
                    revalidatePath(`/admin/auctions/${params.id}/edit`)
                    revalidatePath('/admin')
                  }}
                  className="flex items-center justify-between bg-background hover:bg-card border border-border hover:border-gold/30 rounded-lg p-3 transition-all"
                >
                  <div>
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.tier} · x{item.qty} in stock · {formatCurrency(item.resellMin)}+</p>
                  </div>
                  <button
                    type="submit"
                    className="text-xs text-gold border border-gold/30 bg-gold/5 hover:bg-gold/10 px-3 py-1 rounded font-semibold transition-colors"
                  >
                    + Add
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
