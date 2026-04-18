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
        background: '#0a0a0f',
        card: '#11111c',
        gold: '#FFD700',
        'gold-dark': '#B8860B',
        'gold-light': '#FFE44D',
        border: '#2a2a3a',
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
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0f 0%, #11111c 100%)',
      },
    },
  },
  plugins: [],
}
export default config
