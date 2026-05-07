'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const GRID_SIZE = 14
const MIN_WORDS = 7
const MAX_WORDS = 10

const SHOWCASE_POKEMON = [25, 133, 150, 6, 7, 1, 143, 39]

const FALLBACK_WORDS = [
  'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon',
  'Charizard', 'Squirtle', 'Wartortle', 'Blastoise', 'Pikachu',
  'Raichu', 'Eevee', 'Snorlax', 'Mewtwo', 'Mew',
  'Lucario', 'Greninja', 'Gengar', 'Dragonite', 'Garchomp',
  'Rayquaza', 'Arceus', 'Zacian', 'Miraidon',
]

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
]

function getPokemonImageUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function todayCentral(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')!.value
  const m = parts.find((p) => p.type === 'month')!.value
  const d = parts.find((p) => p.type === 'day')!.value
  return `${y}-${m}-${d}`
}

function getDailySeed(): number {
  const key = todayCentral()
  let seed = 0
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0
  return seed
}

function seededRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function shuffleWithRandom<T>(array: T[], random: () => number): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeWord(word: string): string {
  return word.replace(/[^a-zA-Z]/g, '').toUpperCase()
}

function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dx: number,
  dy: number,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + dx * i
    const c = col + dy * i
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false
    if (grid[r][c] && grid[r][c] !== word[i]) return false
  }
  return true
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dx: number,
  dy: number,
): string[] {
  const cells: string[] = []
  for (let i = 0; i < word.length; i++) {
    const r = row + dx * i
    const c = col + dy * i
    grid[r][c] = word[i]
    cells.push(`${r}-${c}`)
  }
  return cells
}

function generatePuzzle(words: string[], seed: number) {
  const random = seededRandom(seed)
  const cleanedWords = words
    .map(normalizeWord)
    .filter((word) => word.length >= 3 && word.length <= GRID_SIZE)

  const wordCount = MIN_WORDS + Math.floor(random() * (MAX_WORDS - MIN_WORDS + 1))
  const selectedWords = shuffleWithRandom(cleanedWords, random).slice(0, wordCount)
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))
  const placed: { word: string; cells: string[] }[] = []

  for (const word of selectedWords) {
    let placedWord = false
    const directions = shuffleWithRandom(DIRECTIONS, random)

    for (let attempt = 0; attempt < 160 && !placedWord; attempt++) {
      const [dx, dy] = directions[Math.floor(random() * directions.length)]
      const row = Math.floor(random() * GRID_SIZE)
      const col = Math.floor(random() * GRID_SIZE)

      if (canPlaceWord(grid, word, row, col, dx, dy)) {
        const cells = placeWord(grid, word, row, col, dx, dy)
        placed.push({ word, cells })
        placedWord = true
      }
    }
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(random() * alphabet.length)]
    }
  }

  return { grid, words: placed }
}

