'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

function compressImage(file: File, maxPx = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

function ImageUploader({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch {
      alert('Failed to process image — try another file.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="relative flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all"
        style={{
          minHeight: '80px',
          border: `2px dashed ${dragOver ? 'rgba(255,215,0,0.7)' : 'rgba(124,58,237,0.4)'}`,
          background: dragOver ? 'rgba(255,215,0,0.04)' : 'rgba(124,58,237,0.04)',
        }}
      >
        {uploading ? (
          <p className="text-violet-400 text-xs animate-pulse">Uploading…</p>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-16 w-16 object-contain rounded" />
            <p className="text-[10px] text-gray-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500">Drop image or click to upload</p>
            <p className="text-[10px] text-gray-600">JPEG / PNG / WebP · max 5 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }}
        />
      </div>
      {/* URL fallback */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-xs py-1"
        placeholder="Or paste image URL…"
      />
    </div>
  )
}

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
    qty: 1,
    cost: 0,
    resellMin: 0,
    resellMax: 0,
    shippingCost: 10,
    imageUrl: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'qty' | 'cost' | 'resellMin' | 'tier'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterTier, setFilterTier] = useState('all')

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
        name: editValues.name,
        qty: parseInt(editValues.qty as any),
        cost: parseFloat(editValues.cost as any),
        resellMin: parseFloat(editValues.resellMin as any),
        resellMax: parseFloat(editValues.resellMax as any),
        shippingCost: parseFloat(editValues.shippingCost as any),
        note: editValues.note || null,
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchItems()
      setMessage({ type: 'success', text: 'Item deleted.' })
    } else {
      setMessage({ type: 'error', text: 'Failed to delete item.' })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        tier: 'C',
        qty: parseInt(newItem.qty as any),
        cost: parseFloat(newItem.cost as any),
        resellMin: parseFloat(newItem.resellMin as any),
        resellMax: parseFloat(newItem.resellMax as any),
        shippingCost: parseFloat(newItem.shippingCost as any),
      }),
    })

    if (res.ok) {
      setShowAddForm(false)
      setNewItem({ name: '', qty: 1, cost: 0, resellMin: 0, resellMax: 0, shippingCost: 10 })
      fetchItems()
      setMessage({ type: 'success', text: 'Item added!' })
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to add item' })
    }
  }

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortArrow = (key: typeof sortKey) =>
    sortKey !== key ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'

  const visibleItems = items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesTier = filterTier === 'all' || item.tier === filterTier
      return matchesSearch && matchesTier
    })
    .sort((a, b) => {
      let val = 0
      if (sortKey === 'name') val = a.name.localeCompare(b.name)
      else if (sortKey === 'qty') val = a.qty - b.qty
      else if (sortKey === 'cost') val = a.cost - b.cost
      else if (sortKey === 'resellMin') val = a.resellMin - b.resellMin
      else if (sortKey === 'tier') val = a.tier.localeCompare(b.tier)
      return sortDir === 'asc' ? val : -val
    })

  const tiers = ['all', ...Array.from(new Set(items.map((i) => i.tier))).sort()]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading text-white mb-1">INVENTORY MANAGEMENT</h1>
          <Link href="/admin" className="text-gold text-sm hover:underline">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-gold">
          {showAddForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-green-950/50 border border-green-500/40 text-green-300'
            : 'bg-red-950/50 border border-red-500/40 text-red-300'
        }`}>
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
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Image</label>
              <ImageUploader
                value={newItem.imageUrl || ''}
                onChange={(url) => setNewItem((n) => ({ ...n, imageUrl: url }))}
              />
            </div>
          </div>
          <button type="submit" className="btn-gold mt-4">Add Item</button>
        </form>
      )}

      {/* Filter / Sort bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="input-field py-1.5 text-sm flex-1 min-w-[180px]"
        />
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="input-field py-1.5 text-sm w-auto"
        >
          {tiers.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All Tiers' : `Tier ${t}`}</option>
          ))}
        </select>
        <span className="text-gray-500 text-xs">{visibleItems.length} of {items.length} items</span>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-gray-500 text-xs uppercase tracking-wider">
              {([
                ['name',      'Name',   'text-left'],
                ['qty',       'Qty',    'text-right'],
                ['cost',      'Cost',   'text-right'],
                ['resellMin', 'Resell', 'text-right'],
              ] as [typeof sortKey, string, string][]).map(([key, label, align]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`${align} py-2 pr-4 cursor-pointer hover:text-white select-none transition-colors`}
                >
                  {label}{sortArrow(key)}
                </th>
              ))}
              <th className="text-right py-2 pr-4">Ship</th>
              <th className="text-left py-2 pr-4">Note</th>
              <th className="text-left py-2 pr-4">Image</th>
              <th className="text-right py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-card transition-colors">
                {editingId === item.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        className="input-field py-1 text-sm font-semibold"
                        placeholder="Item name"
                      />
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
                    <td className="py-2 pr-4 w-48">
                      <ImageUploader
                        value={editValues.imageUrl || ''}
                        onChange={(url) => setEditValues((v) => ({ ...v, imageUrl: url }))}
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
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain rounded" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-gray-600 text-xs">No image</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-xs border border-border text-gray-400 hover:text-gold hover:border-gold px-3 py-1 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-xs border border-red-500/30 text-red-400 hover:bg-red-900/30 px-3 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
