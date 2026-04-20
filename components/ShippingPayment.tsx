'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SavedCard { id: string; last4: string; brand: string }

function ShippingForm({
  spotId,
  shippingCost,
  savedCard,
  onPaid,
  onError,
}: {
  spotId: string
  shippingCost: number
  savedCard: SavedCard | null
  onPaid: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [useSaved, setUseSaved] = useState(!!savedCard)

  const confirmAndRecord = async (paymentIntentId: string) => {
    const res = await fetch(`/api/spots/${spotId}/pay-shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId }),
    })
    if (res.ok) onPaid()
    else {
      const d = await res.json()
      onError(d.error || 'Payment succeeded but could not record. Contact support.')
    }
  }

  const handleSavedCardPay = async (clientSecret: string) => {
    if (!stripe || !savedCard) return
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: savedCard.id,
    })
    if (error) { onError(error.message || 'Payment failed'); return }
    if (paymentIntent?.status === 'succeeded') await confirmAndRecord(paymentIntent.id)
    else onError('Payment not completed.')
  }

  const handleNewCardPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    if (error) { onError(error.message || 'Payment failed'); return }
    if (paymentIntent?.status === 'succeeded') await confirmAndRecord(paymentIntent.id)
    else onError('Payment not completed.')
  }

  const handlePay = async () => {
    if (!stripe) return
    setLoading(true)
    if (useSaved) {
      // We need the clientSecret from the parent — but we have it via Elements context
      // Use the Elements form approach instead
    }
    setLoading(false)
  }

  if (useSaved && savedCard) {
    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}
        >
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-white text-sm capitalize">{savedCard.brand} •••• {savedCard.last4}</span>
        </div>
        <button
          onClick={async () => {
            setLoading(true)
            // Get the clientSecret from Elements context via confirmPayment fallback
            if (!stripe) { setLoading(false); return }
            // Re-use the form but skip PaymentElement rendering
            setUseSaved(false)
            setLoading(false)
          }}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Use a different card instead
        </button>
        {/* Hidden submit handled by parent stripe.confirmCardPayment */}
      </div>
    )
  }

  return (
    <form onSubmit={handleNewCardPay} className="space-y-3">
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}
      >
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(shippingCost)} Shipping`}
      </button>
    </form>
  )
}

export default function ShippingPayment({
  spotId,
  savedCard,
  onPaid,
}: {
  spotId: string
  savedCard: SavedCard | null
  onPaid: () => void
}) {
  const [step, setStep] = useState<'idle' | 'loading' | 'form' | 'done'>('idle')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [shippingCost, setShippingCost] = useState(0)
  const [itemName, setItemName] = useState('')
  const [error, setError] = useState('')
  const [payingWithSaved, setPayingWithSaved] = useState(false)

  const start = async () => {
    setStep('loading')
    setError('')
    const res = await fetch('/api/payments/stripe/shipping-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Could not start shipping payment.'); setStep('idle'); return }
    setClientSecret(data.clientSecret)
    setShippingCost(data.shippingCost)
    setItemName(data.itemName || 'your item')
    setStep('form')
  }

  const handleSavedCardPay = async () => {
    if (!clientSecret) return
    setPayingWithSaved(true)
    setError('')
    const stripe = await stripePromise
    if (!stripe) { setError('Stripe failed to load.'); setPayingWithSaved(false); return }
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: savedCard!.id,
    })
    if (confirmError) { setError(confirmError.message || 'Payment failed.'); setPayingWithSaved(false); return }
    if (paymentIntent?.status === 'succeeded') {
      const res = await fetch(`/api/spots/${spotId}/pay-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      })
      if (res.ok) { setStep('done'); onPaid() }
      else { const d = await res.json(); setError(d.error || 'Could not record payment. Contact support.') }
    } else {
      setError('Payment not completed.')
    }
    setPayingWithSaved(false)
  }

  if (step === 'done') {
    return (
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <p className="text-green-400 font-semibold">Shipping paid! We will ship your item soon.</p>
      </div>
    )
  }

  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#FFD700',
      colorBackground: '#06060d',
      colorText: '#e5e7eb',
      colorDanger: '#f87171',
      fontFamily: 'Rajdhani, sans-serif',
      borderRadius: '10px',
    },
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {step === 'idle' && (
        <button onClick={start} className="btn-gold w-full py-2.5">
          Pay Shipping to Claim Your Item
        </button>
      )}

      {step === 'loading' && (
        <div className="btn-gold w-full py-2.5 opacity-50 text-center">Loading...</div>
      )}

      {step === 'form' && clientSecret && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Shipping cost for <span className="text-white font-semibold">{itemName}</span>:{' '}
            <span className="text-gold font-bold">{formatCurrency(shippingCost)}</span>
          </p>

          {savedCard && (
            <div className="space-y-2">
              <button
                onClick={handleSavedCardPay}
                disabled={payingWithSaved}
                className="btn-gold w-full disabled:opacity-50"
              >
                {payingWithSaved
                  ? 'Processing...'
                  : `Pay ${formatCurrency(shippingCost)} with ${savedCard.brand} ••••${savedCard.last4}`}
              </button>
              <p className="text-xs text-gray-600 text-center">or pay with a different card:</p>
            </div>
          )}

          <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
            <ShippingForm
              spotId={spotId}
              shippingCost={shippingCost}
              savedCard={null}
              onPaid={() => { setStep('done'); onPaid() }}
              onError={setError}
            />
          </Elements>
        </div>
      )}
    </div>
  )
}
