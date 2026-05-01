'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false)
  const gamesRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (gamesRef.current && !gamesRef.current.contains(e.target as Node)) {
        setGamesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const gamesLinks = [
    { href: '/live', label: 'Live', desc: 'Active raffles running now' },
    { href: '/auctions', label: 'Raffles', desc: 'Browse all raffle drops' },
    { href: '/giveaways', label: 'Giveaways', desc: 'Free entry giveaways' },
  ]

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
              { href: '/daily-spin', label: '🎁 Free Spin' },
              { href: '/inventory', label: 'Inventory' },
              { href: '/results', label: 'Results' },
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

            {/* Games Dropdown */}
            <div className="relative" ref={gamesRef}>
              <button
                onClick={() => setGamesOpen((o) => !o)}
                className="relative flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition-colors duration-200 group"
              >
                Games
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${gamesOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gold group-hover:w-4/5 transition-all duration-300" />
              </button>

              {gamesOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(10, 10, 22, 0.98)',
                    border: '1px solid rgba(255,215,0,0.15)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.05)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {gamesLinks.map((link, i) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setGamesOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-gold/10 transition-colors group"
                      style={{ borderBottom: i < gamesLinks.length - 1 ? '1px solid rgba(30,30,53,0.8)' : undefined }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-gold transition-colors">{link.label}</span>
                      <span className="text-xs text-gray-600 mt-0.5">{link.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

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
                <button onClick={() => signOut()} className="btn-outline text-sm py-2 px-4">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-3 py-2">
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
            <Link href="/daily-spin" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>🎁 Free Spin</Link>
            <Link href="/inventory" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Inventory</Link>
            <Link href="/results" className="px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors" onClick={() => setMobileOpen(false)}>Results</Link>

            {/* Games mobile dropdown */}
            <button
              onClick={() => setMobileGamesOpen((o) => !o)}
              className="flex items-center justify-between px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold transition-colors"
            >
              <span>Games</span>
              <svg className={`w-4 h-4 transition-transform ${mobileGamesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileGamesOpen && (
              <div className="ml-4 space-y-0.5" style={{ borderLeft: '2px solid rgba(255,215,0,0.2)' }}>
                {gamesLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block pl-4 pr-3 py-2 text-gray-400 hover:text-gold font-semibold text-sm transition-colors"
                    onClick={() => { setMobileOpen(false); setMobileGamesOpen(false) }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

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
