'use client'

import { useEffect, useState } from 'react'

interface PendingSpot {
  id: string
  paymentMethod: string | null
  user: { name: string | null; email: string }
  auction: { name: string; spotPrice: number }
}

export default function PendingPayments() {
  const [spots, setSpots] = useState<PendingSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<Record<string, 'approve' | 'decline'>>({})

  useEffect(() => {
    fetch('/api/admin/spots/pending')
      .then((r) => r.json())
      .then(setSpots)
      .finally(() => setLoading(false))
  }, [])

  const remove = (id: string) => setSpots((prev) => prev.filter((s) => s.id !== id))

  const approve = async (id: string) => {
    setActing((a) => ({ ...a, [id]: 'approve' }))
    await fetch(`/api/admin/spots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: true }),
    })
    remove(id)
  }

  const decline = async (id: string) => {
    setActing((a) => ({ ...a, [id]: 'decline' }))
    await fetch(`/api/admin/spots/${id}`, { method: 'DELETE' })
    remove(id)
  }

  if (loading) return null
  if (spots.length === 0) return null

  return (
    <div>
      <h2 className="text-2xl font-heading text-yellow-400 mb-4">
        PENDING PAYMENTS ({spots.length})
      </h2>
      <div className="space-y-2">
        {spots.map((spot) => (
          <div key={spot.id} className="card p-3 border-yellow-500/20">
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm truncate">
                  {spot.user.name || spot.user.email.split('@')[0]} — {spot.paymentMethod?.toUpperCase()}
                </p>
                <p className="text-gray-500 text-xs">{spot.auction.name}</p>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <span className="text-yellow-400 text-xs font-semibold">PENDING</span>
                <button
                  onClick={() => approve(spot.id)}
                  disabled={!!acting[spot.id]}
                  className="text-xs bg-green-900/50 border border-green-500/40 text-green-300 hover:bg-green-900 disabled:opacity-50 px-3 py-1 rounded font-semibold transition-colors"
                >
                  {acting[spot.id] === 'approve' ? '…' : 'Approve'}
                </button>
                <button
                  onClick={() => decline(spot.id)}
                  disabled={!!acting[spot.id]}
                  className="text-xs bg-red-900/50 border border-red-500/40 text-red-300 hover:bg-red-900 disabled:opacity-50 px-3 py-1 rounded font-semibold transition-colors"
                >
                  {acting[spot.id] === 'decline' ? '…' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
