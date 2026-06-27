'use client'

import { useEffect, useState } from 'react'

interface DayData { date: string; revenue: number; spots: number }

interface AnalyticsData {
  revenue:  { total: number; last7d: number; last30d: number; avgPerSpot: number }
  spots:    { total: number; last7d: number; last30d: number }
  users:    { total: number; newLast7d: number; newLast30d: number; buyers: number; conversionRate: number }
  dailyData: DayData[]
  paymentBreakdown: Record<string, number>
  raffles: {
    id: string; name: string; status: string
    totalSpots: number; soldSpots: number; fillRate: number
    revenue: number; spotPrice: number; createdAt: string
  }[]
  engagement: { totalSpins: number; spins7d: number; totalWordSearch: number; ws7d: number }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function num(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

function shortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** A tiny sparkline-style bar chart built entirely from divs */
function BarChart({ data, getValue, getLabel, color = '#FFD700' }: {
  data: DayData[]
  getValue: (d: DayData) => number
  getLabel: (d: DayData) => string
  color?: string
}) {
  const max = Math.max(...data.map(getValue), 1)
  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {data.map((d) => {
        const pct = (getValue(d) / max) * 100
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
            <div
              className="w-full rounded-sm transition-all duration-200 group-hover:opacity-80"
              style={{ height: `${Math.max(pct, 2)}%`, background: pct > 0 ? color : 'rgba(255,255,255,0.06)' }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              {shortDate(d.date)}: {getLabel(d)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Horizontal bar showing a breakdown */
function BreakdownBar({ breakdown, total }: { breakdown: Record<string, number>; total: number }) {
  const COLORS: Record<string, string> = {
    stripe:  '#7C3AED',
    paypal:  '#003087',
    venmo:   '#008CFF',
    cashapp: '#00D632',
    unknown: '#374151',
  }
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1])
  return (
    <div className="space-y-2">
      {entries.map(([method, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        const color = COLORS[method] || '#6B7280'
        const label = method === 'stripe' ? 'Stripe' : method === 'paypal' ? 'PayPal'
          : method === 'venmo' ? 'Venmo' : method === 'cashapp' ? 'Cash App'
          : method.charAt(0).toUpperCase() + method.slice(1)
        return (
          <div key={method}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-semibold">{count} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card text-center py-4">
      <p className={`text-2xl font-heading ${color} mb-0.5`}>{value}</p>
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      {sub && <p className="text-gray-600 text-[10px] mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeChart, setActiveChart] = useState<'revenue' | 'spots'>('revenue')

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse h-24 bg-white/5" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return <div className="card text-red-400 text-sm p-4">{error || 'No data'}</div>
  }

  const totalPayments = Object.values(data.paymentBreakdown).reduce((s, n) => s + n, 0)

  // Raffle leaderboard — top 5 by revenue
  const topRaffles = [...data.raffles].sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  return (
    <div className="space-y-6">

      {/* ── Top KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="All-time Revenue"   value={fmt(data.revenue.total)}  color="text-gold" />
        <StatCard label="Avg Spot Price"      value={fmt(data.revenue.avgPerSpot)} color="text-gold" />
        <StatCard label="Spots Sold (total)"  value={num(data.spots.total)}   color="text-blue-400" />
        <StatCard
          label="Buyer Conversion"
          value={`${data.users.conversionRate.toFixed(1)}%`}
          sub={`${data.users.buyers} of ${data.users.total} users`}
          color="text-green-400"
        />
      </div>

      {/* ── 7-day & 30-day snapshots ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Revenue (7d)"  value={fmt(data.revenue.last7d)}  color="text-violet-400" />
        <StatCard label="Revenue (30d)" value={fmt(data.revenue.last30d)} color="text-violet-400" />
        <StatCard label="Spots Sold (7d)"  value={data.spots.last7d}  color="text-blue-400" />
        <StatCard label="Spots Sold (30d)" value={data.spots.last30d} color="text-blue-400" />
      </div>

      {/* ── 14-Day Chart ─────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-white text-lg">14-DAY TREND</h3>
          <div className="flex gap-1">
            {(['revenue', 'spots'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveChart(v)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeChart === v ? 'bg-gold text-black' : 'border border-border text-gray-500 hover:text-white'
                }`}
              >
                {v === 'revenue' ? 'Revenue' : 'Spots'}
              </button>
            ))}
          </div>
        </div>

        <BarChart
          data={data.dailyData}
          getValue={activeChart === 'revenue' ? (d) => d.revenue : (d) => d.spots}
          getLabel={activeChart === 'revenue' ? (d) => fmt(d.revenue) : (d) => `${d.spots} spots`}
          color={activeChart === 'revenue' ? '#FFD700' : '#7C3AED'}
        />

        {/* X-axis labels — show every other to avoid crowding */}
        <div className="flex mt-1">
          {data.dailyData.map((d, i) => (
            <div key={d.date} className="flex-1 text-center text-[9px] text-gray-600">
              {i % 2 === 0 ? shortDate(d.date) : ''}
            </div>
          ))}
        </div>
      </div>

      {/* ── Conversion funnel ─────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-heading text-white text-lg mb-4">CONVERSION FUNNEL</h3>
        <div className="space-y-2">
          {[
            { label: 'Registered Users',  value: data.users.total,   color: '#94a3b8', pct: 100 },
            { label: 'Made a Purchase',   value: data.users.buyers,  color: '#22d3ee',
              pct: data.users.total > 0 ? (data.users.buyers / data.users.total) * 100 : 0 },
            { label: 'New Users (30d)',   value: data.users.newLast30d, color: '#a78bfa',
              pct: data.users.total > 0 ? (data.users.newLast30d / data.users.total) * 100 : 0 },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-40 flex-shrink-0">{step.label}</span>
              <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2 text-[11px] font-bold text-black transition-all duration-700"
                  style={{ width: `${Math.max(step.pct, 3)}%`, background: step.color }}
                >
                  {step.pct >= 15 && num(step.value)}
                </div>
              </div>
              <span className="text-white text-xs font-semibold w-20 text-right flex-shrink-0">
                {num(step.value)} ({step.pct.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Visitor → buyer funnel requires page-view tracking (see Vercel Analytics below).
        </p>
      </div>

      {/* ── Raffle performance ────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-heading text-white text-lg mb-4">RAFFLE PERFORMANCE</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4">Raffle</th>
                <th className="text-right py-2 pr-4">Status</th>
                <th className="text-right py-2 pr-4">Fill</th>
                <th className="text-right py-2 pr-4">Fill %</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topRaffles.map((r) => (
                <tr key={r.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 text-white font-semibold text-xs max-w-[180px] truncate">{r.name}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      r.status === 'active'    ? 'text-green-400 border-green-400/30 bg-green-400/10'
                      : r.status === 'completed' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                      : 'text-gray-400 border-gray-400/20 bg-gray-400/10'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-400 text-xs">{r.soldSpots}/{r.totalSpots}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.fillRate}%`,
                            background: r.fillRate >= 80 ? '#22c55e' : r.fillRate >= 50 ? '#FFD700' : '#7C3AED',
                          }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${
                        r.fillRate >= 80 ? 'text-green-400' : r.fillRate >= 50 ? 'text-gold' : 'text-gray-400'
                      }`}>
                        {r.fillRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gold font-bold text-xs">{fmt(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment breakdown + Engagement ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading text-white text-lg mb-4">PAYMENT METHODS</h3>
          {totalPayments > 0 ? (
            <BreakdownBar breakdown={data.paymentBreakdown} total={totalPayments} />
          ) : (
            <p className="text-gray-500 text-sm">No payment data yet.</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-heading text-white text-lg mb-4">ENGAGEMENT LOOP</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Daily Spin</span>
                <span className="text-white font-semibold">{num(data.engagement.totalSpins)} total</span>
              </div>
              <p className="text-gray-600 text-xs">{num(data.engagement.spins7d)} in last 7 days</p>
            </div>
            <div className="h-px bg-border/50" />
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Word Search</span>
                <span className="text-white font-semibold">{num(data.engagement.totalWordSearch)} total</span>
              </div>
              <p className="text-gray-600 text-xs">{num(data.engagement.ws7d)} in last 7 days</p>
            </div>
            <div className="h-px bg-border/50" />
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Return rate</span>
                <span className="text-gray-500 text-xs">Requires page-view tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── User growth ───────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-heading text-white text-lg mb-4">USER GROWTH</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',   value: num(data.users.total),        color: 'text-white' },
            { label: 'New (7d)',      value: `+${data.users.newLast7d}`,   color: 'text-green-400' },
            { label: 'New (30d)',     value: `+${data.users.newLast30d}`,  color: 'text-green-400' },
            { label: 'Total Buyers',  value: num(data.users.buyers),       color: 'text-gold' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-heading ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Traffic tracking callout ─────────────────────────────── */}
      <div
        className="rounded-xl px-5 py-4 text-sm"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}
      >
        <p className="text-violet-300 font-semibold mb-1">Add Page-View & Traffic Analytics</p>
        <p className="text-gray-500 text-xs leading-relaxed mb-3">
          The metrics above are pulled from your database (purchases, users, engagement). To also track
          page views, referrers, and UTM sources — add Vercel Analytics. It's free, privacy-friendly,
          and takes 2 commands since you're already on Vercel.
        </p>
        <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-gray-300 space-y-1">
          <p># 1. Install</p>
          <p className="text-green-400">npm install @vercel/analytics</p>
          <p className="mt-2"># 2. Add to app/layout.tsx</p>
          <p className="text-green-400">{'import { Analytics } from \'@vercel/analytics/react\''}</p>
          <p className="text-green-400">{'<Analytics /> // inside <body>'}</p>
          <p className="mt-2"># 3. Enable in Vercel Dashboard → your project → Analytics tab</p>
        </div>
        <p className="text-gray-600 text-xs mt-3">
          For custom funnel events (room opened, checkout started), add{' '}
          <code className="text-violet-400">track(&#39;spot_purchased&#39;, {'{ auctionId, amount }'})</code>{' '}
          calls at key conversion points.
        </p>
      </div>

    </div>
  )
}
