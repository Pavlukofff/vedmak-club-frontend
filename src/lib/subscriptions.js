function pluralRu(n, [one, few, many]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function formatDuration(days) {
  if (days >= 28) {
    const months = Math.round(days / 30.44)
    if (months >= 1) return `${months} ${pluralRu(months, ['месяц', 'месяца', 'месяцев'])}`
  }
  return `${days} ${pluralRu(days, ['день', 'дня', 'дней'])}`
}

export function formatBYN(value) {
  const num = parseFloat(value)
  return `${Number.isInteger(num) ? num : num.toFixed(2)} BYN`
}
