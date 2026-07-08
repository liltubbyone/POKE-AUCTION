'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import POKEMON, { TYPE_COLORS, Pokemon } from '@/lib/pokemonData'

export default function CharacterSelect({ onSelect }: { onSelect: (p: Pokemon) => void }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      <motion.h1
        className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-1 tracking-tight"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ textShadow: '3px 3px 0 #3D8B27, -1px -1px 0 #3D8B27' }}
      >
        Poke Flap
      </motion.h1>
      <motion.p
        className="text-white/80 text-sm mb-5 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Choose your Pokémon!
      </motion.p>

      <motion.div
        className="grid grid-cols-5 gap-2 w-full max-h-[400px] overflow-y-auto p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {POKEMON.map((p, i) => {
          const typeColor = TYPE_COLORS[p.type] || '#A8A878'
          return (
            <motion.button
              key={p.name}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex flex-col items-center p-1.5 rounded-xl transition-all cursor-pointer relative group"
              style={{
                background: hoveredIdx === i ? `${typeColor}40` : 'rgba(255,255,255,0.08)',
                border: hoveredIdx === i ? `2px solid ${typeColor}` : '2px solid transparent',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.img}
                alt={p.name}
                className={`w-10 h-10 object-contain drop-shadow-md${p.mirrored ? ' scale-x-[-1]' : ''}`}
                loading="lazy"
              />
              <span className="text-[9px] text-white/90 font-semibold mt-0.5 truncate w-full text-center leading-tight">
                {p.name}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      <motion.p
        className="text-white/50 text-xs mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Tap or click a Pokémon to start
      </motion.p>
    </div>
  )
}
