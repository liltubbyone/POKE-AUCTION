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
  shippingRate: number
  spinSeed: string | null
  wheelTheme: string | null
  createdAt: string
  completedAt: string | null
  items: AuctionItem[]
  spots: AuctionSpot[]
}

interface WinResult {
  itemName: string
  itemTier: string
  spotNumber: number
}

const WHEEL_THEME_OPTIONS = [
  { id: 'cosmic', label: 'Cosmic',  rim: '#FFD700' },
  { id: 'galaxy', label: 'Galaxy',  rim: '#A855F7' },
  { id: 'solar',  label: 'Solar',   rim: '#F97316' },
  { id: 'nebula', label: 'Nebula',  rim: '#22D3EE' },
  { id: 'custom', label: 'Custom',  rim: '#FFFFFF' },
]

const DEFAULT_CUSTOM = { rim: '#FFD700', outer: '#0d0d1a', tierS: '#FF4500', tierA: '#FFD700', tierB: '#4488FF', tierC: '#44CC77' }

function hexDarken(hex: string, f: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  const to = (v: number) => Math.max(0,Math.round(v*f)).toString(16).padStart(2,'0')
  return `#${to(r)}${to(g)}${to(b)}`
}
function isLight(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return (r*299+g*587+b*114)/1000 > 128
}
function buildPalette(c: typeof DEFAULT_CUSTOM) {
  const tier = (h: string) => ({ bg: h, alt: hexDarken(h,0.78), text: isLight(h)?'#1a1a1a':'#FFFFFF' })
  return JSON.stringify({ rim:c.rim, outer:c.outer, pointer:c.rim, tiers:{ S:tier(c.tierS), A:tier(c.tierA), B:tier(c.tierB), C:tier(c.tierC), EXCLUDE:{bg:'#555577',alt:'#333355',text:'#AAAACC'} } })
}
function parsePalette(json: string): typeof DEFAULT_CUSTOM {
  try { const p = JSON.parse(json); if (p.tiers) return { rim:p.rim??'#FFD700', outer:p.outer??'#0d0d1a', tierS:p.tiers.S?.bg??'#FF4500', tierA:p.tiers.A?.bg??'#FFD700', tierB:p.tiers.B?.bg??'#4488FF', tierC:p.tiers.C?.bg??'#44CC77' } } catch {}
  return DEFAULT_CUSTOM
}

