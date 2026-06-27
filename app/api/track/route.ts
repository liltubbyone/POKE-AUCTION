import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json()

    // Skip admin paths and invalid paths
    if (!path || typeof path !== 'string' || path.startsWith('/admin')) {
      return NextResponse.json({ ok: true })
    }

    await prisma.pageView.create({
      data: {
        path: path.slice(0, 500),
        referrer: referrer ? String(referrer).slice(0, 500) : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
