'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  createdAt: string
}

export default function CouponsPanel() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchCoupons() }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create coupon')
    } else {
      setSuccess(`Coupon "${data.code}" created!`)
      setForm({ code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '' })
      setShowForm(false)
      fetchCoupons()
      setTimeout(() => setSuccess(''), 4000)
    }
    setSaving(false)
  }

  const handleToggle = async (coupon: Coupon) => {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    })
    fetchCoupons()
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
    await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
    fetchCoupons()
  }

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false

  const isExhausted = (coupon: Coupon) =>
    coupon.maxUses != null && coupon.usedCount >= coupon.maxUses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-gold text-xs py-1.5 px-4">
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {success && (
        <div className="px-4 py-3 rounded-lg text-sm font-semibold bg-green-950/50 border border-green-500/40 text-green-300">
          {success}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card border-gold/20 space-y-4">
          <h3 className="font-heading text-white text-lg">NEW COUPON</h3>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm bg-red-950/50 border border-red-500/40 text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Code *</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="input-field uppercase"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="input-field text-white"
              >
                <option value="percent" className="text-black">Percentage (%)</option>
                <option value="fixed" className="text-black">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                Value * {form.type === 'percent' ? '(%)' : '($)'}
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                max={form.type === 'percent' ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'percent' ? '20' : '10.00'}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Min Order ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                placeholder="0.00"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Max Uses</label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Expires At</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Coupon list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-16 bg-white/5" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🎟</p>
          <p>No coupons yet. Create one to offer discounts in the store.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon)
            const exhausted = isExhausted(coupon)
            const statusLabel = !coupon.active ? 'Disabled' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Active'
            const statusColor = !coupon.active ? 'text-gray-400 border-gray-400/30 bg-gray-400/10'
              : expired || exhausted ? 'text-red-400 border-red-400/30 bg-red-400/10'
              : 'text-green-400 border-green-400/30 bg-green-400/10'

            return (
              <div key={coupon.id} className="card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <code className="text-gold font-heading text-lg tracking-widest">{coupon.code}</code>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>
                        <strong className="text-white">
                          {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}
                        </strong>
                      </span>
                      {coupon.minOrder > 0 && <span>Min: {formatCurrency(coupon.minOrder)}</span>}
                      <span>
                        Used: <strong className="text-white">{coupon.usedCount}</strong>
                        {coupon.maxUses != null && ` / ${coupon.maxUses}`}
                      </span>
                      {coupon.expiresAt && (
                        <span className={expired ? 'text-red-400' : ''}>
                          Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(coupon)}
                      className={`text-xs px-3 py-1.5 rounded border font-semibold transition-colors ${
                        coupon.active
                          ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20'
                          : 'text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20'
                      }`}
                    >
                      {coupon.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
                      className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-400 bg-red-400/5 hover:bg-red-400/15 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
