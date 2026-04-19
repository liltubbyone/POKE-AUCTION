'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface SpinResult {
  itemName: string
  itemTier: string
}

interface BuySpotModalProps {
  auction: {
    id: string
    name: string
    spotPrice: number
    totalSpots: number
  }
  spotsLeft: number
  onClose: () => void
  onSuccess: (spinResult?: SpinResult) => void
}

export default function BuySpotModal({ auction, spotsLeft, onClose, onSuccess }: BuySpotModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'venmo' | 'cashapp'>('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'choose' | 'manual-instructions'>('choose')

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  const handleStripeOrPayPal = async () => {
    setLoading(true)
    setError('')

    try {
      // For demo: directly create spot with mock payment
      // In production, this would go through Stripe Payment Intent
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          paymentMethod,
          paymentId: `demo_${Date.now()}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to purchase spot')
      } else {
        onSuccess(data.spinResult ?? undefined)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const handleManualPayment = () => {
    setStep('manual-instructions')
  }

  const handleManualConfirm = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          paymentMethod,
          paymentId: null,
          paid: false,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reserve spot')
      } else {
        onSuccess()
      }
    } catch {
      setError('Something went wrong.')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md relative animate-bounce-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-heading text-white mb-2">BUY A SPOT</h2>
        <p className="text-gray-400 text-sm mb-6">{auction.name}</p>

        {/* Price summary */}
        <div className="bg-background border border-border rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Spot Price</span>
            <span className="text-gold font-bold text-xl">{formatCurrency(auction.spotPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Spots Remaining</span>
            <span className="text-white font-semibold">{spotsLeft}</span>
          </div>
        </div>

        <div className="no-refund-banner mb-6 text-xs">
          ALL SALES FINAL — NO REFUNDS — PAYMENT IS IMMEDIATE
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'choose' && (
          <>
            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'stripe', label: 'Credit Card', icon: '💳', desc: 'Stripe — Instant' },
                  { id: 'paypal', label: 'PayPal', icon: '🅿️', desc: 'PayPal — Instant' },
                  { id: 'venmo', label: 'Venmo', icon: '💙', desc: 'Manual confirm' },
                  { id: 'cashapp', label: 'Cash App', icon: '💚', desc: 'Manual confirm' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as 'stripe' | 'paypal' | 'venmo' | 'cashapp')}
                    className={`border rounded-lg p-3 text-left transition-all ${
                      paymentMethod === method.id
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="font-semibold text-sm">{method.label}</div>
                    <div className="text-xs opacity-70">{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {(paymentMethod === 'venmo' || paymentMethod === 'cashapp') ? (
              <button
                onClick={handleManualPayment}
                className="btn-gold w-full"
              >
                View Payment Instructions →
              </button>
            ) : (
              <button
                onClick={handleStripeOrPayPal}
                disabled={loading}
                className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay ${formatCurrency(auction.spotPrice)} & Get Spot`}
              </button>
            )}
          </>
        )}

        {step === 'manual-instructions' && (
          <div>
            <div className="bg-background border border-gold/30 rounded-lg p-5 mb-6">
              <h3 className="font-heading text-xl text-gold mb-3">
                {paymentMethod === 'venmo' ? 'VENMO INSTRUCTIONS' : 'CASH APP INSTRUCTIONS'}
              </h3>

              {paymentMethod === 'venmo' ? (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">1. Open Venmo on your phone</p>
                  <p className="text-gray-300 text-sm">
                    2. Send{' '}
                    <strong className="text-gold">{formatCurrency(auction.spotPrice)}</strong> to:{' '}
                    <strong className="text-white text-lg">
                      {process.env.NEXT_PUBLIC_VENMO_HANDLE || '@PokeAuction'}
                    </strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    3. In the note, write:{' '}
                    <strong className="text-white">PokeAuction - {session.user.email}</strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    4. Click &ldquo;Reserve My Spot&rdquo; below. Admin will confirm your payment and activate
                    your spot within a few hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">1. Open Cash App on your phone</p>
                  <p className="text-gray-300 text-sm">
                    2. Send{' '}
                    <strong className="text-gold">{formatCurrency(auction.spotPrice)}</strong> to:{' '}
                    <strong className="text-white text-lg">
                      {process.env.NEXT_PUBLIC_CASHAPP_HANDLE || '$PokeAuction'}
                    </strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    3. In the note, write:{' '}
                    <strong className="text-white">PokeAuction - {session.user.email}</strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    4. Click &ldquo;Reserve My Spot&rdquo; below. Admin will confirm and activate your spot.
                  </p>
                </div>
              )}

              <div className="mt-4 bg-red-950/30 border border-red-500/30 rounded p-3">
                <p className="text-red-300 text-xs font-semibold">
                  ⚠️ Your spot is NOT guaranteed until the admin confirms your payment.
                  Spots are assigned on a first-come, first-served basis.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="btn-outline flex-1"
              >
                Back
              </button>
              <button
                onClick={handleManualConfirm}
                disabled={loading}
                className="btn-gold flex-1 disabled:opacity-50"
              >
                {loading ? 'Reserving...' : 'Reserve My Spot'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
