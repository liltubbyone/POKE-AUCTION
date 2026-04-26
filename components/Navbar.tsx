'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

interface AuctionSummary {
  id: string
  name: string
  status: string
  spotPrice: number
}

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [auctionsOpen, setAuctionsOpen] = useState(false)
  const [auctions, setAuctions] = useState<AuctionSummary[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auctions')
      .then((r) => r.json())
      .then((data: AuctionSummary[]) =>
        setAuctions(data.filter((a) => a.status === 'active' || a.status === 'spinning'))
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAuctionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(6, 6, 13, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'rgba(30, 30, 53, 0.8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 50%, #B8860B 100%)',
                boxShadow: '0 0 16px rgba(255, 215, 0, 0.35)',
              }}
            >
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <span className="text-xl font-heading tracking-wider">
              <span className="shimmer-gold">POKE</span>
              <span className="text-white">AUCTION</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/inventory', label: 'Inventory' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gold group-hover:w-4/5 transition-all duration-300" />
              </Link>
            ))}

            {/* Auctions dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAuctionsOpen((o) => !o)}
                className="relative flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition-colors duration-200 group"
              >
                Auctions
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${auctionsOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gold group-hover:w-4/5 transition-all duration-300" />
              </button>

              {auctionsOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-56 rounded-xl border py-1.5 z-50"
                  style={{
                    background: 'rgba(10, 10, 20, 0.97)',
                    backdropFilter: 'blur(24px)',
                    borderColor: 'rgba(30, 30, 53, 0.9)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {auctions.length === 0 ? (
                    <p className="px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider">No active auctions</p>
                  ) : (
                    auctions.map((a) => (
                      <Link
                        key={a.id}
                        href={`/auction/${a.id}`}
                        onClick={() => setAuctionsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {a.status === 'spinning' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0" />
                        )}
                        {a.status === 'active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{a.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              href="/results"
              className="relative px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              Results
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gold group-hover:w-4/5 transition-all duration-300" />
            </Link>

            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-1.5 text-sm font-semibold uppercase tracking-wide rounded-lg transition-all duration-200"
                style={{
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.25)',
                  background: 'rgba(255,215,0,0.05)',
                }}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)' }}
                  >
                    {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                  </div>
                  {session.user.name || session.user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="btn-outline text-sm py-2 px-4"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-gold text-sm py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-4 pt-3 flex flex-col gap-1"
            style={{ borderTop: '1px solid rgba(30,30,53,0.8)' }}
          >
            <Link href="/" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/inventory" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Inventory</Link>

            {/* Auctions in mobile */}
            <div>
              <p className="px-3 pt-2 pb-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">Auctions</p>
              {auctions.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-gray-600">No active auctions</p>
              ) : (
                auctions.map((a) => (
                  <Link
                    key={a.id}
                    href={`/auction/${a.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors"
                  >
                    {a.status === 'spinning' && <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0" />}
                    {a.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                    {a.name}
                  </Link>
                ))
              )}
            </div>

            <Link href="/results" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Results</Link>

            {session?.user?.isAdmin && (
              <Link href="/admin" className="px-3 py-2.5 text-gold font-semibold" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            <div className="h-px my-2" style={{ background: 'rgba(30,30,53,0.8)' }} />
            {session ? (
              <>
                <Link href="/profile" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => signOut()} className="text-left px-3 py-2.5 text-red-400 hover:text-red-300 font-semibold">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2.5 text-gray-300 hover:text-white font-semibold" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="btn-gold text-center mt-1" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
