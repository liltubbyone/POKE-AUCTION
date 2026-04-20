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
        background: '#06060d',
        card: '#0d0d1a',
        surface: '#111128',
        gold: '#FFD700',
        'gold-dark': '#B8860B',
        'gold-light': '#FFE44D',
        border: '#1e1e35',
        'border-subtle': '#13132a',
        muted: '#6b7280',
        'tier-s': '#FF4444',
        'tier-a': '#FF8C00',
        'tier-b': '#4169E1',
        'tier-c': '#6B7280',
      },
      fontFamily: {
        heading: ['var(--font-bebas)', 'Bebas Neue', 'sans-serif'],
        body: ['var(--font-rajdhani)', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        spin: 'spin 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'wheel-spin': 'wheel-spin 4s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards',
        shimmer: 'shimmer 4s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px #FFD700' },
          '50%': { boxShadow: '0 0 30px #FFD700, 0 0 60px #FFD700' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'wheel-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(1800deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFE44D 0%, #FFD700 40%, #B8860B 100%)',
        'dark-gradient': 'linear-gradient(180deg, #06060d 0%, #0d0d1a 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #B8860B 0%, #FFE44D 25%, #FFD700 50%, #FFE44D 75%, #B8860B 100%)',
      },
      boxShadow: {
        gold: '0 0 20px rgba(255, 215, 0, 0.25)',
        'gold-lg': '0 0 40px rgba(255, 215, 0, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config
