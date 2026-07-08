'use client'

import { motion } from 'framer-motion'
import { RotateCcw, ArrowLeft } from 'lucide-react'
import { Pokemon } from '@/lib/pokemonData'

interface Props {
  score: number
  bestScore: number
  pokemon: Pokemon | null
  onRestart: () => void
  onBack: () => void
}

export default function GameOverOverlay({ score, bestScore, pokemon, onRestart, onBack }: Props) {
  const isNewBest = score > 0 && score === bestScore

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl p-5 shadow-2xl border-4 border-amber-300 w-[280px] text-center"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <h2 className="text-2xl font-black text-red-500 mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
          Game Over!
        </h2>

        {pokemon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pokemon.img} alt={pokemon.name} className="w-14 h-14 mx-auto mb-2 object-contain" />
        )}

        {isNewBest && (
          <div className="mb-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
            New Best!
          </div>
        )}

        <div className="space-y-1.5 my-3">
          <div className="bg-white/60 rounded-xl py-1.5 px-4">
            <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">Score</p>
            <p className="text-4xl font-black text-amber-900">{score}</p>
          </div>
          <div className="bg-white/40 rounded-xl py-1 px-4">
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Best</p>
            <p className="text-2xl font-bold text-amber-800">{bestScore}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 border-2 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 rounded-full px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
