import { useEffect, useMemo, useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const emptyForm = { owner_type: 'club', owner: '', platform: '', url: '', label: '' }

const SECTIONS = [
  { key: 'club', title: 'Клуб' },
  { key: 'master', title: 'Мастера школ' },
  { key: 'armory', title: 'Оружейня' },
]

export default function SocialLinksPage() {
  const { user, isAuthenticated } = useAuth()
  const [links, setLinks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([api.get('/social-links/'), api.get('/accounts/users/')])
      .then(([l, u]) => {
        setLinks(l.data)
        setUsers(u.data)
      })
      .catch(() => setError('Не удалось загрузить ссылки.'))
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

  const byType = useMemo(() => {
    const map = { club: [], master: [], armory: [] }
    links.forEach((l) => {
      map[l.owner_type]?.push(l)
    })
    return map
  }, [links])

  async function handleCreate(payload) {
    await api.post('/social-links/', payload)
    setCreating(false)
    load()
  }

  async function handleUpdate(id, payload) {
    await api.patch(`/social-links/${id}/`, payload)
    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    setError('')
    try {
      await api.delete(`/social-links/${id}/`)
      setConfirmDeleteId(null)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Соц-сети</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Добавить ссылку'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-8">
        Клуб, мастера школ, оружейня. Мастер может вести только свою собственную ссылку.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-lg">
          <LinkForm users={users} currentUsername={user?.username} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted">Ссылок пока нет.</p>
      ) : (
        <div className="space-y-8 max-w-lg">
          {SECTIONS.filter((s) => byType[s.key].length > 0).map((section) => (
            <div key={section.key}>
              <h2 className="text-sm font-medium text-ink-soft mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {byType[section.key].map((link) => (
                  <li key={link.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent-ink"
                      >
                        <span className="font-medium">{link.platform}</span>
                        {link.label && <span className="text-ink-soft"> — {link.label}</span>}
                        {link.owner && (
                          <span className="text-faint"> · {usersByName[link.owner] || link.owner}</span>
                        )}
                      </a>
                      {isAuthenticated && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingId(link.id === editingId ? null : link.id)}
                            className="text-xs text-faint hover:text-ink"
                          >
                            Изменить
                          </button>
                          {confirmDeleteId === link.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(link.id)}
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
                              onClick={() => setConfirmDeleteId(link.id)}
                              className="text-xs text-faint hover:text-red"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {editingId === link.id && (
                      <div className="mt-3 pt-3 border-t border-border-soft">
                        <LinkForm
                          users={users}
                          currentUsername={user?.username}
                          initial={link}
                          onSubmit={(payload) => handleUpdate(link.id, payload)}
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

function LinkForm({ users, currentUsername, initial, onSubmit, onCancel, submitLabel = 'Добавить' }) {
  const [form, setForm] = useState(
    initial
      ? {
          owner_type: initial.owner_type,
          owner: initial.owner || '',
          platform: initial.platform,
          url: initial.url,
          label: initial.label || '',
        }
      : { ...emptyForm },
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateOwnerType(value) {
    setForm((f) => ({
      ...f,
      owner_type: value,
      owner: value === 'master' ? currentUsername || '' : '',
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        owner_type: form.owner_type,
        owner: form.owner_type === 'master' ? form.owner : null,
        platform: form.platform,
        url: form.url,
        label: form.label,
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
        <Field label="Тип владельца">
          <select
            className={inputClass}
            value={form.owner_type}
            onChange={(e) => updateOwnerType(e.target.value)}
          >
            <option value="club">Клуб</option>
            <option value="master">Мастер школы</option>
            <option value="armory">Оружейня</option>
          </select>
        </Field>
        {form.owner_type === 'master' && (
          <Field label="Мастер">
            <select className={inputClass} value={form.owner} onChange={(e) => update('owner', e.target.value)} required>
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
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Платформа" hint="Telegram, VK, Instagram…">
          <input
            className={inputClass}
            value={form.platform}
            onChange={(e) => update('platform', e.target.value)}
            required
          />
        </Field>
        <Field label="Ссылка">
          <input
            type="url"
            className={inputClass}
            value={form.url}
            onChange={(e) => update('url', e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Подпись" hint="Необязательно">
        <input className={inputClass} value={form.label} onChange={(e) => update('label', e.target.value)} />
      </Field>

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
