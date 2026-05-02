import Link from 'next/link'

const games = [
  {
    href: '/daily-spin',
    label: 'Games',
    tag: 'Play Free',
    tagColor: '#06B6D4',
    tagBg: 'rgba(6,182,212,0.08)',
    tagBorder: 'rgba(6,182,212,0.25)',
    icon: '🎮',
    desc: 'Spin the cosmic wheel once a day for free. One lucky spin wins the mystery gift. No purchase needed.',
    cta: 'Spin Now',
    accentColor: 'rgba(6,182,212,0.08)',
    borderColor: 'rgba(6,182,212,0.2)',
  },
  {
    href: '/auctions',
    label: 'Raffles',
    tag: 'Most Popular',
    tagColor: '#FFD700',
    tagBg: 'rgba(255,215,0,0.08)',
    tagBorder: 'rgba(255,215,0,0.2)',
    icon: '🎰',
    desc: 'Buy a spot, fill the raffle, spin the wheel. Every spot wins a random item from the prize pool.',
    cta: 'Browse Raffles',
    accentColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  {
    href: '/live',
    label: 'Live',
    tag: 'Live Now',
    tagColor: '#4ade80',
    tagBg: 'rgba(74,222,128,0.08)',
    tagBorder: 'rgba(74,222,128,0.25)',
    icon: '📡',
    desc: 'Active raffles happening right now. Jump in before spots sell out.',
    cta: 'View Live',
    accentColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
  },
  {
    href: '/giveaways',
    label: 'Giveaways',
    tag: 'Free Entry',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.08)',
    tagBorder: 'rgba(167,139,250,0.25)',
    icon: '🎁',
    desc: 'No purchase necessary. Free giveaways for the community — follow our socials for announcements.',
    cta: 'Enter Giveaways',
    accentColor: 'rgba(124,58,237,0.08)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
]

export default function GamesPage() {
  return (
    <div>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-16 md:py-24"
        style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">
            Cosmic Grails
          </p>
          <h1 className="text-6xl md:text-7xl font-heading text-white mb-3">
            <span className="cosmic-title-shimmer">GAMES</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Choose your game. Every format is provably fair and 100% randomized.
          </p>
        </div>
      </div>

      {/* Game cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="group relative rounded-2xl p-7 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-2"
              style={{
                background: 'rgba(10,10,24,0.85)',
                border: `1px solid ${game.borderColor}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
              }}
            >
              {/* Tag */}
              <span
                className="self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  color: game.tagColor,
                  background: game.tagBg,
                  border: `1px solid ${game.tagBorder}`,
                }}
              >
                {game.tag}
              </span>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: game.accentColor,
                  border: `1px solid ${game.borderColor}`,
                }}
              >
                {game.icon}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-heading text-white mb-2">{game.label}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{game.desc}</p>
              </div>

              <div
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide transition-colors duration-200"
                style={{ color: game.tagColor }}
              >
                {game.cta}
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
