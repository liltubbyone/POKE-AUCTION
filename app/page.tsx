export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AuctionCard from '@/components/AuctionCard'
import TrustBanner from '@/components/TrustBanner'

async function getActiveAuctions() {
  return prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] } },
    include: {
      items: { include: { item: true } },
      spots: { where: { paid: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const steps = [
  {
    step: '01',
    title: 'Browse Auctions',
    desc: 'View every item in the pool before you buy. Full transparency, always.',
    icon: (
      <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Buy Your Spot',
    desc: 'Each spot gets a number. Payment is instant and non-refundable.',
    icon: (
      <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Wheel Spins',
    desc: 'All spots filled? The wheel spins live using a cryptographic seed — verifiable by anyone.',
    icon: (
      <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Claim Your Item',
    desc: 'Your spot number wins a random item. Pay shipping and it ships right out.',
    icon: (
      <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

const trustItems = [
  {
    icon: (
      <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: '100% Transparent',
    desc: 'All items are listed publicly before any auction starts. No hidden items, no last-minute swaps. Ever.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Never Manipulated',
    desc: 'Cryptographic random seed shuffles items. The seed is published before the spin so you can verify every result.',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Clear Policies',
    desc: 'No refunds. Buyer pays shipping. No sales tax. Every policy is stated upfront — zero surprises.',
  },
]

export default async function HomePage() {
  const auctions = await getActiveAuctions()

  return (
    <div>
      <TrustBanner />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36 grid-pattern">
        {/* Background radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 65%)' }}
        />
        {/* Edge fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Live pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.25)',
              color: '#4ade80',
            }}
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live Auctions Running Now
          </div>

          {/* Headline */}
          <h1 className="font-heading leading-none mb-6">
            <span className="block text-white text-6xl md:text-8xl">WIN RARE</span>
            <span className="block shimmer-gold text-7xl md:text-9xl">POKEMON</span>
            <span className="block text-white text-6xl md:text-8xl">PRODUCTS</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 font-body max-w-xl mx-auto leading-relaxed">
            Buy a spot. Fill the auction. Spin the wheel. Every outcome is{' '}
            <span className="text-white font-semibold">100% randomized</span> and cryptographically verifiable.
          </p>

          {/* Policy badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <div className="no-refund-banner text-xs px-3 py-1.5">All Sales Final — No Refunds</div>
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#86efac',
              }}
            >
              Cryptographic Seed — Provably Fair
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#active-auctions" className="btn-gold text-base px-8 py-3.5">
              View Active Auctions
            </Link>
            <Link href="/inventory" className="btn-outline text-base px-8 py-3.5">
              Browse Inventory
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 max-w-lg mx-auto gap-4">
            {[
              { value: '100%', label: 'Randomized' },
              { value: '0', label: 'Manipulations' },
              { value: '24h', label: 'Avg. Ship Time' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <p className="text-2xl md:text-3xl font-heading text-gold leading-none mb-1">{s.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ── How It Works ── */}
      <section className="py-20" style={{ background: 'rgba(13,13,26,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">Process</p>
            <h2 className="section-title">How the Wheel Works</h2>
            <p className="text-gray-500 max-w-md mx-auto mt-3 text-sm leading-relaxed">
              Simple, transparent, and provably fair. No tricks, no manipulation, ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* connector line */}
            <div
              className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.2), rgba(255,215,0,0.2), transparent)' }}
            />
            {steps.map((step) => (
              <div
                key={step.step}
                className="step-card relative text-center rounded-2xl p-6 group"
              >
                <div className="step-icon group-hover:bg-gold/15 group-hover:border-gold/30 transition-all duration-300">
                  {step.icon}
                </div>
                <div
                  className="text-xs font-bold font-body tracking-widest mb-2"
                  style={{ color: 'rgba(255,215,0,0.4)' }}
                >
                  STEP {step.step}
                </div>
                <h3 className="text-lg font-heading text-white mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ── Provably Fair ── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(13,13,26,0.9) 0%, rgba(17,17,40,0.9) 100%)',
              border: '1px solid rgba(255,215,0,0.12)',
              boxShadow: '0 0 40px rgba(255,215,0,0.04)',
            }}
          >
            <div className="flex items-start gap-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}
              >
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-heading text-gold mb-2">Provably Fair Randomization</h3>
                <p className="text-gray-400 mb-4 leading-relaxed text-sm">
                  When the wheel spins, we generate a cryptographic random seed and publish it publicly. The seed
                  determines the shuffle order. You can independently verify every single result.
                </p>
                <div
                  className="rounded-xl p-4 font-mono text-xs leading-relaxed"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(30,30,53,0.8)' }}
                >
                  <div className="flex gap-2 mb-1">
                    <span style={{ color: '#4ade80' }}>seed:</span>
                    <span className="text-gray-400">a7f3e9b2c1d4... (SHA-256 hash published BEFORE spin)</span>
                  </div>
                  <div className="flex gap-2 mb-1">
                    <span style={{ color: '#60a5fa' }}>algorithm:</span>
                    <span className="text-gray-400">Fisher-Yates shuffle seeded by CSPRNG</span>
                  </div>
                  <div className="flex gap-2">
                    <span style={{ color: '#FFD700' }}>result:</span>
                    <span className="text-gray-400">spot #1 → Booster Box, spot #2 → PO Sleeve...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Auctions ── */}
      <section id="active-auctions" className="py-20" style={{ background: 'rgba(13,13,26,0.4)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Live Now</p>
              <h2 className="section-title">Active Auctions</h2>
              <p className="text-gray-500 mt-1 text-sm">Secure your spot before they sell out.</p>
            </div>
            {auctions.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                }}
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {auctions.length} Live
              </div>
            )}
          </div>

          {auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl py-20 text-center"
              style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(30,30,53,0.8)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.12)' }}
              >
                <svg className="w-8 h-8 text-gold opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading text-gray-400 mb-2">No Active Auctions</h3>
              <p className="text-gray-600 text-sm">Check back soon — new auctions are added regularly.</p>
            </div>
          )}
        </div>
      </section>

      <div className="glow-line" />

      {/* ── Why Trust ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">Trust</p>
            <h2 className="section-title">Why Trust PokeAuction?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="trust-card rounded-2xl p-7 text-center group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.12)' }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-heading text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20" style={{ background: 'rgba(13,13,26,0.5)', borderTop: '1px solid rgba(30,30,53,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">Reviews</p>
            <h2 className="section-title">What Buyers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Tyler M.',
                text: 'Won a booster box on my second spot! The wheel spin was so hype. Completely legit and transparent.',
                item: 'Won: Booster Box',
              },
              {
                name: 'Sarah K.',
                text: 'I appreciate that everything is disclosed upfront. Bought 3 spots and the whole experience was smooth.',
                item: 'Won: PO Sleeves',
              },
              {
                name: 'Jake R.',
                text: 'The provably fair system gives me real confidence. Got my item shipped fast with tracking. 10/10.',
                item: 'Won: First Partner Coll.',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: 'rgba(13,13,26,0.9)',
                  border: '1px solid rgba(30,30,53,0.8)',
                }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="#FFD700" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-400 text-sm italic leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(30,30,53,0.8)' }}>
                  <span className="font-semibold text-white text-sm">{t.name}</span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: '#FFD700', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}
                  >
                    {t.item}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
