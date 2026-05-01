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

async function getSettings() {
  return prisma.siteSettings.upsert({
    where: { id: 'main' },
    create: { id: 'main' },
    update: {},
  })
}

// GET — check if user has already spun today and today's spin count
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayCentral()
  const [existing, totalToday, settings] = await Promise.all([
    prisma.dailySpin.findUnique({
      where: { userId_spinDate: { userId: session.user.id, spinDate: today } },
    }),
    prisma.dailySpin.count({ where: { spinDate: today } }),
    getSettings(),
  ])

  return NextResponse.json({
    hasSpunToday: !!existing,
    won: existing?.won ?? false,
    spinNumber: existing?.spinNumber ?? null,
    totalSpinsToday: totalToday,
    winnerSpinNumber: settings.winnerSpinNumber,
    mysteryGiftName: settings.mysteryGiftName,
    mysteryGiftImage: settings.mysteryGiftImage,
  })
}

// POST — perform the daily spin
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayCentral()
  const settings = await getSettings()

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if already spun
      const existing = await tx.dailySpin.findUnique({
        where: { userId_spinDate: { userId: session.user.id, spinDate: today } },
      })
      if (existing) {
        return { alreadySpun: true, won: existing.won, spinNumber: existing.spinNumber }
      }

      // Count today's spins to get next number
      const count = await tx.dailySpin.count({ where: { spinDate: today } })
      const spinNumber = count + 1
      const won = spinNumber === settings.winnerSpinNumber

      await tx.dailySpin.create({
        data: {
          userId: session.user.id,
          spinDate: today,
          spinNumber,
          won,
        },
      })

      return { alreadySpun: false, won, spinNumber }
    })

    return NextResponse.json({
      ...result,
      mysteryGiftName: settings.mysteryGiftName,
      mysteryGiftImage: settings.mysteryGiftImage,
      winnerSpinNumber: settings.winnerSpinNumber,
    })
  } catch (err: any) {
    // Unique constraint = already spun (race condition edge case)
    if (err?.code === 'P2002') {
      const existing = await prisma.dailySpin.findUnique({
        where: { userId_spinDate: { userId: session.user.id, spinDate: today } },
      })
      return NextResponse.json({ alreadySpun: true, won: existing?.won ?? false, spinNumber: existing?.spinNumber ?? null })
    }
    console.error(err)
    return NextResponse.json({ error: 'Spin failed' }, { status: 500 })
  }
}
