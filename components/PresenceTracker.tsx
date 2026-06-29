'use client'

import { useEffect, useRef } from 'react'

const HEARTBEAT_INTERVAL_MS = 30_000

function getSessionId(): string {
  let id = sessionStorage.getItem('cg_session_id')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('cg_session_id', id)
  }
  return id
}

function sendHeartbeat() {
  fetch('/api/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: getSessionId() }),
  }).catch(() => {})
}

export default function PresenceTracker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    sendHeartbeat() // immediate ping on mount
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
