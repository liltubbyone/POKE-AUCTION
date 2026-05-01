'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SupportMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: string
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated' || (session && !session.user.isAdmin)) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    fetch('/api/support')
      .then((r) => r.json())
      .then((d) => { setMessages(d); setLoading(false) })
  }, [])

  const setStatus = async (id: string, newStatus: string) => {
    await fetch('/api/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus } : m))
  }

  const filtered = messages.filter((m) => filter === 'all' ? true : m.status === filter)
  const openCount = messages.filter((m) => m.status === 'open').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading text-white mb-1">
            SUPPORT MESSAGES
            {openCount > 0 && (
              <span className="ml-3 text-lg text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full">
                {openCount} open
              </span>
            )}
          </h1>
          <Link href="/admin" className="text-gold text-sm hover:underline">← Back to Dashboard</Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['open', 'all', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide border transition-colors ${
              filter === f
                ? 'border-gold/50 text-gold bg-gold/10'
                : 'border-border text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No {filter === 'all' ? '' : filter} messages.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`card transition-all ${msg.status === 'open' ? 'border-yellow-500/20' : 'border-border opacity-70'}`}
            >
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      msg.status === 'open'
                        ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                        : 'text-green-400 border-green-400/30 bg-green-400/10'
                    }`}>
                      {msg.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{msg.subject}</p>
                  <p className="text-gray-400 text-xs">{msg.name} — {msg.email}</p>
                </div>
                <span className="text-gray-500 text-sm flex-shrink-0">{expanded === msg.id ? '▲' : '▼'}</span>
              </div>

              {expanded === msg.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="bg-background/50 rounded-xl p-4">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      className="text-xs border border-blue-500/30 text-blue-400 hover:bg-blue-900/30 px-3 py-1.5 rounded font-semibold transition-colors"
                    >
                      Reply via Email
                    </a>
                    {msg.status === 'open' ? (
                      <button
                        onClick={() => setStatus(msg.id, 'resolved')}
                        className="text-xs border border-green-500/30 text-green-400 hover:bg-green-900/30 px-3 py-1.5 rounded font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(msg.id, 'open')}
                        className="text-xs border border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/30 px-3 py-1.5 rounded font-semibold transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
