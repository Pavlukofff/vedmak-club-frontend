export const STATUSES = [
  { value: 'upcoming', label: 'Предстоит', cls: 'text-accent-ink bg-accent-soft' },
  { value: 'ongoing', label: 'Идёт', cls: 'text-teal bg-teal-soft' },
  { value: 'finished', label: 'Завершён', cls: 'text-muted bg-surface-2' },
  { value: 'cancelled', label: 'Отменён', cls: 'text-red bg-red-soft' },
]

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label || value
}

export function statusClass(value) {
  return STATUSES.find((s) => s.value === value)?.cls || 'text-muted bg-surface-2'
}

export function bracketTypeLabel(value) {
  return value === 'double' ? 'Двойное выбывание' : 'Одиночное выбывание'
}

// Порядок чтения сетки, не совпадает с алфавитным порядком ключей в ответе API.
export const BRACKET_SECTIONS = [
  { key: 'upper', label: 'Верхняя сетка' },
  { key: 'lower', label: 'Нижняя сетка' },
  { key: 'final', label: 'Финал' },
]
