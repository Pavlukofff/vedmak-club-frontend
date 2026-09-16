import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inputClass } from '../components/Field'
import { api } from '../lib/api'
import { EVENT_TYPES, eventTypeLabel } from '../lib/dashboard'

export default function DashboardPage() {
  const [feed, setFeed] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  function load() {
    setLoading(true)
    setError('')
    Promise.all([
      api.get('/dashboard/feed/', { params: typeFilter ? { type: typeFilter } : {} }),
      api.get('/dashboard/birthdays/', { params: { days: 14 } }),
    ])
      .then(([f, b]) => {
        setFeed(f.data)
        setBirthdays(b.data)
      })
      .catch((err) => {
        setError(
          err.response?.status === 403
            ? 'Доступ только для персонала клуба.'
            : 'Не удалось загрузить дашборд.',
        )
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [typeFilter])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Дашборд</h1>
      <p className="text-sm text-muted mb-8">
        Сводка последних событий клуба — для персонала админ-панели.
      </p>

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-red">{error}</p>
      ) : (
        <>
          {birthdays.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-medium text-ink-soft mb-3">
                Дни рождения (ближайшие 14 дней)
              </h2>
              <ul className="space-y-2 max-w-md">
                {birthdays.map((b) => (
                  <li
                    key={b.username}
                    className="flex items-center justify-between text-sm border border-border-soft rounded-md px-3.5 py-2.5"
                  >
                    <Link to={`/u/${b.username}`} className="hover:text-accent-ink">
                      {b.display_name}
                    </Link>
                    <span className="text-xs text-faint">
                      {b.days_until === 0 ? 'сегодня' : `через ${b.days_until} дн.`} ·{' '}
                      {new Date(b.next_birthday).toLocaleDateString('ru-RU')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h2 className="text-sm font-medium text-ink-soft">Лента событий</h2>
              <select
                className={`${inputClass} text-xs py-1.5 w-auto`}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Все типы</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {feed.length === 0 ? (
              <p className="text-sm text-muted">Событий пока нет.</p>
            ) : (
              <ul className="space-y-2 max-w-2xl">
                {feed.map((e) => (
                  <li key={e.id} className="border border-border-soft rounded-md px-3.5 py-2.5 text-sm">
                    <p className="text-ink-soft">{e.message}</p>
                    <p className="text-xs text-faint mt-1">
                      {new Date(e.created_at).toLocaleString('ru-RU')} · {eventTypeLabel(e.type)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
