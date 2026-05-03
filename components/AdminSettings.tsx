'use client'

import { useState, useEffect } from 'react'

interface Settings {
  mysteryGiftName: string
  mysteryGiftImage: string | null
  winnerSpinNumber: number
  dailySpinLimit: number
  wheelSegments: string
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
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [imgError, setImgError] = useState(false)
  const [customSlots, setCustomSlots] = useState<string[]>(PRESETS[0].slots)
  const [activePreset, setActivePreset] = useState<number | null>(0)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d)
        const slots = segmentsToSlots(d.wheelSegments ?? '[]')
        setCustomSlots(slots)
        const match = PRESETS.findIndex((p) => JSON.stringify(p.slots) === JSON.stringify(slots))
        setActivePreset(match >= 0 ? match : null)
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
