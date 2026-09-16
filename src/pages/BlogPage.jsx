import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { toDatetimeLocal } from '../lib/datetime'

export default function BlogPage() {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [festivals, setFestivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([api.get('/blog/posts/'), api.get('/blog/festivals/')])
      .then(([p, f]) => {
        setPosts(p.data)
        setFestivals(f.data)
      })
      .catch(() => setError('Не удалось загрузить блог.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Блог</h1>
        {isAuthenticated && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-xs border border-border rounded-md px-2.5 py-1.5 text-ink-soft hover:border-accent hover:text-ink shrink-0"
          >
            {creating ? 'Отмена' : 'Написать пост'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-8">Новости и заметки клуба.</p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {creating && (
        <div className="mb-8 max-w-2xl">
          <PostForm
            festivals={festivals}
            onSubmit={async (payload) => {
              await api.post('/blog/posts/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
              })
              setCreating(false)
              load()
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">Постов пока нет.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="border border-border-soft rounded-lg overflow-hidden bg-surface hover:border-accent block"
            >
              {p.cover_image && (
                <img src={p.cover_image} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-medium">{p.title}</h3>
                  {!p.is_published && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-soft text-accent-ink shrink-0">
                      черновик
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-soft leading-relaxed mb-2 line-clamp-3">
                  {p.excerpt || p.content}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-faint">
                  <span>{new Date(p.published_at).toLocaleDateString('ru-RU')}</span>
                  <span>· {p.author}</span>
                  {p.festival && <span className="text-accent-ink">· 🎪 {p.festival.title}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function PostForm({ initial, festivals, onSubmit, onCancel, submitLabel = 'Опубликовать' }) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          excerpt: initial.excerpt || '',
          content: initial.content,
          festival: initial.festival?.id ? String(initial.festival.id) : '',
          is_published: initial.is_published,
          published_at: toDatetimeLocal(initial.published_at),
        }
      : {
          title: '',
          excerpt: '',
          content: '',
          festival: '',
          is_published: true,
          published_at: toDatetimeLocal(new Date().toISOString()),
        },
  )
  const [coverImage, setCoverImage] = useState(null)
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
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('excerpt', form.excerpt)
      formData.append('content', form.content)
      if (form.festival) formData.append('festival', form.festival)
      formData.append('is_published', form.is_published)
      formData.append('published_at', new Date(form.published_at).toISOString())
      if (coverImage) formData.append('cover_image', coverImage)
      await onSubmit(formData)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-border-soft rounded-md p-4">
      {error && <p className="text-sm text-red">{error}</p>}

      <Field label="Заголовок">
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </Field>

      <Field label="Текст">
        <textarea
          className={inputClass}
          rows={6}
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          required
        />
      </Field>

      <Field label="Краткое превью" hint="Необязательно — если пусто, в списке покажется начало текста">
        <textarea
          className={inputClass}
          rows={2}
          value={form.excerpt}
          onChange={(e) => update('excerpt', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Фестиваль" hint="Необязательно">
          <select
            className={inputClass}
            value={form.festival}
            onChange={(e) => update('festival', e.target.value)}
          >
            <option value="">не привязан</option>
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Дата публикации">
          <input
            type="datetime-local"
            className={inputClass}
            value={form.published_at}
            onChange={(e) => update('published_at', e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Обложка" hint="Необязательно">
        <input
          type="file"
          accept="image/*"
          className={inputClass}
          onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => update('is_published', e.target.checked)}
        />
        Опубликован
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
