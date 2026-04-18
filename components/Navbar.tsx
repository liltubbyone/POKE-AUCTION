'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl font-heading gold-gradient-text tracking-wider">
              POKE<span className="text-white">AUCTION</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-gold transition-colors font-semibold tracking-wide text-sm uppercase">
              Home
            </Link>
            <Link href="/inventory" className="text-gray-300 hover:text-gold transition-colors font-semibold tracking-wide text-sm uppercase">
              Inventory
            </Link>
            {session?.user?.isAdmin && (
              <Link href="/admin" className="text-gold hover:text-gold-light transition-colors font-semibold tracking-wide text-sm uppercase border border-gold/30 px-3 py-1 rounded">
                Admin
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="text-gray-300 hover:text-gold transition-colors font-semibold text-sm">
                  {session.user.name || session.user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="btn-outline text-sm py-2 px-4"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-gray-300 hover:text-gold transition-colors font-semibold text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-gold text-sm py-2 px-4">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-gold"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden pb-4 border-t border-border pt-4 flex flex-col gap-3">
            <Link href="/" className="text-gray-300 hover:text-gold font-semibold" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/inventory" className="text-gray-300 hover:text-gold font-semibold" onClick={() => setMobileOpen(false)}>Inventory</Link>
            {session?.user?.isAdmin && (
              <Link href="/admin" className="text-gold font-semibold" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            {session ? (
              <>
                <Link href="/profile" className="text-gray-300 hover:text-gold font-semibold" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => signOut()} className="text-left text-red-400 hover:text-red-300 font-semibold">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-300 hover:text-gold font-semibold" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="btn-gold text-center" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
