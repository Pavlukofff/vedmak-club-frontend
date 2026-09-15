import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RankBadge from '../components/RankBadge'
import { inputClass } from '../components/Field'
import { api } from '../lib/api'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api
      .get('/accounts/users/')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Не удалось загрузить список участников.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.school?.toLowerCase().includes(q),
    )
  }, [users, query])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Участники цеха</h1>
      <p className="text-sm text-muted mb-6">{users.length ? `${users.length} участников` : ' '}</p>

      <input
        className={`${inputClass} max-w-xs mb-8`}
        placeholder="Поиск по нику, логину или школе…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="text-sm text-muted">Загрузка…</p>}
      {error && <p className="text-sm text-red">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted">Никого не нашлось.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((u) => (
          <Link
            key={u.username}
            to={`/u/${u.username}`}
            className="border border-border-soft rounded-lg p-4 bg-surface hover:border-accent transition-colors"
          >
            {u.avatar ? (
              <img
                src={u.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-border mb-3"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border mb-3" />
            )}
            <div className="font-medium text-sm mb-1 truncate">{u.display_name}</div>
            <div className="text-xs text-muted mb-2">{u.school || 'без школы'}</div>
            <div className="flex flex-wrap gap-1.5">
              <RankBadge rank={u.rank} />
              {u.roles?.map((role) => (
                <span
                  key={role}
                  className="text-xs font-medium px-2 py-0.5 rounded-full border border-teal text-teal bg-teal-soft"
                >
                  {role}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
