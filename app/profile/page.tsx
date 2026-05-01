'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import SavedCardSetup from '@/components/SavedCardSetup'

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
  balance: number
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

const TIERS = [
  { name: 'Poke Trainer',   min: 0,    max: 99,   color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)',  icon: '🎒' },
  { name: 'Gym Challenger', min: 100,  max: 299,  color: '#34D399', bg: 'rgba(52,211,153,0.15)',   border: 'rgba(52,211,153,0.3)',   icon: '⚔️' },
  { name: 'Gym Leader',     min: 300,  max: 699,  color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',   border: 'rgba(96,165,250,0.3)',   icon: '🏅' },
  { name: 'Elite Four',     min: 700,  max: 1499, color: '#A78BFA', bg: 'rgba(167,139,250,0.15)',  border: 'rgba(167,139,250,0.3)',  icon: '💎' },
  { name: 'Champion',       min: 1500, max: 3000, color: '#FFD700', bg: 'rgba(255,215,0,0.15)',    border: 'rgba(255,215,0,0.4)',    icon: '🏆' },
]

function getTier(totalSpent: number) {
  return TIERS.slice().reverse().find((t) => totalSpent >= t.min) ?? TIERS[0]
}

function getNextTier(totalSpent: number) {
  return TIERS.find((t) => t.min > totalSpent) ?? null
}

function getTierProgress(totalSpent: number) {
  const current = getTier(totalSpent)
  const next = getNextTier(totalSpent)
  if (!next) {
    // Champion: show progress toward $3,000 cap
    return Math.min(100, Math.round(((totalSpent - current.min) / (current.max - current.min)) * 100))
  }
  const range = next.min - current.min
  const progress = totalSpent - current.min
  return Math.round((progress / range) * 100)
}

const DEFAULT_PAYMENT: PaymentInfo = {
  preferred: '',
  paypalEmail: '',
  venmoHandle: '',
  cashappTag: '',
}

const SUPPORT_SUBJECTS = [
  'Order / Shipping Issue',
  'Payment Problem',
  'Raffle Question',
  'Daily Spin Issue',
  'Account Help',
  'Other',
]

export default function ProfilePage() {
  const { status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'payment' | 'spots' | 'password' | 'support'>('overview')

  const [name, setName] = useState('')
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zip: '', country: 'US' })
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(DEFAULT_PAYMENT)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Support form
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: SUPPORT_SUBJECTS[0], message: '' })
  const [supportSubmitting, setSupportSubmitting] = useState(false)
  const [supportSubmitted, setSupportSubmitted] = useState(false)
  const [supportError, setSupportError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    const res = await fetch('/api/profile')
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setName(data.name || '')
      if (data.address) { try { setAddress(JSON.parse(data.address)) } catch {} }
      if (data.paymentInfo) { try { setPaymentInfo({ ...DEFAULT_PAYMENT, ...JSON.parse(data.paymentInfo) }) } catch {} }
      // Pre-fill support form name/email
      setSupportForm((f) => ({ ...f, name: data.name || '', email: data.email || '' }))
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
    if (res.ok) { setMessage({ type: 'success', text: 'Profile updated!' }); fetchProfile() }
    else { const d = await res.json(); setMessage({ type: 'error', text: d.error || 'Failed to update' }) }
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
    if (res.ok) { setMessage({ type: 'success', text: 'Payment preferences saved!' }); fetchProfile() }
    else { const d = await res.json(); setMessage({ type: 'error', text: d.error || 'Failed to save' }) }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'New passwords do not match' }); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) { setMessage({ type: 'success', text: 'Password changed!' }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }
    else { setMessage({ type: 'error', text: data.error || 'Failed to change password' }) }
    setSaving(false)
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSupportSubmitting(true)
    setSupportError('')
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supportForm),
    })
    setSupportSubmitting(false)
    if (res.ok) { setSupportSubmitted(true) }
    else { const d = await res.json(); setSupportError(d.error || 'Failed to send.') }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-2xl font-heading animate-pulse">LOADING...</div>
      </div>
    )
  }

  if (!profile) return null

  const paidSpots = profile.spots.filter((s) => s.paid).length
  const totalSpent = profile.spots.filter((s) => s.paid).reduce((sum, s) => sum + s.auction.spotPrice, 0)
  const tier = getTier(totalSpent)
  const nextTier = getNextTier(totalSpent)
  const progress = getTierProgress(totalSpent)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'payment', label: 'Payment' },
    { id: 'spots', label: `My Spots (${profile.spots.length})` },
    { id: 'password', label: 'Password' },
    { id: 'support', label: 'Support' },
  ]

  const PAYMENT_METHODS = [
    { id: 'stripe', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Amex — via Stripe' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️', desc: 'Pay with PayPal balance or bank account' },
    { id: 'venmo', label: 'Venmo', icon: '💸', desc: 'Send to our Venmo — confirmed manually' },
    { id: 'cashapp', label: 'Cash App', icon: '💚', desc: 'Send to our $Cashtag — confirmed manually' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)' }}
        >
          {(profile.name || profile.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-4xl font-heading text-white">{profile.name || 'My Profile'}</h1>
          <p className="text-gray-400 text-sm">{profile.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-card border border-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as typeof activeTab); setMessage({ type: '', text: '' }) }}
            className={`flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${
          message.type === 'success' ? 'bg-green-950/50 border border-green-500/40 text-green-300' : 'bg-red-950/50 border border-red-500/40 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Balance + Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.04)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash Balance</p>
              <p className="text-3xl font-heading text-gold">{formatCurrency(profile.balance)}</p>
              <Link href="#" onClick={() => setActiveTab('payment')} className="text-xs text-gold/60 hover:text-gold mt-1 inline-block transition-colors">
                + Deposit
              </Link>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-2xl font-heading text-white">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Spots Bought</p>
              <p className="text-2xl font-heading text-white">{paidSpots}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Items Won</p>
              <p className="text-2xl font-heading text-white">{profile.spots.filter((s) => s.assignedItemId).length}</p>
            </div>
          </div>

          {/* Tier card */}
          <div className="card" style={{ borderColor: tier.border, background: `${tier.bg}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: tier.color }}>Current Rank</p>
                <h2 className="text-3xl font-heading" style={{ color: tier.color }}>
                  {tier.icon} {tier.name.toUpperCase()}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Paid Spots</p>
                <p className="text-2xl font-heading text-white">{paidSpots}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{tier.name}</span>
                {nextTier ? <span>{nextTier.name} — {formatCurrency(nextTier.min - totalSpent)} away</span> : <span className="text-gold">MAX RANK</span>}
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})`, boxShadow: `0 0 10px ${tier.color}60` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{formatCurrency(tier.min)}</span>
                {nextTier && <span>{formatCurrency(nextTier.min)}</span>}
              </div>
            </div>

            {/* All tiers */}
            <div className="grid grid-cols-5 gap-1 mt-4 pt-4 border-t border-white/5">
              {TIERS.map((t) => {
                const reached = totalSpent >= t.min
                return (
                  <div key={t.name} className="text-center">
                    <div className={`text-lg mb-0.5 ${reached ? '' : 'opacity-30'}`}>{t.icon}</div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: reached ? t.color : '#4B5563', fontSize: '10px' }}>
                      {t.name.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                    </p>
                    <p className="text-gray-600 mt-0.5" style={{ fontSize: '9px' }}>${t.min === 0 ? '0' : t.min >= 1000 ? `${t.min / 1000}k` : t.min}+</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent spots */}
          {profile.spots.length > 0 && (
            <div>
              <h3 className="text-xl font-heading text-white mb-3">RECENT ACTIVITY</h3>
              <div className="space-y-2">
                {profile.spots.slice(0, 5).map((spot) => (
                  <div key={spot.id} className="card p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-semibold">{spot.auction.name}</p>
                      <p className="text-gray-500 text-xs">Spot #{spot.spotNumber} • {formatDate(spot.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-bold text-sm">{formatCurrency(spot.auction.spotPrice)}</p>
                      {spot.assignedItemId && <p className="text-green-400 text-xs">Won!</p>}
                    </div>
                  </div>
                ))}
                {profile.spots.length > 5 && (
                  <button onClick={() => setActiveTab('spots')} className="text-gold text-xs hover:underline w-full text-center pt-1">
                    View all {profile.spots.length} spots →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card">
          <h2 className="text-2xl font-heading text-white mb-6">PROFILE INFO</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your name" />
            </div>
          </div>

          <h3 className="text-xl font-heading text-white mb-4">SHIPPING ADDRESS</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Street Address</label>
              <input type="text" value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} className="input-field" placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">City</label>
                <input type="text" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} className="input-field" placeholder="City" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">State</label>
                <input type="text" value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} className="input-field" placeholder="TX" maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">ZIP Code</label>
                <input type="text" value={address.zip} onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))} className="input-field" placeholder="12345" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Country</label>
                <select value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} className="input-field">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </form>
      )}

      {/* ── PAYMENT TAB ── */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="card">
            <h2 className="text-2xl font-heading text-white mb-2">PAYMENT METHODS</h2>
            <p className="text-gray-400 text-sm mb-6">Select your preferred payment method.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentInfo((p) => ({ ...p, preferred: method.id as PaymentInfo['preferred'] }))}
                  className={`text-left p-4 rounded-xl border transition-all ${paymentInfo.preferred === method.id ? 'border-gold bg-gold/10 text-white' : 'border-border text-gray-400 hover:border-gold/40 hover:text-white'}`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="font-heading text-lg">{method.label}</div>
                  <div className="text-xs mt-1 opacity-70">{method.desc}</div>
                  {paymentInfo.preferred === method.id && <div className="mt-2 text-gold text-xs font-bold">✓ PREFERRED</div>}
                </button>
              ))}
            </div>
            {paymentInfo.preferred === 'stripe' && (
              <div>
                <h3 className="font-heading text-white text-lg mb-3">SAVED CARD</h3>
                <SavedCardSetup />
              </div>
            )}
            {paymentInfo.preferred === 'paypal' && (
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">PayPal Email</label>
                <input type="email" value={paymentInfo.paypalEmail} onChange={(e) => setPaymentInfo((p) => ({ ...p, paypalEmail: e.target.value }))} className="input-field" placeholder="your@email.com" />
              </div>
            )}
            {paymentInfo.preferred === 'venmo' && (
              <div>
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 mb-3">
                  <p className="text-purple-300 text-sm">Send payment to <strong>@PokeAuction</strong> on Venmo with your spot number in the note. Admin confirms within 1 hour.</p>
                </div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your Venmo Handle</label>
                <input type="text" value={paymentInfo.venmoHandle} onChange={(e) => setPaymentInfo((p) => ({ ...p, venmoHandle: e.target.value }))} className="input-field" placeholder="@YourVenmo" />
              </div>
            )}
            {paymentInfo.preferred === 'cashapp' && (
              <div>
                <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-3 mb-3">
                  <p className="text-green-300 text-sm">Send payment to <strong>$PokeAuction</strong> with your spot number in the note. Admin confirms within 1 hour.</p>
                </div>
                <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your $Cashtag</label>
                <input type="text" value={paymentInfo.cashappTag} onChange={(e) => setPaymentInfo((p) => ({ ...p, cashappTag: e.target.value }))} className="input-field" placeholder="$YourCashtag" />
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-border">
              <button type="submit" disabled={saving || !paymentInfo.preferred} className="btn-gold disabled:opacity-50">{saving ? 'Saving...' : 'Save Preference'}</button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
            <span className="text-xl">🔒</span>
            <p className="text-gray-500 text-xs leading-relaxed">We never store credit card numbers. Card payments are handled exclusively by Stripe&apos;s PCI-compliant infrastructure.</p>
          </div>
        </form>
      )}

      {/* ── SPOTS TAB ── */}
      {activeTab === 'spots' && (
        <div className="space-y-4">
          {profile.spots.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🎡</div>
              <h3 className="text-2xl font-heading text-gray-400 mb-2">No Spots Yet</h3>
              <Link href="/auctions" className="btn-gold inline-block mt-2">Browse Raffles</Link>
            </div>
          ) : (
            profile.spots.map((spot) => (
              <div key={spot.id} className="card">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-heading text-xl text-white mb-1">{spot.auction.name}</h3>
                    <p className="text-gray-400 text-sm">
                      Spot #{spot.spotNumber} • {formatCurrency(spot.auction.spotPrice)} • {formatDate(spot.createdAt)}
                    </p>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${spot.paid ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'}`}>
                    {spot.paid ? 'PAID' : 'PENDING'}
                  </div>
                </div>
                {spot.assignedItemId && (
                  <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}>
                    <p className="text-gold font-heading text-lg mb-2">YOU WON A PRIZE!</p>
                    {spot.shipped ? (
                      <div>
                        <p className="text-green-400 font-semibold text-sm">Shipped!</p>
                        {spot.trackingNumber && <p className="text-gray-400 text-xs mt-1">Tracking: <span className="text-white font-mono">{spot.trackingNumber}</span></p>}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Being prepared for shipment — tracking will appear here.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PASSWORD TAB ── */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="card">
          <h2 className="text-2xl font-heading text-white mb-6">CHANGE PASSWORD</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" minLength={8} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">{saving ? 'Changing...' : 'Change Password'}</button>
          </div>
        </form>
      )}

      {/* ── SUPPORT TAB ── */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-heading text-white mb-1">CONTACT SUPPORT</h2>
            <p className="text-gray-500 text-sm mb-6">We&apos;ll get back to you within 24 hours.</p>

            {supportSubmitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-green-400 font-heading text-2xl mb-2">MESSAGE SENT</p>
                <p className="text-gray-400 text-sm">We&apos;ll reply to <strong className="text-white">{supportForm.email}</strong> within 24 hours.</p>
                <button
                  onClick={() => { setSupportSubmitted(false); setSupportForm((f) => ({ ...f, subject: SUPPORT_SUBJECTS[0], message: '' })) }}
                  className="btn-outline text-sm py-2 px-6 mt-4"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Name</label>
                    <input type="text" required value={supportForm.name} onChange={(e) => setSupportForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                    <input type="email" required value={supportForm.email} onChange={(e) => setSupportForm((f) => ({ ...f, email: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Subject</label>
                  <select value={supportForm.subject} onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))} className="input-field" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {SUPPORT_SUBJECTS.map((s) => <option key={s} value={s} style={{ background: '#0d0d1a' }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Message</label>
                  <textarea required value={supportForm.message} onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))} className="input-field resize-none" rows={5} placeholder="Describe your issue..." />
                </div>
                {supportError && <p className="text-red-400 text-sm">{supportError}</p>}
                <button type="submit" disabled={supportSubmitting} className="btn-gold py-3 px-8 disabled:opacity-50">
                  {supportSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="text-xl font-heading text-white mb-3">QUICK LINKS</h3>
            <div className="space-y-2">
              <Link href="/support" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gold/30 hover:bg-gold/5 transition-all">
                <span className="text-gray-300 text-sm font-semibold">Full FAQ</span>
                <span className="text-gold text-sm">→</span>
              </Link>
              <Link href="/results" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gold/30 hover:bg-gold/5 transition-all">
                <span className="text-gray-300 text-sm font-semibold">Past Raffle Results</span>
                <span className="text-gold text-sm">→</span>
              </Link>
              <Link href="/auctions" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gold/30 hover:bg-gold/5 transition-all">
                <span className="text-gray-300 text-sm font-semibold">Active Raffles</span>
                <span className="text-gold text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
