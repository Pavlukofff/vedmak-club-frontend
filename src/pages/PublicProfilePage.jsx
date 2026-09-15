import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RankBadge from '../components/RankBadge'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { PENALTY_TYPES, penaltyTypeClass, penaltyTypeLabel } from '../lib/penalties'

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatBirthDate(value) {
  if (!value) return null
  if (typeof value === 'object') {
    return `${value.day} ${MONTHS[value.month - 1] || ''}`.trim()
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .get(`/accounts/users/${username}/`)
      .then(({ data }) => setProfile(data))
      .catch(() => setError('Участник не найден.'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>
  if (error) {
    return (
      <div>
        <p className="text-sm text-red mb-4">{error}</p>
        <Link to="/users" className="text-sm text-teal hover:underline">
          Ко всем участникам
        </Link>
      </div>
    )
  }
  if (!profile) return null

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  const birthDate = formatBirthDate(profile.birth_date)
  const stats = profile.battle_stats

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-5 mb-8">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt=""
            className="w-20 h-20 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-surface-2 border border-border" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
          {fullName && <p className="text-sm text-muted">{fullName}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <RankBadge rank={profile.rank} />
            {profile.roles?.map((role) => (
              <span
                key={role}
                className="text-xs font-medium px-2.5 py-1 rounded-full border border-teal text-teal bg-teal-soft"
              >
                {role}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted mt-2">
            {profile.school || 'без школы'} · уровень {profile.level}
          </p>
          {birthDate && <p className="text-xs text-faint mt-1">Родился(ась) {birthDate}</p>}
        </div>
      </div>

      {profile.character_description && (
        <p className="text-sm text-ink-soft mb-8 leading-relaxed">{profile.character_description}</p>
      )}

      {profile.titles?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-ink-soft mb-2">Титулы</h2>
          <div className="flex flex-wrap gap-2">
            {profile.titles.map((title) => (
              <span
                key={title}
                className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent-ink"
              >
                {title}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Статистика боёв</h2>
          <div className="grid grid-cols-4 gap-3 max-w-md">
            <Stat label="Боёв" value={stats.battles} />
            <Stat label="Побед" value={stats.wins} />
            <Stat label="Поражений" value={stats.losses} />
            <Stat label="Винрейт" value={`${stats.winrate}%`} />
          </div>
        </div>
      )}

      {currentUser && currentUser.username !== profile.username && (
        <PenaltiesModeration profile={profile} />
      )}
    </div>
  )
}

function PenaltiesModeration({ profile }) {
  const [penalties, setPenalties] = useState([])
  const [canView, setCanView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ type: 'remark', reason: '', expires_at: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [issueError, setIssueError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  function load() {
    setLoading(true)
    api
      .get('/penalties/', { params: { user: profile.username } })
      .then(({ data }) => {
        // Без права на просмотр бэкенд игнорирует ?user= и отдаёт вызывающего —
        // отфильтровываем и по этому признаку понимаем, есть ли доступ.
        const matched = data.filter((p) => p.user === profile.username)
        setCanView(data.length === 0 || matched.length > 0)
        setPenalties(matched)
      })
      .catch(() => setCanView(false))
      .finally(() => setLoading(false))
  }

  useEffect(load, [profile.id, profile.username])

  async function handleIssue(e) {
    e.preventDefault()
    setSubmitting(true)
    setIssueError('')
    try {
      await api.post('/penalties/', {
        user: profile.username,
        type: form.type,
        reason: form.reason,
        expires_at: form.expires_at || null,
      })
      setForm({ type: 'remark', reason: '', expires_at: '' })
      setFormOpen(false)
      load()
    } catch (err) {
      setIssueError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(penaltyId) {
    setError('')
    try {
      await api.post(`/penalties/${penaltyId}/cancel/`, { cancel_reason: cancelReason })
      setCancellingId(null)
      setCancelReason('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  if (loading) return null

  return (
    <div className="border-t border-border-soft pt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-ink-soft">Взыскания</h2>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
        >
          {formOpen ? 'Отмена' : 'Вынести взыскание'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleIssue} className="space-y-3 mb-6 max-w-md border border-border-soft rounded-md p-4">
          {issueError && <p className="text-sm text-red">{issueError}</p>}
          <Field label="Тип взыскания">
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {PENALTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Причина">
            <textarea
              className={inputClass}
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              required
            />
          </Field>
          <Field label="Действует до" hint="Необязательно — для авто-сгорающих взысканий">
            <input
              type="date"
              className={inputClass}
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Отправляем…' : 'Вынести взыскание'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red mb-3">{error}</p>}

      {!canView ? (
        <p className="text-sm text-muted">У вас нет прав на просмотр истории взысканий этого участника.</p>
      ) : penalties.length === 0 ? (
        <p className="text-sm text-muted">Взысканий нет.</p>
      ) : (
        <ul className="space-y-2 max-w-md">
          {penalties.map((p) => (
            <li key={p.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${penaltyTypeClass(p.type)}`}>
                  {penaltyTypeLabel(p.type)}
                </span>
                {p.status === 'active' ? (
                  <button
                    onClick={() => {
                      setCancellingId(p.id === cancellingId ? null : p.id)
                      setCancelReason('')
                    }}
                    className="text-xs text-faint hover:text-red"
                  >
                    Отменить
                  </button>
                ) : (
                  <span className="text-xs text-faint">
                    {p.status === 'cancelled' ? 'отменено' : 'истекло'}
                  </span>
                )}
              </div>
              <p className="text-ink-soft">{p.reason}</p>
              <p className="text-xs text-faint mt-1.5">
                Вынес: {p.issued_by} · {new Date(p.issued_at).toLocaleDateString('ru-RU')}
              </p>
              {cancellingId === p.id && (
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border-soft">
                  <input
                    className={`${inputClass} text-xs py-1.5`}
                    placeholder="Причина отмены"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleCancel(p.id)}
                    disabled={!cancelReason.trim()}
                    className="text-xs bg-accent text-bg font-medium rounded-md px-3 py-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    Подтвердить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="border border-border-soft rounded-md px-3 py-2.5 text-center">
      <div className="text-lg font-mono text-ink">{value}</div>
      <div className="text-[11px] text-faint uppercase tracking-wide">{label}</div>
    </div>
  )
}
