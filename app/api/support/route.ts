import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, subject, message } = body

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const msg = await prisma.supportMessage.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    },
  })

  return NextResponse.json({ ok: true, id: msg.id })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(messages)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const msg = await prisma.supportMessage.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(msg)
}
