import { useEffect, useState } from 'react'
import RankBadge from '../components/RankBadge'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { penaltyTypeClass, penaltyTypeLabel } from '../lib/penalties'

const TABS = [
  { key: 'profile', label: 'Профиль' },
  { key: 'avatar', label: 'Аватар' },
  { key: 'displayname', label: 'Смена ника' },
  { key: 'transfers', label: 'Переводы' },
  { key: 'penalties', label: 'Взыскания' },
]

export default function CabinetPage() {
  const { user, refreshMe } = useAuth()
  const [tab, setTab] = useState('profile')

  if (!user) return null

  const expForLevel = 1000 // display-only scale, backend doesn't expose next-level threshold
  const expProgress = Math.min(100, Math.round(((user.experience % expForLevel) / expForLevel) * 100))

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="w-16 h-16 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{user.display_name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <RankBadge rank={user.rank} />
            <span className="text-xs text-muted">
              {user.school || 'без школы'} · уровень {user.level}
            </span>
          </div>
          <div className="w-40 h-1.5 rounded-full bg-surface-2 mt-2 overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${expProgress}%` }} />
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-faint uppercase tracking-wide">Баланс</div>
          <div className="text-lg font-mono text-accent-ink">{user.balance} крон</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-soft mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-accent text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab user={user} onSaved={refreshMe} />}
      {tab === 'avatar' && <AvatarTab user={user} onSaved={refreshMe} />}
      {tab === 'displayname' && <DisplaynameTab user={user} />}
      {tab === 'transfers' && <TransfersTab user={user} onSaved={refreshMe} />}
      {tab === 'penalties' && <PenaltiesTab user={user} />}
    </div>
  )
}

