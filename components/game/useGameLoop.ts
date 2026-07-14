'use client'

import { useRef, useCallback, useEffect, MutableRefObject } from 'react'
import { getPipePattern } from '@/lib/spriteCache'
import { Pokemon } from '@/lib/pokemonData'

const GRAVITY = 0.38
const JUMP_FORCE = -5.8
const PIPE_WIDTH = 70
const PIPE_GAP_MIN = 106
const PIPE_GAP_MAX = 167
const PIPE_SPEED = 2.8
const PIPE_SPAWN_INTERVAL = 1800
const BIRD_SIZE = 52
const GROUND_HEIGHT = 80

// Target frame duration (60fps reference)
const FRAME_MS = 1000 / 60

interface Pipe {
  x: number
  topHeight: number
  gap: number
  scored: boolean
}

interface UseGameLoopProps {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>
  gameState: string
  setGameState: (s: string) => void
  selectedPokemon: Pokemon | null
  birdImgRef: MutableRefObject<HTMLImageElement | null>
  pipeStyle: string
  pipeDecoration: string
  onJump?: () => void
  onScore?: () => void
  onHit?: () => void
}

// Cached gradients — recreated when canvas width changes
const gradCache: Record<string, CanvasGradient | null> = {
  classic: null, ice: null, lava: null,
  sky0: null,
}
let gradCacheWidth = 0

function getGradients(ctx: CanvasRenderingContext2D, w: number) {
  if (gradCacheWidth !== w) {
    gradCacheWidth = w

    const classic = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
    classic.addColorStop(0, '#5EBD3E')
    classic.addColorStop(0.3, '#7ED957')
    classic.addColorStop(0.7, '#5EBD3E')
    classic.addColorStop(1, '#3D8B27')
    gradCache.classic = classic

    const ice = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
    ice.addColorStop(0, '#4A90B8')
    ice.addColorStop(0.3, '#7EC8E3')
    ice.addColorStop(0.7, '#4A90B8')
    ice.addColorStop(1, '#2A6B8F')
    gradCache.ice = ice

    const lava = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
    lava.addColorStop(0, '#C0392B')
    lava.addColorStop(0.3, '#FF8C42')
    lava.addColorStop(0.7, '#E55B1B')
    lava.addColorStop(1, '#922B1B')
    gradCache.lava = lava
  }
  return gradCache
}

