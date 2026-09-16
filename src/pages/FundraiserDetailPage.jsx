import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { FundraiserForm } from './FundraisersPage'

const STATUS_LABEL = { active: 'Активен', completed: 'Завершён', cancelled: 'Отменён' }

export default function FundraiserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [fundraiser, setFundraiser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState('')
  const [addingContribution, setAddingContribution] = useState(false)

  function load() {
    setLoading(true)
    setError('')
    Promise.all([api.get(`/fundraisers/${id}/`), api.get('/accounts/users/')])
      .then(([f, u]) => {
        setFundraiser(f.data)
        setUsers(u.data)
      })
      .catch(() => setError('Сбор не найден.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function handleUpdate(payload) {
    await api.patch(`/fundraisers/${id}/`, payload)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    setActionError('')
    try {
      await api.delete(`/fundraisers/${id}/`)
      navigate('/fundraisers')
    } catch (err) {
      setActionError(extractErrorMessage(err))
    }
  }

  async function handleContribution(payload) {
    await api.post(`/fundraisers/${id}/contributions/`, payload)
    setAddingContribution(false)
    load()
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>
  if (error || !fundraiser) {
    return (
      <div>
        <p className="text-sm text-red mb-4">{error || 'Сбор не найден.'}</p>
        <Link to="/fundraisers" className="text-sm text-teal hover:underline">
          Ко всем сборам
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/fundraisers" className="text-xs text-faint hover:text-ink mb-4 inline-block">
        ← ко всем сборам
      </Link>

      {editing ? (
        <FundraiserForm
          initial={fundraiser}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Сохранить"
        />
      ) : (
        <>
          {fundraiser.cover_image && (
            <img
              src={fundraiser.cover_image}
              alt=""
              className="w-full aspect-video object-cover rounded-lg mb-5 border border-border-soft"
            />
          )}

          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-2xl font-semibold">{fundraiser.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted shrink-0">
              {STATUS_LABEL[fundraiser.status] || fundraiser.status}
            </span>
          </div>

          {fundraiser.description && (
            <p className="text-sm text-ink-soft leading-relaxed mb-4">{fundraiser.description}</p>
          )}

          <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden mb-1.5">
            <div className="h-full bg-accent" style={{ width: `${fundraiser.progress_percent}%` }} />
          </div>
          <p className="text-sm text-faint mb-6">
            {fundraiser.raised_amount} / {fundraiser.goal_amount} BYN · {fundraiser.progress_percent}%
          </p>

          {isAuthenticated && (
            <div className="flex items-center gap-2 mb-8">
              {actionError && <p className="text-sm text-red">{actionError}</p>}
              <button
                onClick={() => setEditing(true)}
                className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
              >
                Редактировать
              </button>
              {confirmDelete ? (
                <>
                  <span className="text-xs text-faint">удалить безвозвратно?</span>
                  <button
                    onClick={handleDelete}
                    className="text-xs bg-red text-bg font-medium rounded-md px-2.5 py-1.5"
                  >
                    Да
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-faint hover:text-ink"
                  >
                    Нет
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs border border-border rounded-md px-2.5 py-1.5 text-faint hover:border-red hover:text-red"
                >
                  Удалить
                </button>
              )}
            </div>
          )}
        </>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ink-soft">Взносы</h2>
          {isAuthenticated && (
            <button
              onClick={() => setAddingContribution((v) => !v)}
              className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink"
            >
              {addingContribution ? 'Отмена' : 'Зафиксировать взнос'}
            </button>
          )}
        </div>

        {addingContribution && (
          <div className="mb-6 max-w-md">
            <ContributionForm users={users} onSubmit={handleContribution} onCancel={() => setAddingContribution(false)} />
          </div>
        )}

        {fundraiser.contributions.length === 0 ? (
          <p className="text-sm text-muted">Взносов пока нет.</p>
        ) : (
          <ul className="space-y-2 max-w-md">
            {fundraiser.contributions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 text-sm border border-border-soft rounded-md px-3.5 py-2.5"
              >
                <div>
                  <span className="font-medium">{c.contributor_display}</span>
                  {c.comment && <p className="text-xs text-faint mt-0.5">{c.comment}</p>}
                  <p className="text-xs text-faint mt-0.5">
                    {new Date(c.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className="text-sm font-mono text-accent-ink shrink-0">{c.amount} BYN</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ContributionForm({ users, onSubmit, onCancel }) {
  const [contributorType, setContributorType] = useState('member')
  const [contributor, setContributor] = useState('')
  const [contributorName, setContributorName] = useState('')
  const [amount, setAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        contributor: contributorType === 'member' ? contributor || null : null,
        contributor_name: contributorType === 'guest' ? contributorName : '',
        amount,
        is_anonymous: isAnonymous,
        comment,
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

      <div className="flex gap-4 text-sm text-ink-soft">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={contributorType === 'member'}
            onChange={() => setContributorType('member')}
          />
          Участник клуба
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={contributorType === 'guest'}
            onChange={() => setContributorType('guest')}
          />
          Гость
        </label>
      </div>

      {contributorType === 'member' ? (
        <Field label="Донатер">
          <select className={inputClass} value={contributor} onChange={(e) => setContributor(e.target.value)} required>
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
      ) : (
        <Field label="Имя гостя" hint="Необязательно — оставьте пустым для анонима">
          <input className={inputClass} value={contributorName} onChange={(e) => setContributorName(e.target.value)} />
        </Field>
      )}

      <Field label="Сумма, BYN">
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputClass}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </Field>

      <Field label="Комментарий" hint="Необязательно">
        <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
        Показывать как анонимный взнос
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg font-medium rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Сохраняем…' : 'Зафиксировать'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-faint hover:text-ink px-2">
          Отмена
        </button>
      </div>
    </form>
  )
}
