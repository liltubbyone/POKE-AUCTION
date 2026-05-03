import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        card: '#0d1224',
        surface: '#0f172a',
        gold: '#FFD700',
        'gold-dark': '#b45309',
        'gold-light': '#fde68a',
        border: '#1e293b',
        'border-subtle': '#0d1829',
        muted: '#64748b',
        primary: '#7c3aed',
        'primary-light': '#a78bfa',
        cyan: '#38bdf8',
        emerald: '#22c55e',
        'tier-s': '#f87171',
        'tier-a': '#fb923c',
        'tier-b': '#60a5fa',
        'tier-c': '#64748b',
      },
      fontFamily: {
        heading: ['var(--font-orbitron)', 'Orbitron', 'sans-serif'],
        body:    ['var(--font-rajdhani)', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        spin:           'spin 1s linear infinite',
        'spin-slow':    'spin 3s linear infinite',
        'pulse-gold':   'pulse-gold 2s ease-in-out infinite',
        'bounce-in':    'bounce-in 0.5s ease-out',
        'fade-in':      'fade-in 0.3s ease-out',
        'wheel-spin':   'wheel-spin 4s cubic-bezier(0.17,0.67,0.12,0.99) forwards',
        shimmer:        'shimmer 4s linear infinite',
        'bounce-once':  'bounce-once 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px #FFD700' },
          '50%':       { boxShadow: '0 0 30px #FFD700, 0 0 60px rgba(255,215,0,0.4)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'wheel-spin': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(1800deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'bounce-once': {
          '0%':   { transform: 'scale(0.9)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '80%':  { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #fde68a 0%, #FFD700 40%, #b45309 100%)',
        'dark-gradient':  'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        'cosmic-gradient':'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
        'gold-shimmer':   'linear-gradient(90deg, #b45309 0%, #fde68a 25%, #FFD700 50%, #fde68a 75%, #b45309 100%)',
      },
      boxShadow: {
        gold:        '0 0 20px rgba(255,215,0,0.22)',
        'gold-lg':   '0 0 40px rgba(255,215,0,0.32)',
        card:        '0 4px 24px rgba(0,0,0,0.4)',
        neon:        '0 0 20px rgba(124,58,237,0.25)',
        'neon-cyan': '0 0 20px rgba(56,189,248,0.25)',
      },
    },
  },
  plugins: [],
}
export default config
