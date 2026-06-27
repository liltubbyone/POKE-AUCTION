'use client'

import { useState } from 'react'
import Link from 'next/link'

type PanelId = 'overview' | 'raffles' | 'stock' | 'spots' | 'analytics' | 'settings' | 'inbox'

interface Props {
  adminEmail: string
  overviewPanel: React.ReactNode
  rafflesPanel: React.ReactNode
  stockPanel: React.ReactNode
  spotsPanel: React.ReactNode
  analyticsPanel: React.ReactNode
  settingsPanel: React.ReactNode
  inboxPanel: React.ReactNode
}

const PANELS: { id: PanelId; label: string }[] = [
  { id: 'overview',   label: 'Overview'        },
  { id: 'raffles',    label: 'Raffles'         },
  { id: 'stock',      label: 'Stock'           },
  { id: 'spots',      label: 'Spots'           },
  { id: 'analytics',  label: 'Analytics'       },
  { id: 'settings',   label: 'Settings'        },
  { id: 'inbox',      label: 'Inbox'           },
]

const PANEL_TITLES: Record<PanelId, string> = {
  overview:  'Overview',
  raffles:   'Raffles',
  stock:     'Stock',
  spots:     'Spots & Shipping',
  analytics: 'Analytics',
  settings:  'Settings',
  inbox:     'Support Inbox',
}

export default function AdminDashboardClient({
  adminEmail,
  overviewPanel,
  rafflesPanel,
  stockPanel,
  spotsPanel,
  analyticsPanel,
  settingsPanel,
  inboxPanel,
}: Props) {
  const [current, setCurrent] = useState<PanelId>('overview')
  const [history, setHistory] = useState<PanelId[]>([])

  const navigateTo = (panelId: PanelId) => {
    if (panelId === current) return
    setHistory((h) => [...h, current])
    setCurrent(panelId)
  }

  const goBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setCurrent(prev)
  }

  const panelContent: Record<PanelId, React.ReactNode> = {
    overview:  overviewPanel,
    raffles:   rafflesPanel,
    stock:     stockPanel,
    spots:     spotsPanel,
    analytics: analyticsPanel,
    settings:  settingsPanel,
    inbox:     inboxPanel,
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: 220,
          borderRight: '1px solid rgba(30,41,59,0.8)',
          background: 'rgba(2,6,23,0.5)',
          padding: '20px 10px',
        }}
      >
        <div className="mb-6 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 mb-0.5">Admin</p>
          <p className="text-[11px] text-gray-600 truncate">{adminEmail}</p>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => navigateTo(p.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full ${
                current === p.id
                  ? 'text-gold border border-gold/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
              style={current === p.id ? { background: 'rgba(255,215,0,0.07)' } : undefined}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  current === p.id ? 'bg-gold' : 'bg-gray-700'
                }`}
              />
              {p.label}
            </button>
          ))}
        </nav>

        <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-0.5">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0" />
            Inventory
          </Link>
          <Link
            href="/admin/auctions/new"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0" />
            New Raffle
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0" />
            View Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px',
            borderBottom: '1px solid rgba(30,41,59,0.8)',
            flexShrink: 0,
          }}
        >
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
              style={{
                color: '#94a3b8',
                border: '1px solid rgba(30,41,59,0.9)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f1f5f9'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.borderColor = 'rgba(30,41,59,0.9)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ← Back
            </button>
          )}

          <h2 className="font-heading text-white text-lg tracking-wide">{PANEL_TITLES[current]}</h2>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile panel switcher */}
            <select
              value={current}
              onChange={(e) => navigateTo(e.target.value as PanelId)}
              className="md:hidden input-field text-xs py-1 w-auto text-white"
            >
              {PANELS.map((p) => (
                <option key={p.id} value={p.id} className="text-black">{p.label}</option>
              ))}
            </select>
            <Link href="/admin/auctions/new" className="btn-gold text-xs py-1.5 px-4">
              + New Raffle
            </Link>
          </div>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {PANELS.map((p) => (
            <div key={p.id} className={current === p.id ? 'block' : 'hidden'}>
              {panelContent[p.id]}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
