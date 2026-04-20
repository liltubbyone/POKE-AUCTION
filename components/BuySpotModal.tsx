'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SavedCard { id: string; last4: string; brand: string }

interface SpinResult {
  itemName: string
  itemTier: string
}

interface PurchaseResult {
  spot: {
    id: string
    spotNumber: number
    paid: boolean
    assignedItemId: string | null
    paymentMethod: string | null
    shipped: boolean
    trackingNumber: string | null
    user: { id: string; name: string | null; email: string }
  }
  spinResult: SpinResult | null
}

interface BuySpotModalProps {
  auction: {
    id: string
    name: string
    spotPrice: number
    totalSpots: number
    shippingRate?: number
  }
  spotsLeft: number
  onClose: () => void
  onSuccess: (result?: PurchaseResult) => void
}

// Inner form — must live inside <Elements>
function StripeCheckoutForm({
  auction,
  onSuccess,
  onError,
}: {
  auction: BuySpotModalProps['auction']
  onSuccess: (result?: PurchaseResult) => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message || 'Payment failed. Please try again.')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const res = await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auctionId: auction.id,
            paymentMethod: 'stripe',
            paymentId: paymentIntent.id,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          onError(data.error || 'Payment succeeded but spot creation failed. Contact support.')
        } else {
          onSuccess({ spot: data.spot, spinResult: data.spinResult ?? null })
        }
      } catch {
        onError('Payment succeeded but we could not confirm your spot. Contact support.')
      }
    } else {
      onError('Payment was not completed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}
      >
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(auction.spotPrice)} & Get Spot`}
      </button>
    </form>
  )
}

export default function BuySpotModal({ auction, spotsLeft, onClose, onSuccess }: BuySpotModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'venmo' | 'cashapp'>('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'choose' | 'stripe-form' | 'manual-instructions'>('choose')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null)
  const [chargedTotal, setChargedTotal] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/payments/stripe/saved-card')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setSavedCard(data))
      .catch(() => {})
  }, [])

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  // Pay with saved card — no card form needed
  const handleSavedCardPay = async () => {
    if (!savedCard) return
    setLoading(true)
    setError('')
    try {
      // Create payment intent
      const intentRes = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id }),
      })
      const intentData = await intentRes.json()
      if (!intentRes.ok) { setError(intentData.error || 'Could not start payment.'); setLoading(false); return }
      if (intentData.total) setChargedTotal(intentData.total)

      // Confirm with saved card using raw stripe instance (no Elements needed)
      const stripe = await stripePromise
      if (!stripe) { setError('Stripe failed to load.'); setLoading(false); return }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        { payment_method: savedCard.id }
      )

      if (confirmError) { setError(confirmError.message || 'Payment failed.'); setLoading(false); return }

      if (paymentIntent?.status === 'succeeded') {
        const spotRes = await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auctionId: auction.id, paymentMethod: 'stripe', paymentId: paymentIntent.id }),
        })
        const spotData = await spotRes.json()
        if (!spotRes.ok) { setError(spotData.error || 'Payment succeeded but spot creation failed.') }
        else { onSuccess({ spot: spotData.spot, spinResult: spotData.spinResult ?? null }) }
      } else {
        setError('Payment was not completed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleStripeClick = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not start checkout. Try again.')
      } else {
        setClientSecret(data.clientSecret)
        setChargedTotal(data.total)
        setStep('stripe-form')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
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
        onSuccess({ spot: data.spot, spinResult: null })
      }
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div
        className="w-full max-w-md relative rounded-2xl p-6"
        style={{ background: '#0d0d1a', border: '1px solid rgba(30,30,53,0.8)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-heading text-white mb-1">Buy a Spot</h2>
        <p className="text-gray-500 text-sm mb-5">{auction.name}</p>

        {/* Price summary */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Spot Price</span>
            <span className="text-white font-semibold">{formatCurrency(auction.spotPrice)}</span>
          </div>
          {auction.shippingRate != null && (
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-gray-400">Shipping <span className="text-gray-600 text-xs">(1st spot only — all wins ship together)</span></span>
              <span className="text-gray-300">{formatCurrency(auction.shippingRate)}</span>
            </div>
          )}
          <div className="border-t border-gold/20 mt-2 pt-2 flex justify-between items-center">
            <span className="text-gray-400 text-sm font-semibold">Total</span>
            <span className="text-gold font-bold text-xl font-heading">{formatCurrency(chargedTotal ?? (auction.spotPrice + (auction.shippingRate ?? 0)))}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-gray-600">Spots Remaining</span>
            <span className="text-white font-semibold">{spotsLeft}</span>
          </div>
        </div>

        <div className="no-refund-banner mb-5 text-xs">
          All Sales Final — No Refunds — Payment Is Immediate
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl mb-4 text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}
          >
            {error}
          </div>
        )}

        {/* Step: choose payment method */}
        {step === 'choose' && (
          <>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'stripe',  label: 'Credit Card', sub: 'Instant' },
                  { id: 'venmo',   label: 'Venmo',       sub: 'Manual' },
                  { id: 'cashapp', label: 'Cash App',    sub: 'Manual' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as 'stripe' | 'venmo' | 'cashapp')}
                    className="rounded-xl p-3 text-left transition-all duration-200"
                    style={{
                      border: paymentMethod === method.id
                        ? '1px solid rgba(255,215,0,0.5)'
                        : '1px solid rgba(30,30,53,0.8)',
                      background: paymentMethod === method.id
                        ? 'rgba(255,215,0,0.06)'
                        : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="font-semibold text-sm" style={{ color: paymentMethod === method.id ? '#FFD700' : '#9ca3af' }}>
                      {method.label}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{method.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'stripe' ? (
              <div className="space-y-2">
                {savedCard && (
                  <button
                    onClick={handleSavedCardPay}
                    disabled={loading}
                    className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `Pay ${formatCurrency(chargedTotal ?? auction.spotPrice)} with ${savedCard.brand} ••••${savedCard.last4}`}
                  </button>
                )}
                <button
                  onClick={handleStripeClick}
                  disabled={loading}
                  className={savedCard ? 'btn-outline w-full disabled:opacity-50' : 'btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed'}
                >
                  {loading ? 'Loading checkout...' : savedCard ? 'Use a different card' : `Pay ${formatCurrency(chargedTotal ?? auction.spotPrice)} & Get Spot`}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setStep('manual-instructions')}
                className="btn-gold w-full"
              >
                View Payment Instructions
              </button>
            )}
          </>
        )}

        {/* Step: Stripe card form */}
        {step === 'stripe-form' && clientSecret && (
          <div>
            <button
              onClick={() => { setStep('choose'); setClientSecret(null) }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#FFD700',
                    colorBackground: '#06060d',
                    colorText: '#e5e7eb',
                    colorDanger: '#f87171',
                    fontFamily: 'Rajdhani, sans-serif',
                    borderRadius: '10px',
                  },
                },
              }}
            >
              <StripeCheckoutForm
                auction={auction}
                onSuccess={onSuccess}
                onError={setError}
              />
            </Elements>
          </div>
        )}

        {/* Step: manual (Venmo / CashApp) instructions */}
        {step === 'manual-instructions' && (
          <div>
            <div
              className="rounded-xl p-5 mb-5"
              style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}
            >
              <h3 className="font-heading text-lg text-gold mb-3">
                {paymentMethod === 'venmo' ? 'Venmo Instructions' : 'Cash App Instructions'}
              </h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Open {paymentMethod === 'venmo' ? 'Venmo' : 'Cash App'} on your phone</li>
                <li>
                  2. Send <strong className="text-gold">{formatCurrency(chargedTotal ?? auction.spotPrice)}</strong> to{' '}
                  <strong className="text-white">
                    {paymentMethod === 'venmo'
                      ? (process.env.NEXT_PUBLIC_VENMO_HANDLE || '@PokeAuction')
                      : (process.env.NEXT_PUBLIC_CASHAPP_HANDLE || '$PokeAuction')}
                  </strong>
                </li>
                <li>
                  3. In the note write:{' '}
                  <strong className="text-white">PokeAuction — {session.user.email}</strong>
                </li>
                <li>4. Click &quot;Reserve My Spot&quot; below — admin will confirm within a few hours.</li>
              </ol>
              <div
                className="mt-4 rounded-lg p-3 text-xs"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
              >
                Your spot is NOT guaranteed until the admin confirms your payment.
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('choose')} className="btn-outline flex-1">
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
