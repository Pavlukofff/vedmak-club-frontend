export const CATEGORIES = [
  { value: 'general', label: 'Обычный товар' },
  { value: 'potion', label: 'Зелье' },
  { value: 'scroll', label: 'Свиток' },
]

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value
}

const DURATION_LABELS = {
  instant: 'мгновенно',
  temporary: 'временно',
  permanent: 'постоянно',
}

export function formatEffect(effect) {
  const parts = [effect.type.name]
  if (effect.value !== null && effect.value !== undefined) {
    parts.push(effect.value > 0 ? `+${effect.value}` : `${effect.value}`)
  }
  let duration = DURATION_LABELS[effect.duration] || effect.duration
  if (effect.duration === 'temporary' && effect.duration_value) {
    duration += `, ${effect.duration_value}`
  }
  return `${parts.join(' ')} — ${duration}`
}
