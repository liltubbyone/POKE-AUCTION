const POKEBALL_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
const SMALL_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

const PIPE_POKEMON_IDS = [25, 1, 4, 7, 133, 94, 150, 151, 39, 143, 6, 9]

const cache: { pokeball: HTMLImageElement | null; pokemon: HTMLImageElement[]; loaded: boolean } = {
  pokeball: null,
  pokemon: [],
  loaded: false,
}
let initPromise: Promise<void> | null = null

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function initSprites(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const pokeball = await loadImage(POKEBALL_URL)
    const pokemonImgs = await Promise.all(
      PIPE_POKEMON_IDS.map((id) => loadImage(`${SMALL_BASE}/${id}.png`))
    )
    cache.pokeball = pokeball
    cache.pokemon = pokemonImgs.filter(Boolean) as HTMLImageElement[]
    cache.loaded = true
  })()
  return initPromise
}

export function getPipePattern(type: string): HTMLImageElement[] {
  if (type === 'pokeball') return cache.pokeball ? [cache.pokeball] : []
  if (type === 'pokemon') return cache.pokemon
  return []
}
