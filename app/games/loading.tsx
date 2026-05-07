import AuctionCardSkeleton from '@/components/AuctionCardSkeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <AuctionCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
