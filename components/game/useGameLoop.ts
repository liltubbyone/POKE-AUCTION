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
const BERRY_SIZE = 28
const BERRY_SPAWN_CHANCE = 0.22
const POWERUP_DURATION = 3500
const SPEED_BOOST_MULTIPLIER = 1.6

interface Pipe {
  x: number
  topHeight: number
  gap: number
  scored: boolean
}

interface Berry {
  x: number
  y: number
  collected: boolean
}

interface PowerUp {
  type: 'invincible' | 'speed' | null
  endTime: number
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
  onBerryCollect?: () => void
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
  onBerryCollect,
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
  const berriesRef = useRef<Berry[]>([])
  const powerUpRef = useRef<PowerUp>({ type: null, endTime: 0 })

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
    berriesRef.current = []
    powerUpRef.current = { type: null, endTime: 0 }
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
    const minTop = 40
    const maxTop = playableH - gap - 40
    const topHeight = minTop + Math.random() * (maxTop - minTop)
    const spawnX = w + 20
    pipesRef.current.push({ x: spawnX, topHeight, gap, scored: false })
    if (Math.random() < BERRY_SPAWN_CHANCE) {
      const berryY = topHeight + 20 + Math.random() * (gap - 40)
      berriesRef.current.push({ x: spawnX + PIPE_WIDTH / 2, y: berryY, collected: false })
    }
  }, [getCanvasSize])

  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(0, 0, 25, 0, Math.PI * 2)
    ctx.arc(25, -5, 20, 0, Math.PI * 2)
    ctx.arc(50, 0, 25, 0, Math.PI * 2)
    ctx.arc(15, -18, 18, 0, Math.PI * 2)
    ctx.arc(38, -15, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  const drawPokeballButton = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#D8D8D8'
    ctx.beginPath()
    ctx.arc(cx - 1.5, cy - 1.5, 2, 0, Math.PI * 2)
    ctx.fill()
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
    let y = 4
    let idx = 0
    while (y + ICON < pipe.topHeight - 30) {
      ctx.drawImage(pattern[idx % pattern.length], x, y, ICON, ICON)
      y += SPACING
      idx++
    }
    y = bottomY + 34
    idx = 0
    while (y + ICON < playableH) {
      ctx.drawImage(pattern[idx % pattern.length], x, y, ICON, ICON)
      y += SPACING
      idx++
    }
    ctx.restore()
  }, [])

  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe, h: number) => {
    const playableH = h - GROUND_HEIGHT
    const style = pipeStyleRef.current || 'classic'

    if (style === 'pokeball') {
      const redGrad = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
      redGrad.addColorStop(0, '#C02828')
      redGrad.addColorStop(0.5, '#F04040')
      redGrad.addColorStop(1, '#A01818')
      ctx.fillStyle = redGrad
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 28, PIPE_WIDTH + 10, 28)
      drawPokeballButton(ctx, pipe.x + PIPE_WIDTH / 2, pipe.topHeight - 14)
      const bottomY = pipe.topHeight + pipe.gap
      const whiteGrad = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
      whiteGrad.addColorStop(0, '#C8C8C8')
      whiteGrad.addColorStop(0.5, '#FFFFFF')
      whiteGrad.addColorStop(1, '#B0B0B0')
      ctx.fillStyle = whiteGrad
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, playableH - bottomY)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 28)
      drawPokeballButton(ctx, pipe.x + PIPE_WIDTH / 2, bottomY + 14)
      drawPipeDecor(ctx, pipe, h)
      return
    }

    let bodyGrad: CanvasGradient
    let capColor: string
    let accentColor: string

    if (style === 'ice') {
      bodyGrad = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
      bodyGrad.addColorStop(0, '#4A90B8')
      bodyGrad.addColorStop(0.3, '#7EC8E3')
      bodyGrad.addColorStop(0.7, '#4A90B8')
      bodyGrad.addColorStop(1, '#2A6B8F')
      capColor = '#3A8FB7'
      accentColor = 'rgba(255,255,255,0.25)'
    } else if (style === 'lava') {
      bodyGrad = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
      bodyGrad.addColorStop(0, '#C0392B')
      bodyGrad.addColorStop(0.3, '#FF8C42')
      bodyGrad.addColorStop(0.7, '#E55B1B')
      bodyGrad.addColorStop(1, '#922B1B')
      capColor = '#A93226'
      accentColor = 'rgba(255,220,100,0.3)'
    } else {
      bodyGrad = ctx.createLinearGradient(0, 0, PIPE_WIDTH, 0)
      bodyGrad.addColorStop(0, '#5EBD3E')
      bodyGrad.addColorStop(0.3, '#7ED957')
      bodyGrad.addColorStop(0.7, '#5EBD3E')
      bodyGrad.addColorStop(1, '#3D8B27')
      capColor = '#4CA82B'
      accentColor = 'rgba(255,255,255,0.2)'
    }

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
  }, [drawPokeballButton, drawPipeDecor])

  const drawBerry = useCallback((ctx: CanvasRenderingContext2D, berry: Berry) => {
    if (berry.collected) return
    const cx = berry.x
    const cy = berry.y
    const r = BERRY_SIZE / 2
    const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, r)
    grad.addColorStop(0, '#FF8787')
    grad.addColorStop(1, '#C92A2A')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(cx - 4, cy - 5, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#51CF66'
    ctx.beginPath()
    ctx.ellipse(cx + 3, cy - r, 4, 6, -0.5, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gY = h - GROUND_HEIGHT
    const groundGrad = ctx.createLinearGradient(0, gY, 0, h)
    groundGrad.addColorStop(0, '#DEB887')
    groundGrad.addColorStop(0.15, '#C9A664')
    groundGrad.addColorStop(1, '#8B7355')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, gY, w, GROUND_HEIGHT)
    ctx.fillStyle = '#7EC850'
    ctx.fillRect(0, gY, w, 12)
    ctx.fillStyle = '#5EAD30'
    ctx.fillRect(0, gY + 12, w, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    const offset = groundOffsetRef.current % 48
    for (let i = -48 + offset; i < w + 48; i += 48) {
      ctx.fillRect(i, gY + 20, 24, GROUND_HEIGHT - 20)
    }
  }, [])

  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: { y: number; velocity: number }) => {
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

  const drawPowerUpIndicator = useCallback((
    ctx: CanvasRenderingContext2D,
    bird: { y: number; velocity: number },
    timestamp: number
  ) => {
    const pu = powerUpRef.current
    if (!pu.type || timestamp >= pu.endTime) return
    const cx = 80 + BIRD_SIZE / 2
    const cy = bird.y + BIRD_SIZE / 2
    if (pu.type === 'invincible') {
      ctx.save()
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + 0.3 * Math.sin(timestamp / 80)})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, BIRD_SIZE / 2 + 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'
      for (let i = 0; i < 6; i++) {
        const angle = timestamp / 200 + i * Math.PI / 3
        const r = BIRD_SIZE / 2 + 14
        ctx.beginPath()
        ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    } else if (pu.type === 'speed') {
      ctx.save()
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 + 0.3 * Math.sin(timestamp / 60)})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, BIRD_SIZE / 2 + 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
      ctx.lineWidth = 2
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(cx - BIRD_SIZE / 2 - i * 10, cy - 10 + i * 10)
        ctx.lineTo(cx - BIRD_SIZE / 2 - 16 - i * 10, cy - 10 + i * 10)
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [])

  const drawSky = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h - GROUND_HEIGHT)
    grad.addColorStop(0, '#4DC9F6')
    grad.addColorStop(0.5, '#78D6F7')
    grad.addColorStop(1, '#B8E8FC')
    ctx.fillStyle = grad
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

    drawSky(ctx, w, h)
    drawCloud(ctx, 60, 80, 1)
    drawCloud(ctx, w - 120, 50, 0.8)

    const bird = birdRef.current

    if (gameStateRef.current === 'playing') {
      const pu = powerUpRef.current
      const isPowerActive = pu.type && timestamp < pu.endTime
      if (pu.type && !isPowerActive) {
        powerUpRef.current = { type: null, endTime: 0 }
      }
      const isInvincible = isPowerActive && pu.type === 'invincible'
      const isSpeedBoost = isPowerActive && pu.type === 'speed'
      const currentSpeed = isSpeedBoost ? PIPE_SPEED * SPEED_BOOST_MULTIPLIER : PIPE_SPEED

      bird.velocity += GRAVITY
      bird.y += bird.velocity

      if (timestamp - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
        spawnPipe()
        lastPipeTimeRef.current = timestamp
      }

      pipesRef.current.forEach((pipe) => { pipe.x -= currentSpeed })
      berriesRef.current.forEach((berry) => { berry.x -= currentSpeed })
      pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > -10)
      berriesRef.current = berriesRef.current.filter((b) => !b.collected && b.x > -BERRY_SIZE)

      pipesRef.current.forEach((pipe) => {
        if (!pipe.scored && pipe.x + PIPE_WIDTH < 80) {
          pipe.scored = true
          scoreRef.current += 1
          onScore?.()
        }
      })

      const birdCx = 80 + BIRD_SIZE / 2
      const birdCy = bird.y + BIRD_SIZE / 2
      berriesRef.current.forEach((berry) => {
        if (berry.collected) return
        const dx = birdCx - berry.x
        const dy = birdCy - berry.y
        if (Math.abs(dx) < BIRD_SIZE / 2 + BERRY_SIZE / 2 && Math.abs(dy) < BIRD_SIZE / 2 + BERRY_SIZE / 2) {
          berry.collected = true
          const effect = Math.random() < 0.5 ? 'speed' : 'invincible'
          powerUpRef.current = { type: effect as 'speed' | 'invincible', endTime: timestamp + POWERUP_DURATION }
          onBerryCollect?.()
        }
      })

      groundOffsetRef.current -= currentSpeed

      if (bird.y + BIRD_SIZE > playableH || bird.y < 0) {
        onHit?.()
        setGameState('gameover')
        return
      }

      if (!isInvincible) {
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
    }

    pipesRef.current.forEach((pipe) => {
      const alpha = Math.min(1, Math.max(0, (w + 20 - pipe.x) / 60))
      ctx.save()
      ctx.globalAlpha = alpha
      drawPipe(ctx, pipe, h)
      ctx.restore()
    })

    berriesRef.current.forEach((berry) => drawBerry(ctx, berry))
    drawGround(ctx, w, h)
    drawBird(ctx, bird)

    if (gameStateRef.current === 'playing') {
      drawPowerUpIndicator(ctx, bird, timestamp)
      drawScore(ctx, w, scoreRef.current)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [canvasRef, setGameState, spawnPipe, drawSky, drawCloud, drawPipe, drawGround, drawBird, drawScore, drawBerry, drawPowerUpIndicator, onScore, onHit, onBerryCollect])

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

  return { jump, score: scoreRef, resetGame, powerUp: powerUpRef }
}
