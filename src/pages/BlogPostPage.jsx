import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { PostForm } from './BlogPage'

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [post, setPost] = useState(null)
  const [festivals, setFestivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    Promise.all([api.get(`/blog/posts/${slug}/`), api.get('/blog/festivals/')])
      .then(([p, f]) => {
        setPost(p.data)
        setFestivals(f.data)
      })
      .catch(() => setError('Пост не найден.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [slug])

  async function handleUpdate(formData) {
    await api.patch(`/blog/posts/${slug}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setEditing(false)
    load()
  }

  async function handleDelete() {
    setActionError('')
    try {
      await api.delete(`/blog/posts/${slug}/`)
      navigate('/blog')
    } catch (err) {
      setActionError(extractErrorMessage(err))
    }
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>
  if (error || !post) {
    return (
      <div>
        <p className="text-sm text-red mb-4">{error || 'Пост не найден.'}</p>
        <Link to="/blog" className="text-sm text-teal hover:underline">
          Ко всем постам
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/blog" className="text-xs text-faint hover:text-ink mb-4 inline-block">
        ← ко всем постам
      </Link>

      {editing ? (
        <PostForm
          initial={post}
          festivals={festivals}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Сохранить"
        />
      ) : (
        <>
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt=""
              className="w-full aspect-video object-cover rounded-lg mb-5 border border-border-soft"
            />
          )}

          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h1 className="text-2xl font-semibold">{post.title}</h1>
            {!post.is_published && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-soft text-accent-ink shrink-0">
                черновик
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-faint mb-6">
            <span>{new Date(post.published_at).toLocaleDateString('ru-RU')}</span>
            <span>
              · <Link to={`/u/${post.author}`} className="hover:text-accent-ink">{post.author}</Link>
            </span>
            {post.festival && (
              <span>
                ·{' '}
                <Link to={`/festivals/${post.festival.id}`} className="text-accent-ink hover:underline">
                  🎪 {post.festival.title}
                </Link>
              </span>
            )}
          </div>

          <div className="text-sm text-ink-soft leading-relaxed space-y-3 mb-8">
            {post.content.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {isAuthenticated && (
            <div className="border-t border-border-soft pt-4">
              {actionError && <p className="text-sm text-red mb-3">{actionError}</p>}
              <div className="flex items-center gap-2">
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
