'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sticker } from 'lucide-react'
import { PIPE_DECORATIONS, getPipeDecoration } from '@/lib/pipeDecorations'

export default function PipeDecorationSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = getPipeDecoration(value)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors flex items-center gap-1"
        title="Pipe decoration"
      >
        <Sticker className="w-4 h-4" />
        <span className="text-xs font-bold mr-1">{current.icon}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
            <motion.div
              className="absolute top-9 left-0 z-40 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/40 p-2 w-44"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 pb-1">Pipe Decoration</p>
              <div className="space-y-0.5">
                {PIPE_DECORATIONS.map((dec) => (
                  <button
                    key={dec.id}
                    onClick={() => { onChange(dec.id); setOpen(false) }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                      value === dec.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{dec.icon}</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs font-bold text-slate-800">{dec.label}</span>
                      <span className="text-[9px] text-slate-400">{dec.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
