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
  note: string | null
  imageUrl: string | null
  shippingCost: number
}

const TIERS = ['S', 'A', 'B', 'C', 'EXCLUDE']

export default function AdminInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<InventoryItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    tier: 'C',
    qty: 1,
    cost: 0,
    resellMin: 0,
    resellMax: 0,
    shippingCost: 10,
    imageUrl: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (status === 'unauthenticated' || (session && !session.user.isAdmin)) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const res = await fetch('/api/inventory')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditValues({ ...item })
  }

  const handleSave = async (id: string) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qty: parseInt(editValues.qty as any),
        cost: parseFloat(editValues.cost as any),
        resellMin: parseFloat(editValues.resellMin as any),
        resellMax: parseFloat(editValues.resellMax as any),
        shippingCost: parseFloat(editValues.shippingCost as any),
        note: editValues.note || null,
        tier: editValues.tier,
        imageUrl: editValues.imageUrl || null,
      }),
    })

    if (res.ok) {
      setEditingId(null)
      fetchItems()
      setMessage({ type: 'success', text: 'Item updated!' })
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to update' })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        qty: parseInt(newItem.qty as any),
        cost: parseFloat(newItem.cost as any),
        resellMin: parseFloat(newItem.resellMin as any),
        resellMax: parseFloat(newItem.resellMax as any),
        shippingCost: parseFloat(newItem.shippingCost as any),
      }),
    })

    if (res.ok) {
      setShowAddForm(false)
      setNewItem({ name: '', tier: 'C', qty: 1, cost: 0, resellMin: 0, resellMax: 0, shippingCost: 10 })
      fetchItems()
      setMessage({ type: 'success', text: 'Item added!' })
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to add item' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  const grouped = TIERS.reduce(
    (acc, t) => {
      acc[t] = items.filter((i) => i.tier === t)
      return acc
    },
    {} as Record<string, InventoryItem[]>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading text-white mb-1">INVENTORY MANAGEMENT</h1>
          <Link href="/admin" className="text-gold text-sm hover:underline">← Back to Dashboard</Link>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-gold"
        >
          {showAddForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {message.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-green-950/50 border border-green-500/40 text-green-300'
              : 'bg-red-950/50 border border-red-500/40 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="card mb-8 border-gold/30">
          <h2 className="text-2xl font-heading text-gold mb-4">ADD NEW ITEM</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Tier</label>
              <select
                value={newItem.tier}
                onChange={(e) => setNewItem((n) => ({ ...n, tier: e.target.value }))}
                className="input-field"
              >
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Qty</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={(e) => setNewItem((n) => ({ ...n, qty: parseInt(e.target.value) }))}
                className="input-field"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.cost}
                onChange={(e) => setNewItem((n) => ({ ...n, cost: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Resell Min ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.resellMin}
                onChange={(e) => setNewItem((n) => ({ ...n, resellMin: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Resell Max ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.resellMax}
                onChange={(e) => setNewItem((n) => ({ ...n, resellMax: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Ship Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.shippingCost}
                onChange={(e) => setNewItem((n) => ({ ...n, shippingCost: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Note (optional)</label>
              <input
                type="text"
                value={newItem.note || ''}
                onChange={(e) => setNewItem((n) => ({ ...n, note: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="col-span-4">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Image URL (paste a link to the product photo)</label>
              <input
                type="url"
                value={newItem.imageUrl || ''}
                onChange={(e) => setNewItem((n) => ({ ...n, imageUrl: e.target.value }))}
                className="input-field"
                placeholder="https://..."
              />
            </div>
          </div>
          <button type="submit" className="btn-gold mt-4">Add Item</button>
        </form>
      )}

      {/* Items by Tier */}
      {TIERS.filter((t) => grouped[t]?.length > 0).map((tier) => (
        <div key={tier} className="mb-10">
          <h2 className="text-2xl font-heading text-white mb-4 flex items-center gap-3">
            <span className={`tier-badge ${getTierColor(tier)}`}>{tier}</span>
            Tier ({grouped[tier].length} items)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-right py-2 pr-4">Qty</th>
                  <th className="text-right py-2 pr-4">Cost</th>
                  <th className="text-right py-2 pr-4">Resell</th>
                  <th className="text-right py-2 pr-4">Ship</th>
                  <th className="text-left py-2 pr-4">Note</th>
                  <th className="text-left py-2 pr-4">Image URL</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped[tier].map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-card transition-colors">
                    {editingId === item.id ? (
                      <>
                        <td className="py-2 pr-4">
                          <span className="text-white font-semibold">{item.name}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            value={editValues.qty}
                            onChange={(e) => setEditValues((v) => ({ ...v, qty: parseInt(e.target.value) }))}
                            className="input-field w-20 text-right py-1 text-sm"
                            min={0}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.cost}
                            onChange={(e) => setEditValues((v) => ({ ...v, cost: parseFloat(e.target.value) }))}
                            className="input-field w-24 text-right py-1 text-sm"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.resellMin}
                              onChange={(e) => setEditValues((v) => ({ ...v, resellMin: parseFloat(e.target.value) }))}
                              className="input-field w-20 text-right py-1 text-sm"
                            />
                            <span className="text-gray-500 self-center">–</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.resellMax}
                              onChange={(e) => setEditValues((v) => ({ ...v, resellMax: parseFloat(e.target.value) }))}
                              className="input-field w-20 text-right py-1 text-sm"
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.shippingCost}
                            onChange={(e) => setEditValues((v) => ({ ...v, shippingCost: parseFloat(e.target.value) }))}
                            className="input-field w-20 text-right py-1 text-sm"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            value={editValues.note || ''}
                            onChange={(e) => setEditValues((v) => ({ ...v, note: e.target.value }))}
                            className="input-field py-1 text-sm"
                            placeholder="Note"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="url"
                            value={editValues.imageUrl || ''}
                            onChange={(e) => setEditValues((v) => ({ ...v, imageUrl: e.target.value }))}
                            className="input-field py-1 text-sm w-48"
                            placeholder="https://..."
                          />
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSave(item.id)}
                              className="text-xs bg-green-900/50 border border-green-500/40 text-green-300 hover:bg-green-900 px-3 py-1 rounded font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs border border-border text-gray-400 hover:text-white px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-4 text-white font-semibold">{item.name}</td>
                        <td className={`py-3 pr-4 text-right font-bold ${item.qty === 0 ? 'text-red-400' : item.qty <= 2 ? 'text-yellow-400' : 'text-white'}`}>
                          {item.qty}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-300">{formatCurrency(item.cost)}</td>
                        <td className="py-3 pr-4 text-right text-green-400 font-semibold">
                          {formatCurrency(item.resellMin)}–{formatCurrency(item.resellMax)}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-300">{formatCurrency(item.shippingCost)}</td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">{item.note || '—'}</td>
                        <td className="py-3 pr-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain rounded" />
                          ) : (
                            <span className="text-gray-600 text-xs">No image</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-xs border border-border text-gray-400 hover:text-gold hover:border-gold px-3 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
