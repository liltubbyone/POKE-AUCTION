export interface PipeDecoration {
  id: string
  label: string
  description: string
  icon: string
}

export const PIPE_DECORATIONS: PipeDecoration[] = [
  {
    id: 'pokemon',
    label: 'Pokémon',
    description: 'Monster sprites on pipes',
    icon: '🐾',
  },
  {
    id: 'none',
    label: 'Plain',
    description: 'No decorations',
    icon: '⬜',
  },
]

export const DEFAULT_PIPE_DECORATION = 'none'

export function getPipeDecoration(id: string): PipeDecoration {
  return PIPE_DECORATIONS.find((d) => d.id === id) || PIPE_DECORATIONS[0]
}
