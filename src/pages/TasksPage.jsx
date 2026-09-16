import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const STATUSES = [
  { value: 'in_progress', label: 'Выполняется', cls: 'text-accent-ink bg-accent-soft' },
  { value: 'completed', label: 'Выполнено', cls: 'text-teal bg-teal-soft' },
  { value: 'failed', label: 'Провалено', cls: 'text-red bg-red-soft' },
  { value: 'cancelled', label: 'Отменено', cls: 'text-muted bg-surface-2' },
]

function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label || value
}

function statusClass(value) {
  return STATUSES.find((s) => s.value === value)?.cls || 'text-muted bg-surface-2'
}

export default function TasksPage() {
  const { user, isAuthenticated } = useAuth()
  const [templates, setTemplates] = useState([])
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [assignOpenId, setAssignOpenId] = useState(null)
  const [assignTarget, setAssignTarget] = useState('')

  function load() {
    setLoading(true)
    const calls = [api.get('/tasks/templates/')]
    if (isAuthenticated) {
      calls.push(api.get('/tasks/assignments/'), api.get('/accounts/users/'))
    }
    Promise.all(calls)
      .then(([t, a, u]) => {
        setTemplates(t.data)
        setAssignments(a?.data || [])
        setUsers(u?.data || [])
      })
      .catch(() => setError('Не удалось загрузить задания.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [isAuthenticated])

  const myAssignments = useMemo(
    () => (user ? assignments.filter((a) => a.user === user.username) : []),
    [assignments, user],
  )

  // Без права can_manage_tasks бэкенд отдаёт только свои задания — если в ответе
  // есть чужие, значит право есть (тот же приём, что и в PublicProfilePage для взысканий).
  const canManage = useMemo(
    () => Boolean(user) && assignments.some((a) => a.user !== user.username),
    [assignments, user],
  )

  const usersByName = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      map[u.username] = u.display_name
    })
    return map
  }, [users])

  const myByTemplate = useMemo(() => {
    const map = {}
    myAssignments.forEach((a) => {
      if (!map[a.task_template.id]) map[a.task_template.id] = []
      map[a.task_template.id].push(a)
    })
    return map
  }, [myAssignments])

  async function takeTask(templateId) {
    setBusyId(templateId)
    setError('')
    try {
      await api.post('/tasks/assignments/', { task_template: templateId })
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function assignTask(templateId) {
    if (!assignTarget) return
    setError('')
    try {
      await api.post('/tasks/assignments/', { task_template: templateId, user: assignTarget })
      setAssignOpenId(null)
      setAssignTarget('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function setStatus(assignmentId, status) {
    setError('')
    try {
      await api.patch(`/tasks/assignments/${assignmentId}/`, { status })
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Задания</h1>
      <p className="text-sm text-muted mb-8">
        Доска квестов клуба — задание считается взятым сразу, выполненным — только когда мастер
        или судья подтвердит его на месте.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10">
        <h2 className="text-sm font-medium text-ink-soft mb-3">Доска квестов</h2>
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted">Заданий пока нет.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((t) => {
              const mine = myByTemplate[t.id] || []
              const inProgress = mine.find((a) => a.status === 'in_progress')
              const full = t.max_slots != null && t.available_slots <= 0
              const exhausted = !t.is_repeatable && mine.length > 0

              return (
                <div key={t.id} className="border border-border-soft rounded-lg p-4 bg-surface">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-medium">{t.title}</h3>
                    {t.max_slots != null && (
                      <span className="text-xs text-faint shrink-0">
                        {t.available_slots}/{t.max_slots} копий
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-ink-soft leading-relaxed mb-2">{t.description}</p>
                  )}
                  {t.requirements && (
                    <p className="text-xs text-faint mb-2">Требования: {t.requirements}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {(t.reward_experience > 0 || t.reward_currency > 0) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent-ink">
                        награда: {t.reward_experience} опыта, {t.reward_currency} крон
                      </span>
                    )}
                    <span className="text-xs text-faint">выполнено раз: {t.completions_count}</span>
                    {t.is_repeatable && <span className="text-xs text-faint">повторяемое</span>}
                  </div>

                  {isAuthenticated && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {inProgress ? (
                        <span className="text-xs text-teal">уже у вас в работе</span>
                      ) : (
                        <button
                          onClick={() => takeTask(t.id)}
                          disabled={busyId === t.id || full || exhausted}
                          className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 disabled:opacity-50"
                        >
                          {busyId === t.id
                            ? 'Берём…'
                            : exhausted
                              ? 'Уже выполнялось'
                              : full
                                ? 'Нет копий'
                                : 'Взять'}
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => {
                            setAssignOpenId(assignOpenId === t.id ? null : t.id)
                            setAssignTarget('')
                          }}
                          className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
                        >
                          {assignOpenId === t.id ? 'Отмена' : 'Выдать другому'}
                        </button>
                      )}
                    </div>
                  )}

                  {assignOpenId === t.id && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border-soft">
                      <select
                        className={`${inputClass} text-xs py-1.5`}
                        value={assignTarget}
                        onChange={(e) => setAssignTarget(e.target.value)}
                      >
                        <option value="" disabled>
                          Кому…
                        </option>
                        {users.map((u) => (
                          <option key={u.username} value={u.username}>
                            {u.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignTask(t.id)}
                        disabled={!assignTarget}
                        className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 whitespace-nowrap disabled:opacity-50"
                      >
                        Выдать
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Мои задания</h2>
          {myAssignments.length === 0 ? (
            <p className="text-sm text-muted">Вы ещё не брали заданий.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {myAssignments.map((a) => (
                <li
                  key={a.id}
                  className="border border-border-soft rounded-md px-3.5 py-3 text-sm flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-medium">{a.task_template.title}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusClass(a.status)}`}>
                      {statusLabel(a.status)}
                    </span>
                    <p className="text-xs text-faint mt-1">
                      взято {new Date(a.assigned_at).toLocaleDateString('ru-RU')}
                      {a.completed_at &&
                        ` · завершено ${new Date(a.completed_at).toLocaleDateString('ru-RU')}`}
                    </p>
                  </div>
                  {a.status === 'in_progress' && (
                    <button
                      onClick={() => setStatus(a.id, 'cancelled')}
                      className="text-xs text-faint hover:text-red shrink-0"
                    >
                      Отказаться
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canManage && (
        <section>
          <h2 className="text-sm font-medium text-ink-soft mb-3">Управление заданиями</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted">Заданий ещё никто не брал.</p>
          ) : (
            <ul className="space-y-2 max-w-2xl">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="border border-border-soft rounded-md px-3.5 py-3 text-sm flex items-center justify-between gap-2 flex-wrap"
                >
                  <div>
                    <Link to={`/u/${a.user}`} className="font-medium hover:text-accent-ink">
                      {usersByName[a.user] || a.user}
                    </Link>
                    <span className="text-ink-soft"> — {a.task_template.title}</span>
                    <p className="text-xs text-faint mt-1">
                      взято {new Date(a.assigned_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <select
                    className={`${inputClass} text-xs py-1.5 w-auto`}
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