export default function AuctionRoom({ initialAuction, customWheelTheme = '{}' }: { initialAuction: AuctionData; customWheelTheme?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [auction, setAuction] = useState<AuctionData>(initialAuction)
  const [wheelThemeOverride, setWheelThemeOverride] = useState<string | null>(null)
  const [customColors, setCustomColors] = useState(() => parsePalette(customWheelTheme))
  const [liveCustomPalette, setLiveCustomPalette] = useState(customWheelTheme)
  const [customSaving, setCustomSaving] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [myWin, setMyWin] = useState<WinResult | null>(null)
  const [showWinModal, setShowWinModal] = useState(false)
  const [winnerLabel, setWinnerLabel] = useState<string | undefined>(undefined)

  const paidSpots = auction.spots.filter((s) => s.paid)
  const spotsLeft = auction.totalSpots - paidSpots.length
  const pctFilled = (paidSpots.length / auction.totalSpots) * 100

  // Count assigned spots per auction item to compute remaining
  const assignedCounts: Record<string, number> = {}
  for (const spot of auction.spots) {
    if (spot.assignedItemId) {
      assignedCounts[spot.assignedItemId] = (assignedCounts[spot.assignedItemId] || 0) + 1
    }
  }

  // Wheel segments: only show items with remaining quantity
  const wheelSegments = auction.items
    .map((ai) => ({
      label: ai.item.name,
      tier: ai.item.tier,
      quantity: ai.quantity - (assignedCounts[ai.id] || 0),
    }))
    .filter((seg) => seg.quantity > 0)

  // Track which spots were already assigned on load (to detect new wins via polling)
  const [seenAssignedSpotIds] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const spot of initialAuction.spots) {
      if (spot.assignedItemId) s.add(spot.id)
    }
    return s
  })

  // Poll for updates when auction is active
  useEffect(() => {
    if (auction.status === 'completed') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/auctions/${auction.id}`)
      if (res.ok) {
        const updated: AuctionData = await res.json()
        // Don't overwrite state while spin animation is in progress
        if (!spinning) setAuction(updated)

        // Detect if a new spin result appeared for the current user
        if (session?.user?.id && !spinning && !showWinModal) {
          for (const spot of updated.spots) {
            if (
              spot.user.id === session.user.id &&
              spot.assignedItemId &&
              !seenAssignedSpotIds.has(spot.id)
            ) {
              seenAssignedSpotIds.add(spot.id)
              const assignedItem = updated.items.find((ai) => ai.id === spot.assignedItemId)
              if (assignedItem) {
                setWinnerLabel(assignedItem.item.name)
                setSpinning(true)
                setTimeout(() => {
                  setSpinning(false)
                  setMyWin({
                    itemName: assignedItem.item.name,
                    itemTier: assignedItem.item.tier,
                    spotNumber: spot.spotNumber,
                  })
                  setShowWinModal(true)
                }, 5000)
              }
              break
            }
          }
        }
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [auction.id, auction.status, session?.user?.id, spinning, showWinModal, seenAssignedSpotIds])

  const handleBuySuccess = (result?: { spot: AuctionSpot; spinResult: { itemName: string; itemTier: string } | null }) => {
    setShowBuyModal(false)

    if (!result?.spot) return

    seenAssignedSpotIds.add(result.spot.id)

    if (result.spinResult) {
      // Add spot WITHOUT assignedItemId first — wheel keeps all items visible during spin
      const spotDuringSpин = { ...result.spot, assignedItemId: null }
      setAuction((prev) => ({
        ...prev,
        spots: [...prev.spots.filter((s) => s.id !== result.spot.id), spotDuringSpин],
      }))

      setWinnerLabel(result.spinResult.itemName)
      setSpinning(true)

      setTimeout(() => {
        // Spin done — now apply real assignedItemId so item disappears from wheel
        setAuction((prev) => ({
          ...prev,
          spots: [...prev.spots.filter((s) => s.id !== result.spot.id), result.spot],
        }))
        setSpinning(false)
        setMyWin({
          itemName: result.spinResult!.itemName,
          itemTier: result.spinResult!.itemTier,
          spotNumber: result.spot.spotNumber,
        })
        setShowWinModal(true)
      }, 5000)
    } else {
      // Venmo/CashApp — unpaid, no spin yet
      setAuction((prev) => ({
        ...prev,
        spots: [...prev.spots.filter((s) => s.id !== result.spot.id), result.spot],
      }))
    }
  }

  const handleThemeChange = async (theme: string) => {
    setWheelThemeOverride(theme)
    await fetch(`/api/auctions/${auction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wheelTheme: theme }),
    })
  }

  const handleColorChange = (key: string, value: string) => {
    const next = { ...customColors, [key]: value }
    setCustomColors(next)
    setLiveCustomPalette(buildPalette(next))
  }

  const saveCustomColors = async () => {
    setCustomSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customWheelTheme: liveCustomPalette }),
    })
    setCustomSaving(false)
  }

  const activeTheme = wheelThemeOverride ?? auction.wheelTheme ?? 'cosmic'

  // Find item by auctionItem id
  const getItemByAuctionItemId = (id: string | null) => {
    if (!id) return null
    return auction.items.find((ai) => ai.id === id) || null
  }

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
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold px-4 py-2 rounded-full border uppercase tracking-widest ${
                statusColors[auction.status] || statusColors.active
              }`}
            >
              {auction.status === 'spinning' ? 'SPINNING...' : auction.status}
            </span>
            {auction.status === 'completed' && (
              <a
                href={`/auction/${auction.id}/results`}
                className="text-sm font-semibold text-gold border border-gold/40 bg-gold/10 hover:bg-gold/20 px-4 py-2 rounded-full transition-colors"
              >
                View Results →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Trust banners */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="no-refund-banner text-xs flex-1 min-w-fit">ALL SALES FINAL — NO REFUNDS</div>
        <div className="bg-green-950/30 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-xs font-semibold text-center flex-1 min-w-fit">
          100% RANDOMIZED — PROVABLY FAIR
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Wheel */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <div className="w-full max-w-sm mx-auto">
            {spinning && (
              <div className="text-center mb-4">
                <p className="text-gold font-heading text-3xl animate-pulse">SPINNING!</p>
                <p className="text-gray-400 text-sm">The Pokeball decides your fate...</p>
              </div>
            )}

            <SpinWheel
              segments={wheelSegments}
              spinning={spinning}
              winnerLabel={winnerLabel}
              theme={activeTheme}
              customPalette={activeTheme === 'custom' ? liveCustomPalette : undefined}
              onSpinComplete={() => setSpinning(false)}
            />

            {/* Admin: live theme switcher */}
            {session?.user?.isAdmin && (
              <div className="mt-3 w-full">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5 text-center">Wheel Theme</p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {WHEEL_THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      title={t.label}
                      className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all"
                      style={{
                        background: activeTheme === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                        border: activeTheme === t.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(30,30,53,0.6)',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: t.rim, boxShadow: `0 0 5px ${t.rim}` }}
                      />
                      <span className="text-[9px] text-gray-500">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom color pickers — shown when Custom is active */}
                {activeTheme === 'custom' && (
                  <div className="mt-3 rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Custom Colors</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['Rim', 'rim'],
                        ['Outer', 'outer'],
                        ['Tier S', 'tierS'],
                        ['Tier A', 'tierA'],
                        ['Tier B', 'tierB'],
                        ['Tier C', 'tierC'],
                      ] as [string, string][]).map(([label, key]) => (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors[key as keyof typeof customColors]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent flex-shrink-0"
                          />
                          <span className="text-[10px] text-gray-400">{label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={saveCustomColors}
                      disabled={customSaving}
                      className="w-full text-[11px] py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                      style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd' }}
                    >
                      {customSaving ? 'Saving…' : 'Save Custom Colors'}
                    </button>
                  </div>
                )}
              </div>
            )}

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
                      {spotsLeft === 0 ? 'FULL!' : `${spotsLeft} left`}
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
                      disabled={spinning}
                    >
                      {spinning ? 'Wheel Spinning...' : 'Buy a Spot'}
                    </button>
                  ) : (
                    <div className="text-gold font-heading text-lg">ALL SPOTS SOLD!</div>
                  )
                ) : (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="btn-outline w-full"
                  >
                    Sign In to Buy a Spot
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
            {auction.items.map((ai) => {
              const remaining = ai.quantity - (assignedCounts[ai.id] || 0)
              const soldOut = remaining <= 0
              return (
                <div
                  key={ai.id}
                  className={`card p-4 transition-all ${soldOut ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`tier-badge text-xs ${getTierColor(ai.item.tier)}`}>
                      {ai.item.tier}
                    </span>
                    <p className="font-semibold text-white text-sm flex-1">{ai.item.name}</p>
                    <span className={`text-xs font-bold ${soldOut ? 'text-red-400' : 'text-gray-400'}`}>
                      {soldOut ? 'GONE' : `x${remaining}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Spots & Results */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-heading text-white mb-4">
            {auction.status === 'completed' ? 'RESULTS' : 'SPOT ASSIGNMENTS'}
          </h2>

          {auction.status === 'completed' ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {paidSpots
                .sort((a, b) => a.spotNumber - b.spotNumber)
                .map((spot) => {
                  const assignedItem = getItemByAuctionItemId(spot.assignedItemId)
                  return (
                    <div key={spot.id} className="card p-4 border-gold/20">
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
                            <span className="text-green-400 font-semibold">SHIPPED</span>
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
            <div>
              <div className="spot-grid mb-4">
                {Array.from({ length: auction.totalSpots }, (_, i) => i + 1).map((num) => {
                  const spot = paidSpots.find((s) => s.spotNumber === num)
                  const isYours = spot?.user.id === session?.user?.id
                  const assignedItem = spot ? getItemByAuctionItemId(spot.assignedItemId) : null
                  return (
                    <div
                      key={num}
                      title={assignedItem ? assignedItem.item.name : undefined}
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
                          {isYours ? 'YOU' : spot.user.name || spot.user.email.split('@')[0]}
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

              {/* Show current user's assigned items */}
              {session?.user && (
                <div className="mt-6">
                  {paidSpots
                    .filter((s) => s.user.id === session.user.id && s.assignedItemId)
                    .map((spot) => {
                      const item = getItemByAuctionItemId(spot.assignedItemId)
                      if (!item) return null
                      return (
                        <div key={spot.id} className="card border-gold/40 bg-gold/5 p-4 mb-2">
                          <p className="text-gold text-xs font-bold uppercase tracking-wider mb-1">Your Win — Spot #{spot.spotNumber}</p>
                          <div className="flex items-center gap-2">
                            <span className={`tier-badge text-xs ${getTierColor(item.item.tier)}`}>{item.item.tier}</span>
                            <p className="text-white font-semibold text-sm">{item.item.name}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Win Modal */}
      {showWinModal && myWin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full text-center border-gold/50 shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-heading text-gold mb-2">YOU WON!</h2>
            <p className="text-gray-400 mb-6 text-sm">Spot #{myWin.spotNumber}</p>
            <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border mb-6 ${getTierColor(myWin.itemTier)}`}>
              <span className={`tier-badge ${getTierColor(myWin.itemTier)}`}>{myWin.itemTier}</span>
              <span className="text-white font-heading text-xl">{myWin.itemName}</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Your item will be shipped after payment is confirmed. Check your profile for updates.
            </p>
            <button
              onClick={() => setShowWinModal(false)}
              className="btn-gold w-full"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

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
