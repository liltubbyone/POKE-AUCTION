'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export interface CartItem {
  id: string
  name: string
  storePrice: number
  imageUrl: string | null
  qty: number // available qty
  quantity: number // in cart
  shippingCost: number
}

interface CouponInfo {
  id: string
  code: string
  type: string
  value: number
  discount: number
}

// --- Inner Stripe form ---
function StripeForm({
  onSuccess,
  onError,
  total,
}: {
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
  total: number
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
      onError(error.message || 'Payment failed')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      onError('Payment was not completed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
      </button>
    </form>
  )
}

// --- Main checkout modal ---
interface Props {
  cart: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

export default function StoreCheckout({ cart, onClose, onSuccess }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<'cart' | 'payment' | 'done'>('cart')
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CouponInfo | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pricing, setPricing] = useState<{ subtotal: number; discount: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  const subtotal = cart.reduce((s, i) => s + i.storePrice * i.quantity, 0)
  const shippingEst = Math.max(...cart.map((i) => i.shippingCost))
  const displayDiscount = coupon?.discount ?? 0
  const displayTotal = Math.max(0, subtotal - displayDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCoupon(null)
    try {
      const res = await fetch('/api/store/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error || 'Invalid coupon')
      } else {
        setCoupon(data)
      }
    } catch {
      setCouponError('Failed to validate coupon')
    }
    setCouponLoading(false)
  }

  const handleRemoveCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleProceedToPayment = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
          couponCode: coupon?.code || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout')
      } else {
        setClientSecret(data.clientSecret)
        setPricing({ subtotal: data.subtotal, discount: data.discount, total: data.total })
        setStep('payment')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/store/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Order confirmation failed. Contact support.')
      } else {
        setOrderId(data.orderId)
        setStep('done')
        onSuccess()
      }
    } catch {
      setError('Payment succeeded but order confirmation failed. Contact support.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
      <div
        className="w-full max-w-lg relative rounded-2xl p-6 my-auto"
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

        {/* Done state */}
        {step === 'done' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading text-white mb-2">Order Confirmed!</h2>
            <p className="text-gray-400 text-sm mb-1">Order #{orderId?.slice(-8).toUpperCase()}</p>
            <p className="text-gray-500 text-sm mb-6">
              Your items will be shipped to your address on file. You&apos;ll receive a tracking number when shipped.
            </p>
            <button onClick={onClose} className="btn-gold">
              Continue Shopping
            </button>
          </div>
        )}

        {/* Cart + coupon step */}
        {step === 'cart' && (
          <>
            <h2 className="text-2xl font-heading text-white mb-5">Your Cart</h2>

            {/* Cart items */}
            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain rounded-lg bg-black/20 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-black/30 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-gold font-bold text-sm flex-shrink-0">
                    {formatCurrency(item.storePrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="mb-5">
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Coupon Code</label>
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <div>
                    <span className="text-green-400 font-semibold text-sm">{coupon.code}</span>
                    <span className="text-green-300 text-xs ml-2">
                      {coupon.type === 'percent' ? `${coupon.value}% off` : `$${coupon.value} off`}
                      {' — '}saves {formatCurrency(coupon.discount)}
                    </span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-gray-500 hover:text-white text-xs ml-3">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter code…"
                    className="input-field flex-1 text-sm py-2 uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-border text-gray-300 hover:text-white hover:border-gold/40 transition-all disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
            </div>

            {/* Price summary */}
            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              {displayDiscount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400">Discount ({coupon?.code})</span>
                  <span className="text-green-400">-{formatCurrency(displayDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Shipping (est.)</span>
                <span className="text-gray-300">~{formatCurrency(shippingEst)}</span>
              </div>
              <div className="border-t border-gold/20 mt-2 pt-2 flex justify-between">
                <span className="text-gray-400 font-semibold text-sm">Total (excl. shipping)</span>
                <span className="text-gold font-bold text-xl font-heading">{formatCurrency(displayTotal)}</span>
              </div>
            </div>

            <div className="no-refund-banner mb-4 text-xs">ALL SALES FINAL — NO REFUNDS</div>

            {error && (
              <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={loading || cart.length === 0}
              className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading checkout...' : `Proceed to Payment — ${formatCurrency(displayTotal)}`}
            </button>
          </>
        )}

        {/* Stripe payment step */}
        {step === 'payment' && clientSecret && pricing && (
          <>
            <button
              onClick={() => setStep('cart')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to cart
            </button>

            <h2 className="text-2xl font-heading text-white mb-1">Payment</h2>
            <p className="text-gray-500 text-sm mb-5">
              Total: <strong className="text-gold">{formatCurrency(pricing.total)}</strong>
              {pricing.discount > 0 && <span className="text-green-400 ml-2">(saved {formatCurrency(pricing.discount)})</span>}
            </p>

            {error && (
              <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

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
                    borderRadius: '10px',
                  },
                },
              }}
            >
              <StripeForm
                total={pricing.total}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          </>
        )}
      </div>
    </div>
  )
}