function PokemonMascot({ id, className = '' }: { id: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getPokemonImageUrl(id)}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none object-contain ${className}`}
      style={{
        animation: 'float 4.5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.6))',
      }}
    />
  )
}

export default function WordSearchPage() {
  const { data: session } = useSession()
  const [pokemonNames, setPokemonNames] = useState<string[]>(FALLBACK_WORDS)
  const [selectedCells, setSelectedCells] = useState<string[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [message, setMessage] = useState("Find today's hidden cosmic Pokemon.")
  const [muted, setMuted] = useState(false)
  const [completionSent, setCompletionSent] = useState(false)
  const [bonusSpin, setBonusSpin] = useState<boolean | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  // Load full Pokemon name list from PokeAPI
  useEffect(() => {
    let isMounted = true
    async function loadPokemonNames() {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
        const data = await response.json()
        const names = data.results.map((item: { name: string }) =>
          item.name.replace(/-/g, ' '),
        )
        if (isMounted && names.length >= 1025) setPokemonNames(names)
      } catch {
        console.warn('Using fallback Pokemon word bank.')
      }
    }
    loadPokemonNames()
    return () => {
      isMounted = false
    }
  }, [])

  // Check if user already completed today's puzzle
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/word-search/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.completedToday) {
          setAlreadyCompleted(true)
          setCompletionSent(true)
        }
      })
      .catch(() => {})
  }, [session])

  const puzzle = useMemo(() => generatePuzzle(pokemonNames, getDailySeed()), [pokemonNames])

  const selectedWord = selectedCells
    .map((cell) => {
      const [r, c] = cell.split('-').map(Number)
      return puzzle.grid[r][c]
    })
    .join('')

  const reverseSelectedWord = selectedWord.split('').reverse().join('')

  const toggleCell = (cellKey: string) => {
    setSelectedCells((prev) =>
      prev.includes(cellKey) ? prev.filter((cell) => cell !== cellKey) : [...prev, cellKey],
    )
  }

  const checkWord = () => {
    const match = puzzle.words.find(
      (entry) => entry.word === selectedWord || entry.word === reverseSelectedWord,
    )

    if (!match) {
      setMessage('Not a match yet. Try another cosmic path.')
      setSelectedCells([])
      return
    }

    if (foundWords.includes(match.word)) {
      setMessage(`${match.word} was already found.`)
      setSelectedCells([])
      return
    }

    const newFoundWords = [...foundWords, match.word]
    setFoundWords(newFoundWords)
    setMessage(`Found ${match.word}!`)
    setSelectedCells([])

    // Send completion when all words are found
    if (newFoundWords.length === puzzle.words.length && !completionSent && session?.user) {
      setCompletionSent(true)
      fetch('/api/word-search/complete', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => setBonusSpin(d.bonusSpin ?? false))
        .catch(() => setBonusSpin(false))
    }
  }

  const clearSelection = () => {
    setSelectedCells([])
    setMessage('Selection cleared.')
  }

  const allFound = foundWords.length === puzzle.words.length && puzzle.words.length > 0

  return (
    <div className="min-h-screen overflow-hidden relative text-white" style={{ background: '#020617' }}>
      {/* Galactic nebula background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(255,78,167,0.15) 0%, transparent 32%),' +
            'radial-gradient(circle at 82% 14%, rgba(0,229,255,0.10) 0%, transparent 28%),' +
            'radial-gradient(circle at 72% 82%, rgba(124,58,237,0.13) 0%, transparent 28%),' +
            'radial-gradient(ellipse 80% 45% at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 60%)',
        }}
      />
      {/* Star field */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1420px] px-4 py-5 md:px-6 md:py-8">

        {/* Top utility bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div
            className="rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide"
            style={{
              border: '1px solid rgba(0,229,255,0.35)',
              background: 'rgba(17,26,68,0.8)',
              boxShadow: '0 0 18px rgba(0,229,255,0.12)',
            }}
          >
            Daily Puzzle
          </div>
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl px-4 py-2 text-center"
              style={{
                border: '1px solid rgba(0,229,255,0.2)',
                background: 'rgba(13,19,36,0.85)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>Found</p>
              <p className="text-xl font-black" style={{ color: '#38bdf8' }}>
                {foundWords.length}/{puzzle.words.length}
              </p>
            </div>
            <button
              onClick={() => setMuted((prev) => !prev)}
              className="min-h-11 min-w-11 rounded-xl text-xl transition active:scale-95"
              style={{
                border: '1px solid rgba(0,229,255,0.35)',
                background: 'rgba(23,32,101,0.8)',
                boxShadow: '0 0 14px rgba(0,229,255,0.12)',
              }}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="relative mb-5 text-center">
          <div className="mx-auto max-w-4xl">
            <h1
              className="text-5xl font-black uppercase leading-none tracking-tight md:text-8xl"
              style={{
                color: '#fde047',
                textShadow: '0 6px 0 rgba(0,84,178,0.85)',
                WebkitTextStroke: '2px #0b55ac',
              }}
            >
              Pokemon
            </h1>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span
                className="hidden h-px w-20 md:block"
                style={{ background: 'rgba(0,229,255,0.55)' }}
              />
              <h2
                className="text-3xl font-black uppercase tracking-[0.22em] md:text-5xl"
                style={{ color: '#ffffff', textShadow: '0 0 20px rgba(0,229,255,0.75)' }}
              >
                Word Search
              </h2>
              <span
                className="hidden h-px w-20 md:block"
                style={{ background: 'rgba(0,229,255,0.55)' }}
              />
            </div>
            <p
              className="mx-auto mt-3 w-fit rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-white/90 md:text-sm"
              style={{
                border: '1px solid rgba(255,46,136,0.45)',
                background: 'rgba(0,0,0,0.45)',
                boxShadow: '0 0 16px rgba(255,46,136,0.22)',
              }}
            >
              A new 7-10 Pokemon puzzle every day - resets at midnight Central
            </p>
            {!session?.user && (
              <p className="mt-3 text-sm" style={{ color: '#94a3b8' }}>
                <Link href="/auth/login" className="font-bold" style={{ color: '#a78bfa' }}>
                  Sign in
                </Link>{' '}
                to earn a free bonus spin on the mystery wheel for completing the puzzle!
              </p>
            )}
          </div>
        </header>

        {/* 3-column layout: Pokémon | Game | Pokémon (only on xl) */}
        <div
          className="hidden xl:grid gap-5"
          style={{ gridTemplateColumns: '150px minmax(0, 1fr) 150px' }}
        >
          {/* Left Pokémon showcase */}
          <aside
            className="flex flex-col items-center justify-between py-5 rounded-[2rem]"
            style={{
              border: '1px solid rgba(0,229,255,0.07)',
              background: 'rgba(0,0,0,0.07)',
            }}
          >
            {SHOWCASE_POKEMON.slice(0, 4).map((id, i) => (
              <PokemonMascot
                key={id}
                id={id}
                className="h-28 w-28"
              />
            ))}
          </aside>

          {/* Main game panel */}
          <GamePanel
            puzzle={puzzle}
            selectedCells={selectedCells}
            foundWords={foundWords}
            message={message}
            allFound={allFound}
            alreadyCompleted={alreadyCompleted}
            bonusSpin={bonusSpin}
            isLoggedIn={!!session?.user}
            onToggleCell={toggleCell}
            onCheckWord={checkWord}
            onClearSelection={clearSelection}
          />

          {/* Right Pokémon showcase */}
          <aside
            className="flex flex-col items-center justify-between py-5 rounded-[2rem]"
            style={{
              border: '1px solid rgba(0,229,255,0.07)',
              background: 'rgba(0,0,0,0.07)',
            }}
          >
            {SHOWCASE_POKEMON.slice(4, 8).map((id) => (
              <PokemonMascot key={id} id={id} className="h-28 w-28" />
            ))}
          </aside>
        </div>

        {/* Mobile / tablet layout */}
        <div className="xl:hidden">
          <GamePanel
            puzzle={puzzle}
            selectedCells={selectedCells}
            foundWords={foundWords}
            message={message}
            allFound={allFound}
            alreadyCompleted={alreadyCompleted}
            bonusSpin={bonusSpin}
            isLoggedIn={!!session?.user}
            onToggleCell={toggleCell}
            onCheckWord={checkWord}
            onClearSelection={clearSelection}
          />
        </div>

        <footer
          className="mx-auto mt-5 w-fit rounded-2xl px-8 py-3 text-center text-sm font-black uppercase tracking-[0.35em]"
          style={{
            border: '1px solid rgba(168,85,247,0.35)',
            background: 'rgba(0,0,0,0.38)',
            color: '#38bdf8',
            boxShadow: '0 0 18px rgba(168,85,247,0.2)',
          }}
        >
          Explore. Search. Discover.
        </footer>
      </div>
    </div>
  )
}

// ── GamePanel ────────────────────────────────────────────────────────────────

interface GamePanelProps {
  puzzle: { grid: string[][]; words: { word: string; cells: string[] }[] }
  selectedCells: string[]
  foundWords: string[]
  message: string
  allFound: boolean
  alreadyCompleted: boolean
  bonusSpin: boolean | null
  isLoggedIn: boolean
  onToggleCell: (key: string) => void
  onCheckWord: () => void
  onClearSelection: () => void
}

function GamePanel({
  puzzle,
  selectedCells,
  foundWords,
  message,
  allFound,
  alreadyCompleted,
  bonusSpin,
  isLoggedIn,
  onToggleCell,
  onCheckWord,
  onClearSelection,
}: GamePanelProps) {
  return (
    <main
      className="rounded-[2rem] p-4 md:p-5"
      style={{
        border: '1px solid rgba(0,229,255,0.45)',
        background: 'rgba(7,19,41,0.88)',
        boxShadow:
          '0 0 42px rgba(0,229,255,0.18), inset 0 0 28px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

        {/* Word grid */}
        <section
          className="rounded-[1.5rem] p-3 md:p-4"
          style={{
            border: '1px solid rgba(0,229,255,0.3)',
            background: 'rgba(0,0,0,0.28)',
            boxShadow: 'inset 0 0 24px rgba(0,229,255,0.08)',
          }}
        >
          {/* 14×14 grid */}
          <div
            className="select-none"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
              gap: '4px',
            }}
          >
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => {
                const cellKey = `${r}-${c}`
                const isSelected = selectedCells.includes(cellKey)
                const isFound = puzzle.words.some(
                  (entry) =>
                    foundWords.includes(entry.word) && entry.cells.includes(cellKey),
                )

                let bgColor = '#07152c'
                let borderColor = 'rgba(0,229,255,0.15)'
                let textColor = '#ffffff'
                let boxShadow = 'inset 0 0 8px rgba(0,0,0,0.5)'

                if (isFound) {
                  bgColor = '#fde047'
                  borderColor = '#fde047'
                  textColor = '#000000'
                  boxShadow = '0 0 14px rgba(253,224,71,0.7)'
                } else if (isSelected) {
                  bgColor = '#38bdf8'
                  borderColor = '#e0f2fe'
                  textColor = '#000000'
                  boxShadow = '0 0 14px rgba(56,189,248,0.7)'
                }

                return (
                  <button
                    key={cellKey}
                    onClick={() => onToggleCell(cellKey)}
                    className="aspect-square rounded-md text-xs font-black transition-all active:scale-90 md:rounded-lg md:text-base"
                    style={{
                      minHeight: 28,
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                      boxShadow,
                    }}
                    aria-label={`Row ${r + 1}, column ${c + 1}, letter ${letter}`}
                  >
                    {letter}
                  </button>
                )
              }),
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={onCheckWord}
              className="min-h-14 rounded-2xl px-6 text-lg font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.98]"
              style={{
                border: '1px solid rgba(0,229,255,0.6)',
                background: 'linear-gradient(180deg, #38bdf8 0%, #1e40af 100%)',
                boxShadow: '0 0 24px rgba(56,189,248,0.35)',
              }}
            >
              Check Word
            </button>
            <button
              onClick={onClearSelection}
              className="min-h-14 rounded-2xl px-6 text-lg font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.98]"
              style={{
                border: '1px solid rgba(168,85,247,0.5)',
                background: 'linear-gradient(180deg, #a855f7 0%, #581c87 100%)',
                boxShadow: '0 0 24px rgba(168,85,247,0.32)',
              }}
            >
              Clear Selection
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside
          className="space-y-4 rounded-[1.5rem] p-4"
          style={{
            border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(0,0,0,0.32)',
            boxShadow: 'inset 0 0 20px rgba(168,85,247,0.08)',
          }}
        >
          {/* Progress */}
          <section>
            <h3
              className="mb-3 text-center text-lg font-black uppercase tracking-widest"
              style={{ color: '#38bdf8' }}
            >
              Progress
            </h3>
            <div
              className="rounded-2xl p-4 text-center"
              style={{
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(17,22,51,0.9)',
              }}
            >
              <p className="text-4xl font-black" style={{ color: '#38bdf8' }}>
                {foundWords.length}/{puzzle.words.length}
              </p>
              <p
                className="mt-1 text-xs font-black uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Words Found
              </p>
              {/* Progress bar */}
              <div
                className="mt-3 h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${puzzle.words.length > 0 ? (foundWords.length / puzzle.words.length) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
                    boxShadow: '0 0 8px rgba(56,189,248,0.5)',
                  }}
                />
              </div>
            </div>
          </section>

          {/* Word bank */}
          <section>
            <h3
              className="mb-3 text-center text-lg font-black uppercase tracking-widest"
              style={{ color: '#38bdf8' }}
            >
              Word Bank
            </h3>
            <div
              className="grid max-h-[340px] gap-2 overflow-auto rounded-2xl p-3"
              style={{
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(17,22,51,0.9)',
              }}
            >
              {puzzle.words.map((entry) => {
                const found = foundWords.includes(entry.word)
                return (
                  <div
                    key={entry.word}
                    className="rounded-xl px-3 py-2 text-sm font-black uppercase tracking-wide transition-all"
                    style={
                      found
                        ? {
                            border: '1px solid rgba(253,224,71,0.6)',
                            background: '#fde047',
                            color: '#000000',
                            boxShadow: '0 0 10px rgba(253,224,71,0.45)',
                          }
                        : {
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(0,0,0,0.18)',
                            color: 'rgba(255,255,255,0.85)',
                          }
                    }
                  >
                    {found ? '✓ ' : ''}
                    {entry.word}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Mission log */}
          <section>
            <h3
              className="mb-3 text-center text-lg font-black uppercase tracking-widest"
              style={{ color: '#38bdf8' }}
            >
              Mission Log
            </h3>
            <div
              className="rounded-2xl p-4 text-sm font-bold"
              style={{
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(17,22,51,0.9)',
                color: 'rgba(255,255,255,0.85)',
                minHeight: 52,
              }}
            >
              {message}
            </div>
          </section>

          {/* Completion banner */}
          {(allFound || alreadyCompleted) && (
            <div
              className="rounded-3xl p-5 text-center"
              style={{
                background: 'linear-gradient(135deg, #fde047 0%, #fb7185 60%, #a855f7 100%)',
                boxShadow: '0 0 32px rgba(253,224,71,0.45)',
                color: '#000',
              }}
            >
              <p className="text-3xl mb-1">
                {alreadyCompleted && !allFound ? '✓' : '🏆'}
              </p>
              <h3 className="text-xl font-black">
                {alreadyCompleted && !allFound ? 'Already Completed!' : 'Cosmic Clear!'}
              </h3>

              {isLoggedIn ? (
                <>
                  {bonusSpin === true && (
                    <p className="mt-1 font-bold text-sm">
                      You earned a free bonus spin on the Mystery Wheel!
                    </p>
                  )}
                  {(bonusSpin === false || alreadyCompleted) && (
                    <p className="mt-1 font-bold text-sm">
                      Your bonus spin has already been used today.
                    </p>
                  )}
                  {bonusSpin === null && !alreadyCompleted && (
                    <p className="mt-1 font-bold text-sm opacity-70">Saving your reward...</p>
                  )}
                  <Link
                    href="/daily-spin"
                    className="mt-3 inline-block rounded-xl px-5 py-2 text-sm font-black uppercase tracking-wider transition active:scale-95"
                    style={{ background: 'rgba(0,0,0,0.18)', color: '#000' }}
                  >
                    Go to Daily Spin
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 font-bold text-sm">
                    Sign in to earn a free bonus spin!
                  </p>
                  <Link
                    href="/auth/login"
                    className="mt-3 inline-block rounded-xl px-5 py-2 text-sm font-black uppercase tracking-wider transition active:scale-95"
                    style={{ background: 'rgba(0,0,0,0.18)', color: '#000' }}
                  >
                    Sign In
                  </Link>
                </>
              )}

              {!alreadyCompleted && (
                <p className="mt-3 text-xs opacity-70 font-bold">
                  Come back tomorrow for a new Pokemon puzzle.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
