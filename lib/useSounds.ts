'use client'

import { useRef, useCallback, useState } from 'react'

export default function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null)
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('flappy_muted') === 'true'
  })
  const mutedRef = useRef(muted)

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    localStorage.setItem('flappy_muted', String(next))
  }, [])

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return ctxRef.current
  }

  const playJump = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  const playScore = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getCtx();
      [0, 0.08].forEach((delay, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(i === 0 ? 880 : 1100, ctx.currentTime + delay)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + 0.12)
      })
    } catch {}
  }, [])

  const playHit = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getCtx()
      const bufferSize = ctx.sampleRate * 0.25
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
      }
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400
      source.buffer = buffer
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      source.start(ctx.currentTime)
    } catch {}
  }, [])

  const playPowerUp = useCallback(() => {
    if (mutedRef.current) return
    try {
      const ctx = getCtx();
      [0, 0.1, 0.2].forEach((delay, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440 + i * 220, ctx.currentTime + delay)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15)
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + 0.15)
      })
    } catch {}
  }, [])

  return { playJump, playScore, playHit, playPowerUp, muted, toggleMute }
}
