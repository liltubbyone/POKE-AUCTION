'use client'

import { useState, useEffect } from 'react'

interface Settings {
  mysteryGiftName: string
  mysteryGiftImage: string | null
  winnerSpinNumber: number
  dailySpinLimit: number
  wheelSegments: string
  mysteryWheelTheme: string
  customMysteryColor: string
  customWheelTheme: string
}

const MYSTERY_WHEEL_PRESETS = [
  { id: 'cosmic',  label: 'Cosmic',  desc: 'Purple & cyan',       color: '#7C3AED' },
  { id: 'galaxy',  label: 'Galaxy',  desc: 'Teal & electric blue', color: '#14B8A6' },
  { id: 'solar',   label: 'Solar',   desc: 'Orange & amber',       color: '#F97316' },
  { id: 'nebula',  label: 'Nebula',  desc: 'Pink & violet',        color: '#EC4899' },
  { id: 'custom',  label: 'Custom',  desc: 'Pick your own color',  color: '' },
]

const WHEEL_THEME_PRESETS = [
  { id: 'cosmic',  label: 'Cosmic',          rim: '#FFD700', desc: 'Gold & classic tier colors'    },
  { id: 'galaxy',  label: 'Galaxy Explorer', rim: '#A855F7', desc: 'Deep purples & electric blues' },
  { id: 'solar',   label: 'Solar System',    rim: '#F97316', desc: 'Warm oranges, reds & amber'    },
  { id: 'nebula',  label: 'Nebula Storm',    rim: '#22D3EE', desc: 'Cyan, pink & electric hues'    },
]

// Preset custom palette defaults (matches Cosmic)
const DEFAULT_CUSTOM_COLORS = { rim: '#FFD700', outer: '#0d0d1a', tierS: '#FF4500', tierA: '#FFD700', tierB: '#4488FF', tierC: '#44CC77' }

function hexDarken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const to = (v: number) => Math.max(0, Math.round(v * factor)).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
function buildCustomPalette(c: typeof DEFAULT_CUSTOM_COLORS): string {
  const tier = (hex: string) => ({ bg: hex, alt: hexDarken(hex, 0.78), text: isLight(hex) ? '#1a1a1a' : '#FFFFFF' })
  return JSON.stringify({
    rim: c.rim, outer: c.outer, pointer: c.rim,
    tiers: {
      S: tier(c.tierS), A: tier(c.tierA), B: tier(c.tierB), C: tier(c.tierC),
      EXCLUDE: { bg: '#555577', alt: '#333355', text: '#AAAACC' },
    },
  })
}
function parseCustomPalette(json: string): typeof DEFAULT_CUSTOM_COLORS {
  try {
    const p = JSON.parse(json)
    if (p.tiers) return {
      rim: p.rim ?? '#FFD700', outer: p.outer ?? '#0d0d1a',
      tierS: p.tiers.S?.bg ?? '#FF4500', tierA: p.tiers.A?.bg ?? '#FFD700',
      tierB: p.tiers.B?.bg ?? '#4488FF', tierC: p.tiers.C?.bg ?? '#44CC77',
    }
  } catch {}
  return DEFAULT_CUSTOM_COLORS
}

// All 8 slots — 'pokeball' renders the logo image, anything else is an emoji
const PRESETS: { name: string; emoji: string; desc: string; slots: string[] }[] = [
  {
    name: 'Cosmic',
    emoji: '🌌',
    desc: 'Rockets, planets & shooting stars',
    slots: ['pokeball', '🚀', '⭐', '🌙', '☄️', '🌌', '🪐', '💫'],
  },
  {
    name: 'Galaxy Explorer',
    emoji: '🛸',
    desc: 'UFOs, supernovas & deep space',
    slots: ['pokeball', '🛸', '🌠', '🔭', '🌟', '💥', '🌀', '✨'],
  },
  {
    name: 'Solar System',
    emoji: '☀️',
    desc: 'Planets, sun & satellites',
    slots: ['pokeball', '☀️', '🌍', '🌕', '🪐', '☄️', '🛰️', '🌟'],
  },
  {
    name: 'Nebula Storm',
    emoji: '⚡',
    desc: 'Cosmic energy & mystical forces',
    slots: ['pokeball', '⚡', '🔥', '💎', '🌊', '❄️', '🌪️', '🔮'],
  },
]

function segmentsToSlots(json: string): string[] {
  try {
    const arr = JSON.parse(json)
    if (arr.length === 8) return arr
  } catch {}
  return PRESETS[0].slots
}

