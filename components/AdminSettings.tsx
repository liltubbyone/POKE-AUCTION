'use client'

import { useState, useEffect } from 'react'

interface Settings {
  mysteryGiftName: string
  mysteryGiftImage: string | null
  winnerSpinNumber: number
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    mysteryGiftName: 'Perfect Order Booster Pack',
    mysteryGiftImage: null,
    winnerSpinNumber: 100,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mysteryGiftName: settings.mysteryGiftName,
        mysteryGiftImage: settings.mysteryGiftImage || null,
        winnerSpinNumber: settings.winnerSpinNumber,
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
            onChange={(e) => setSettings((s) => ({ ...s, mysteryGiftImage: e.target.value }))}
            className="input-field"
            placeholder="https://..."
          />
          {settings.mysteryGiftImage && (
            <img src={settings.mysteryGiftImage} alt="Gift preview" className="mt-2 w-20 h-20 object-contain rounded-lg border border-border" referrerPolicy="no-referrer" />
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Winning Spin Number</label>
          <input
            type="number"
            min={1}
            value={settings.winnerSpinNumber}
            onChange={(e) => setSettings((s) => ({ ...s, winnerSpinNumber: parseInt(e.target.value) }))}
            className="input-field w-32"
          />
          <p className="text-gray-600 text-xs mt-1">The user whose spin lands on this number wins the mystery gift.</p>
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
