import Link from 'next/link'

export default function WordSearchCard() {
  return (
    <Link href="/word-search" className="block group">
      <div
        className="auction-card relative rounded-2xl p-5 flex flex-col gap-4"
        style={{ '--cat-rgb': '0,229,255' } as React.CSSProperties}
      >
        {/* Top neon edge */}
        <div
          className="absolute top-0 left-8 right-8 h-px pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.75), transparent)',
            opacity: 0.55,
          }}
        />

        {/* Header */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest"
              style={{
                color: '#38bdf8',
                background: 'rgba(0,229,255,0.10)',
                border: '1px solid rgba(0,229,255,0.28)',
              }}
            >
              Free Game
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{
                color: '#4ade80',
                background: 'rgba(74,222,128,0.07)',
                border: '1px solid rgba(74,222,128,0.22)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#4ade80',
                  boxShadow: '0 0 5px #4ade80',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              Daily
            </span>
          </div>
          <h3 className="text-xl font-heading text-white leading-tight group-hover:text-sky-300 transition-colors duration-200">
            Pokemon Word Search
          </h3>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed -mt-1">
          A new set of hidden Pokemon names every day. Find them all to earn a free bonus spin on the mystery wheel.
        </p>

        {/* Preview grid */}
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-bold">Puzzle Preview</p>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}
          >
            <div
              className="select-none opacity-60"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0,1fr))', gap: 3 }}
            >
              {'PIKACHUABCDRAGONITEEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRST'.split('').slice(0, 50).map((l, i) => (
                <div
                  key={i}
                  className="aspect-square rounded text-[9px] font-black flex items-center justify-center"
                  style={{
                    background: [3,4,5,6,7,8,21,22,23,24,25,26,27,28,29,30].includes(i)
                      ? 'rgba(56,189,248,0.35)'
                      : 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,229,255,0.10)',
                    color: [3,4,5,6,7,8,21,22,23,24,25,26,27,28,29,30].includes(i) ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reward pill */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              color: '#fde047',
              background: 'rgba(253,224,71,0.08)',
              border: '1px solid rgba(253,224,71,0.22)',
            }}
          >
            +1 Bonus Spin
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.22)',
            }}
          >
            14×14 Grid
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              color: '#a78bfa',
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.22)',
            }}
          >
            7–10 Words
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5 font-bold">Entry Fee</p>
            <p className="text-2xl font-heading leading-none" style={{ color: '#4ade80', textShadow: '0 0 14px rgba(74,222,128,0.35)' }}>
              FREE
            </p>
          </div>
          <div className="btn-gold text-sm py-2.5 px-5 rounded-xl">
            Play Now
            <svg className="w-3.5 h-3.5 ml-1.5 inline -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
