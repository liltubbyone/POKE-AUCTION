'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      if (data.resetUrl) setResetUrl(data.resetUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-heading text-white mb-2">FORGOT PASSWORD</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

        {done ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-green-300 text-sm">
              {resetUrl
                ? 'Email delivery not yet configured. Use the link below to reset your password:'
                : `Check your inbox at ${email} for a reset link. It expires in 1 hour.`}
            </div>
            {resetUrl && (
              <a
                href={resetUrl}
                className="block text-gold text-sm break-all underline hover:text-gold-dark"
              >
                {resetUrl}
              </a>
            )}
            <Link href="/auth/login" className="btn-outline w-full text-center block py-2 text-sm">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field w-full"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link href="/auth/login" className="block text-center text-gray-500 text-sm hover:text-gray-300 transition-colors">
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
