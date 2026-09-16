import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatBYN, formatDuration } from '../lib/subscriptions'

export default function SubscriptionsPage() {
  const [tickets, setTickets] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([api.get('/subscriptions/tickets/'), api.get('/subscriptions/activities/')])
      .then(([t, a]) => {
        setTickets(t.data)
        setActivities(a.data)
      })
      .catch(() => setError('Не удалось загрузить абонементы.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Абонементы</h1>
      <p className="text-sm text-muted mb-8">
        Витрина цен клуба — реальные деньги (BYN). Оплата и оформление абонемента — очно в клубе,
        сайт ничего не списывает и не проводит платежей.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10">
        <h2 className="text-sm font-medium text-ink-soft mb-3">Билеты</h2>
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted">Абонементов пока нет.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t) => (
              <div key={t.id} className="border border-border-soft rounded-lg p-4 bg-surface flex flex-col">
                <h3 className="font-medium mb-1.5">{t.name}</h3>
                {t.description && (
                  <p className="text-xs text-ink-soft leading-relaxed mb-2">{t.description}</p>
                )}

                {t.included_activities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {t.included_activities.map((a) => (
                      <span
                        key={a.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-teal-soft text-teal"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}

                {t.perks && (
                  <p className="text-xs text-accent-ink bg-accent-soft rounded-md px-2.5 py-2 mb-3">
                    {t.perks}
                  </p>
                )}

                <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-faint">{formatDuration(t.duration_days)}</span>
                  <span className="text-right">
                    <span className="block text-sm font-mono text-accent-ink">
                      {formatBYN(t.price_real)}
                    </span>
                    {t.price_currency != null && (
                      <span className="block text-xs text-faint font-mono">
                        или {t.price_currency} крон
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-ink-soft mb-3">Разовые занятия</h2>
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted">Разовых активностей пока нет.</p>
        ) : (
          <div className="overflow-x-auto border border-border-soft rounded-lg max-w-md">
            <table className="w-full text-sm">
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b border-border-soft last:border-0">
                    <td className="px-3.5 py-2.5">{a.name}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-accent-ink">
                      {formatBYN(a.price_real)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
