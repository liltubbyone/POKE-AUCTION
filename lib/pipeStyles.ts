export interface PipeStyle {
  id: string
  label: string
  description: string
  swatch: string[]
}

export const PIPE_STYLES: PipeStyle[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Green pipes',
    swatch: ['#7ED957', '#3D8B27'],
  },
  {
    id: 'ice',
    label: 'Ice',
    description: 'Frozen blue pipes',
    swatch: ['#7EC8E3', '#3A8FB7'],
  },
  {
    id: 'lava',
    label: 'Lava',
    description: 'Fiery orange pipes',
    swatch: ['#FF8C42', '#C0392B'],
  },
]

export const DEFAULT_PIPE_STYLE = 'classic'

export function getPipeStyle(id: string): PipeStyle {
  return PIPE_STYLES.find((s) => s.id === id) || PIPE_STYLES[0]
}
