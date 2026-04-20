'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SavedCard {
  id: string
  last4: string
  brand: string
}

function SetupForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Failed to save card. Please try again.')
      setLoading(false)
      return
    }

    if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
      const pmId =
        typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method.id

      await fetch('/api/payments/stripe/saved-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })

      onSaved()
    } else {
      setError('Card setup did not complete. Please try again.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}
      >
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-outline flex-1 py-2">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-gold flex-1 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </form>
  )
}

export default function SavedCardSetup({ onUpdate }: { onUpdate?: () => void }) {
  const [savedCard, setSavedCard] = useState<SavedCard | null | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)

  const fetchSavedCard = async () => {
    const res = await fetch('/api/payments/stripe/saved-card')
    if (res.ok) setSavedCard(await res.json())
  }

  useEffect(() => { fetchSavedCard() }, [])

  const handleAddCard = async () => {
    setLoadingForm(true)
    const res = await fetch('/api/payments/stripe/setup-intent', { method: 'POST' })
    const data = await res.json()
    if (data.clientSecret) {
      setClientSecret(data.clientSecret)
      setShowForm(true)
    }
    setLoadingForm(false)
  }

  const handleRemove = async () => {
    setRemoving(true)
    await fetch('/api/payments/stripe/saved-card', { method: 'DELETE' })
    setSavedCard(null)
    setRemoving(false)
    onUpdate?.()
  }

  const handleSaved = () => {
    setShowForm(false)
    setClientSecret(null)
    fetchSavedCard()
    onUpdate?.()
  }

  if (savedCard === undefined) {
    return <div className="text-gray-500 text-sm animate-pulse">Loading card info...</div>
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
    <div>
      {savedCard ? (
        <div
          className="flex items-center justify-between rounded-xl p-4"
          style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <p className="text-white font-semibold capitalize">
                {savedCard.brand} •••• {savedCard.last4}
              </p>
              <p className="text-xs text-gray-500">Saved — used automatically at checkout</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ) : !showForm ? (
        <button
          onClick={handleAddCard}
          disabled={loadingForm}
          className="btn-gold w-full disabled:opacity-50"
        >
          {loadingForm ? 'Loading...' : '+ Add Credit / Debit Card'}
        </button>
      ) : null}

      {showForm && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: stripeAppearance }}
        >
          <SetupForm
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setClientSecret(null) }}
          />
        </Elements>
      )}
    </div>
  )
}
