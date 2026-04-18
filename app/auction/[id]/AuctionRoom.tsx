'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SpinWheel from '@/components/SpinWheel'
import BuySpotModal from '@/components/BuySpotModal'
import { formatCurrency, getTierColor } from '@/lib/utils'

interface AuctionItem {
  id: string
  quantity: number
  spotNumber: number | null
  item: {
    id: string
    name: string
    tier: string
    resellMin: number
    resellMax: number
    shippingCost: number
  }
}

interface AuctionSpot {
  id: string
  spotNumber: number
  paid: boolean
  assignedItemId: string | null
  paymentMethod: string | null
  shipped: boolean
  trackingNumber: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface AuctionData {
  id: string
  name: string
  description: string | null
  status: string
  spotPrice: number
  totalSpots: number
  spinSeed: string | null
  createdAt: string
  completedAt: string | null
  items: AuctionItem[]
  spots: AuctionSpot[]
}

export default function AuctionRoom({ initialAuction }: { initialAuction: AuctionData }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [auction, setAuction] = useState<AuctionData>(initialAuction)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [spinComplete, setSpinComplete] = useState(false)
  const [revealedResults, setRevealedResults] = useState<AuctionSpot[]>([])
  const [isAdmin] = useState(session?.user?.isAdmin ?? false)

  const paidSpots = auction.spots.filter((s) => s.paid)
  const spotsLeft = auction.totalSpots - paidSpots.length
  const pctFilled = (paidSpots.length / auction.totalSpots) * 100

  // Poll for updates
  useEffect(() => {
    if (auction.status === 'completed') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/auctions/${auction.id}`)
      if (res.ok) {
        const updated = await res.json()
        setAuction(updated)
        if (updated.status === 'spinning' && !spinning) {
          setSpinning(true)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [auction.id, auction.status, spinning])

  const handleBuySuccess = async () => {
    setShowBuyModal(false)
    const res = await fetch(`/api/auctions/${auction.id}`)
    if (res.ok) {
      const updated = await res.json()
      setAuction(updated)
    }
    router.refresh()
  }

  const handleAdminSpin = async () => {
    if (!confirm('Are you sure you want to spin now? This cannot be undone.')) return

    const res = await fetch(`/api/auctions/${auction.id}/spin`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setSpinning(true)
      setTimeout(async () => {
        const updated = await fetch(`/api/auctions/${auction.id}`)
        if (updated.ok) {
          const auctionData = await updated.json()
          setAuction(auctionData)
          setSpinning(false)
          setSpinComplete(true)
          revealResultsSequentially(auctionData.spots.filter((s: AuctionSpot) => s.paid))
        }
      }, 6000)
    } else {
      alert(data.error || 'Spin failed')
    }
  }

  const revealResultsSequentially = (spots: AuctionSpot[]) => {
    spots.forEach((spot, i) => {
      setTimeout(() => {
        setRevealedResults((prev) => [...prev, spot])
      }, i * 800)
    })
  }

  // Find item by auctionItem id
  const getItemByAuctionItemId = (id: string | null) => {
    if (!id) return null
    return auction.items.find((ai) => ai.id === id) || null
  }

  // Wheel segments
  const wheelSegments = auction.items.map((ai) => ({
    label: ai.item.name,
    tier: ai.item.tier,
    quantity: ai.quantity,
  }))

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/30',
    spinning: 'text-gold bg-gold/10 border-gold/30',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-2">{auction.name}</h1>
            {auction.description && (
              <p className="text-gray-400 max-w-2xl">{auction.description}</p>
            )}
          </div>
          <span
            className={`text-sm font-bold px-4 py-2 rounded-full border uppercase tracking-widest ${
              statusColors[auction.status] || statusColors.active
            }`}
          >
            {auction.status === 'spinning' ? '🎡 SPINNING...' : auction.status}
          </span>
        </div>
      </div>

      {/* Trust banners */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="no-refund-banner text-xs flex-1 min-w-fit">ALL SALES FINAL — NO REFUNDS</div>
        <div className="bg-green-950/30 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-xs font-semibold text-center flex-1 min-w-fit">
          100% RANDOMIZED • PROVABLY FAIR
        </div>
        {auction.spinSeed && (
          <div className="bg-blue-950/30 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-lg text-xs font-mono flex-1 min-w-fit overflow-hidden">
            SEED: {auction.spinSeed.substring(0, 20)}...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Wheel */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Spinning status */}
            {auction.status === 'spinning' && !spinComplete && (
              <div className="text-center mb-4">
                <p className="text-gold font-heading text-3xl animate-pulse">SPINNING!</p>
                <p className="text-gray-400 text-sm">The wheel is deciding everyone&apos;s fate...</p>
              </div>
            )}

            <SpinWheel
              segments={wheelSegments}
              spinning={spinning}
              onSpinComplete={() => {
                setSpinning(false)
                setSpinComplete(true)
              }}
            />

            {/* Spot purchase section */}
            {auction.status === 'active' && (
              <div className="mt-6 card text-center">
                <div className="mb-4">
                  <p className="text-3xl font-heading text-gold">{formatCurrency(auction.spotPrice)}</p>
                  <p className="text-gray-400 text-sm">per spot</p>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-400">{paidSpots.length}/{auction.totalSpots} spots</span>
                    <span className={spotsLeft === 0 ? 'text-gold font-bold' : 'text-gray-400'}>
                      {spotsLeft === 0 ? '🔥 FULL!' : `${spotsLeft} left`}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pctFilled}%`,
                        background:
                          pctFilled === 100
                            ? '#FFD700'
                            : 'linear-gradient(90deg, #FFD700, #B8860B)',
                      }}
                    />
                  </div>
                </div>

                {session?.user ? (
                  spotsLeft > 0 ? (
                    <button
                      onClick={() => setShowBuyModal(true)}
                      className="btn-gold w-full active-glow"
                    >
                      Buy a Spot →
                    </button>
                  ) : (
                    <div className="text-gold font-heading text-lg">ALL SPOTS SOLD — WHEEL SPINNING SOON!</div>
                  )
                ) : (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="btn-outline w-full"
                  >
                    Sign In to Buy a Spot
                  </button>
                )}

                {isAdmin && paidSpots.length > 0 && (
                  <button
                    onClick={handleAdminSpin}
                    className="mt-3 w-full bg-red-900/50 border border-red-500/40 text-red-300 rounded-lg py-2 text-sm font-semibold hover:bg-red-900/70 transition-colors"
                  >
                    [ADMIN] Force Spin Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Items in Pool */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-heading text-white mb-4">ITEMS IN POOL</h2>
          <div className="space-y-3">
            {auction.items.map((ai) => (
              <div key={ai.id} className={`card p-4 ${getTierColor(ai.item.tier)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`tier-badge text-xs ${getTierColor(ai.item.tier)}`}>
                        {ai.item.tier}
                      </span>
                      <span className="text-xs text-gray-400">x{ai.quantity}</span>
                    </div>
                    <p className="font-semibold text-white text-sm">{ai.item.name}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>{formatCurrency(ai.item.resellMin)}–{formatCurrency(ai.item.resellMax)}</p>
                    <p className="text-gray-500">resell</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Provably Fair */}
          {auction.spinSeed && (
            <div className="mt-4 card bg-blue-950/20 border-blue-500/20">
              <h3 className="font-heading text-blue-300 mb-2">SPIN SEED (VERIFY)</h3>
              <p className="font-mono text-xs text-gray-400 break-all">{auction.spinSeed}</p>
              <p className="text-gray-500 text-xs mt-2">
                This cryptographic seed was generated before the spin and can be used to independently verify all results.
              </p>
            </div>
          )}
        </div>

        {/* Right: Spots & Results */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-heading text-white mb-4">
            {auction.status === 'completed' ? 'RESULTS' : 'SPOT ASSIGNMENTS'}
          </h2>

          {auction.status === 'completed' ? (
            // Show full results
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {paidSpots
                .sort((a, b) => a.spotNumber - b.spotNumber)
                .map((spot) => {
                  const assignedItem = getItemByAuctionItemId(spot.assignedItemId)
                  const isRevealed =
                    revealedResults.length === 0 ||
                    revealedResults.some((r) => r.id === spot.id)
                  return (
                    <div
                      key={spot.id}
                      className={`card p-4 transition-all ${
                        isRevealed ? 'reveal-animation border-gold/20' : 'opacity-20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-gold font-heading text-lg">{spot.spotNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {spot.user.name || spot.user.email.split('@')[0]}
                          </p>
                          {assignedItem && (
                            <p className={`text-xs font-semibold ${getTierColor(assignedItem.item.tier).split(' ')[0]}`}>
                              {assignedItem.item.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs">
                          {spot.shipped ? (
                            <span className="text-green-400 font-semibold">SHIPPED ✓</span>
                          ) : (
                            <span className="text-yellow-400">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            // Show spot grid
            <div>
              <div className="spot-grid mb-4">
                {Array.from({ length: auction.totalSpots }, (_, i) => i + 1).map((num) => {
                  const spot = paidSpots.find((s) => s.spotNumber === num)
                  const isYours = spot?.user.id === session?.user?.id
                  return (
                    <div
                      key={num}
                      className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs border transition-all ${
                        spot
                          ? isYours
                            ? 'bg-gold/20 border-gold text-gold font-bold'
                            : 'bg-green-900/30 border-green-500/30 text-green-300'
                          : 'bg-background border-border text-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="font-heading text-base">{num}</span>
                      {spot && (
                        <span className="text-[9px] truncate w-full text-center px-1 opacity-70">
                          {isYours ? 'YOU' : spot.user.name?.split(' ')[0] || '•'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gold/20 border border-gold" />
                  <span>Your spot</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-900/30 border border-green-500/30" />
                  <span>Taken</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-background border border-border" />
                  <span>Open</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <BuySpotModal
          auction={auction}
          spotsLeft={spotsLeft}
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  )
}
