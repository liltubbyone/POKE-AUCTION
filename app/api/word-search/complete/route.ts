import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function todayCentral() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

// POST — record that the user completed today's word search
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayCentral()

  // Check if word search is enabled
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'main' },
    create: { id: 'main' },
    update: {},
  })
  if (!(settings as any).wordSearchEnabled) {
    return NextResponse.json({ error: 'Word search is disabled' }, { status: 403 })
  }

  // Try to record completion (ignore duplicate — already completed today)
  const existing = await prisma.wordSearchCompletion.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  })

  if (existing) {
    return NextResponse.json({ bonusSpin: false, alreadyCompleted: true })
  }

  await prisma.wordSearchCompletion.create({
    data: { userId: session.user.id, date: today },
  })

  return NextResponse.json({ bonusSpin: true, alreadyCompleted: false })
}
