'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomBar() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(2,6,23,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(30,41,59,0.8)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(56,189,248,0.3), rgba(124,58,237,0.4), transparent)' }}
      />

      {/* Play */}
      <Link
        href="/browse"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95"
        style={{ color: isActive('/browse') ? '#a78bfa' : '#475569' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: isActive('/browse') ? '#a78bfa' : '#475569' }}
        >
          Play
        </span>
        {isActive('/browse') && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{ background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
        )}
      </Link>

      {/* Live */}
      <Link
        href="/live"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95 relative"
        style={{ color: isActive('/live') ? '#38bdf8' : '#475569' }}
      >
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
          </svg>
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
        {isActive('/live') && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
        )}
      </Link>

      {/* Shop */}
      <Link
        href="/inventory"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95 relative"
        style={{ color: isActive('/inventory') ? '#FFD700' : '#475569' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">Shop</span>
        {isActive('/inventory') && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{ background: '#FFD700', boxShadow: '0 0 6px #FFD700' }} />
        )}
      </Link>

      {/* Spin (Free Spin — highlighted center) */}
      <Link
        href="/daily-spin"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95 relative"
        style={{ color: isActive('/daily-spin') ? '#FFD700' : '#64748b' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: isActive('/daily-spin')
              ? 'linear-gradient(135deg, rgba(255,228,77,0.2), rgba(255,215,0,0.1))'
              : 'rgba(255,215,0,0.06)',
            border: `1px solid ${isActive('/daily-spin') ? 'rgba(255,215,0,0.5)' : 'rgba(255,215,0,0.15)'}`,
            boxShadow: isActive('/daily-spin') ? '0 0 12px rgba(255,215,0,0.3)' : 'none',
          }}
        >
          <span className="text-sm">🎁</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FFD700' }}>Free Spin</span>
      </Link>

      {/* Profile */}
      <Link
        href="/profile"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95 relative"
        style={{ color: isActive('/profile') ? '#38bdf8' : '#475569' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
        {isActive('/profile') && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
        )}
      </Link>
    </div>
  )
}
