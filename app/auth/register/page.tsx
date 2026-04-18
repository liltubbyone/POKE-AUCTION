'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!agreed) {
      setError('You must agree to the terms before registering')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Auto sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-heading gold-gradient-text mb-2">POKEAUCTION</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-heading text-white mb-6">CREATE ACCOUNT</h2>

          {error && (
            <div className="bg-red-950/50 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Re-enter password"
                required
              />
            </div>

            {/* Terms Agreement */}
            <div className="bg-background border border-border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-gold"
                />
                <span className="text-sm text-gray-300 leading-relaxed">
                  I understand and agree that:{' '}
                  <strong className="text-red-400">ALL SALES ARE FINAL — NO REFUNDS.</strong>{' '}
                  All auctions are 100% randomized. I am responsible for shipping costs.
                  The wheel result is determined by a provably fair cryptographic algorithm
                  and cannot be manipulated.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gold hover:text-gold-light font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
