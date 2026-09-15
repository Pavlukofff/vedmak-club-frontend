export function Field({ label, children, hint, error }) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-soft mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-faint mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red mt-1">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent'
