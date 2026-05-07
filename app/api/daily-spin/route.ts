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

// GET — check spin status for today
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayCentral()
  const [userSpinsToday, totalToday, settings] = await Promise.all([
    prisma.dailySpin.findMany({
      where: { userId: session.user.id, spinDate: today },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dailySpin.count({ where: { spinDate: today } }),
    getSettings(),
  ])

  const spinsUsed = userSpinsToday.length
  const baseLimit = (settings as any).dailySpinLimit ?? 1

  // Grant +1 spin if user completed today's word search
  const wordSearchBonus = await prisma.wordSearchCompletion.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  })
  const limit = baseLimit + (wordSearchBonus ? 1 : 0)

  const hasSpunToday = spinsUsed >= limit
  const won = userSpinsToday.some((s) => s.won)
  const lastSpin = userSpinsToday[0]

  return NextResponse.json({
    hasSpunToday,
    spinsUsed,
    spinsLimit: limit,
    won,
    spinNumber: lastSpin?.spinNumber ?? null,
    totalSpinsToday: totalToday,
    winnerSpinNumber: settings.winnerSpinNumber,
    mysteryGiftName: settings.mysteryGiftName,
    mysteryGiftImage: settings.mysteryGiftImage,
    wheelSegments: (settings as any).wheelSegments ?? '[]',
    mysteryWheelTheme: (settings as any).mysteryWheelTheme ?? 'cosmic',
    customMysteryColor: (settings as any).customMysteryColor ?? '#7C3AED',
  })
}

// POST — perform a spin
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayCentral()
  const settings = await getSettings()
  const limit = (settings as any).dailySpinLimit ?? 1

  const [spinsUsed, wordSearchBonus] = await Promise.all([
    prisma.dailySpin.count({ where: { userId: session.user.id, spinDate: today } }),
    prisma.wordSearchCompletion.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    }),
  ])
  const effectiveLimit = limit + (wordSearchBonus ? 1 : 0)

  if (spinsUsed >= effectiveLimit) {
    return NextResponse.json({ alreadySpun: true, won: false, spinNumber: null })
  }

  const count = await prisma.dailySpin.count({ where: { spinDate: today } })
  const spinNumber = count + 1
  const won = spinNumber === settings.winnerSpinNumber

  await prisma.dailySpin.create({
    data: { userId: session.user.id, spinDate: today, spinNumber, won },
  })

  return NextResponse.json({
    alreadySpun: false,
    won,
    spinNumber,
    spinsUsed: spinsUsed + 1,
    spinsLimit: effectiveLimit,
    mysteryGiftName: settings.mysteryGiftName,
    mysteryGiftImage: settings.mysteryGiftImage,
    winnerSpinNumber: settings.winnerSpinNumber,
  })
}
