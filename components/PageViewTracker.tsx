'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function PageViewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef('')

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [pathname])

  return null
}
