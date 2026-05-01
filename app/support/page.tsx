'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How do raffles work?',
    a: 'Each raffle has a set number of spots at a fixed price. You purchase one or more spots, and when all spots are filled (or the raffle ends early), a provably fair spin assigns each spot a random item from the prize pool. Every paid spot is guaranteed to win something.',
  },
  {
    q: 'How are winners chosen?',
    a: 'Winners are selected using a cryptographically seeded random spin. The seed is generated at raffle close using a combination of participant data and a random salt, making the result tamper-proof and verifiable.',
  },
  {
    q: 'How do I pay for a spot?',
    a: 'We accept all major credit/debit cards via Stripe. Your payment is processed securely — we never store your full card number. You can also save a card to your profile for faster checkout on future raffles.',
  },
  {
    q: 'What happens after I win?',
    a: 'Once the raffle spins, you\'ll see your assigned item in your profile and on the results page. You\'ll then be prompted to pay shipping. After shipping is paid, your item will be packed and a USPS label generated.',
  },
  {
    q: 'How much does shipping cost?',
    a: 'Shipping is calculated at cost via USPS. Typical packages ship for $8–$15 depending on weight and your location. You\'ll see the exact amount before you pay.',
  },
  {
    q: 'What is the Daily Mystery Spin?',
    a: 'Every registered user gets one free spin per day. The 100th spin of the day wins a mystery gift — currently a Perfect Order Booster Pack. Unused spins don\'t carry over. The counter resets at midnight UTC.',
  },
  {
    q: 'Are sales final?',
    a: 'Yes. All raffle purchases are final — no refunds once a spot is paid. If there is a fulfillment issue on our end, we will make it right. Please reach out via the support form below.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your item ships, a tracking number will appear in your profile under your won spots. You can use that number on the USPS website to follow your package.',
  },
  {
    q: 'What if my item arrives damaged?',
    a: 'All items are carefully packed. If something arrives damaged, contact us within 48 hours with photos and we\'ll work with you to resolve it.',
  },
  {
    q: 'How quickly do raffles fill up?',
    a: 'Popular raffles can fill within minutes. Follow us on social media or check back regularly to catch new listings as soon as they drop.',
  },
]

const SUBJECTS = [
  'Order / Shipping Issue',
  'Payment Problem',
  'Raffle Question',
  'Daily Spin Issue',
  'Account Help',
  'Other',
]

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to send. Please try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Help Center</p>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          FAQ &amp; <span className="gold-gradient-text">SUPPORT</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Find answers to common questions below, or send us a message and we&apos;ll get back to you.
        </p>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-3xl font-heading text-white mb-6">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="card cursor-pointer select-none transition-all duration-200"
              style={{ borderColor: openIndex === i ? 'rgba(255,215,0,0.3)' : undefined }}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-white text-sm sm:text-base">{faq.q}</h3>
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-gray-400 transition-all duration-200"
                  style={{ borderColor: openIndex === i ? 'rgba(255,215,0,0.4)' : undefined, color: openIndex === i ? '#FFD700' : undefined }}
                >
                  {openIndex === i ? '−' : '+'}
                </div>
              </div>
              {openIndex === i && (
                <p className="mt-3 text-gray-400 text-sm leading-relaxed border-t border-border pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div>
        <h2 className="text-3xl font-heading text-white mb-2">CONTACT US</h2>
        <p className="text-gray-500 text-sm mb-6">Can&apos;t find your answer above? Send us a message and we&apos;ll respond within 24 hours.</p>

        {submitted ? (
          <div className="card border-green-500/30 text-center py-12">
            <div className="text-5xl mb-4">✓</div>
            <p className="text-green-400 font-heading text-2xl mb-2">MESSAGE SENT</p>
            <p className="text-gray-400 text-sm">We&apos;ll get back to you within 24 hours at the email you provided.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' }) }}
              className="btn-outline text-sm py-2 px-6 mt-6"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="input-field"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} style={{ background: '#0d0d1a' }}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Message</label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="input-field resize-none"
                rows={5}
                placeholder="Describe your issue or question in detail..."
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
