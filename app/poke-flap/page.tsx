'use client'

import { useState } from 'react'
import CharacterSelect from '@/components/game/CharacterSelect'
import GameCanvas from '@/components/game/GameCanvas'
import { Pokemon } from '@/lib/pokemonData'

export default function PokeFlapPage() {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #0d1b2a 50%, #0a2d1f 100%)',
      }}
    >
      {!selectedPokemon ? (
        <CharacterSelect onSelect={setSelectedPokemon} />
      ) : (
        <div className="w-full flex flex-col items-center gap-4" style={{ maxWidth: 420 }}>
          <div className="w-full" style={{ height: '600px' }}>
            <GameCanvas
              selectedPokemon={selectedPokemon}
              onBack={() => setSelectedPokemon(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