function ProfileTab({ user, onSaved }) {
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    name_visibility: user.name_visibility || 'hidden',
    birth_date: user.birth_date || '',
    birth_date_visibility: user.birth_date_visibility || 'hidden',
    character_description: user.character_description || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.patch('/accounts/me/', form)
      await onSaved()
      setMessage('Сохранено.')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {message && <p className="text-sm text-teal">{message}</p>}
      {error && <p className="text-sm text-red">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Имя">
          <input
            className={inputClass}
            value={form.first_name}
            onChange={(e) => update('first_name', e.target.value)}
          />
        </Field>
        <Field label="Фамилия">
          <input
            className={inputClass}
            value={form.last_name}
            onChange={(e) => update('last_name', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Видимость имени/фамилии" hint="По умолчанию скрыто в публичном профиле">
        <select
          className={inputClass}
          value={form.name_visibility}
          onChange={(e) => update('name_visibility', e.target.value)}
        >
          <option value="hidden">Скрыто</option>
          <option value="public">Показывать публично</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Дата рождения">
          <input
            type="date"
            className={inputClass}
            value={form.birth_date || ''}
            onChange={(e) => update('birth_date', e.target.value)}
          />
        </Field>
        <Field label="Видимость даты рождения">
          <select
            className={inputClass}
            value={form.birth_date_visibility}
            onChange={(e) => update('birth_date_visibility', e.target.value)}
          >
            <option value="hidden">Скрыто</option>
            <option value="day_month">Только день и месяц</option>
            <option value="full">Полностью</option>
          </select>
        </Field>
      </div>

      <Field label="Описание персонажа">
        <textarea
          className={inputClass}
          rows={4}
          value={form.character_description}
          onChange={(e) => update('character_description', e.target.value)}
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  )
}

function AvatarTab({ user, onSaved }) {
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get('/accounts/avatar-presets/')
      .then(({ data }) => setPresets(data))
      .catch(() => setError('Не удалось загрузить пресеты.'))
      .finally(() => setLoading(false))
  }, [])

  async function selectPreset(presetId) {
    setBusy(true)
    setError('')
    try {
      await api.post('/accounts/me/avatar/preset/', { preset_id: presetId })
      await onSaved()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      await api.post('/accounts/me/avatar/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Не удалось загрузить изображение.'))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-2xl">
      {error && <p className="text-sm text-red mb-4">{error}</p>}

      <div className="mb-8">
        <h2 className="text-sm font-medium text-ink-soft mb-3">Своё изображение</h2>
        {user.email_verified ? (
          <label className="inline-flex items-center gap-2 text-sm bg-surface border border-border rounded-md px-3.5 py-2 cursor-pointer hover:border-accent">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={busy} />
            Загрузить файл
          </label>
        ) : (
          <p className="text-sm text-muted bg-surface-2 border border-border-soft rounded-md px-3.5 py-2.5">
            Подтвердите email, чтобы загрузить свою аватарку — ссылка была отправлена при
            регистрации.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-ink-soft mb-3">Пресеты</h2>
        {loading ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset.id)}
                disabled={busy}
                title={preset.title}
                className="group aspect-square rounded-lg overflow-hidden border border-border hover:border-accent disabled:opacity-50"
              >
                <img src={preset.image} alt={preset.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DisplaynameTab({ user }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestedName, setRequestedName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api
      .get('/accounts/displayname-requests/')
      .then(({ data }) => setRequests(data))
      .catch(() => setError('Не удалось загрузить заявки.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const hasPending = requests.some((r) => r.status === 'pending')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/accounts/displayname-requests/', { requested_name: requestedName, reason })
      setRequestedName('')
      setReason('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm text-muted mb-4">
        Текущий ник: <span className="text-ink">{user.display_name}</span>. Изменить его можно
        только через заявку на рассмотрение.
      </p>

      {!hasPending && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {error && <p className="text-sm text-red">{error}</p>}
          <Field label="Новое имя">
            <input
              className={inputClass}
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              required
            />
          </Field>
          <Field label="Причина" hint="Необязательно">
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
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
      {hasPending && (
        <p className="text-sm text-accent-ink bg-accent-soft border border-accent/30 rounded-md px-3.5 py-2.5 mb-8">
          У вас уже есть заявка на рассмотрении — дождитесь решения.
        </p>
      )}

      <h2 className="text-sm font-medium text-ink-soft mb-3">История заявок</h2>
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted">Заявок ещё не было.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between text-sm border border-border-soft rounded-md px-3.5 py-2.5"
            >
              <span>
                {r.current_name} → <span className="text-ink">{r.requested_name}</span>
              </span>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TransfersTab({ user, onSaved }) {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api
      .get('/accounts/currency-transfers/')
      .then(({ data }) => setTransfers(data))
      .catch(() => setError('Не удалось загрузить переводы.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/accounts/currency-transfers/', {
        recipient,
        amount: Number(amount),
        message,
      })
      setRecipient('')
      setAmount('')
      setMessage('')
      load()
      await onSaved()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {error && <p className="text-sm text-red">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Кому" hint="Логин получателя">
            <input
              className={inputClass}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </Field>
          <Field label="Сумма">
            <input
              type="number"
              min="1"
              max={user.balance}
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Сообщение" hint="Необязательно">
          <input className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Отправляем…' : 'Перевести'}
        </button>
      </form>

      <h2 className="text-sm font-medium text-ink-soft mb-3">История переводов</h2>
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : transfers.length === 0 ? (
        <p className="text-sm text-muted">Переводов ещё не было.</p>
      ) : (
        <ul className="space-y-2">
          {transfers.map((t) => {
            const outgoing = t.sender === user.username
            return (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm border border-border-soft rounded-md px-3.5 py-2.5"
              >
                <span>
                  {outgoing ? `→ ${t.recipient}` : `← ${t.sender}`}
                  {t.message && <span className="text-faint"> · {t.message}</span>}
                </span>
                <span className={outgoing ? 'text-red' : 'text-teal'}>
                  {outgoing ? '-' : '+'}
                  {t.amount}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PenaltiesTab({ user }) {
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/penalties/')
      .then(({ data }) => {
        // Пользователи с правом на просмотр получают весь журнал взысканий —
        // здесь нужна только личная история, а не чужие записи.
        setPenalties(data.filter((p) => p.user === user.username))
      })
      .catch(() => setError('Не удалось загрузить историю взысканий.'))
      .finally(() => setLoading(false))
  }, [user.username])

  return (
    <div className="max-w-lg">
      <p className="text-sm text-muted mb-4">
        История видна только вам и уполномоченным ролям — публично не отображается.
      </p>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : penalties.length === 0 ? (
        <p className="text-sm text-muted">Взысканий нет.</p>
      ) : (
        <ul className="space-y-2">
          {penalties.map((p) => (
            <li key={p.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${penaltyTypeClass(p.type)}`}>
                  {penaltyTypeLabel(p.type)}
                </span>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-ink-soft">{p.reason}</p>
              <p className="text-xs text-faint mt-1.5">
                Вынес: {p.issued_by} · {new Date(p.issued_at).toLocaleDateString('ru-RU')}
              </p>
              {p.status === 'cancelled' && (
                <p className="text-xs text-teal mt-1">
                  Отменено ({p.cancelled_by}): {p.cancel_reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'На рассмотрении', cls: 'text-accent-ink bg-accent-soft' },
    approved: { label: 'Одобрено', cls: 'text-teal bg-teal-soft' },
    rejected: { label: 'Отклонено', cls: 'text-red bg-red-soft' },
    active: { label: 'Действует', cls: 'text-red bg-red-soft' },
    expired: { label: 'Истекло', cls: 'text-muted bg-surface-2' },
    cancelled: { label: 'Отменено', cls: 'text-teal bg-teal-soft' },
  }
  const entry = map[status] || { label: status, cls: 'text-muted bg-surface-2' }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${entry.cls}`}>{entry.label}</span>
}
