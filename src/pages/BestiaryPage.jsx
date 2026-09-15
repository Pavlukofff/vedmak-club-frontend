import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { dangerLevelClass, dangerLevelLabel } from '../lib/bestiary'
import { toDatetimeLocal } from '../lib/datetime'

const emptyForm = {
  user: '',
  bestiary: '',
  battle: '',
  date: toDatetimeLocal(new Date().toISOString()),
  notes: '',
  reward_granted: false,
  reward_experience: '',
  reward_currency: '',
}

function killToForm(kill) {
  return {
    user: kill.user,
    bestiary: String(kill.bestiary.id),
    battle: kill.battle ? String(kill.battle) : '',
    date: toDatetimeLocal(kill.date),
    notes: kill.notes || '',
    reward_granted: kill.reward_granted,
    reward_experience: kill.reward_experience ?? '',
    reward_currency: kill.reward_currency ?? '',
  }
}

export default function BestiaryPage() {
  const { isAuthenticated } = useAuth()
  const [species, setSpecies] = useState([])
  const [kills, setKills] = useState([])
  const [users, setUsers] = useState([])
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [killersCache, setKillersCache] = useState({})
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([
      api.get('/bestiary/species/'),
      api.get('/bestiary/kills/'),
      api.get('/accounts/users/'),
      api.get('/battles/'),
    ])
      .then(([s, k, u, b]) => {
        setSpecies(s.data)
        setKills(k.data)
        setUsers(u.data)
        setBattles(b.data)
      })
      .catch(() => setError('Не удалось загрузить бестиарий.'))
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

  const filteredSpecies = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return species
    return species.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    )
  }, [species, query])

  async function toggleExpand(s) {
    if (expandedId === s.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(s.id)
    if (!killersCache[s.id]) {
      const { data } = await api.get(`/bestiary/species/${s.id}/`)
      setKillersCache((c) => ({ ...c, [s.id]: data.killers }))
    }
  }

  async function handleCreate(payload) {
    await api.post('/bestiary/kills/', payload)
    setCreating(false)
    load()
  }

  async function handleUpdate(id, payload) {
    await api.patch(`/bestiary/kills/${id}/`, payload)
    setEditingId(null)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Бестиарий</h1>
      <p className="text-sm text-muted mb-8">
        Энциклопедия видов — отдельно от журнала охот ниже, который фиксирует, кто кого убил.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10">
        <input
          className={`${inputClass} max-w-xs mb-5`}
          placeholder="Поиск по названию или категории…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : filteredSpecies.length === 0 ? (
          <p className="text-sm text-muted">Ничего не нашлось.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecies.map((s) => (
              <div key={s.id} className="border border-border-soft rounded-lg p-4 bg-surface">
                <button
                  onClick={() => toggleExpand(s)}
                  className="text-left w-full"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-medium">{s.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${dangerLevelClass(s.danger_level)}`}>
                      {dangerLevelLabel(s.danger_level)}
                    </span>
                  </div>
                  {s.category && <p className="text-xs text-faint mb-2">{s.category}</p>}
                  {s.description && <p className="text-xs text-ink-soft leading-relaxed">{s.description}</p>}
                </button>

                {expandedId === s.id && (
                  <div className="mt-3 pt-3 border-t border-border-soft">
                    <p className="text-xs text-faint uppercase tracking-wide mb-2">Кто убивал</p>
                    {!killersCache[s.id] ? (
                      <p className="text-xs text-muted">Загрузка…</p>
                    ) : killersCache[s.id].length === 0 ? (
                      <p className="text-xs text-muted">Пока никто.</p>
                    ) : (
                      <ul className="space-y-1">
                        {killersCache[s.id].map((k, i) => (
                          <li key={i} className="text-xs flex items-center justify-between">
                            <Link to={`/u/${k.username}`} className="hover:text-accent-ink">
                              {k.display_name}
                            </Link>
                            <span className="text-faint">{new Date(k.date).toLocaleDateString('ru-RU')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-soft">Журнал охот</h2>
          {isAuthenticated && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
            >
              {creating ? 'Отмена' : 'Записать убийство'}
            </button>
          )}
        </div>

        {creating && (
          <div className="mb-6 max-w-xl">
            <KillForm
              users={users}
              species={species}
              battles={battles}
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : kills.length === 0 ? (
          <p className="text-sm text-muted">Записей ещё нет.</p>
        ) : (
          <ul className="space-y-2 max-w-2xl">
            {kills.map((k) => (
              <li key={k.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <Link to={`/u/${k.user}`} className="font-medium hover:text-accent-ink">
                      {usersByName[k.user] || k.user}
                    </Link>
                    {' убил(а) '}
                    <span className="text-ink-soft">{k.bestiary.name}</span>
                  </span>
                  {isAuthenticated && (
                    <button
                      onClick={() => setEditingId(k.id === editingId ? null : k.id)}
                      className="text-xs text-faint hover:text-ink shrink-0"
                    >
                      Изменить
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {k.reward_granted ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-soft text-teal">
                      награда: {k.reward_experience || 0} опыта, {k.reward_currency || 0} крон
                    </span>
                  ) : (
                    <span className="text-xs text-faint">награда не начислена</span>
                  )}
                </div>
                {k.notes && <p className="text-ink-soft mt-1.5">{k.notes}</p>}
                <p className="text-xs text-faint mt-1.5">
                  {new Date(k.date).toLocaleDateString('ru-RU')} · зафиксировал: {k.recorded_by}
                </p>

                {editingId === k.id && (
                  <div className="mt-3 pt-3 border-t border-border-soft">
                    <KillForm
                      users={users}
                      species={species}
                      battles={battles}
                      initial={k}
                      onSubmit={(payload) => handleUpdate(k.id, payload)}
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

function KillForm({ users, species, battles, initial, onSubmit, onCancel, submitLabel = 'Записать' }) {
  const [form, setForm] = useState(initial ? killToForm(initial) : emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        user: form.user,
        bestiary: Number(form.bestiary),
        battle: form.battle ? Number(form.battle) : null,
        date: new Date(form.date).toISOString(),
        notes: form.notes,
        reward_granted: form.reward_granted,
        reward_experience: form.reward_granted && form.reward_experience ? Number(form.reward_experience) : null,
        reward_currency: form.reward_granted && form.reward_currency ? Number(form.reward_currency) : null,
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
        <Field label="Охотник">
          <select className={inputClass} value={form.user} onChange={(e) => update('user', e.target.value)} required>
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
        <Field label="Вид монстра">
          <select
            className={inputClass}
            value={form.bestiary}
            onChange={(e) => update('bestiary', e.target.value)}
            required
          >
            <option value="" disabled>
              Выберите…
            </option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата">
          <input
            type="datetime-local"
            className={inputClass}
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            required
          />
        </Field>
        <Field label="Связанный бой" hint="Необязательно">
          <select className={inputClass} value={form.battle} onChange={(e) => update('battle', e.target.value)}>
            <option value="">—</option>
            {battles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.fighter1} vs {b.fighter2} · {new Date(b.date).toLocaleDateString('ru-RU')}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Заметки" hint="Необязательно">
        <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.reward_granted}
          onChange={(e) => update('reward_granted', e.target.checked)}
        />
        Начислить награду
      </label>

      {form.reward_granted && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Опыт">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.reward_experience}
              onChange={(e) => update('reward_experience', e.target.value)}
            />
          </Field>
          <Field label="Кроны">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.reward_currency}
              onChange={(e) => update('reward_currency', e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Сохраняем…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-faint hover:text-ink px-2">
          Отмена
        </button>
      </div>
    </form>
  )
}
