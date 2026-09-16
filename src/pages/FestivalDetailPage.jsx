import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { FestivalForm } from './FestivalsPage'

export default function FestivalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [festival, setFestival] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState('')

  const [captionDraft, setCaptionDraft] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .get(`/blog/festivals/${id}/`)
      .then(({ data }) => setFestival(data))
      .catch(() => setError('Фестиваль не найден.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function handleUpdate(payload) {
    await api.patch(`/blog/festivals/${id}/`, payload)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    setActionError('')
    try {
      await api.delete(`/blog/festivals/${id}/`)
      navigate('/festivals')
    } catch (err) {
      setActionError(extractErrorMessage(err))
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setPhotoError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('caption', captionDraft)
      await api.post(`/blog/festivals/${id}/photos/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setCaptionDraft('')
      load()
    } catch (err) {
      setPhotoError(extractErrorMessage(err, 'Не удалось загрузить фото.'))
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function deletePhoto(photoId) {
    setPhotoError('')
    try {
      await api.delete(`/blog/festivals/photos/${photoId}/`)
      load()
    } catch (err) {
      setPhotoError(extractErrorMessage(err))
    }
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>
  if (error || !festival) {
    return (
      <div>
        <p className="text-sm text-red mb-4">{error || 'Фестиваль не найден.'}</p>
        <Link to="/festivals" className="text-sm text-teal hover:underline">
          Ко всем фестивалям
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/festivals" className="text-xs text-faint hover:text-ink mb-4 inline-block">
        ← ко всем фестивалям
      </Link>

      {editing ? (
        <FestivalForm
          initial={festival}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Сохранить"
        />
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-1.5">{festival.title}</h1>
          <p className="text-xs text-faint mb-4">
            {new Date(festival.date_start).toLocaleDateString('ru-RU')}
            {festival.date_end
              ? ` – ${new Date(festival.date_end).toLocaleDateString('ru-RU')}`
              : ''}
          </p>
          {festival.description && (
            <p className="text-sm text-ink-soft leading-relaxed mb-8">{festival.description}</p>
          )}

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

      {festival.blog_posts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Посты блога о фестивале</h2>
          <ul className="space-y-2">
            {festival.blog_posts.map((p) => (
              <li key={p.id} className="border border-border-soft rounded-md px-3.5 py-3 text-sm">
                <Link to={`/blog/${p.slug}`} className="font-medium hover:text-accent-ink">
                  {p.title}
                </Link>
                <p className="text-xs text-faint mt-1">
                  {new Date(p.published_at).toLocaleDateString('ru-RU')} · {p.author}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink-soft mb-3">Фото</h2>
        {photoError && <p className="text-sm text-red mb-3">{photoError}</p>}
        {festival.photos.length === 0 ? (
          <p className="text-sm text-muted mb-4">Фото пока нет.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {festival.photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.image}
                  alt={photo.caption}
                  className="w-full aspect-video object-cover rounded-md border border-border-soft"
                />
                {photo.caption && <p className="text-xs text-faint mt-1">{photo.caption}</p>}
                {isAuthenticated && (
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 text-xs bg-bg/90 text-red px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 border border-border"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAuthenticated && (
          <div className="flex items-end gap-2 flex-wrap max-w-md">
            <Field label="Подпись" hint="Необязательно">
              <input
                className={inputClass}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm bg-surface border border-border rounded-md px-3.5 py-2 cursor-pointer hover:border-accent">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadPhoto}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto ? 'Загружаем…' : 'Загрузить фото'}
            </label>
          </div>
        )}
      </section>
    </div>
  )
}
