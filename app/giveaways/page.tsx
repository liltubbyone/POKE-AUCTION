export default function GiveawaysPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Free to Enter</p>
        <h1 className="text-5xl md:text-6xl font-heading text-white mb-3">
          GIVE<span className="gold-gradient-text">AWAYS</span>
        </h1>
        <p className="text-gray-400 max-w-xl leading-relaxed">
          No purchase necessary. Free giveaways for our community — follow us on social media for announcements.
        </p>
      </div>

      <div
        className="rounded-2xl py-24 text-center"
        style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,215,0,0.1)' }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.15)' }}
        >
          🎁
        </div>
        <h3 className="text-3xl font-heading text-white mb-3">COMING SOON</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          Giveaways are launching soon. Make sure you&apos;re signed up and follow our socials so you don&apos;t miss a drop.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <div
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}
          >
            Free Entry
          </div>
          <div
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}
          >
            No Purchase Needed
          </div>
        </div>
      </div>
    </div>
  )
}
