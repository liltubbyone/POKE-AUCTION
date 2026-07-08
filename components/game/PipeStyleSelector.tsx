'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette } from 'lucide-react'
import { PIPE_STYLES, getPipeStyle } from '@/lib/pipeStyles'

export default function PipeStyleSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = getPipeStyle(value)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors flex items-center gap-1"
        title="Pipe style"
      >
        <Palette className="w-4 h-4" />
        <span className="flex gap-0.5 mr-1">
          {current.swatch.map((c, i) => (
            <span key={i} className="w-2 h-2 rounded-full border border-white/40" style={{ background: c }} />
          ))}
        </span>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 pb-1">Pipe Style</p>
              <div className="space-y-0.5">
                {PIPE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => { onChange(style.id); setOpen(false) }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                      value === style.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {style.swatch.map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-slate-300" style={{ background: c }} />
                      ))}
                    </span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs font-bold text-slate-800">{style.label}</span>
                      <span className="text-[9px] text-slate-400">{style.description}</span>
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
