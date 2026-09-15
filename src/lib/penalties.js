export const PENALTY_TYPES = [
  { value: 'remark', label: 'Замечание', tone: 'accent' },
  { value: 'battle_remark', label: 'Боевое замечание', tone: 'accent' },
  { value: 'warning', label: 'Предупреждение', tone: 'amber' },
  { value: 'battle_suspension', label: 'Отстранение от боёв', tone: 'amber' },
  { value: 'temp_ban', label: 'Временный бан', tone: 'red' },
  { value: 'character_reset', label: 'Обнуление персонажа', tone: 'red' },
  { value: 'permanent_ban', label: 'Бессрочный бан', tone: 'red' },
]

const TONE_CLASS = {
  accent: 'text-accent-ink bg-accent-soft',
  amber: 'text-accent-ink bg-accent-soft',
  red: 'text-red bg-red-soft',
}

export function penaltyTypeLabel(type) {
  return PENALTY_TYPES.find((t) => t.value === type)?.label || type
}

export function penaltyTypeClass(type) {
  const tone = PENALTY_TYPES.find((t) => t.value === type)?.tone || 'accent'
  return TONE_CLASS[tone]
}
