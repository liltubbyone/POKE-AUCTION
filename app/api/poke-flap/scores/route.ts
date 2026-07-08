import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/poke-flap/scores — top 20 all-time scores
export async function GET() {
  const scores = await prisma.pokeFlapScore.findMany({
    orderBy: { score: 'desc' },
    take: 50,
    select: {
      id: true,
      playerName: true,
      score: true,
      pokemonName: true,
      pokemonImg: true,
      createdAt: true,
    },
  })
  return NextResponse.json(scores)
}

// POST /api/poke-flap/scores — submit a score
export async function POST(req: Request) {
  const body = await req.json()
  const { playerName, score, pokemonName, pokemonImg } = body

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    return NextResponse.json({ error: 'playerName required' }, { status: 400 })
  }
  if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
    return NextResponse.json({ error: 'invalid score' }, { status: 400 })
  }

  const entry = await prisma.pokeFlapScore.create({
    data: {
      playerName: playerName.trim().slice(0, 20),
      score,
      pokemonName: pokemonName || 'Unknown',
      pokemonImg: pokemonImg || '',
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
