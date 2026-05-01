'use client'

import { useState, useEffect } from 'react'

interface Winner {
  id: string
  user: string
  item: string
  itemImage: string | null
  raffle: string
  spotNumber: number
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'Just now'
}

export default function RecentWinnerFeed() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/winners')
      .then((r) => r.json())
      .then((d) => { setWinners(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || winners.length === 0) return null

  return (
    <section className="py-16" style={{ background: 'rgba(13,13,26,0.6)', borderTop: '1px solid rgba(30,30,53,0.8)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Hall of Fame</p>
          <h2 className="text-4xl md:text-5xl font-heading text-white">
            RECENT <span className="gold-gradient-text">WINNERS</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2">Real people, real wins. Every result is published publicly.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {winners.slice(0, 8).map((w) => (
            <div
              key={w.id}
              className="rounded-xl p-4 flex items-start gap-3 transition-all hover:border-gold/25"
              style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(30,30,53,0.9)' }}
            >
              {/* Item image or fallback */}
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}
              >
                {w.itemImage ? (
                  <img src={w.itemImage} alt={w.item} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-lg">🏆</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-gold font-bold text-sm truncate">{w.user}</span>
                  <span className="text-gray-600 text-xs flex-shrink-0">{timeAgo(w.createdAt)}</span>
                </div>
                <p className="text-white text-xs font-semibold truncate">{w.item}</p>
                <p className="text-gray-600 text-xs truncate">{w.raffle} · Spot #{w.spotNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
