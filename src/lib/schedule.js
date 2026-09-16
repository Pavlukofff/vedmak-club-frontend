export const WEEKDAYS = [
  { value: 0, label: 'Понедельник' },
  { value: 1, label: 'Вторник' },
  { value: 2, label: 'Среда' },
  { value: 3, label: 'Четверг' },
  { value: 4, label: 'Пятница' },
  { value: 5, label: 'Суббота' },
  { value: 6, label: 'Воскресенье' },
]

export function weekdayLabel(value) {
  return WEEKDAYS.find((w) => w.value === value)?.label || value
}

export function formatTime(value) {
  return value ? value.slice(0, 5) : ''
}
