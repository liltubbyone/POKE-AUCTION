'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomBar() {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null

  const tabs = [
    {
      href: '/auctions',
      label: 'Play',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/auctions',
      label: 'Live',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
        </svg>
      ),
      badge: true,
    },
    {
      href: '/profile',
      label: 'Deposit',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      gold: true,
    },
  ]

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(6,6,13,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,215,0,0.15)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95"
            style={tab.gold ? {
              background: 'linear-gradient(135deg, rgba(255,228,77,0.15) 0%, rgba(255,215,0,0.1) 100%)',
              color: '#FFD700',
            } : {
              color: active ? '#FFD700' : '#6B7280',
            }}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }}
                />
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
