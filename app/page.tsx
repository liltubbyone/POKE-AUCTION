export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AuctionCard from '@/components/AuctionCard'
import TrustBanner from '@/components/TrustBanner'
import RecentWinnerFeed from '@/components/RecentWinnerFeed'

async function getActiveByCategory(category: string) {
  return prisma.auction.findMany({
    where: { status: { in: ['active', 'spinning'] }, category },
    include: {
      items: { include: { item: true } },
      spots: { where: { paid: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getCompletedAuctions() {
  return prisma.auction.findMany({
    where: { status: 'completed' },
    include: { spots: { where: { paid: true } } },
    orderBy: { completedAt: 'desc' },
    take: 6,
  })
}

const steps = [
  {
    num: '01',
    title: 'Browse Games',
    desc: 'View every item in the pool before you buy. Full transparency — no hidden prizes.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFD700' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Buy Your Spot',
    desc: 'Each spot gets a number. Payment is instant. Every paid spot wins something.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFD700' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Wheel Spins Live',
    desc: 'All spots filled? The wheel spins publicly. Results are published for everyone to verify.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFD700' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Claim Your Item',
    desc: 'Your number wins a random item. Pay shipping and it ships same-day.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFD700' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
]

const trustItems = [
  {
    color: '#38bdf8',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#38bdf8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: '100% Transparent',
    desc: 'All items are listed publicly before any game starts. No hidden items, no last-minute swaps. Ever.',
  },
  {
    color: '#7c3aed',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#a78bfa" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Never Manipulated',
    desc: 'The wheel spin is live and all results are published publicly. Every winner and item is on record.',
  },
  {
    color: '#22c55e',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Clear Policies',
    desc: 'No refunds. Buyer pays shipping. No sales tax. Every policy stated upfront — zero surprises.',
  },
]

const stats = [
  { value: '100%', label: 'Randomized', color: '#a78bfa' },
  { value: '0',    label: 'Manipulated', color: '#4ade80' },
  { value: '24h',  label: 'Avg Ship',    color: '#38bdf8' },
]

export default async function HomePage() {
  const [games, raffles, giveaways, completedAuctions] = await Promise.all([
    getActiveByCategory('game'),
    getActiveByCategory('raffle'),
    getActiveByCategory('giveaway'),
    getCompletedAuctions(),
  ])

  const totalActive = games.length + raffles.length + giveaways.length

  return (
    <div>
      <TrustBanner />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-28 md:py-40 grid-pattern">
        {/* Radial glow centerpiece */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '800px', height: '800px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, rgba(56,189,248,0.04) 45%, transparent 68%)',
          }}
        />
        {/* Orbital ring */}
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{ width: '650px', height: '650px', marginLeft: '-325px', marginTop: '-325px', perspective: '800px' }}
        >
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            border: '1px solid rgba(124,58,237,0.10)',
            transform: 'rotateX(72deg)',
            animation: 'orbital-pulse 7s ease-in-out infinite',
          }} />
        </div>
        {/* Edge fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Live pill */}
          {totalActive > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
              style={{
                background: 'rgba(74,222,128,0.07)',
                border: '1px solid rgba(74,222,128,0.22)',
                color: '#4ade80',
              }}
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {totalActive} Raffle{totalActive !== 1 ? 's' : ''} Running Now
            </div>
          )}

          {/* Headline */}
          <h1 className="font-heading leading-none mb-6 select-none">
            <span className="block text-white" style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}>DISCOVER YOUR</span>
            <span className="block cosmic-title-shimmer" style={{ fontSize: 'clamp(3.2rem, 10vw, 8rem)' }}>COSMIC</span>
            <span className="block shimmer-gold"         style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}>GRAILS</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 font-body max-w-lg mx-auto leading-relaxed">
            Sign in. Buy a spot. Spin the wheel. Rare trading cards and collectibles —{' '}
            <span className="text-white font-semibold">100% randomized</span>, published publicly.
          </p>

          {/* Policy pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
              style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.20)', color: '#fca5a5' }}
            >
              All Sales Final
            </span>
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
              style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.20)', color: '#86efac' }}
            >
              Results Published · 100% Transparent
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/games" className="btn-gold text-base px-9 py-3.5">
              View Active Games
            </Link>
            <Link href="/inventory" className="btn-outline text-base px-9 py-3.5">
              Browse Inventory
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 max-w-md mx-auto gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="stat-card rounded-2xl"
                style={{ borderColor: `${s.color}18`, background: `${s.color}08` }}
              >
                <p
                  className="text-2xl md:text-3xl font-heading leading-none mb-1.5"
                  style={{ color: s.color, textShadow: `0 0 20px ${s.color}55` }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-600 uppercase tracking-widest font-bold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="relative py-24" style={{ background: 'rgba(10,14,28,0.70)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-eyebrow">Process</p>
            <h2 className="section-title">How the Wheel Works</h2>
            <p className="text-slate-500 max-w-sm mx-auto mt-3 text-sm leading-relaxed">
              Simple and transparent. No tricks, no manipulation, ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), rgba(255,215,0,0.15), transparent)' }}
            />
            {steps.map((step) => (
              <div
                key={step.num}
                className="step-card relative text-center rounded-2xl p-7 group"
              >
                {/* Step number — top-left corner pill */}
                <span
                  className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full font-body tracking-widest"
                  style={{ color: 'rgba(255,215,0,0.5)', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}
                >
                  {step.num}
                </span>
                <div className="step-icon group-hover:bg-gold/10 group-hover:border-gold/25 transition-all duration-300">
                  {step.icon}
                </div>
                <h3 className="text-lg font-heading text-white mb-2.5">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ACTIVE GAMES
      ══════════════════════════════════════ */}
      {games.length > 0 && (
        <section id="active-games" className="py-24" style={{ background: 'rgba(10,14,28,0.50)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-eyebrow" style={{ color: '#38bdf8' }}>Active Now</p>
                <h2 className="section-title">Games</h2>
                <p className="text-slate-500 mt-1 text-sm">Join a live game before spots fill up.</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.20)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#38bdf8' }} />
                {games.length} Live
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((a) => <AuctionCard key={a.id} auction={a} />)}
            </div>
            <div className="mt-10 text-center">
              <Link href="/games" className="btn-outline text-sm px-7 py-2.5">View All Games →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          ACTIVE RAFFLES
      ══════════════════════════════════════ */}
      {raffles.length > 0 && (
        <section id="active-raffles" className="py-24" style={{ background: 'rgba(7,8,18,0.60)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-eyebrow" style={{ color: '#a78bfa' }}>Active Now</p>
                <h2 className="section-title">Raffles</h2>
                <p className="text-slate-500 mt-1 text-sm">Buy a spot — wheel spins when all are filled.</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.20)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
                {raffles.length} Live
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {raffles.map((a) => <AuctionCard key={a.id} auction={a} />)}
            </div>
            <div className="mt-10 text-center">
              <Link href="/auctions" className="btn-outline text-sm px-7 py-2.5">View All Raffles →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          ACTIVE GIVEAWAYS
      ══════════════════════════════════════ */}
      {giveaways.length > 0 && (
        <section id="active-giveaways" className="py-24" style={{ background: 'rgba(10,14,28,0.50)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-eyebrow">Active Now</p>
                <h2 className="section-title">Giveaways</h2>
                <p className="text-slate-500 mt-1 text-sm">Free entry — just show up and claim.</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ color: '#FFD700', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.20)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FFD700' }} />
                {giveaways.length} Live
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {giveaways.map((a) => <AuctionCard key={a.id} auction={a} />)}
            </div>
            <div className="mt-10 text-center">
              <Link href="/giveaways" className="btn-outline text-sm px-7 py-2.5">View All Giveaways →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {games.length === 0 && raffles.length === 0 && giveaways.length === 0 && (
        <section className="py-24" style={{ background: 'rgba(10,14,28,0.50)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-2xl py-20 text-center"
              style={{ background: 'rgba(13,18,36,0.85)', border: '1px solid rgba(30,41,59,0.8)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}
              >
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="#FFD700" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading text-slate-400 mb-2">Nothing Active Right Now</h3>
              <p className="text-slate-600 text-sm">Check back soon — new drops happen regularly.</p>
            </div>
          </div>
        </section>
      )}

      <div className="glow-line" />

      {/* ══════════════════════════════════════
          WHY TRUST
      ══════════════════════════════════════ */}
      <section className="relative py-24">
        {/* Subtle bg glow for this section */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-eyebrow">Trust</p>
            <h2 className="section-title">
              Why Trust <span className="cosmic-gradient-text">Cosmic Grails</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="trust-card rounded-2xl p-8 text-center group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${item.color}0a`,
                    border: `1px solid ${item.color}22`,
                    boxShadow: `0 0 16px ${item.color}10`,
                  }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-heading text-white mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          RECENT WINNER FEED
      ══════════════════════════════════════ */}
      <RecentWinnerFeed />

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section
        className="relative py-24"
        style={{ background: 'rgba(10,14,28,0.65)', borderTop: '1px solid rgba(30,41,59,0.6)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-eyebrow">Reviews</p>
            <h2 className="section-title">What Buyers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Tyler M.', text: 'Won a booster box on my second spot! The wheel spin was so hype. Completely legit and transparent.', item: 'Booster Box' },
              { name: 'Sarah K.', text: 'I appreciate that everything is disclosed upfront. Bought 3 spots and the whole experience was smooth.', item: 'PO Sleeves'  },
              { name: 'Jake R.',  text: 'Results are posted publicly so you can verify everything. Got my item shipped fast with tracking. 10/10.', item: 'Games'      },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: 'rgba(13,18,36,0.9)',
                  border: '1px solid rgba(30,41,59,0.8)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
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
                <p className="text-slate-400 text-sm italic leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(30,41,59,0.7)' }}
                >
                  <span className="font-semibold text-white text-sm">{t.name}</span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: '#FFD700', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.15)' }}
                  >
                    Won: {t.item}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          RECENT RESULTS
      ══════════════════════════════════════ */}
      {completedAuctions.length > 0 && (
        <>
          <div className="glow-line" />
          <section className="py-24" style={{ background: 'rgba(7,8,18,0.60)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="section-eyebrow">Past Shows</p>
                <h2 className="section-title">Recent Results</h2>
                <p className="text-slate-500 mt-1 text-sm">See who won what in our completed raffles.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {completedAuctions.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl p-5 flex flex-col gap-3"
                    style={{
                      background: 'rgba(13,18,36,0.9)',
                      border: '1px solid rgba(30,41,59,0.8)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-heading text-white leading-tight">{a.name}</h3>
                      <span
                        className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                        style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.22)' }}
                      >
                        Completed
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {a.spots.length} spot{a.spots.length !== 1 ? 's' : ''} sold
                      {(a as any).completedAt
                        ? ` · ${new Date((a as any).completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : ''}
                    </p>
                    <Link
                      href={`/auction/${a.id}/results`}
                      className="mt-auto text-center btn-gold text-sm py-2"
                    >
                      View Results →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
