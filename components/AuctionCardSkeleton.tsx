export default function AuctionCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 animate-pulse"
      style={{
        background: 'linear-gradient(160deg, rgba(15,22,42,0.95) 0%, rgba(10,14,30,1) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* pills row */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      {/* title */}
      <div>
        <div className="h-6 w-3/4 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-4 w-1/2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {/* item pills */}
      <div className="flex gap-2 flex-wrap">
        <div className="h-7 w-20 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-7 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-7 w-24 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      {/* progress */}
      <div>
        <div className="flex justify-between mb-2">
          <div className="h-4 w-28 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-4 w-14 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-3 w-8 rounded ml-auto mt-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {/* footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div>
          <div className="h-3 w-14 rounded mb-1.5" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-8 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
        <div className="h-10 w-28 rounded-xl" style={{ background: 'rgba(255,215,0,0.10)' }} />
      </div>
    </div>
  )
}
