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

function canPlaceWord(grid: string[][], word: string, row: number, col: number, dx: number, dy: number): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + dx * i
    const c = col + dy * i
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false
    if (grid[r][c] && grid[r][c] !== word[i]) return false
  }
  return true
}

function placeWord(grid: string[][], word: string, row: number, col: number, dx: number, dy: number): string[] {
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

function PokemonMascot({ id }: { id: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getPokemonImageUrl(id)}
      alt=""
      aria-hidden="true"
      className="pointer-events-none select-none object-contain h-24 w-24"
      style={{
        animation: 'float 4.5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 16px rgba(0,229,255,0.55))',
      }}
    />
  )
}

export default function WordSearch() {
  const { data: session } = useSession()
  const [pokemonNames, setPokemonNames] = useState<string[]>(FALLBACK_WORDS)
  const [selectedCells, setSelectedCells] = useState<string[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [message, setMessage] = useState("Find today's hidden Pokemon.")
  const [completionSent, setCompletionSent] = useState(false)
  const [bonusSpin, setBonusSpin] = useState<boolean | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
      .then((r) => r.json())
      .then((data) => {
        const names = data.results.map((item: { name: string }) => item.name.replace(/-/g, ' '))
        if (isMounted && names.length >= 1025) setPokemonNames(names)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

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
      prev.includes(cellKey) ? prev.filter((c) => c !== cellKey) : [...prev, cellKey],
    )
  }

  const checkWord = () => {
    const match = puzzle.words.find(
      (e) => e.word === selectedWord || e.word === reverseSelectedWord,
    )
    if (!match) {
      setMessage('Not a match. Try another path.')
      setSelectedCells([])
      return
    }
    if (foundWords.includes(match.word)) {
      setMessage(`${match.word} was already found.`)
      setSelectedCells([])
      return
    }
    const next = [...foundWords, match.word]
    setFoundWords(next)
    setMessage(`Found ${match.word}!`)
    setSelectedCells([])

    if (next.length === puzzle.words.length && !completionSent && session?.user) {
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
    <div
      className="rounded-[2rem] p-4 md:p-6 relative overflow-hidden"
      style={{
        border: '1px solid rgba(0,229,255,0.35)',
        background: 'rgba(7,19,41,0.90)',
        boxShadow: '0 0 42px rgba(0,229,255,0.12), inset 0 0 28px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Subtle inner glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[2rem]"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-5">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#38bdf8' }}
          >
            Free Daily Game
          </p>
          <h2
            className="text-3xl md:text-4xl font-heading uppercase tracking-wide"
            style={{ color: '#fde047', textShadow: '0 4px 0 rgba(0,84,178,0.7)', WebkitTextStroke: '1px #0b55ac' }}
          >
            Pokemon Word Search
          </h2>
          <p className="text-slate-500 text-xs mt-2">
            Find all hidden Pokemon to earn a free bonus spin — resets at midnight Central
          </p>
          {!session?.user && (
            <p className="text-slate-500 text-xs mt-1">
              <Link href="/auth/login" className="font-bold" style={{ color: '#a78bfa' }}>Sign in</Link>
              {' '}to claim your bonus spin reward
            </p>
          )}
        </div>

        {/* 3-col on xl: pokemon | game | pokemon */}
        <div
          className="hidden xl:grid gap-4"
          style={{ gridTemplateColumns: '120px minmax(0,1fr) 120px' }}
        >
          <aside className="flex flex-col items-center justify-around py-4">
            {SHOWCASE_POKEMON.slice(0, 4).map((id) => (
              <PokemonMascot key={id} id={id} />
            ))}
          </aside>
          <GameGrid
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
          <aside className="flex flex-col items-center justify-around py-4">
            {SHOWCASE_POKEMON.slice(4, 8).map((id) => (
              <PokemonMascot key={id} id={id} />
            ))}
          </aside>
        </div>

        {/* Compact on smaller screens */}
        <div className="xl:hidden">
          <GameGrid
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
      </div>
    </div>
  )
}

// ── GameGrid ──────────────────────────────────────────────────────────────────

interface GameGridProps {
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

function GameGrid({
  puzzle, selectedCells, foundWords, message,
  allFound, alreadyCompleted, bonusSpin, isLoggedIn,
  onToggleCell, onCheckWord, onClearSelection,
}: GameGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">

      {/* Grid section */}
      <div
        className="rounded-[1.5rem] p-3 md:p-4"
        style={{
          border: '1px solid rgba(0,229,255,0.22)',
          background: 'rgba(0,0,0,0.25)',
          boxShadow: 'inset 0 0 20px rgba(0,229,255,0.06)',
        }}
      >
        <div
          className="select-none"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 3 }}
        >
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`
              const isSelected = selectedCells.includes(key)
              const isFound = puzzle.words.some(
                (e) => foundWords.includes(e.word) && e.cells.includes(key),
              )
              let bg = '#07152c', border = 'rgba(0,229,255,0.13)', color = '#fff', shadow = 'none'
              if (isFound)    { bg = '#fde047'; border = '#fde047'; color = '#000'; shadow = '0 0 10px rgba(253,224,71,0.6)' }
              if (isSelected) { bg = '#38bdf8'; border = '#e0f2fe'; color = '#000'; shadow = '0 0 10px rgba(56,189,248,0.6)' }
              return (
                <button
                  key={key}
                  onClick={() => onToggleCell(key)}
                  className="aspect-square rounded-md text-[10px] font-black transition-all active:scale-90 md:text-sm"
                  style={{ minHeight: 26, background: bg, border: `1px solid ${border}`, color, boxShadow: shadow }}
                  aria-label={`${r + 1},${c + 1} ${letter}`}
                >
                  {letter}
                </button>
              )
            }),
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={onCheckWord}
            className="min-h-12 rounded-2xl px-4 text-base font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.98]"
            style={{
              border: '1px solid rgba(56,189,248,0.5)',
              background: 'linear-gradient(180deg,#38bdf8,#1e40af)',
              boxShadow: '0 0 20px rgba(56,189,248,0.28)',
            }}
          >
            Check Word
          </button>
          <button
            onClick={onClearSelection}
            className="min-h-12 rounded-2xl px-4 text-base font-black uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.98]"
            style={{
              border: '1px solid rgba(168,85,247,0.45)',
              background: 'linear-gradient(180deg,#a855f7,#581c87)',
              boxShadow: '0 0 20px rgba(168,85,247,0.25)',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className="space-y-3 rounded-[1.5rem] p-4"
        style={{
          border: '1px solid rgba(168,85,247,0.25)',
          background: 'rgba(0,0,0,0.28)',
        }}
      >
        {/* Progress */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(17,22,51,0.9)' }}
        >
          <p className="text-3xl font-black" style={{ color: '#38bdf8' }}>
            {foundWords.length}/{puzzle.words.length}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Words Found
          </p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${puzzle.words.length > 0 ? (foundWords.length / puzzle.words.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg,#38bdf8,#a78bfa)',
              }}
            />
          </div>
        </div>

        {/* Word bank */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#38bdf8' }}>Word Bank</p>
          <div
            className="grid max-h-[280px] gap-1.5 overflow-auto rounded-xl p-2.5"
            style={{ border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(17,22,51,0.9)' }}
          >
            {puzzle.words.map((entry) => {
              const found = foundWords.includes(entry.word)
              return (
                <div
                  key={entry.word}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-black uppercase tracking-wide"
                  style={
                    found
                      ? { border: '1px solid rgba(253,224,71,0.5)', background: '#fde047', color: '#000' }
                      : { border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.8)' }
                  }
                >
                  {found ? '✓ ' : ''}{entry.word}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mission log */}
        <div
          className="rounded-xl p-3 text-sm font-bold"
          style={{
            border: '1px solid rgba(168,85,247,0.2)',
            background: 'rgba(17,22,51,0.9)',
            color: 'rgba(255,255,255,0.75)',
            minHeight: 44,
          }}
        >
          {message}
        </div>

        {/* Completion banner */}
        {(allFound || alreadyCompleted) && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: 'linear-gradient(135deg,#fde047,#fb7185 55%,#a855f7)',
              boxShadow: '0 0 28px rgba(253,224,71,0.4)',
              color: '#000',
            }}
          >
            <p className="text-2xl mb-0.5">{alreadyCompleted && !allFound ? '✓' : '🏆'}</p>
            <p className="font-black text-lg">
              {alreadyCompleted && !allFound ? 'Already Done!' : 'Cosmic Clear!'}
            </p>
            {isLoggedIn ? (
              <>
                {bonusSpin === true && (
                  <p className="text-xs font-bold mt-1">You earned a free bonus spin!</p>
                )}
                {(bonusSpin === false || alreadyCompleted) && (
                  <p className="text-xs font-bold mt-1">Bonus spin already used today.</p>
                )}
                <Link
                  href="/daily-spin"
                  className="mt-2 inline-block rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider active:scale-95"
                  style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                  Go to Daily Spin
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs font-bold mt-1">Sign in to claim your free spin!</p>
                <Link
                  href="/auth/login"
                  className="mt-2 inline-block rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider active:scale-95"
                  style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                  Sign In
                </Link>
              </>
            )}
            {!alreadyCompleted && (
              <p className="text-[10px] opacity-60 font-bold mt-2">New puzzle tomorrow at midnight CT</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
