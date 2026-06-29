'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import StoreCheckout, { CartItem } from '@/components/StoreCheckout'

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

function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
        className="relative flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all"
        style={{
          minHeight: 80,
          border: `2px dashed ${dragOver ? 'rgba(255,215,0,0.7)' : 'rgba(124,58,237,0.4)'}`,
          background: dragOver ? 'rgba(255,215,0,0.04)' : 'rgba(124,58,237,0.04)',
        }}
      >
        {uploading ? (
          <p className="text-violet-400 text-xs animate-pulse">Processing…</p>
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
            <p className="text-[10px] text-gray-600">JPEG / PNG / WebP</p>
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

type SortOption = 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc' | 'popular'

interface StoreItem {
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
  forSale: boolean
  storePrice: number | null
  _count: { auctionItems: number }
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'alpha-asc',  label: 'A → Z' },
  { value: 'alpha-desc', label: 'Z → A' },
  { value: 'price-asc',  label: 'Price Low' },
  { value: 'price-desc', label: 'Price High' },
  { value: 'popular',    label: 'Popular' },
]

export default function StorePage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.isAdmin

  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('alpha-asc')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '', qty: 1, cost: 0, resellMin: 0, resellMax: 0, shippingCost: 10, imageUrl: '', note: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const res = await fetch('/api/inventory')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  // Cart helpers
  const addToCart = (item: StoreItem) => {
    if (!item.storePrice || item.qty === 0) return
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        if (existing.quantity >= item.qty) return prev
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, {
        id: item.id, name: item.name, storePrice: item.storePrice!, imageUrl: item.imageUrl,
        qty: item.qty, quantity: 1, shippingCost: item.shippingCost,
      }]
    })
    setCartSuccess(false)
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return }
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, quantity: qty } : c))
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  // Admin: toggle for-sale + set store price
  const handleSetStorePrice = async (item: { id: string; forSale: boolean; storePrice: number | null }, price: number | null) => {
    const forSale = price != null && price > 0
    await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forSale, storePrice: forSale ? price : null }),
    })
    fetchItems()
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        tier: 'C',
        qty: Math.max(0, parseInt(String(newItem.qty)) || 0),
        cost: parseFloat(String(newItem.cost)) || 0,
        resellMin: parseFloat(String(newItem.resellMin)) || 0,
        resellMax: parseFloat(String(newItem.resellMax)) || 0,
        shippingCost: parseFloat(String(newItem.shippingCost)) || 10,
        note: newItem.note || null,
        imageUrl: newItem.imageUrl || null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setShowAddForm(false)
      setNewItem({ name: '', qty: 1, cost: 0, resellMin: 0, resellMax: 0, shippingCost: 10, imageUrl: '', note: '' })
      fetchItems()
      setMessage({ type: 'success', text: 'Item added to store!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to add item' })
    }
  }

  const visibleItems = items
    .filter((item) => item.tier !== 'EXCLUDE')
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case 'alpha-asc':  return a.name.localeCompare(b.name)
        case 'alpha-desc': return b.name.localeCompare(a.name)
        case 'price-asc':  return a.cost - b.cost
        case 'price-desc': return b.cost - a.cost
        case 'popular':    return (b._count?.auctionItems ?? 0) - (a._count?.auctionItems ?? 0)
        default: return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
            THE <span className="gold-gradient-text">STORE</span>
          </h1>
          <p className="text-gray-400 max-w-xl leading-relaxed">
            Browse all available Pokemon products. Items marked{' '}
            <strong className="text-red-400">SOLD OUT</strong> have zero quantity remaining.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0 self-start sm:self-auto">
          {/* Cart button */}
          {!isAdmin && session?.user && (
            <button
              onClick={() => setShowCart(true)}
              className="relative btn-outline flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-16H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="btn-gold"
            >
              {showAddForm ? 'Cancel' : '+ Add Item'}
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-green-950/50 border border-green-500/40 text-green-300'
            : 'bg-red-950/50 border border-red-500/40 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {cartSuccess && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-semibold bg-green-950/50 border border-green-500/40 text-green-300 flex items-center justify-between">
          <span>Order placed successfully! Check your profile for order details.</span>
          <button onClick={() => setCartSuccess(false)} className="text-green-500 hover:text-green-300 ml-4">✕</button>
        </div>
      )}

      {/* Admin Upload Form */}
      {isAdmin && showAddForm && (
        <form onSubmit={handleAddItem} className="card mb-10 border-gold/30">
          <h2 className="text-2xl font-heading text-gold mb-6">ADD NEW ITEM</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Name *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                className="input-field"
                placeholder="e.g. Charizard VMAX PSA 10"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Qty</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={(e) => setNewItem((n) => ({ ...n, qty: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="input-field"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.cost}
                onChange={(e) => setNewItem((n) => ({ ...n, cost: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Market Min ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.resellMin}
                onChange={(e) => setNewItem((n) => ({ ...n, resellMin: parseFloat(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Market Max ($)</label>
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
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Note</label>
              <input
                type="text"
                value={newItem.note}
                onChange={(e) => setNewItem((n) => ({ ...n, note: e.target.value }))}
                className="input-field"
                placeholder="Optional note…"
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Image</label>
              <ImageUploader
                value={newItem.imageUrl}
                onChange={(url) => setNewItem((n) => ({ ...n, imageUrl: url }))}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn-gold" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Item'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="input-field pl-9 py-2 w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                sort === value
                  ? 'bg-gold text-black'
                  : 'border border-border text-gray-400 hover:border-gold/40 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-gray-600 text-xs flex-shrink-0">
          {visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Items Grid */}
      {visibleItems.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-semibold text-gray-400">No items found</p>
          {search && <p className="text-sm mt-2">Try a different search term</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-14">
          {visibleItems.map((item) => {
            const soldOut = item.qty === 0
            const lowStock = !soldOut && item.qty <= 2
            const popularity = item._count?.auctionItems ?? 0
            return (
              <div
                key={item.id}
                className={`card relative flex flex-col ${
                  soldOut ? 'opacity-60' : 'hover:border-gold/30 hover:-translate-y-0.5'
                } transition-all duration-200`}
              >
                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
                    <span className="text-red-400 font-heading text-2xl border border-red-400/50 px-4 py-2 rounded-lg">
                      SOLD OUT
                    </span>
                  </div>
                )}

                {item.imageUrl ? (
                  <div className="w-full h-44 flex items-center justify-center mb-4 rounded-lg overflow-hidden bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-44 max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 flex items-center justify-center mb-4 rounded-lg bg-black/20 text-gray-700">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <h3 className="font-semibold text-white mb-2 leading-tight text-sm">{item.name}</h3>

                <p className="text-2xl font-bold gold-gradient-text mb-1">
                  {formatCurrency(item.forSale && item.storePrice ? item.storePrice : item.cost)}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                  <span className={`text-xs font-semibold ${
                    soldOut ? 'text-red-400' : lowStock ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {soldOut ? 'SOLD OUT' : lowStock ? `Only ${item.qty} left` : `${item.qty} in stock`}
                  </span>
                  {popularity > 0 && (
                    <span className="text-xs text-violet-400 font-semibold">
                      🔥 {popularity}x
                    </span>
                  )}
                </div>

                {item.note && (
                  <div className="mt-2 bg-gold/5 border border-gold/20 rounded px-2 py-1">
                    <p className="text-gold text-xs">{item.note}</p>
                  </div>
                )}

                {/* Buy Now / store actions */}
                {!isAdmin && session?.user && item.forSale && item.storePrice && !soldOut && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        const cartItem: import('@/components/StoreCheckout').CartItem = {
                          id: item.id, name: item.name, storePrice: item.storePrice!,
                          imageUrl: item.imageUrl, qty: item.qty, quantity: 1, shippingCost: item.shippingCost,
                        }
                        setCart([cartItem])
                        setShowCheckout(true)
                      }}
                      className="w-full btn-gold text-sm py-2"
                    >
                      Buy Now — {formatCurrency(item.storePrice)}
                    </button>
                    <button
                      onClick={() => { addToCart(item); setShowCart(true) }}
                      className="w-full text-center text-xs text-gray-400 border border-border hover:border-gold/40 hover:text-white py-2 rounded-lg transition-all"
                    >
                      {cart.find((c) => c.id === item.id) ? 'In Cart — View Cart' : 'Add to Cart'}
                    </button>
                  </div>
                )}
                {!isAdmin && session?.user && item.forSale && item.storePrice && soldOut && (
                  <div className="mt-3 w-full text-center text-xs text-red-400 font-semibold py-2 border border-red-400/20 rounded-lg bg-red-400/5">
                    Sold Out
                  </div>
                )}
                {!isAdmin && !session?.user && item.forSale && item.storePrice && (
                  <a href="/auth/login" className="mt-3 block w-full text-center text-sm btn-gold py-2">
                    Sign In to Buy
                  </a>
                )}

                {/* Admin: store price control */}
                {isAdmin && (
                  <AdminStorePriceControl item={item} onSave={handleSetStorePrice} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="no-refund-banner">ALL SALES FINAL — NO REFUNDS</div>
        <div className="bg-blue-950/30 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-lg text-sm font-semibold text-center">
          BUYER PAYS ACTUAL SHIPPING ($8–$15 est.)
        </div>
        <div className="bg-green-950/30 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm font-semibold text-center">
          100% RANDOMIZED — PROVABLY FAIR
        </div>
      </div>

      {/* Cart drawer */}
      {showCart && !cartSuccess && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={() => setShowCart(false)} />
          <div
            className="w-full max-w-sm h-full overflow-y-auto flex flex-col"
            style={{ background: '#0d0d1a', borderLeft: '1px solid rgba(30,30,53,0.8)' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-xl font-heading text-white">Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-5 space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-8">Your cart is empty.</p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-contain rounded-lg bg-black/20 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-black/30 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-gold text-sm font-bold">{formatCurrency(item.storePrice * item.quantity)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded border border-border text-gray-400 hover:text-white flex items-center justify-center text-sm">−</button>
                      <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.qty} className="w-6 h-6 rounded border border-border text-gray-400 hover:text-white flex items-center justify-center text-sm disabled:opacity-40">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-xs text-gray-600 hover:text-red-400 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-border/60">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-bold">
                    {formatCurrency(cart.reduce((s, i) => s + i.storePrice * i.quantity, 0))}
                  </span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true) }}
                  className="btn-gold w-full"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && cart.length > 0 && (
        <StoreCheckout
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => { setCart([]); setCartSuccess(true); setShowCheckout(false) }}
        />
      )}
    </div>
  )
}

function AdminStorePriceControl({
  item,
  onSave,
}: {
  item: { id: string; forSale: boolean; storePrice: number | null }
  onSave: (item: { id: string; forSale: boolean; storePrice: number | null }, price: number | null) => Promise<void>
}) {
  const [price, setPrice] = useState(item.storePrice?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const parsed = price === '' ? null : parseFloat(price)
    await onSave(item as any, parsed)
    setSaving(false)
  }

  const handleRemove = async () => {
    setSaving(true)
    setPrice('')
    await onSave(item as any, null)
    setSaving(false)
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Store Price</p>
      <div className="flex gap-1.5">
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          className="input-field text-xs py-1 flex-1"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-2 py-1 rounded font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? '…' : item.forSale ? 'Update' : 'List'}
        </button>
        {item.forSale && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="text-xs bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50 px-2 py-1 rounded font-semibold transition-colors disabled:opacity-50"
          >
            Delist
          </button>
        )}
      </div>
      {item.forSale && (
        <p className="text-[10px] text-green-400 mt-1">Listed in store</p>
      )}
    </div>
  )
}
