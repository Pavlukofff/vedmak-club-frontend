import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const emptyForm = { title: '', description: '', date_start: '', date_end: '' }

export default function FestivalsPage() {
  const { isAuthenticated } = useAuth()
  const [festivals, setFestivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    api
      .get('/blog/festivals/')
      .then(({ data }) => setFestivals(data))
      .catch(() => setError('Не удалось загрузить фестивали.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Фестивали</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Создать фестиваль'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-8">
        Мероприятия клуба — с фотогалереей и перекрёстными ссылками на посты блога.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-lg">
          <FestivalForm
            onSubmit={async (payload) => {
              await api.post('/blog/festivals/', payload)
              setCreating(false)
              load()
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : festivals.length === 0 ? (
        <p className="text-sm text-muted">Фестивалей пока нет.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {festivals.map((f) => (
            <Link
              key={f.id}
              to={`/festivals/${f.id}`}
              className="border border-border-soft rounded-lg overflow-hidden bg-surface hover:border-accent block"
            >
              {f.photos[0] && (
                <img src={f.photos[0].image} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-medium mb-1.5">{f.title}</h3>
                {f.description && (
                  <p className="text-xs text-ink-soft leading-relaxed mb-2 line-clamp-2">
                    {f.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap text-xs text-faint">
                  <span>
                    {new Date(f.date_start).toLocaleDateString('ru-RU')}
                    {f.date_end ? ` – ${new Date(f.date_end).toLocaleDateString('ru-RU')}` : ''}
                  </span>
                  {f.photos.length > 0 && <span>· фото: {f.photos.length}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function FestivalForm({ initial, onSubmit, onCancel, submitLabel = 'Создать' }) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || '',
          date_start: initial.date_start,
          date_end: initial.date_end || '',
        }
      : emptyForm,
  )
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
          rows={3}
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
