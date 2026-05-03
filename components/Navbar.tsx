'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false)
  const gamesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (gamesRef.current && !gamesRef.current.contains(e.target as Node)) {
        setGamesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  const gamesLinks = [
    { href: '/auctions', label: 'Raffles',    desc: 'Browse all raffle drops',       icon: '🎰' },
    { href: '/giveaways', label: 'Giveaways', desc: 'Free entry giveaways',           icon: '🎁' },
    { href: '/browse',   label: 'Browse All', desc: 'All games, raffles & giveaways', icon: '🌌' },
  ]

  const navLinks = [
    { href: '/', label: 'Home' },
  ]
  const rightLinks = [
    { href: '/daily-spin', label: '🎁 Free Spin' },
    { href: '/inventory',  label: 'Inventory' },
    { href: '/results',    label: 'Results' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(2,6,23,0.92)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderColor: 'rgba(30,41,59,0.8)',
        boxShadow: '0 1px 0 rgba(56,189,248,0.05), 0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Cosmic Grails"
              width={58}
              height={58}
              className="transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(124,58,237,0.8)]"
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-200 group"
                style={{ color: isActive(link.href) ? '#f1f5f9' : '#64748b' }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300"
                  style={{
                    width: isActive(link.href) ? '70%' : '0%',
                    background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                  }}
                />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px group-hover:w-4/5 transition-all duration-300"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />
              </Link>
            ))}

            {/* Games dropdown */}
            <div className="relative" ref={gamesRef}>
              <div className="flex items-center">
                <Link
                  href="/games"
                  className="px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-200"
                  style={{ color: isActive('/games') || isActive('/auctions') || isActive('/browse') ? '#f1f5f9' : '#64748b' }}
                >
                  Games
                </Link>
                <button
                  onClick={() => setGamesOpen((o) => !o)}
                  className="px-1 py-2 transition-colors duration-200"
                  style={{ color: '#64748b' }}
                  aria-label="Games submenu"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${gamesOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {gamesOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(10,14,28,0.98)',
                    border: '1px solid rgba(30,41,59,0.9)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)',
                    backdropFilter: 'blur(24px)',
                  }}
                >
                  {/* Top accent line */}
                  <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(56,189,248,0.4), transparent)' }} />
                  {gamesLinks.map((link, i) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setGamesOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
                      style={{ borderBottom: i < gamesLinks.length - 1 ? '1px solid rgba(30,41,59,0.6)' : undefined }}
                    >
                      <span className="text-base">{link.icon}</span>
                      <div>
                        <span className="block text-sm font-bold uppercase tracking-wide text-white group-hover:text-violet-300 transition-colors">{link.label}</span>
                        <span className="text-xs text-slate-600 mt-0.5">{link.desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-200 group"
                style={{ color: isActive(link.href) ? '#f1f5f9' : '#64748b' }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300"
                  style={{
                    width: isActive(link.href) ? '70%' : '0%',
                    background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                  }}
                />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px group-hover:w-4/5 transition-all duration-300"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />
              </Link>
            ))}

            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className="ml-1 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200"
                style={{
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.22)',
                  background: 'rgba(255,215,0,0.05)',
                }}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/[0.04]"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #fde68a, #FFD700, #b45309)' }}
                  >
                    {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:block">{session.user.name || session.user.email?.split('@')[0]}</span>
                </Link>
                <button onClick={() => signOut()} className="btn-ghost text-xs py-2 px-4">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-slate-500 hover:text-white transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-gold text-xs py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-5 pt-3 flex flex-col gap-0.5"
            style={{ borderTop: '1px solid rgba(30,41,59,0.7)' }}
          >
            <Link href="/" className="px-3 py-2.5 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors hover:bg-white/[0.04] text-sm" onClick={() => setMobileOpen(false)}>Home</Link>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
              <Link href="/games" className="text-slate-300 hover:text-white font-semibold flex-1 text-sm" onClick={() => setMobileOpen(false)}>
                Games
              </Link>
              <button
                onClick={() => setMobileGamesOpen((o) => !o)}
                className="text-slate-500 hover:text-white transition-colors pl-3"
              >
                <svg className={`w-4 h-4 transition-transform ${mobileGamesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {mobileGamesOpen && (
              <div className="ml-4 space-y-0.5 mb-1" style={{ borderLeft: '2px solid rgba(124,58,237,0.25)' }}>
                {gamesLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 pl-4 pr-3 py-2 text-slate-400 hover:text-violet-300 font-semibold text-sm transition-colors"
                    onClick={() => { setMobileOpen(false); setMobileGamesOpen(false) }}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/daily-spin" className="px-3 py-2.5 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors hover:bg-white/[0.04] text-sm" onClick={() => setMobileOpen(false)}>🎁 Free Spin</Link>
            <Link href="/inventory"  className="px-3 py-2.5 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors hover:bg-white/[0.04] text-sm" onClick={() => setMobileOpen(false)}>Inventory</Link>
            <Link href="/results"    className="px-3 py-2.5 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors hover:bg-white/[0.04] text-sm" onClick={() => setMobileOpen(false)}>Results</Link>

            {session?.user?.isAdmin && (
              <Link href="/admin" className="px-3 py-2.5 font-bold text-sm" style={{ color: '#FFD700' }} onClick={() => setMobileOpen(false)}>Admin</Link>
            )}

            <div className="h-px my-2" style={{ background: 'rgba(30,41,59,0.7)' }} />

            {session ? (
              <>
                <Link href="/profile" className="px-3 py-2.5 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors hover:bg-white/[0.04] text-sm" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => signOut()} className="text-left px-3 py-2.5 text-red-400 hover:text-red-300 font-semibold text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2.5 text-slate-300 hover:text-white font-semibold text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="btn-gold text-center mt-2 mx-3" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
