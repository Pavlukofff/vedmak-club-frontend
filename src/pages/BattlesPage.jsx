import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { toDatetimeLocal } from '../lib/datetime'

const emptyForm = {
  type: 'ТС',
  fighter1: '',
  fighter2: '',
  winner: '',
  is_ranked: false,
  main_judge: '',
  side_judge: '',
  date: toDatetimeLocal(new Date().toISOString()),
  notes: '',
}

function battleToForm(battle) {
  return {
    type: battle.type,
    fighter1: battle.fighter1,
    fighter2: battle.fighter2,
    winner: battle.winner || '',
    is_ranked: battle.is_ranked,
    main_judge: battle.main_judge || '',
    side_judge: battle.side_judge || '',
    date: toDatetimeLocal(battle.date),
    notes: battle.notes || '',
  }
}

export default function BattlesPage() {
  const { isAuthenticated } = useAuth()
  const [battles, setBattles] = useState([])
  const [ratings, setRatings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([
      api.get('/battles/'),
      api.get('/battles/ratings/'),
      api.get('/accounts/users/'),
    ])
      .then(([b, r, u]) => {
        setBattles(b.data)
        setRatings(r.data)
        setUsers(u.data)
      })
      .catch(() => setError('Не удалось загрузить бои.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const usersByName = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      map[u.username] = u.display_name
    })
    return map
  }, [users])

  function displayName(username) {
    return usersByName[username] || username
  }

  async function handleCreate(payload) {
    await api.post('/battles/', payload)
    setCreating(false)
    load()
  }

  async function handleUpdate(id, payload) {
    await api.patch(`/battles/${id}/`, payload)
    setEditingId(null)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Бои</h1>
      <p className="text-sm text-muted mb-8">
        Сайт не проводит бои — здесь фиксируются результаты живых схваток судьёй или админом.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10">
        <h2 className="text-sm font-medium text-ink-soft mb-3">Рейтинг</h2>
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : ratings.length === 0 ? (
          <p className="text-sm text-muted">Пока нет данных.</p>
        ) : (
          <div className="overflow-x-auto border border-border-soft rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-faint uppercase tracking-wide border-b border-border-soft">
                  <th className="px-3.5 py-2.5 font-medium">#</th>
                  <th className="px-3.5 py-2.5 font-medium">Участник</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">Боёв</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">Побед</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">Поражений</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">Винрейт</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r, i) => (
                  <tr key={r.username} className="border-b border-border-soft last:border-0">
                    <td className="px-3.5 py-2.5 text-faint">{i + 1}</td>
                    <td className="px-3.5 py-2.5">
                      <Link to={`/u/${r.username}`} className="hover:text-accent-ink">
                        {r.display_name}
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono">{r.battles}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-teal">{r.wins}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-red">{r.losses}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">{r.winrate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-soft">Журнал боёв</h2>
          {isAuthenticated && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
            >
              {creating ? 'Отмена' : 'Записать бой'}
            </button>
          )}
        </div>

        {creating && (
          <div className="mb-6 max-w-xl">
            <BattleForm users={users} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : battles.length === 0 ? (
          <p className="text-sm text-muted">Боёв ещё не было.</p>
        ) : (
          <ul className="space-y-2 max-w-2xl">
            {battles.map((b) => (
              <li key={b.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent-ink">
                      {b.type}
                    </span>
                    {b.is_ranked && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-soft text-teal">
                        ранговый
                      </span>
                    )}
                    <span>
                      <Link to={`/u/${b.fighter1}`} className={b.winner === b.fighter1 ? 'text-accent-ink font-medium' : ''}>
                        {displayName(b.fighter1)}
                      </Link>
                      {' vs '}
                      <Link to={`/u/${b.fighter2}`} className={b.winner === b.fighter2 ? 'text-accent-ink font-medium' : ''}>
                        {displayName(b.fighter2)}
                      </Link>
                    </span>
                    {!b.winner && <span className="text-xs text-faint">ничья</span>}
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => setEditingId(b.id === editingId ? null : b.id)}
                      className="text-xs text-faint hover:text-ink shrink-0"
                    >
                      Изменить
                    </button>
                  )}
                </div>
                {b.notes && <p className="text-ink-soft mt-1.5">{b.notes}</p>}
                <p className="text-xs text-faint mt-1.5">
                  {new Date(b.date).toLocaleString('ru-RU')} · зафиксировал: {b.recorded_by}
                  {b.main_judge && ` · судья: ${displayName(b.main_judge)}`}
                </p>

                {editingId === b.id && (
                  <div className="mt-3 pt-3 border-t border-border-soft">
                    <BattleForm
                      users={users}
                      initial={b}
                      onSubmit={(payload) => handleUpdate(b.id, payload)}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Сохранить"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function BattleForm({ users, initial, onSubmit, onCancel, submitLabel = 'Записать' }) {
  const [form, setForm] = useState(initial ? battleToForm(initial) : emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const winnerOptions = [form.fighter1, form.fighter2].filter(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        type: form.type,
        fighter1: form.fighter1,
        fighter2: form.fighter2,
        winner: form.winner || null,
        is_ranked: form.is_ranked,
        main_judge: form.main_judge || null,
        side_judge: form.side_judge || null,
        date: new Date(form.date).toISOString(),
        notes: form.notes,
      })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-border-soft rounded-md p-4">
      {error && <p className="text-sm text-red">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Тип боя">
          <select className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)}>
            <option value="ТС">ТС — Тренировочная Схватка</option>
            <option value="РС">РС — Ролевая Схватка</option>
          </select>
        </Field>
        <Field label="Дата и время">
          <input
            type="datetime-local"
            className={inputClass}
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Участник 1">
          <select
            className={inputClass}
            value={form.fighter1}
            onChange={(e) => update('fighter1', e.target.value)}
            required
          >
            <option value="" disabled>
              Выберите…
            </option>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.display_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Участник 2">
          <select
            className={inputClass}
            value={form.fighter2}
            onChange={(e) => update('fighter2', e.target.value)}
            required
          >
            <option value="" disabled>
              Выберите…
            </option>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.display_name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Победитель" hint="Оставьте «Ничья», если победитель не определён">
        <select className={inputClass} value={form.winner} onChange={(e) => update('winner', e.target.value)}>
          <option value="">Ничья</option>
          {winnerOptions.map((username) => (
            <option key={username} value={username}>
              {users.find((u) => u.username === username)?.display_name || username}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.is_ranked}
          onChange={(e) => update('is_ranked', e.target.checked)}
        />
        Ранговый / квестовый бой
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Главный судья" hint={form.is_ranked ? 'Обязателен для рангового боя' : 'Необязательно'}>
          <select
            className={inputClass}
            value={form.main_judge}
            onChange={(e) => update('main_judge', e.target.value)}
            required={form.is_ranked}
          >
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.display_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Боковой судья" hint="Необязательно">
          <select
            className={inputClass}
            value={form.side_judge}
            onChange={(e) => update('side_judge', e.target.value)}
          >
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.display_name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Заметки" hint="Необязательно">
        <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Сохраняем…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-faint hover:text-ink px-2"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
