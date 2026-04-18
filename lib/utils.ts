import crypto from 'crypto'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateSpinSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Provably fair shuffle using a seed.
 * Given a seed and an array, deterministically shuffle it.
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const arr = [...array]
  // Create a simple seeded random from the seed hash
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  let s = Math.abs(hash)
  const seededRandom = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    S: 'text-red-400 bg-red-400/10 border border-red-400/30',
    A: 'text-orange-400 bg-orange-400/10 border border-orange-400/30',
    B: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
    C: 'text-gray-400 bg-gray-400/10 border border-gray-400/30',
    EXCLUDE: 'text-gray-600 bg-gray-600/10 border border-gray-600/30',
  }
  return colors[tier] || colors.C
}

export function getTierWheelColor(tier: string): string {
  const colors: Record<string, string> = {
    S: '#FF4444',
    A: '#FF8C00',
    B: '#4169E1',
    C: '#6B7280',
    EXCLUDE: '#374151',
  }
  return colors[tier] || colors.C
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
