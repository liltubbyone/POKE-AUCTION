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

export default async function HomePage() {
  const auctions = await getActiveAuctions()

  return (
    <div>
      <TrustBanner />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Auctions Running Now
          </div>

          <h1 className="text-6xl md:text-8xl font-heading text-white mb-4 leading-none">
            WIN RARE<br />
            <span className="gold-gradient-text">POKEMON</span><br />
            PRODUCTS
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-body max-w-2xl mx-auto">
            Buy a spot. Fill the auction. Spin the wheel. Every outcome is{' '}
            <strong className="text-gold">100% randomized</strong> — never manipulated.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <div className="no-refund-banner text-xs">ALL SALES FINAL — NO REFUNDS</div>
            <div className="bg-green-950/50 border border-green-500/40 text-green-300 px-4 py-3 rounded-lg text-xs font-semibold text-center">
              CRYPTOGRAPHIC SEED PROVABLY FAIR
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#active-auctions" className="btn-gold text-lg px-8 py-4">
              View Active Auctions
            </Link>
            <Link href="/inventory" className="btn-outline text-lg px-8 py-4">
              Browse Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">HOW THE WHEEL WORKS</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Simple, transparent, and provably fair. No tricks, no manipulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Browse Auctions',
                desc: 'View all items in the pool BEFORE buying a spot. Full transparency always.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Buy Your Spot',
                desc: 'Pay per spot. Each spot gets a number. Payment is immediate and non-refundable.',
                icon: '💳',
              },
              {
                step: '03',
                title: 'Wheel Spins',
                desc: 'When ALL spots fill, the wheel auto-spins using a cryptographic random seed — live for everyone to watch.',
                icon: '🎡',
              },
              {
                step: '04',
                title: 'Claim Your Item',
                desc: 'Your spot number gets assigned a random item. Pay shipping and we send it right out.',
                icon: '📦',
              },
            ].map((step) => (
              <div key={step.step} className="text-center group">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-5xl font-heading text-gold/20 group-hover:text-gold/40 transition-colors mb-2">
                  {step.step}
                </div>
                <h3 className="text-xl font-heading text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provably Fair */}
      <section className="py-12 bg-gradient-to-r from-background to-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card border-gold/20">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🔐</div>
              <div>
                <h3 className="text-2xl font-heading text-gold mb-2">PROVABLY FAIR RANDOMIZATION</h3>
                <p className="text-gray-300 mb-3 leading-relaxed">
                  When the wheel spins, we generate a cryptographic random seed and publish it publicly. The seed
                  determines the shuffle order. You can independently verify every result.
                </p>
                <div className="bg-background rounded-lg p-3 font-mono text-xs text-gray-400 border border-border">
                  <span className="text-green-400">seed:</span> a7f3e9b2c1d4... (SHA-256 hash published BEFORE spin)
                  <br />
                  <span className="text-blue-400">algorithm:</span> Fisher-Yates shuffle seeded by CSPRNG
                  <br />
                  <span className="text-gold">result:</span> spot #1 → Booster Box, spot #2 → PO Sleeve...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Auctions */}
      <section id="active-auctions" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">ACTIVE AUCTIONS</h2>
              <p className="text-gray-400 mt-1">Buy a spot before they sell out!</p>
            </div>
            {auctions.length > 0 && (
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {auctions.length} Live
              </div>
            )}
          </div>

          {auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🎡</div>
              <h3 className="text-2xl font-heading text-gray-400 mb-2">No Active Auctions</h3>
              <p className="text-gray-500">Check back soon! New auctions are added regularly.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">WHY TRUST POKEAUCTION?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: '100% TRANSPARENT',
                desc: 'All items are listed publicly before any auction starts. No hidden items, no last-minute swaps. Ever.',
              },
              {
                icon: '🔒',
                title: 'NEVER MANIPULATED',
                desc: 'We use a cryptographic random seed to shuffle items. The seed is published before the spin — verify it independently.',
              },
              {
                icon: '📋',
                title: 'CLEAR POLICIES',
                desc: 'No refunds. Buyer pays shipping. No sales tax. These policies are stated clearly upfront — no surprises.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="text-center p-6 rounded-xl bg-background border border-border hover:border-gold/30 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-heading text-gold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">WHAT BUYERS SAY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                text: 'The provably fair system gives me confidence. Got my item shipped fast with tracking. 10/10.',
                item: 'Won: First Partner Coll.',
              },
            ].map((t) => (
              <div key={t.name} className="card">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-xs text-gold font-semibold">{t.item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
