'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-400">Invalid reset link.</p>
        <Link href="/auth/forgot-password" className="btn-gold inline-block px-6 py-2 text-sm">Request New Link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-green-300 text-sm text-center">
        Password reset! Redirecting to login...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="input-field w-full"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="input-field w-full"
          placeholder="Repeat password"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-50">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-heading text-white mb-2">RESET PASSWORD</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your new password below.</p>
        <Suspense fallback={<p className="text-gray-400 text-sm">Loading...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