function slotsToSegments(slots: string[]): string {
  return JSON.stringify(slots)
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    mysteryGiftName: 'Perfect Order Booster Pack',
    mysteryGiftImage: null,
    winnerSpinNumber: 100,
    dailySpinLimit: 1,
    wheelSegments: '[]',
    mysteryWheelTheme: 'cosmic',
    customMysteryColor: '#7C3AED',
    customWheelTheme: '{}',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imgError, setImgError] = useState(false)
  const [customSlots, setCustomSlots] = useState<string[]>(PRESETS[0].slots)
  const [activePreset, setActivePreset] = useState<number | null>(0)
  const [customColors, setCustomColors] = useState(DEFAULT_CUSTOM_COLORS)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d)
        const slots = segmentsToSlots(d.wheelSegments ?? '[]')
        setCustomSlots(slots)
        const match = PRESETS.findIndex((p) => JSON.stringify(p.slots) === JSON.stringify(slots))
        setActivePreset(match >= 0 ? match : null)
        setCustomColors(parseCustomPalette(d.customWheelTheme ?? '{}'))
      })
  }, [])

  const applyPreset = (idx: number) => {
    setActivePreset(idx)
    setCustomSlots(PRESETS[idx].slots)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mysteryGiftName: settings.mysteryGiftName,
        mysteryGiftImage: settings.mysteryGiftImage || null,
        winnerSpinNumber: settings.winnerSpinNumber,
        dailySpinLimit: settings.dailySpinLimit,
        wheelSegments: slotsToSegments(customSlots),
        mysteryWheelTheme: settings.mysteryWheelTheme,
        customMysteryColor: settings.customMysteryColor,
        customWheelTheme: buildCustomPalette(customColors),
      }),
    })
    setSaving(false)
    setMessage(res.ok ? 'Saved!' : 'Failed to save.')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="card border-purple-500/20">
      <h2 className="text-2xl font-heading text-purple-400 mb-4">MYSTERY SPIN SETTINGS</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Mystery Gift Name</label>
          <input
            type="text"
            value={settings.mysteryGiftName}
            onChange={(e) => setSettings((s) => ({ ...s, mysteryGiftName: e.target.value }))}
            className="input-field"
            placeholder="Perfect Order Booster Pack"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Gift Image URL (optional)</label>
          <input
            type="url"
            value={settings.mysteryGiftImage || ''}
            onChange={(e) => { setSettings((s) => ({ ...s, mysteryGiftImage: e.target.value })); setImgError(false) }}
            className="input-field"
            placeholder="https://..."
          />
          {settings.mysteryGiftImage && !imgError && (
            <img
              src={settings.mysteryGiftImage}
              alt="Gift preview"
              className="mt-2 w-20 h-20 object-contain rounded-lg border border-border"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          )}
          {settings.mysteryGiftImage && imgError && (
            <p className="text-red-400 text-xs mt-1">Image failed to load — check the URL.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Winning Spin Number</label>
            <input
              type="number"
              min={1}
              value={settings.winnerSpinNumber}
              onChange={(e) => setSettings((s) => ({ ...s, winnerSpinNumber: parseInt(e.target.value) }))}
              className="input-field"
            />
            <p className="text-gray-600 text-xs mt-1">The spin number that wins the gift.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Free Spins Per Day</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.dailySpinLimit}
              onChange={(e) => setSettings((s) => ({ ...s, dailySpinLimit: parseInt(e.target.value) }))}
              className="input-field"
            />
            <p className="text-gray-600 text-xs mt-1">How many spins each user gets daily.</p>
          </div>
        </div>
        {/* Wheel Theme */}
        <div>
          <label className="block text-xs text-gray-400 mb-3 uppercase tracking-wider">Spin Wheel Theme</label>

          {/* Preset grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(idx)}
                className="rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: activePreset === idx ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                  border: activePreset === idx ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(30,30,53,0.8)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{preset.emoji}</span>
                  <span className="font-heading text-sm text-white">{preset.name}</span>
                  {activePreset === idx && (
                    <span className="ml-auto text-xs font-bold text-violet-400">Active</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-2">{preset.desc}</p>
                {/* Slot preview */}
                <div className="flex gap-1 flex-wrap">
                  {preset.slots.map((s, i) => (
                    <span key={i} className="text-sm">{s === 'pokeball' ? '🔴' : s}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Custom slot editor */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}
          >
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              Custom — Edit All 8 Slots
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {customSlots.map((slot, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-600">S{i + 1}</span>
                  {slot === 'pokeball' ? (
                    <div className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="pokeball" className="w-10 h-10 mx-auto object-contain" />
                      <button
                        onClick={() => {
                          setActivePreset(null)
                          const next = [...customSlots]
                          next[i] = '🔴'
                          setCustomSlots(next)
                        }}
                        className="block w-full text-center text-[10px] text-violet-400 hover:text-white mt-0.5"
                      >
                        change
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={slot}
                        maxLength={4}
                        onChange={(e) => {
                          setActivePreset(null)
                          const next = [...customSlots]
                          next[i] = e.target.value
                          setCustomSlots(next)
                        }}
                        className="w-full text-center rounded-lg py-2 text-lg"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(30,30,53,0.8)', color: '#fff' }}
                      />
                      <button
                        onClick={() => {
                          setActivePreset(null)
                          const next = [...customSlots]
                          next[i] = 'pokeball'
                          setCustomSlots(next)
                        }}
                        className="block w-full text-center text-[10px] text-violet-400 hover:text-white mt-0.5"
                      >
                        pokeball
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-3">Type any emoji per slot. Click <span className="text-violet-400">pokeball</span> to restore the logo, or <span className="text-violet-400">change</span> to replace it with an emoji.</p>
          </div>
        </div>

        {/* Mystery Wheel Visual Theme */}
        <div>
          <label className="block text-xs text-gray-400 mb-3 uppercase tracking-wider">Mystery Wheel Visual Theme</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {MYSTERY_WHEEL_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSettings((s) => ({ ...s, mysteryWheelTheme: p.id }))}
                className="rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: settings.mysteryWheelTheme === p.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                  border: settings.mysteryWheelTheme === p.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(30,30,53,0.8)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {p.color ? (
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                  ) : (
                    <span className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-500" style={{ background: 'conic-gradient(red, yellow, green, blue, red)' }} />
                  )}
                  <span className="text-sm text-white font-semibold">{p.label}</span>
                  {settings.mysteryWheelTheme === p.id && <span className="ml-auto text-[10px] font-bold text-violet-400">Active</span>}
                </div>
                <p className="text-gray-500 text-xs">{p.desc}</p>
              </button>
            ))}
          </div>
          {settings.mysteryWheelTheme === 'custom' && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Custom Accent Color</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.customMysteryColor}
                  onChange={(e) => setSettings((s) => ({ ...s, customMysteryColor: e.target.value }))}
                  className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <div>
                  <p className="text-white text-sm font-semibold">{settings.customMysteryColor}</p>
                  <p className="text-gray-600 text-xs">Controls wheel glow, rings, pointer & segment tints</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Auction Wheel Theme */}
        <div>
          <label className="block text-xs text-gray-400 mb-3 uppercase tracking-wider">Custom Auction Wheel Theme</label>
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,30,53,0.8)' }}
          >
            <p className="text-gray-500 text-xs">Set these colors then pick <span className="text-violet-400">Custom</span> as the theme when creating an auction.</p>

            {/* Rim / Pointer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Rim &amp; Pointer Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={customColors.rim}
                    onChange={(e) => setCustomColors((c) => ({ ...c, rim: e.target.value }))}
                    className="w-10 h-9 rounded cursor-pointer border-0 bg-transparent flex-shrink-0" />
                  <span className="text-white text-xs font-mono">{customColors.rim}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Outer Ring Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={customColors.outer}
                    onChange={(e) => setCustomColors((c) => ({ ...c, outer: e.target.value }))}
                    className="w-10 h-9 rounded cursor-pointer border-0 bg-transparent flex-shrink-0" />
                  <span className="text-white text-xs font-mono">{customColors.outer}</span>
                </div>
              </div>
            </div>

            {/* Tier colors */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Segment Colors by Tier</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([['S', 'tierS'], ['A', 'tierA'], ['B', 'tierB'], ['C', 'tierC']] as const).map(([tier, key]) => (
                  <div key={tier}>
                    <label className="block text-xs text-gray-500 mb-1.5">Tier {tier}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customColors[key]}
                        onChange={(e) => setCustomColors((c) => ({ ...c, [key]: e.target.value }))}
                        className="w-10 h-9 rounded cursor-pointer border-0 bg-transparent flex-shrink-0" />
                      <span className="text-white text-xs font-mono">{customColors[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live preview swatches */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div className="flex gap-2 items-center">
                <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: customColors.rim, boxShadow: `0 0 8px ${customColors.rim}` }} title="Rim" />
                {(['tierS','tierA','tierB','tierC'] as const).map((k) => (
                  <span key={k} className="w-5 h-5 rounded flex-shrink-0" style={{ background: customColors[k] }} title={k} />
                ))}
                <span className="text-gray-600 text-xs ml-1">Rim · S · A · B · C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-gold text-sm py-2 px-5 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && <span className="text-green-400 text-sm font-semibold">{message}</span>}
        </div>
      </div>
    </div>
  )
}
