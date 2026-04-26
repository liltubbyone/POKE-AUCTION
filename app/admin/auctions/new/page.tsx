'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, getTierColor } from '@/lib/utils'
import Link from 'next/link'

interface InventoryItem {
  id: string
  name: string
  tier: string
  qty: number
  cost: number
  resellMin: number
  resellMax: number
  shippingCost: number
}

interface AuctionItemEntry {
  itemId: string
  quantity: number
}

export default function CreateAuctionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [spotPrice, setSpotPrice] = useState<number>(45)
  const [shippingRate, setShippingRate] = useState<number>(8)
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7)
  const [selectedItems, setSelectedItems] = useState<AuctionItemEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated' || (session && !session.user.isAdmin)) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(setInventory)
  }, [])

  const totalSpots = selectedItems.reduce((sum, si) => sum + si.quantity, 0)
  const totalCost = selectedItems.reduce((sum, si) => {
    const item = inventory.find((i) => i.id === si.itemId)
    return sum + (item ? item.cost * si.quantity : 0)
  }, 0)
  const totalRevenue = totalSpots * spotPrice
  const profit = totalRevenue - totalCost

  const addItem = (itemId: string) => {
    if (selectedItems.find((si) => si.itemId === itemId)) return
    setSelectedItems((prev) => [...prev, { itemId, quantity: 1 }])
  }

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((si) => si.itemId !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return
    const capped = Math.min(quantity, item.qty)
    setSelectedItems((prev) =>
      prev.map((si) => (si.itemId === itemId ? { ...si, quantity: capped } : si))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedItems.length === 0) {
      setError('Please select at least one item')
      return
    }

    if (totalSpots === 0) {
      setError('Total spots must be greater than 0')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auctions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        spotPrice,
        shippingRate,
        totalSpots,
        expiresInDays,
        items: selectedItems,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      router.push(`/auction/${data.id}`)
    } else {
      setError(data.error || 'Failed to create auction')
    }

    setLoading(false)
  }

  const tierGroups = ['S', 'A', 'B', 'C']
  const availableInventory = inventory.filter(
    (i) => i.tier !== 'EXCLUDE' && i.qty > 0 && !selectedItems.find((si) => si.itemId === i.id)
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading text-white mb-1">CREATE AUCTION</h1>
          <Link href="/admin" className="text-gold text-sm hover:underline">← Back to Dashboard</Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Auction settings */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-heading text-white mb-4">AUCTION DETAILS</h2>

              {error && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                    Auction Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="🔥 First Partner Flex"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Describe this auction set..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                      Spot Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={spotPrice}
                      onChange={(e) => setSpotPrice(parseFloat(e.target.value))}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                      Shipping Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingRate}
                      onChange={(e) => setShippingRate(parseFloat(e.target.value))}
                      className="input-field"
                    />
                    <p className="text-gray-600 text-xs mt-1">Charged once per customer per show</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                      Expires In (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={expiresInDays ?? ''}
                      disabled={expiresInDays === null}
                      onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                      className="input-field disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={expiresInDays === null}
                        onChange={(e) => setExpiresInDays(e.target.checked ? null : 7)}
                        className="w-3.5 h-3.5 accent-gold"
                      />
                      <span className="text-gray-400 text-xs">No expiration</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="card border-gold/20">
              <h2 className="text-2xl font-heading text-gold mb-4">AUCTION SUMMARY</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Spots</span>
                  <span className="text-white font-bold text-xl">{totalSpots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Spot Price</span>
                  <span className="text-gold font-bold">{formatCurrency(spotPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Revenue (if full)</span>
                  <span className="text-green-400 font-bold">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Item Cost</span>
                  <span className="text-red-400 font-bold">{formatCurrency(totalCost)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-white font-semibold">Est. Profit</span>
                  <span className={`font-bold text-xl ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className="btn-gold w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : `Create Auction (${totalSpots} spots)`}
              </button>
            </div>
          </div>

          {/* Right: Item selection */}
          <div className="space-y-6">
            {/* Selected items */}
            {selectedItems.length > 0 && (
              <div className="card border-gold/20">
                <h2 className="text-xl font-heading text-gold mb-3">
                  SELECTED ITEMS ({selectedItems.length})
                </h2>
                <div className="space-y-2">
                  {selectedItems.map((si) => {
                    const item = inventory.find((i) => i.id === si.itemId)
                    if (!item) return null
                    return (
                      <div key={si.itemId} className="flex items-center gap-3 bg-background border border-border rounded-lg p-3">
                        <span className={`tier-badge text-xs flex-shrink-0 ${getTierColor(item.tier)}`}>
                          {item.tier}
                        </span>
                        <span className="flex-1 text-white text-sm font-semibold">{item.name}</span>
                        <input
                          type="number"
                          min={1}
                          max={item.qty}
                          value={si.quantity}
                          onChange={(e) => updateQuantity(si.itemId, parseInt(e.target.value))}
                          className="w-16 bg-card border border-border rounded px-2 py-1 text-center text-white text-sm"
                        />
                        <span className="text-gray-500 text-xs">max {item.qty}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(si.itemId)}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available inventory */}
            <div className="card">
              <h2 className="text-xl font-heading text-white mb-3">AVAILABLE INVENTORY</h2>
              <p className="text-gray-500 text-xs mb-4">Click an item to add it to the auction. EXCLUDE tier items cannot be added.</p>
              {tierGroups.map((tier) => {
                const tierItems = availableInventory.filter((i) => i.tier === tier)
                if (tierItems.length === 0) return null
                return (
                  <div key={tier} className="mb-4">
                    <h3 className={`text-sm font-bold mb-2 ${getTierColor(tier).split(' ')[0]}`}>
                      {tier}-Tier
                    </h3>
                    <div className="space-y-1">
                      {tierItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addItem(item.id)}
                          className="w-full flex items-center gap-3 bg-background hover:bg-card border border-border hover:border-gold/30 rounded-lg p-3 text-left transition-all"
                        >
                          <span className={`tier-badge text-xs flex-shrink-0 ${getTierColor(item.tier)}`}>
                            {item.tier}
                          </span>
                          <span className="flex-1 text-white text-sm">{item.name}</span>
                          <span className="text-gray-400 text-xs">x{item.qty}</span>
                          <span className="text-green-400 text-xs font-semibold">
                            {formatCurrency(item.resellMin)}+
                          </span>
                          <span className="text-gold text-xs">+ Add</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
