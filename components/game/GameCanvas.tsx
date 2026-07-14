'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import useGameLoop from './useGameLoop'
import GameOverOverlay from './GameOverOverlay'
import PipeStyleSelector from './PipeStyleSelector'
import PipeDecorationSelector from './PipeDecorationSelector'
import { DEFAULT_PIPE_STYLE } from '@/lib/pipeStyles'
import { DEFAULT_PIPE_DECORATION } from '@/lib/pipeDecorations'
import { initSprites } from '@/lib/spriteCache'
import useSounds from '@/lib/useSounds'
import { Pokemon } from '@/lib/pokemonData'

export default function GameCanvas({
  selectedPokemon,
  onBack,
}: {
  selectedPokemon: Pokemon
  onBack: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const birdImgRef = useRef<HTMLImageElement | null>(null)
  const [gameState, setGameStateRaw] = useState('ready')
  const gameStateRef = useRef(gameState)
  const setGameState = useCallback((next: string) => {
    gameStateRef.current = next
    setGameStateRaw(next)
  }, [])
  const [displayScore, setDisplayScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem('flappy_pokemon_best') || '0', 10)
  })
  const [pipeStyle, setPipeStyle] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PIPE_STYLE
    return localStorage.getItem('flappy_pipe_style') || DEFAULT_PIPE_STYLE
  })
  const [pipeDecoration, setPipeDecoration] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PIPE_DECORATION
    return localStorage.getItem('flappy_pipe_decoration') || DEFAULT_PIPE_DECORATION
  })

  const handlePipeStyleChange = (style: string) => {
    setPipeStyle(style)
    localStorage.setItem('flappy_pipe_style', style)
  }

  const handlePipeDecorationChange = (dec: string) => {
    setPipeDecoration(dec)
    localStorage.setItem('flappy_pipe_decoration', dec)
  }

  const { playJump, playScore, playHit, muted, toggleMute } = useSounds()

  useEffect(() => { initSprites() }, [])

  const { jump, score } = useGameLoop({
    canvasRef,
    gameState,
    setGameState,
    selectedPokemon,
    birdImgRef,
    pipeStyle,
    pipeDecoration,
    onJump: playJump,
    onScore: playScore,
    onHit: playHit,
  })

  useEffect(() => {
    if (!selectedPokemon) return
    birdImgRef.current = null
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { birdImgRef.current = img }
    img.src = selectedPokemon.img
  }, [selectedPokemon])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.imageSmoothingEnabled = true
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (gameState === 'gameover') {
      const s = score.current
      setDisplayScore(s)
      if (s > bestScore) {
        setBestScore(s)
        localStorage.setItem('flappy_pokemon_best', String(s))
      }
    }
  }, [gameState, score, bestScore])

  const handleInteraction = useCallback(() => {
    const state = gameStateRef.current
    if (state === 'ready') {
      setGameState('playing')
    } else if (state === 'playing') {
      jump()
    }
  }, [jump, setGameState])

  const handleRestart = () => {
    setGameState('ready')
    setTimeout(() => setGameState('playing'), 50)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault()
      handleInteraction()
    }
  }, [handleInteraction])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="relative w-full h-full max-w-md mx-auto" style={{ maxHeight: '700px' }}>
      <div
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 cursor-pointer"
        style={{ touchAction: 'none', willChange: 'transform' }}
        onClick={handleInteraction}
        onTouchStart={(e) => { e.preventDefault(); handleInteraction() }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" style={{ display: 'block' }} />

        <div className="absolute top-3 left-3 z-20 flex gap-1.5">
          <PipeStyleSelector value={pipeStyle} onChange={handlePipeStyleChange} />
          <PipeDecorationSelector value={pipeDecoration} onChange={handlePipeDecorationChange} />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toggleMute() }}
          className="absolute top-3 right-3 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {gameState === 'ready' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative flex flex-col items-center">
              <motion.img
                src={selectedPokemon?.img}
                alt={selectedPokemon?.name}
                className="w-20 h-20 object-contain drop-shadow-xl"
                style={{ imageRendering: 'auto', transform: selectedPokemon?.mirrored ? 'scaleX(-1)' : undefined }}
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              />
              <p className="text-white font-bold text-lg mt-2 drop-shadow-md">
                {selectedPokemon?.name}
              </p>
              <motion.p
                className="text-white/90 text-sm mt-4 font-medium bg-black/30 px-4 py-2 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Tap or press Space to fly!
              </motion.p>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <GameOverOverlay
            score={displayScore}
            bestScore={bestScore}
            pokemon={selectedPokemon}
            onRestart={handleRestart}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  )
}
