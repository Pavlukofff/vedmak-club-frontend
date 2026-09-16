import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { formatRequirement, formatReward } from '../lib/ranks'

const REQUEST_STATUS = {
  pending: { label: 'На рассмотрении', cls: 'text-accent-ink bg-accent-soft' },
  approved: { label: 'Одобрено', cls: 'text-teal bg-teal-soft' },
  rejected: { label: 'Отклонено', cls: 'text-red bg-red-soft' },
}

export default function RanksPage() {
  const { user, isAuthenticated, refreshMe } = useAuth()
  const [ranks, setRanks] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [reviewingId, setReviewingId] = useState(null)

  function load() {
    setLoading(true)
    const calls = [api.get('/ranks/')]
    if (isAuthenticated) {
      calls.push(api.get('/ranks/rank-up-requests/'), api.get('/accounts/users/'))
    }
    Promise.all(calls)
      .then(([r, req, u]) => {
        setRanks(r.data)
        setRequests(req?.data || [])
        setUsers(u?.data || [])
      })
      .catch(() => setError('Не удалось загрузить ранги.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [isAuthenticated])

  const usersByName = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      map[u.username] = u.display_name
    })
    return map
  }, [users])

  const myRequests = useMemo(
    () => (user ? requests.filter((r) => r.user === user.username) : []),
    [requests, user],
  )

  // Без права can_approve_ranks бэкенд отдаёт только свои заявки — чужие в ответе
  // выдают наличие права (тот же приём, что и в TasksPage/PublicProfilePage).
  const canApprove = useMemo(
    () => Boolean(user) && requests.some((r) => r.user !== user.username),
    [requests, user],
  )

  const currentRank = useMemo(
    () => (user?.rank ? ranks.find((r) => r.name === user.rank.name) : null),
    [ranks, user],
  )
  const nextRank = useMemo(
    () => (currentRank ? ranks.find((r) => r.order === currentRank.order + 1) : null),
    [ranks, currentRank],
  )
  const hasPending = myRequests.some((r) => r.status === 'pending')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nextRank) return
    setSubmitting(true)
    setFormError('')
    try {
      await api.post('/ranks/rank-up-requests/', { to_rank: nextRank.id, comment })
      setComment('')
      load()
    } catch (err) {
      setFormError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function review(request, decision) {
    setReviewingId(request.id)
    setError('')
    try {
      await api.post(`/ranks/rank-up-requests/${request.id}/${decision}/`)
      if (user && request.user === user.username) {
        await refreshMe()
      }
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setReviewingId(null)
    }
  }

  const pendingQueue = requests.filter((r) => r.status === 'pending')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Ранги цеха</h1>
      <p className="text-sm text-muted mb-8">
        Лестница рангов клуба — от Рекрута до Мастера Ведьмака. Повышение — по заявке, с ручной
        проверкой мастером или Главой Клуба.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10">
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : (
          <ol className="space-y-3">
            {ranks.map((r) => {
              const isCurrent = currentRank?.id === r.id
              return (
                <li
                  key={r.id}
                  className={`border rounded-lg p-4 ${
                    isCurrent ? 'border-accent bg-accent-soft/40' : 'border-border-soft bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {r.icon && <span>{r.icon}</span>}
                    <h3 className="font-medium">{r.name}</h3>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-bg">
                        ваш ранг
                      </span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-faint uppercase tracking-wide mb-1.5">Требования</p>
                      {r.requirements.length === 0 ? (
                        <p className="text-muted">—</p>
                      ) : (
                        <ul className="space-y-1 text-ink-soft">
                          {r.requirements.map((req) => (
                            <li key={req.id}>{formatRequirement(req)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-faint uppercase tracking-wide mb-1.5">Награды</p>
                      {r.rewards.length === 0 ? (
                        <p className="text-muted">—</p>
                      ) : (
                        <ul className="space-y-1 text-ink-soft">
                          {r.rewards.map((rw) => (
                            <li key={rw.id}>{formatReward(rw)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {isAuthenticated && (
        <section className="mb-10 max-w-lg">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Моя заявка</h2>

          {!currentRank ? (
            <p className="text-sm text-muted mb-6">Текущий ранг ещё не назначен.</p>
          ) : !nextRank ? (
            <p className="text-sm text-muted mb-6">Вы уже на максимальном ранге.</p>
          ) : hasPending ? (
            <p className="text-sm text-accent-ink bg-accent-soft border border-accent/30 rounded-md px-3.5 py-2.5 mb-6">
              У вас уже есть заявка на рассмотрении — дождитесь решения.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {formError && <p className="text-sm text-red">{formError}</p>}
              <Field label="Следующий ранг">
                <input
                  className={inputClass}
                  value={`${nextRank.icon || ''} ${nextRank.name}`.trim()}
                  disabled
                />
              </Field>
              <Field label="Комментарий" hint="Необязательно — например, что уже выполнено">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Отправляем…' : 'Подать заявку'}
              </button>
            </form>
          )}

          <h3 className="text-sm font-medium text-ink-soft mb-2">История заявок</h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted">Заявок ещё не было.</p>
          ) : (
            <ul className="space-y-2">
              {myRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm border border-border-soft rounded-md px-3.5 py-2.5"
                >
                  <span>
                    {r.from_rank.name} → <span className="text-ink">{r.to_rank.name}</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${REQUEST_STATUS[r.status]?.cls}`}>
                    {REQUEST_STATUS[r.status]?.label || r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canApprove && (
        <section>
          <h2 className="text-sm font-medium text-ink-soft mb-3">Очередь на рассмотрение</h2>
          {pendingQueue.length === 0 ? (
            <p className="text-sm text-muted">Заявок на рассмотрении нет.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {pendingQueue.map((r) => (
                <li
                  key={r.id}
                  className="border border-border-soft rounded-md px-3.5 py-3 text-sm flex items-center justify-between gap-2 flex-wrap"
                >
                  <div>
                    <Link to={`/u/${r.user}`} className="font-medium hover:text-accent-ink">
                      {usersByName[r.user] || r.user}
                    </Link>
                    <span className="text-ink-soft">
                      {' '}
                      : {r.from_rank.name} → {r.to_rank.name}
                    </span>
                    {r.comment && <p className="text-xs text-faint mt-1">{r.comment}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => review(r, 'approve')}
                      disabled={reviewingId === r.id}
                      className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 disabled:opacity-50"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => review(r, 'reject')}
                      disabled={reviewingId === r.id}
                      className="text-xs border border-border rounded-md px-3 py-1.5 text-ink-soft hover:border-red hover:text-red disabled:opacity-50"
                    >
                      Отклонить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
