'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import CharacterSelect from '@/components/game/CharacterSelect'
import GameCanvas from '@/components/game/GameCanvas'
import { Pokemon } from '@/lib/pokemonData'

interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  pokemonName: string
  pokemonImg: string
}

function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/poke-flap/scores')
      .then((r) => r.json())
      .then((data) => setBoard(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #1e0a3c, #0d2137)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h2 className="font-heading text-white text-lg tracking-wide">LEADERBOARD</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : board.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No scores yet. Be the first!</p>
          ) : (
            <div className="space-y-1.5">
              {board.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{
                    background: i === 0
                      ? 'rgba(255,215,0,0.12)'
                      : i === 1
                      ? 'rgba(192,192,192,0.10)'
                      : i === 2
                      ? 'rgba(205,127,50,0.10)'
                      : 'rgba(255,255,255,0.04)',
                    border: i < 3 ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                  }}
                >
                  <span className="w-7 text-center text-sm font-black flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                      <span className="text-xs text-gray-500">{i + 1}</span>
                    )}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.pokemonImg} alt={entry.pokemonName} className="w-8 h-8 object-contain flex-shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-white truncate">{entry.playerName}</span>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-gold">{entry.score}</span>
                    <p className="text-[10px] text-gray-500 leading-none">{entry.pokemonName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PokeFlapPage() {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1b2a 50%, #0a2d1f 100%)' }}
    >
      {/* Leaderboard button — always visible */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
        style={{
          background: 'rgba(255,215,0,0.10)',
          border: '1px solid rgba(255,215,0,0.30)',
          color: '#FFD700',
        }}
      >
        <Trophy className="w-3.5 h-3.5" />
        Leaderboard
      </button>

      {!selectedPokemon ? (
        <CharacterSelect onSelect={setSelectedPokemon} />
      ) : (
        <div className="w-full flex flex-col items-center gap-4" style={{ maxWidth: 420 }}>
          <div className="w-full" style={{ height: '600px' }}>
            <GameCanvas
              selectedPokemon={selectedPokemon}
              onBack={() => setSelectedPokemon(null)}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
      </AnimatePresence>
    </div>
  )
}
