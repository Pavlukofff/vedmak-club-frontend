export function toDatetimeLocal(iso) {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d - offset).toISOString().slice(0, 16)
}
