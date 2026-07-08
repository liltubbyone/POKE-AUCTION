// 50 iconic Pokémon using official PokéAPI front-facing sprites (transparent PNG)
const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home'

const MIRRORED_IDS = new Set([
  1, 4, 7, 25, 26, 39, 52, 54, 58, 63, 66, 77, 79, 92, 94,
  133, 151, 152, 155, 158, 175, 194, 216, 249,
  252, 255, 258, 280, 330, 384, 387, 390, 445, 448,
  491, 501, 570, 610, 653, 656, 722, 778,
])

const POKEMON_RAW = [
  { id: 1,   name: 'Bulbasaur',   type: 'Grass' },
  { id: 4,   name: 'Charmander',  type: 'Fire' },
  { id: 6,   name: 'Charizard',   type: 'Fire' },
  { id: 7,   name: 'Squirtle',    type: 'Water' },
  { id: 9,   name: 'Blastoise',   type: 'Water' },
  { id: 25,  name: 'Pikachu',     type: 'Electric' },
  { id: 26,  name: 'Raichu',      type: 'Electric' },
  { id: 39,  name: 'Jigglypuff',  type: 'Fairy' },
  { id: 52,  name: 'Meowth',      type: 'Normal' },
  { id: 54,  name: 'Psyduck',     type: 'Water' },
  { id: 58,  name: 'Growlithe',   type: 'Fire' },
  { id: 63,  name: 'Abra',        type: 'Psychic' },
  { id: 66,  name: 'Machop',      type: 'Fighting' },
  { id: 74,  name: 'Geodude',     type: 'Rock' },
  { id: 77,  name: 'Ponyta',      type: 'Fire' },
  { id: 79,  name: 'Slowpoke',    type: 'Water' },
  { id: 92,  name: 'Gastly',      type: 'Ghost' },
  { id: 94,  name: 'Gengar',      type: 'Ghost' },
  { id: 133, name: 'Eevee',       type: 'Normal' },
  { id: 143, name: 'Snorlax',     type: 'Normal' },
  { id: 150, name: 'Mewtwo',      type: 'Psychic' },
  { id: 151, name: 'Mew',         type: 'Psychic' },
  { id: 152, name: 'Chikorita',   type: 'Grass' },
  { id: 155, name: 'Cyndaquil',   type: 'Fire' },
  { id: 158, name: 'Totodile',    type: 'Water' },
  { id: 175, name: 'Togepi',      type: 'Fairy' },
  { id: 179, name: 'Mareep',      type: 'Electric' },
  { id: 194, name: 'Wooper',      type: 'Water' },
  { id: 197, name: 'Umbreon',     type: 'Dark' },
  { id: 216, name: 'Teddiursa',   type: 'Normal' },
  { id: 249, name: 'Lugia',       type: 'Psychic' },
  { id: 252, name: 'Treecko',     type: 'Grass' },
  { id: 255, name: 'Torchic',     type: 'Fire' },
  { id: 258, name: 'Mudkip',      type: 'Water' },
  { id: 280, name: 'Ralts',       type: 'Psychic' },
  { id: 330, name: 'Flygon',      type: 'Dragon' },
  { id: 384, name: 'Rayquaza',    type: 'Dragon' },
  { id: 387, name: 'Turtwig',     type: 'Grass' },
  { id: 390, name: 'Chimchar',    type: 'Fire' },
  { id: 393, name: 'Piplup',      type: 'Water' },
  { id: 448, name: 'Lucario',     type: 'Fighting' },
  { id: 445, name: 'Garchomp',    type: 'Dragon' },
  { id: 491, name: 'Darkrai',     type: 'Dark' },
  { id: 501, name: 'Oshawott',    type: 'Water' },
  { id: 570, name: 'Zorua',       type: 'Dark' },
  { id: 610, name: 'Axew',        type: 'Dragon' },
  { id: 653, name: 'Fennekin',    type: 'Fire' },
  { id: 656, name: 'Froakie',     type: 'Water' },
  { id: 722, name: 'Rowlet',      type: 'Grass' },
  { id: 778, name: 'Mimikyu',     type: 'Ghost' },
]

export interface Pokemon {
  id: number
  name: string
  type: string
  mirrored: boolean
  img: string
}

const POKEMON: Pokemon[] = POKEMON_RAW.map((p) => ({
  ...p,
  mirrored: MIRRORED_IDS.has(p.id),
  img: `${BASE}/${p.id}.png`,
}))

export const TYPE_COLORS: Record<string, string> = {
  Grass:    '#78C850',
  Fire:     '#F08030',
  Water:    '#6890F0',
  Electric: '#F8D030',
  Psychic:  '#F85888',
  Normal:   '#A8A878',
  Fighting: '#C03028',
  Rock:     '#B8A038',
  Ghost:    '#705898',
  Dark:     '#705848',
  Fairy:    '#EE99AC',
  Dragon:   '#7038F8',
  Bug:      '#A8B820',
}

export default POKEMON
