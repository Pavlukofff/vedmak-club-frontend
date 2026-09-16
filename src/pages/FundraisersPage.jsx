import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const STATUSES = [
  { value: 'active', label: 'Активен', cls: 'text-teal bg-teal-soft' },
  { value: 'completed', label: 'Завершён', cls: 'text-accent-ink bg-accent-soft' },
  { value: 'cancelled', label: 'Отменён', cls: 'text-red bg-red-soft' },
]

function statusLabel(v) {
  return STATUSES.find((s) => s.value === v)?.label || v
}

function statusClass(v) {
  return STATUSES.find((s) => s.value === v)?.cls || 'text-muted bg-surface-2'
}

const emptyForm = { title: '', description: '', goal_amount: '', status: 'active', start_date: '', end_date: '' }

export default function FundraisersPage() {
  const { isAuthenticated } = useAuth()
  const [fundraisers, setFundraisers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    api
      .get('/fundraisers/')
      .then(({ data }) => setFundraisers(data))
      .catch(() => setError('Не удалось загрузить сборы средств.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Сборы средств</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Создать сбор'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-8">
        Реальные деньги (BYN) — взносы офлайн, сайт не принимает оплату онлайн.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-lg">
          <FundraiserForm
            onSubmit={async (payload) => {
              await api.post('/fundraisers/', payload)
              setCreating(false)
              load()
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : fundraisers.length === 0 ? (
        <p className="text-sm text-muted">Сборов пока нет.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fundraisers.map((f) => (
            <Link
              key={f.id}
              to={`/fundraisers/${f.id}`}
              className="border border-border-soft rounded-lg overflow-hidden bg-surface hover:border-accent block"
            >
              {f.cover_image && (
                <img src={f.cover_image} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium">{f.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass(f.status)}`}>
                    {statusLabel(f.status)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden mb-1.5">
                  <div className="h-full bg-accent" style={{ width: `${f.progress_percent}%` }} />
                </div>
                <p className="text-xs text-faint">
                  {f.raised_amount} / {f.goal_amount} BYN · {f.progress_percent}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function FundraiserForm({ initial, onSubmit, onCancel, submitLabel = 'Создать' }) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || '',
          goal_amount: initial.goal_amount,
          status: initial.status,
          start_date: initial.start_date,
          end_date: initial.end_date || '',
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
        goal_amount: form.goal_amount,
        status: form.status,
        start_date: form.start_date || undefined,
        end_date: form.end_date || null,
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
        <Field label="Цель, BYN">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={form.goal_amount}
            onChange={(e) => update('goal_amount', e.target.value)}
            required
          />
        </Field>
        <Field label="Статус">
          <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата начала" hint={initial ? '' : 'По умолчанию — сегодня'}>
          <input
            type="date"
            className={inputClass}
            value={form.start_date}
            onChange={(e) => update('start_date', e.target.value)}
          />
        </Field>
        <Field label="Дата окончания" hint="Необязательно">
          <input
            type="date"
            className={inputClass}
            value={form.end_date}
            onChange={(e) => update('end_date', e.target.value)}
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
