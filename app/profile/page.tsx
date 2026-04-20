'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import SavedCardSetup from '@/components/SavedCardSetup'
import ShippingPayment from '@/components/ShippingPayment'

interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

interface PaymentInfo {
  preferred: 'stripe' | 'paypal' | 'venmo' | 'cashapp' | ''
  paypalEmail: string
  venmoHandle: string
  cashappTag: string
}

interface UserProfile {
  id: string
  email: string
  name: string | null
  address: string | null
  paymentInfo: string | null
  createdAt: string
  spots: {
    id: string
    spotNumber: number
    paid: boolean
    assignedItemId: string | null
    shipped: boolean
    trackingNumber: string | null
    shippingPaid: boolean
    shippingCost: number | null
    paymentMethod: string | null
    createdAt: string
    auction: {
      name: string
      status: string
      spotPrice: number
    }
  }[]
}

const DEFAULT_PAYMENT: PaymentInfo = {
  preferred: '',
  paypalEmail: '',
  venmoHandle: '',
  cashappTag: '',
}

export default function ProfilePage() {
  const { status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'spots' | 'password'>('profile')

  const [name, setName] = useState('')
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  })
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(DEFAULT_PAYMENT)
  const [savedCard, setSavedCard] = useState<{ id: string; last4: string; brand: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
      fetch('/api/payments/stripe/saved-card').then(r => r.ok ? r.json() : null).then(setSavedCard).catch(() => {})
    }
  }, [status])

  const fetchProfile = async () => {
    const res = await fetch('/api/profile')
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setName(data.name || '')
      if (data.address) {
        try { setAddress(JSON.parse(data.address)) } catch {}
      }
      if (data.paymentInfo) {
        try { setPaymentInfo({ ...DEFAULT_PAYMENT, ...JSON.parse(data.paymentInfo) }) } catch {}
      }
    }
    setLoading(false)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address: JSON.stringify(address) }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      fetchProfile()
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to update' })
    }
    setSaving(false)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentInfo: JSON.stringify(paymentInfo) }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Payment preferences saved!' })
      fetchProfile()
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error || 'Failed to save' })
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to change password' })
    }
    setSaving(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  if (!profile) return null

  const tabs = [
    { id: 'profile', label: 'Profile & Address' },
    { id: 'payment', label: 'Payment Methods' },
    { id: 'spots', label: `My Spots (${profile.spots.length})` },
    { id: 'password', label: 'Change Password' },
  ]

  const PAYMENT_METHODS = [
    { id: 'stripe', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Amex — processed securely via Stripe' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️', desc: 'Pay with your PayPal balance or linked bank account' },
    { id: 'venmo', label: 'Venmo', icon: '💸', desc: 'Send payment to our Venmo handle — confirmed manually' },
    { id: 'cashapp', label: 'Cash App', icon: '💚', desc: 'Send payment to our $Cashtag — confirmed manually' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-5xl font-heading text-white mb-2">MY PROFILE</h1>
        <p className="text-gray-400">{profile.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-card border border-border rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab)
              setMessage({ type: '', text: '' })
            }}
            className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-green-950/50 border border-green-500/40 text-green-300'
              : 'bg-red-950/50 border border-red-500/40 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card">
          <h2 className="text-2xl font-heading text-white mb-6">PROFILE INFO</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>
          </div>

          <h3 className="text-xl font-heading text-white mb-4">SHIPPING ADDRESS</h3>
          <p className="text-gray-500 text-sm mb-4">
            Required before winning an auction. Buyer pays actual shipping cost.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                className="input-field"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  className="input-field"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">State</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  className="input-field"
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">ZIP Code</label>
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
                  className="input-field"
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Country</label>
                <select
                  value={address.country}
                  onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                  className="input-field"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-gray-500 text-xs mb-4">
              No sales tax collected. Shipping cost is calculated based on item size and location (~$8–$15).
            </p>
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="card">
            <h2 className="text-2xl font-heading text-white mb-2">PAYMENT METHODS</h2>
            <p className="text-gray-400 text-sm mb-6">
              Select your preferred payment method and enter the relevant details. Your info is stored
              securely and used only to process auction spot purchases.
            </p>

            {/* Method selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentInfo((p) => ({ ...p, preferred: method.id as PaymentInfo['preferred'] }))}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    paymentInfo.preferred === method.id
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-border bg-card2 text-gray-400 hover:border-gold/40 hover:text-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="font-heading text-lg">{method.label}</div>
                  <div className="text-xs mt-1 opacity-70">{method.desc}</div>
                  {paymentInfo.preferred === method.id && (
                    <div className="mt-2 text-gold text-xs font-bold">✓ PREFERRED</div>
                  )}
                </button>
              ))}
            </div>

            {/* Method-specific fields */}
            {paymentInfo.preferred === 'stripe' && (
              <div>
                <h3 className="font-heading text-white text-lg mb-3">SAVED CARD</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Save a card to speed up checkout. Your card is stored securely by Stripe — we never see the number.
                </p>
                <SavedCardSetup />
              </div>
            )}

            {paymentInfo.preferred === 'paypal' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    value={paymentInfo.paypalEmail}
                    onChange={(e) => setPaymentInfo((p) => ({ ...p, paypalEmail: e.target.value }))}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                  <p className="text-gray-500 text-xs mt-1.5">
                    This is the email linked to your PayPal account. Payment is processed via PayPal checkout at purchase time.
                  </p>
                </div>
              </div>
            )}

            {paymentInfo.preferred === 'venmo' && (
              <div className="space-y-3">
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 mb-3">
                  <p className="text-purple-300 text-sm">
                    <strong>How Venmo works:</strong> After buying a spot, send payment to{' '}
                    <strong>{process.env.NEXT_PUBLIC_VENMO_HANDLE || '@PokeAuction'}</strong> on Venmo with your
                    spot number in the note. An admin will confirm your payment manually (usually within 1 hour).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Your Venmo Handle
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.venmoHandle}
                    onChange={(e) => setPaymentInfo((p) => ({ ...p, venmoHandle: e.target.value }))}
                    className="input-field"
                    placeholder="@YourVenmo"
                  />
                  <p className="text-gray-500 text-xs mt-1.5">
                    So we can identify your payment quickly.
                  </p>
                </div>
              </div>
            )}

            {paymentInfo.preferred === 'cashapp' && (
              <div className="space-y-3">
                <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-3 mb-3">
                  <p className="text-green-300 text-sm">
                    <strong>How Cash App works:</strong> After buying a spot, send payment to{' '}
                    <strong>{process.env.NEXT_PUBLIC_CASHAPP_HANDLE || '$PokeAuction'}</strong> on Cash App with your
                    spot number in the note. An admin will confirm your payment manually (usually within 1 hour).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Your $Cashtag
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cashappTag}
                    onChange={(e) => setPaymentInfo((p) => ({ ...p, cashappTag: e.target.value }))}
                    className="input-field"
                    placeholder="$YourCashtag"
                  />
                  <p className="text-gray-500 text-xs mt-1.5">
                    So we can identify your payment quickly.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <button type="submit" disabled={saving || !paymentInfo.preferred} className="btn-gold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Payment Preference'}
              </button>
              {!paymentInfo.preferred && (
                <p className="text-gray-500 text-xs mt-2">Select a payment method above to save.</p>
              )}
            </div>
          </div>

          {/* Security note */}
          <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-white font-semibold text-sm mb-1">Your information is secure</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                We never store credit card numbers. Card payments are handled exclusively by Stripe&apos;s
                PCI-compliant infrastructure. Venmo and Cash App handles are only used to match incoming payments.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Spots Tab */}
      {activeTab === 'spots' && (
        <div className="space-y-4">
          {profile.spots.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🎡</div>
              <h3 className="text-2xl font-heading text-gray-400 mb-2">No Spots Yet</h3>
              <p className="text-gray-500 mb-4">Buy a spot in an active auction to get started!</p>
              <Link href="/" className="btn-gold inline-block">Browse Auctions</Link>
            </div>
          ) : (
            profile.spots.map((spot) => (
              <div key={spot.id} className="card">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-heading text-xl text-white mb-1">{spot.auction.name}</h3>
                    <p className="text-gray-400 text-sm">
                      Spot #{spot.spotNumber} • {formatCurrency(spot.auction.spotPrice)} •{' '}
                      {spot.paymentMethod?.toUpperCase()} • {formatDate(spot.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
                        spot.paid
                          ? 'text-green-400 bg-green-400/10 border-green-400/30'
                          : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                      }`}
                    >
                      {spot.paid ? 'PAID' : 'PENDING PAYMENT'}
                    </div>
                  </div>
                </div>
                {spot.assignedItemId && (
                  <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}>
                    <p className="text-gold font-heading text-lg">YOU WON A PRIZE!</p>

                    {/* Step 1: Shipping address check */}
                    {!address.street ? (
                      <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fdba74' }}>
                        <p className="font-semibold mb-1">Add your shipping address first</p>
                        <p className="text-xs opacity-80">Go to the Profile &amp; Address tab to save your address before paying for shipping.</p>
                      </div>
                    ) : !spot.shippingPaid ? (
                      /* Step 2: Pay shipping */
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Shipping address on file:</p>
                        <p className="text-white text-sm font-semibold mb-3">
                          {address.street}, {address.city}, {address.state} {address.zip}
                        </p>
                        <ShippingPayment
                          spotId={spot.id}
                          savedCard={savedCard}
                          onPaid={fetchProfile}
                        />
                      </div>
                    ) : spot.shipped ? (
                      /* Step 4: Shipped */
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-green-400 font-semibold text-sm">Shipped!</p>
                        </div>
                        {spot.trackingNumber && (
                          <p className="text-gray-400 text-xs">
                            Tracking: <span className="text-white font-mono">{spot.trackingNumber}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Step 3: Shipping paid, awaiting label/ship */
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-gold text-sm font-semibold">Shipping paid {spot.shippingCost ? `(${formatCurrency(spot.shippingCost)})` : ''}</p>
                        </div>
                        <p className="text-gray-500 text-xs">Your item is being prepared for shipment. Tracking will appear here once shipped.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="card">
          <h2 className="text-2xl font-heading text-white mb-6">CHANGE PASSWORD</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
