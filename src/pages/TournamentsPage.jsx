import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { STATUSES, bracketTypeLabel, statusClass, statusLabel } from '../lib/tournaments'

const TABS = [{ value: 'all', label: 'Все' }, ...STATUSES]

const emptyForm = {
  title: '',
  description: '',
  date_start: '',
  date_end: '',
  bracket_type: 'single',
}

export default function TournamentsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    api
      .get('/tournaments/')
      .then(({ data }) => setTournaments(data))
      .catch(() => setError('Не удалось загрузить турниры.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(
    () => (status === 'all' ? tournaments : tournaments.filter((t) => t.status === status)),
    [tournaments, status],
  )

  async function handleCreate(payload) {
    const { data } = await api.post('/tournaments/', payload)
    setCreating(false)
    navigate(`/tournaments/${data.id}`)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Турниры</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Создать турнир'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-6">
        Сайт не проводит бои — сетка турнира только переносит уже зафиксированные судьёй
        результаты.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-lg">
          <CreateTournamentForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      <div className="flex gap-1 border-b border-border-soft mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              status === t.value ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Турниров нет.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/tournaments/${t.id}`}
              className="border border-border-soft rounded-lg p-4 bg-surface hover:border-accent block"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium">{t.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass(t.status)}`}>
                  {statusLabel(t.status)}
                </span>
              </div>
              {t.description && (
                <p className="text-xs text-ink-soft leading-relaxed mb-2">{t.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap text-xs text-faint">
                <span>
                  {new Date(t.date_start).toLocaleDateString('ru-RU')}
                  {t.date_end ? ` – ${new Date(t.date_end).toLocaleDateString('ru-RU')}` : ''}
                </span>
                <span>· {bracketTypeLabel(t.bracket_type)}</span>
              </div>
              {t.winner && (
                <p className="text-xs text-accent-ink mt-2">
                  🏆 {t.winner}
                  {t.runner_up ? ` · 🥈 ${t.runner_up}` : ''}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateTournamentForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm)
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
        title: form.title,
        description: form.description,
        date_start: form.date_start,
        date_end: form.date_end || null,
        bracket_type: form.bracket_type,
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

      <Field label="Название">
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </Field>

      <Field label="Описание" hint="Необязательно">
        <textarea
          className={inputClass}
          rows={2}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата начала">
          <input
            type="date"
            className={inputClass}
            value={form.date_start}
            onChange={(e) => update('date_start', e.target.value)}
            required
          />
        </Field>
        <Field label="Дата окончания" hint="Необязательно">
          <input
            type="date"
            className={inputClass}
            value={form.date_end}
            onChange={(e) => update('date_end', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Формат сетки">
        <select
          className={inputClass}
          value={form.bracket_type}
          onChange={(e) => update('bracket_type', e.target.value)}
        >
          <option value="single">Одиночное выбывание</option>
          <option value="double">Двойное выбывание (с нижней сеткой)</option>
        </select>
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Создаём…' : 'Создать'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-faint hover:text-ink px-2">
          Отмена
        </button>
      </div>
    </form>
  )
}
