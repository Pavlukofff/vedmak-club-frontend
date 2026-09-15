export default function RankBadge({ rank }) {
  if (!rank) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-accent text-accent-ink bg-accent-soft">
      {rank.icon && <span>{rank.icon}</span>}
      {rank.name}
    </span>
  )
}
