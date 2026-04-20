'use client'

import { useState } from 'react'

export default function GenerateLabelButton({ spotId }: { spotId: string }) {
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/shipping/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Label generation failed')

      setTracking(data.trackingNumber)

      // Auto-download label PDF if present
      if (data.labelBase64) {
        const binary = atob(data.labelBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `label-${data.trackingNumber}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (tracking) {
    return (
      <div className="text-xs text-green-400 font-semibold">
        Shipped ✓ — {tracking}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full text-xs bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:bg-blue-900 px-3 py-2 rounded font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate FedEx Label & Ship'}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
