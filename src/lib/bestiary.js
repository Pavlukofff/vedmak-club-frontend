export const DANGER_LEVELS = [
  { value: 'low', label: 'Низкая', cls: 'text-teal bg-teal-soft' },
  { value: 'medium', label: 'Средняя', cls: 'text-accent-ink bg-accent-soft' },
  { value: 'high', label: 'Высокая', cls: 'text-accent-ink bg-accent-soft' },
  { value: 'deadly', label: 'Смертельная', cls: 'text-red bg-red-soft' },
]

export function dangerLevelLabel(value) {
  return DANGER_LEVELS.find((d) => d.value === value)?.label || value
}

export function dangerLevelClass(value) {
  return DANGER_LEVELS.find((d) => d.value === value)?.cls || 'text-muted bg-surface-2'
}