export default function useGameLoop({
  canvasRef,
  gameState,
  setGameState,
  selectedPokemon,
  birdImgRef,
  pipeStyle,
  pipeDecoration,
  onJump,
  onScore,
  onHit,
}: UseGameLoopProps) {
  const pipeStyleRef = useRef(pipeStyle)
  useEffect(() => { pipeStyleRef.current = pipeStyle }, [pipeStyle])
  const pipeDecorationRef = useRef(pipeDecoration)
  useEffect(() => { pipeDecorationRef.current = pipeDecoration }, [pipeDecoration])
  const selectedPokemonRef = useRef(selectedPokemon)
  useEffect(() => { selectedPokemonRef.current = selectedPokemon }, [selectedPokemon])
  const gameStateRef = useRef(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  const birdRef = useRef({ y: 0, velocity: 0 })
  const pipesRef = useRef<Pipe[]>([])
  const scoreRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  const lastPipeTimeRef = useRef(0)
  const groundOffsetRef = useRef(0)
  const lastTimestampRef = useRef(0)

  const getCanvasSize = useCallback(() => {
    if (!canvasRef.current) return { w: 400, h: 600 }
    return { w: canvasRef.current.width, h: canvasRef.current.height }
  }, [canvasRef])

  const resetGame = useCallback(() => {
    const { h } = getCanvasSize()
    birdRef.current = { y: h / 2 - BIRD_SIZE / 2, velocity: 0 }
    pipesRef.current = []
    scoreRef.current = 0
    lastPipeTimeRef.current = 0
    groundOffsetRef.current = 0
    lastTimestampRef.current = 0
    gradCacheWidth = 0 // force gradient rebuild on next frame
  }, [getCanvasSize])

  const jump = useCallback(() => {
    birdRef.current.velocity = JUMP_FORCE
    onJump?.()
  }, [onJump])

  const spawnPipe = useCallback(() => {
    const { w, h } = getCanvasSize()
    const playableH = h - GROUND_HEIGHT
    const gapSizes = [PIPE_GAP_MIN, (PIPE_GAP_MIN + PIPE_GAP_MAX) / 2, PIPE_GAP_MAX]
    const gap = gapSizes[Math.floor(Math.random() * gapSizes.length)]
    const topHeight = 40 + Math.random() * (playableH - gap - 80)
    pipesRef.current.push({ x: w + 20, topHeight, gap, scored: false })
  }, [getCanvasSize])

  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(0, 0, 25, 0, Math.PI * 2)
    ctx.arc(25, -5, 20, 0, Math.PI * 2)
    ctx.arc(50, 0, 25, 0, Math.PI * 2)
    ctx.arc(15, -18, 18, 0, Math.PI * 2)
    ctx.arc(38, -15, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  const drawPipeDecor = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe, h: number) => {
    const decor = pipeDecorationRef.current || 'pokeball'
    const pattern = getPipePattern(decor)
    if (!pattern.length) return
    const playableH = h - GROUND_HEIGHT
    const bottomY = pipe.topHeight + pipe.gap
    const ICON = 48
    const SPACING = 68
    const x = pipe.x + (PIPE_WIDTH - ICON) / 2
    ctx.save()
    ctx.globalAlpha = 0.92
    let y = 4; let idx = 0
    while (y + ICON < pipe.topHeight - 30) { ctx.drawImage(pattern[idx++ % pattern.length], x, y, ICON, ICON); y += SPACING }
    y = bottomY + 34; idx = 0
    while (y + ICON < playableH) { ctx.drawImage(pattern[idx++ % pattern.length], x, y, ICON, ICON); y += SPACING }
    ctx.restore()
  }, [])

  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe, h: number, grads: typeof gradCache) => {
    const playableH = h - GROUND_HEIGHT
    const style = pipeStyleRef.current || 'classic'

    let bodyGrad: CanvasGradient | null
    let capColor: string
    let accentColor: string

    if (style === 'ice') {
      bodyGrad = grads.ice; capColor = '#3A8FB7'; accentColor = 'rgba(255,255,255,0.25)'
    } else if (style === 'lava') {
      bodyGrad = grads.lava; capColor = '#A93226'; accentColor = 'rgba(255,220,100,0.3)'
    } else {
      bodyGrad = grads.classic; capColor = '#4CA82B'; accentColor = 'rgba(255,255,255,0.2)'
    }

    if (!bodyGrad) return

    ctx.fillStyle = bodyGrad
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
    ctx.fillStyle = accentColor
    ctx.fillRect(pipe.x + 6, 0, 8, pipe.topHeight - 28)
    ctx.fillStyle = capColor
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 28, PIPE_WIDTH + 10, 28)

    const bottomY = pipe.topHeight + pipe.gap
    ctx.fillStyle = bodyGrad
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, playableH - bottomY)
    ctx.fillStyle = accentColor
    ctx.fillRect(pipe.x + 6, bottomY + 28, 8, playableH - bottomY - 28)
    ctx.fillStyle = capColor
    ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 28)

    drawPipeDecor(ctx, pipe, h)
  }, [drawPipeDecor])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gY = h - GROUND_HEIGHT
    ctx.fillStyle = '#C9A664'
    ctx.fillRect(0, gY, w, GROUND_HEIGHT)
    ctx.fillStyle = '#7EC850'
    ctx.fillRect(0, gY, w, 12)
    ctx.fillStyle = '#5EAD30'
    ctx.fillRect(0, gY + 12, w, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    const offset = Math.floor(groundOffsetRef.current) % 48
    for (let i = (offset % 48) - 48; i < w + 48; i += 48) {
      ctx.fillRect(i, gY + 20, 24, GROUND_HEIGHT - 20)
    }
  }, [])

  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: { y: number }) => {
    const img = birdImgRef.current
    const cx = 80 + BIRD_SIZE / 2
    const cy = bird.y + BIRD_SIZE / 2
    if (img && img.complete && img.naturalWidth > 0) {
      const TARGET_SIZE = 46
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight) || TARGET_SIZE
      const scale = TARGET_SIZE / maxDim
      const drawW = img.naturalWidth * scale
      const drawH = img.naturalHeight * scale
      ctx.save()
      if (selectedPokemonRef.current?.mirrored) {
        ctx.translate(cx, cy)
        ctx.scale(-1, 1)
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      } else {
        ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH)
      }
      ctx.restore()
    } else {
      ctx.fillStyle = '#F8D030'
      ctx.beginPath()
      ctx.arc(cx, cy, BIRD_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [birdImgRef])

  const drawScore = useCallback((ctx: CanvasRenderingContext2D, w: number, score: number) => {
    const text = String(score)
    ctx.font = 'bold 52px "Arial Black", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.strokeText(text, w / 2, 70)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, w / 2, 70)
  }, [])

  const drawSky = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#78D6F7'
    ctx.fillRect(0, 0, w, h)
  }, [])

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const playableH = h - GROUND_HEIGHT

    // Delta-time: normalize to 60fps so physics are frame-rate independent
    const rawDt = lastTimestampRef.current ? timestamp - lastTimestampRef.current : FRAME_MS
    lastTimestampRef.current = timestamp
    const dt = Math.min(rawDt / FRAME_MS, 2.5) // cap at 2.5x to prevent spiral of death

    const grads = getGradients(ctx, w)

    drawSky(ctx, w, h)
    drawCloud(ctx, 60, 80, 1)
    drawCloud(ctx, w - 120, 50, 0.8)

    const bird = birdRef.current

    if (gameStateRef.current === 'playing') {
      // Delta-time physics
      bird.velocity += GRAVITY * dt
      bird.y += bird.velocity * dt

      if (timestamp - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
        spawnPipe()
        lastPipeTimeRef.current = timestamp
      }

      const move = PIPE_SPEED * dt
      pipesRef.current.forEach((pipe) => { pipe.x -= move })
      pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > -10)

      pipesRef.current.forEach((pipe) => {
        if (!pipe.scored && pipe.x + PIPE_WIDTH < 80) {
          pipe.scored = true
          scoreRef.current += 1
          onScore?.()
        }
      })

      groundOffsetRef.current -= move

      if (bird.y + BIRD_SIZE > playableH || bird.y < 0) {
        onHit?.()
        setGameState('gameover')
        return
      }

      const birdBox = { x: 80 + 6, y: bird.y + 6, w: BIRD_SIZE - 12, h: BIRD_SIZE - 12 }
      for (const pipe of pipesRef.current) {
        const boxes = [
          { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.topHeight },
          { x: pipe.x, y: pipe.topHeight + pipe.gap, w: PIPE_WIDTH, h: playableH - (pipe.topHeight + pipe.gap) },
          { x: pipe.x - 5, y: pipe.topHeight - 28, w: PIPE_WIDTH + 10, h: 28 },
          { x: pipe.x - 5, y: pipe.topHeight + pipe.gap, w: PIPE_WIDTH + 10, h: 28 },
        ]
        for (const box of boxes) {
          if (
            birdBox.x < box.x + box.w &&
            birdBox.x + birdBox.w > box.x &&
            birdBox.y < box.y + box.h &&
            birdBox.y + birdBox.h > box.y
          ) {
            onHit?.()
            setGameState('gameover')
            return
          }
        }
      }
    }

    pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe, h, grads))
    drawGround(ctx, w, h)
    drawBird(ctx, bird)

    if (gameStateRef.current === 'playing') {
      drawScore(ctx, w, scoreRef.current)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [canvasRef, setGameState, spawnPipe, drawSky, drawCloud, drawPipe, drawGround, drawBird, drawScore, onScore, onHit])

  useEffect(() => {
    if (gameState === 'playing') {
      resetGame()
      animFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState, gameLoop, resetGame])

  return { jump, score: scoreRef, resetGame }
}
