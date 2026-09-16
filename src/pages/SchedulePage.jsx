import { useEffect, useMemo, useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { WEEKDAYS, formatTime } from '../lib/schedule'

const emptyForm = {
  weekday: 0,
  start_time: '',
  end_time: '',
  title: '',
  activity: '',
  location: '',
  notes: '',
  is_active: true,
}

function entryToForm(entry, activities) {
  const match = activities.find((a) => a.name === entry.activity)
  return {
    weekday: entry.weekday,
    start_time: formatTime(entry.start_time),
    end_time: formatTime(entry.end_time),
    title: entry.title,
    activity: match ? String(match.id) : '',
    location: entry.location || '',
    notes: entry.notes || '',
    is_active: entry.is_active ?? true,
  }
}

export default function SchedulePage() {
  const { isAuthenticated } = useAuth()
  const [entries, setEntries] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([api.get('/schedule/'), api.get('/subscriptions/activities/')])
      .then(([s, a]) => {
        setEntries(s.data)
        setActivities(a.data)
      })
      .catch(() => setError('Не удалось загрузить расписание.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const byWeekday = useMemo(() => {
    const map = {}
    WEEKDAYS.forEach((w) => {
      map[w.value] = []
    })
    entries.forEach((e) => {
      map[e.weekday]?.push(e)
    })
    return map
  }, [entries])

  async function handleCreate(payload) {
    await api.post('/schedule/', payload)
    setCreating(false)
    load()
  }

  async function handleUpdate(id, payload) {
    await api.patch(`/schedule/${id}/`, payload)
    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    setError('')
    try {
      await api.delete(`/schedule/${id}/`)
      setConfirmDeleteId(null)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Расписание</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Добавить запись'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-8">Тренировки и занятия клуба по дням недели.</p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-lg">
          <EntryForm activities={activities} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">Расписание пока не заполнено.</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {WEEKDAYS.filter((w) => byWeekday[w.value].length > 0).map((w) => (
            <div key={w.value}>
              <h2 className="text-sm font-medium text-ink-soft mb-2.5">{w.label}</h2>
              <ul className="space-y-2">
                {byWeekday[w.value].map((entry) => (
                  <li key={entry.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-accent-ink">
                          {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                        </span>
                        <span className="font-medium">{entry.title}</span>
                        {!entry.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-faint">
                            неактивно
                          </span>
                        )}
                      </div>
                      {isAuthenticated && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingId(entry.id === editingId ? null : entry.id)}
                            className="text-xs text-faint hover:text-ink"
                          >
                            Изменить
                          </button>
                          {confirmDeleteId === entry.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-xs text-red font-medium"
                              >
                                Точно
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-faint hover:text-ink"
                              >
                                Нет
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(entry.id)}
                              className="text-xs text-faint hover:text-red"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {(entry.location || entry.notes) && (
                      <p className="text-xs text-faint mt-1.5">
                        {entry.location}
                        {entry.location && entry.notes && ' · '}
                        {entry.notes}
                      </p>
                    )}

                    {editingId === entry.id && (
                      <div className="mt-3 pt-3 border-t border-border-soft">
                        <EntryForm
                          activities={activities}
                          initial={entry}
                          onSubmit={(payload) => handleUpdate(entry.id, payload)}
                          onCancel={() => setEditingId(null)}
                          submitLabel="Сохранить"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EntryForm({ activities, initial, onSubmit, onCancel, submitLabel = 'Добавить' }) {
  const [form, setForm] = useState(initial ? entryToForm(initial, activities) : emptyForm)
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
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
        title: form.title,
        activity: form.activity ? Number(form.activity) : null,
        location: form.location,
        notes: form.notes,
        is_active: form.is_active,
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

      <div className="grid grid-cols-3 gap-3">
        <Field label="День недели">
          <select
            className={inputClass}
            value={form.weekday}
            onChange={(e) => update('weekday', e.target.value)}
          >
            {WEEKDAYS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Начало">
          <input
            type="time"
            className={inputClass}
            value={form.start_time}
            onChange={(e) => update('start_time', e.target.value)}
            required
          />
        </Field>
        <Field label="Окончание">
          <input
            type="time"
            className={inputClass}
            value={form.end_time}
            onChange={(e) => update('end_time', e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Активность" hint="Необязательно">
          <select
            className={inputClass}
            value={form.activity}
            onChange={(e) => update('activity', e.target.value)}
          >
            <option value="">—</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Место" hint="Необязательно">
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Заметки" hint="Необязательно">
        <textarea
          className={inputClass}
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => update('is_active', e.target.checked)}
        />
        Активно
      </label>

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
