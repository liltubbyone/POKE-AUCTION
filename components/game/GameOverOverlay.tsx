'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, ArrowLeft, Send, Trophy } from 'lucide-react'
import { Pokemon } from '@/lib/pokemonData'

interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  pokemonName: string
  pokemonImg: string
}

interface Props {
  score: number
  bestScore: number
  pokemon: Pokemon | null
  onRestart: () => void
  onBack: () => void
}

export default function GameOverOverlay({ score, bestScore, pokemon, onRestart, onBack }: Props) {
  const isNewBest = score > 0 && score === bestScore

  const [tab, setTab] = useState<'result' | 'leaderboard'>('result')
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('flappy_player_name') || ''
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [loadingBoard, setLoadingBoard] = useState(false)

  const fetchBoard = async () => {
    setLoadingBoard(true)
    try {
      const res = await fetch('/api/poke-flap/scores')
      if (res.ok) setBoard(await res.json())
    } finally {
      setLoadingBoard(false)
    }
  }

  useEffect(() => {
    if (tab === 'leaderboard') fetchBoard()
  }, [tab])

  const handleSave = async () => {
    if (!playerName.trim() || saving) return
    setSaving(true)
    localStorage.setItem('flappy_player_name', playerName.trim())
    try {
      await fetch('/api/poke-flap/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score,
          pokemonName: pokemon?.name || 'Unknown',
          pokemonImg: pokemon?.img || '',
        }),
      })
      setSaved(true)
      setTab('leaderboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl p-5 shadow-2xl border-4 border-amber-300 w-[300px]"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-amber-200 mb-4">
          <button
            onClick={() => setTab('result')}
            className={`flex-1 text-xs font-bold py-1.5 transition-colors ${tab === 'result' ? 'bg-amber-400 text-white' : 'bg-white/50 text-amber-700'}`}
          >
            Result
          </button>
          <button
            onClick={() => setTab('leaderboard')}
            className={`flex-1 text-xs font-bold py-1.5 transition-colors flex items-center justify-center gap-1 ${tab === 'leaderboard' ? 'bg-amber-400 text-white' : 'bg-white/50 text-amber-700'}`}
          >
            <Trophy className="w-3 h-3" /> Board
          </button>
        </div>

        {tab === 'result' && (
          <div className="text-center">
            <h2 className="text-2xl font-black text-red-500 mb-2" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
              Game Over!
            </h2>

            {pokemon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pokemon.img} alt={pokemon.name} className="w-14 h-14 mx-auto mb-1 object-contain" />
            )}

            {isNewBest && (
              <div className="mb-2 text-xs font-black text-amber-600 uppercase tracking-wider">
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

            {/* Save score */}
            <div className="mb-3">
              {!saved ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Your name…"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    maxLength={20}
                    className="flex-1 text-xs rounded-lg border border-amber-300 px-2 py-1.5 bg-white/70 focus:outline-none focus:border-amber-500 text-amber-900 placeholder-amber-400"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!playerName.trim() || saving}
                    className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-green-600 font-semibold">Score saved to leaderboard!</p>
              )}
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="mb-3">
            <h3 className="text-center text-sm font-black text-amber-800 mb-3 uppercase tracking-wide">
              Top Scores
            </h3>
            {loadingBoard ? (
              <div className="space-y-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-amber-200/60 animate-pulse" />
                ))}
              </div>
            ) : board.length === 0 ? (
              <p className="text-center text-amber-600 text-xs py-4">No scores yet. Be the first!</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {board.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${i === 0 ? 'bg-amber-300/60' : i === 1 ? 'bg-amber-200/50' : i === 2 ? 'bg-amber-100/60' : 'bg-white/40'}`}
                  >
                    <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-500' : i === 2 ? 'text-orange-700' : 'text-amber-700'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.pokemonImg} alt={entry.pokemonName} className="w-6 h-6 object-contain" />
                    <span className="flex-1 text-xs font-semibold text-amber-900 truncate">{entry.playerName}</span>
                    <span className="text-sm font-black text-amber-800">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
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
