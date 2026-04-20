import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// GET: return saved card info (last4, brand) or null
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.paymentInfo) return NextResponse.json(null)

  let info: Record<string, string> = {}
  try { info = JSON.parse(user.paymentInfo) } catch { return NextResponse.json(null) }

  const pmId = info.stripePaymentMethodId
  if (!pmId) return NextResponse.json(null)

  const stripe = getStripe()
  try {
    const pm = await stripe.paymentMethods.retrieve(pmId)
    if (pm.card) {
      return NextResponse.json({ id: pmId, last4: pm.card.last4, brand: pm.card.brand })
    }
    return NextResponse.json(null)
  } catch {
    return NextResponse.json(null)
  }
}

// POST: save payment method ID after SetupIntent succeeds
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentMethodId } = await req.json()
  if (!paymentMethodId) return NextResponse.json({ error: 'paymentMethodId required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let info: Record<string, string> = {}
  if (user.paymentInfo) {
    try { info = JSON.parse(user.paymentInfo) } catch {}
  }
  info.stripePaymentMethodId = paymentMethodId

  await prisma.user.update({
    where: { id: user.id },
    data: { paymentInfo: JSON.stringify(info) },
  })

  return NextResponse.json({ success: true })
}

// DELETE: detach from Stripe and remove from user
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.paymentInfo) return NextResponse.json({ success: true })

  let info: Record<string, string> = {}
  try { info = JSON.parse(user.paymentInfo) } catch {}

  const pmId = info.stripePaymentMethodId
  if (pmId) {
    try { await getStripe().paymentMethods.detach(pmId) } catch {}
    delete info.stripePaymentMethodId
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { paymentInfo: JSON.stringify(info) },
  })

  return NextResponse.json({ success: true })
}
