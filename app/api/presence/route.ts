import { NextResponse } from 'next/server'

// In-memory map: sessionId -> last heartbeat timestamp (ms)
const sessions = new Map<string, number>()

// Consider a visitor active if they pinged within the last 90 seconds
const ACTIVE_WINDOW_MS = 90_000

// Clean up stale sessions every call (cheap since this map stays small)
function cleanStale() {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS
  Array.from(sessions.entries()).forEach(([id, ts]) => {
    if (ts < cutoff) sessions.delete(id)
  })
}

// POST /api/presence — visitor heartbeat
export async function POST(req: Request) {
  const { sessionId } = await req.json()
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }
  cleanStale()
  sessions.set(sessionId, Date.now())
  return NextResponse.json({ ok: true })
}

// GET /api/presence — admin polls active visitor count
export async function GET() {
  cleanStale()
  return NextResponse.json({ count: sessions.size })
}
