import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { toDatetimeLocal } from '../lib/datetime'
import { BRACKET_SECTIONS, STATUSES, bracketTypeLabel, statusClass, statusLabel } from '../lib/tournaments'

export default function TournamentDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [users, setUsers] = useState([])
  const [battles, setBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [newUser, setNewUser] = useState('')
  const [newSeed, setNewSeed] = useState('')
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [participantError, setParticipantError] = useState('')

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const [captionDraft, setCaptionDraft] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  function load() {
    setLoading(true)
    Promise.all([api.get(`/tournaments/${id}/`), api.get('/accounts/users/'), api.get('/battles/')])
      .then(([t, u, b]) => {
        setTournament(t.data)
        setUsers(u.data)
        setBattles(b.data)
      })
      .catch(() => setError('Не удалось загрузить турнир.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const usersByName = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      map[u.username] = u.display_name
    })
    return map
  }, [users])

  function displayName(username) {
    if (!username) return null
    return usersByName[username] || username
  }

  const participantUsernames = useMemo(
    () => new Set((tournament?.participants || []).map((p) => p.user)),
    [tournament],
  )

  async function updateStatus(newStatus) {
    setStatusSaving(true)
    setStatusError('')
    try {
      await api.patch(`/tournaments/${id}/`, { status: newStatus })
      load()
    } catch (err) {
      setStatusError(extractErrorMessage(err))
    } finally {
      setStatusSaving(false)
    }
  }

  async function addParticipant(e) {
    e.preventDefault()
    setAddingParticipant(true)
    setParticipantError('')
    try {
      await api.post(`/tournaments/${id}/participants/`, { user: newUser, seed: Number(newSeed) })
      setNewUser('')
      setNewSeed('')
      load()
    } catch (err) {
      setParticipantError(extractErrorMessage(err))
    } finally {
      setAddingParticipant(false)
    }
  }

  async function generateBracket() {
    setGenerating(true)
    setGenerateError('')
    try {
      await api.post(`/tournaments/${id}/generate-bracket/`)
      load()
    } catch (err) {
      setGenerateError(extractErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function linkExistingBattle(matchId, battleId) {
    await api.patch(`/tournaments/matches/${matchId}/battle/`, { battle: battleId })
    load()
  }

  async function recordAndLinkBattle(matchId, payload) {
    const { data: battle } = await api.post('/battles/', { ...payload, tournament: Number(id) })
    await api.patch(`/tournaments/matches/${matchId}/battle/`, { battle: battle.id })
    load()
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
      await api.post(`/tournaments/${id}/photos/`, formData, {
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
      await api.delete(`/tournaments/photos/${photoId}/`)
      load()
    } catch (err) {
      setPhotoError(extractErrorMessage(err))
    }
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>
  if (error && !tournament) {
    return (
      <div>
        <p className="text-sm text-red mb-4">{error}</p>
        <Link to="/tournaments" className="text-sm text-teal hover:underline">
          Ко всем турнирам
        </Link>
      </div>
    )
  }
  if (!tournament) return null

  return (
    <div>
      <Link to="/tournaments" className="text-xs text-faint hover:text-ink mb-3 inline-block">
        ← ко всем турнирам
      </Link>

      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-semibold">{tournament.title}</h1>
        {isAuthenticated ? (
          <select
            value={tournament.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={statusSaving}
            className={`text-xs px-2 py-0.5 rounded-full shrink-0 border-0 cursor-pointer disabled:opacity-50 ${statusClass(tournament.status)}`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass(tournament.status)}`}>
            {statusLabel(tournament.status)}
          </span>
        )}
      </div>
      {statusError && <p className="text-sm text-red mb-2">{statusError}</p>}

      {tournament.description && (
        <p className="text-sm text-ink-soft mb-3">{tournament.description}</p>
      )}
      <p className="text-xs text-faint mb-6">
        {new Date(tournament.date_start).toLocaleDateString('ru-RU')}
        {tournament.date_end ? ` – ${new Date(tournament.date_end).toLocaleDateString('ru-RU')}` : ''}
        {' · '}
        {bracketTypeLabel(tournament.bracket_type)}
      </p>

      {(tournament.winner || tournament.runner_up) && (
        <div className="flex items-center gap-4 mb-8 text-sm">
          {tournament.winner && (
            <Link to={`/u/${tournament.winner}`} className="text-accent-ink hover:underline">
              🏆 {displayName(tournament.winner)}
            </Link>
          )}
          {tournament.runner_up && (
            <Link to={`/u/${tournament.runner_up}`} className="text-muted hover:underline">
              🥈 {displayName(tournament.runner_up)}
            </Link>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      <section className="mb-10 max-w-lg">
        <h2 className="text-sm font-medium text-ink-soft mb-3">Участники</h2>
        {tournament.participants.length === 0 ? (
          <p className="text-sm text-muted mb-4">Участников пока нет.</p>
        ) : (
          <ul className="space-y-1.5 mb-4">
            {tournament.participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-sm border border-border-soft rounded-md px-3.5 py-2"
              >
                <Link to={`/u/${p.user}`} className="hover:text-accent-ink">
                  {displayName(p.user)}
                </Link>
                <span className="text-faint text-xs">посев #{p.seed}</span>
              </li>
            ))}
          </ul>
        )}

        {isAuthenticated && !tournament.bracket_generated && (
          <>
            <form onSubmit={addParticipant} className="flex items-end gap-2 flex-wrap">
              {participantError && <p className="text-sm text-red w-full">{participantError}</p>}
              <Field label="Участник">
                <select
                  className={inputClass}
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Выберите…
                  </option>
                  {users
                    .filter((u) => !participantUsernames.has(u.username))
                    .map((u) => (
                      <option key={u.username} value={u.username}>
                        {u.display_name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Посев">
                <input
                  type="number"
                  min="1"
                  className={`${inputClass} w-24`}
                  value={newSeed}
                  onChange={(e) => setNewSeed(e.target.value)}
                  required
                />
              </Field>
              <button
                type="submit"
                disabled={addingParticipant}
                className="bg-accent text-bg font-medium rounded-md px-3.5 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {addingParticipant ? 'Добавляем…' : 'Добавить'}
              </button>
            </form>

            <div className="mt-4">
              {generateError && <p className="text-sm text-red mb-2">{generateError}</p>}
              <button
                onClick={generateBracket}
                disabled={generating || tournament.participants.length < 2}
                className="text-sm border border-border rounded-md px-3.5 py-2 text-ink-soft hover:border-accent hover:text-ink disabled:opacity-50"
              >
                {generating ? 'Генерируем…' : 'Сгенерировать сетку'}
              </button>
              {tournament.participants.length < 2 && (
                <p className="text-xs text-faint mt-1.5">Нужно минимум 2 участника.</p>
              )}
            </div>
          </>
        )}
      </section>

      {tournament.bracket_generated && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-soft mb-3">Сетка</h2>
          <div className="space-y-8">
            {BRACKET_SECTIONS.filter((s) => tournament.brackets[s.key]).map((section) => (
              <div key={section.key}>
                <h3 className="text-xs font-medium text-faint uppercase tracking-wide mb-2.5">
                  {section.label}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {tournament.brackets[section.key].map((round) => (
                    <div key={round.round} className="flex flex-col gap-3 shrink-0 w-60">
                      <p className="text-xs text-faint text-center">Раунд {round.round}</p>
                      {round.matches.map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          displayName={displayName}
                          users={users}
                          battles={battles}
                          isAuthenticated={isAuthenticated}
                          onLinkExisting={(battleId) => linkExistingBattle(m.id, battleId)}
                          onRecordNew={(payload) => recordAndLinkBattle(m.id, payload)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink-soft mb-3">Фото</h2>
        {photoError && <p className="text-sm text-red mb-3">{photoError}</p>}
        {tournament.photos.length === 0 ? (
          <p className="text-sm text-muted mb-4">Фото пока нет.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {tournament.photos.map((photo) => (
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

function MatchCard({ match, displayName, users, battles, isAuthenticated, onLinkExisting, onRecordNew }) {
  const { participant1: p1, participant2: p2, winner } = match
  const [mode, setMode] = useState(null) // null | 'existing' | 'new'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const linkedBattle = match.battle ? battles.find((b) => b.id === match.battle) : null

  const candidates =
    p1 && p2
      ? battles.filter(
          (b) =>
            (b.fighter1 === p1.user && b.fighter2 === p2.user) ||
            (b.fighter1 === p2.user && b.fighter2 === p1.user),
        )
      : []

  // Настоящий бай (сосед никогда не появится) возможен только в 1-м раунде
  // верхней сетки — см. docstring TournamentMatch на бэкенде. В остальных
  // случаях пустой слот при заполненном соседе значит «ожидается победитель
  // предыдущего матча», а не бай.
  const isFirstUpperRound = match.bracket === 'upper' && match.round_number === 1

  function slotLabel(p, otherPresent) {
    if (p) return `#${p.seed} ${displayName(p.user)}`
    if (!otherPresent) return 'TBD'
    return isFirstUpperRound ? 'бай' : 'ожидается'
  }

  async function handleLinkExisting(battleId) {
    setSubmitting(true)
    setError('')
    try {
      await onLinkExisting(battleId)
      setMode(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecordNew(payload) {
    setSubmitting(true)
    setError('')
    try {
      await onRecordNew(payload)
      setMode(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-border-soft rounded-md p-2.5 bg-surface text-xs">
      <div
        className={`px-1.5 py-1 rounded ${
          winner && p1 && winner.id === p1.id ? 'bg-accent-soft text-accent-ink font-medium' : ''
        }`}
      >
        {slotLabel(p1, Boolean(p2))}
      </div>
      <div
        className={`px-1.5 py-1 rounded ${
          winner && p2 && winner.id === p2.id ? 'bg-accent-soft text-accent-ink font-medium' : ''
        }`}
      >
        {slotLabel(p2, Boolean(p1))}
      </div>

      {linkedBattle && (linkedBattle.main_judge || linkedBattle.side_judge) && (
        <p className="text-faint mt-1.5 pt-1.5 border-t border-border-soft leading-relaxed">
          судья: {displayName(linkedBattle.main_judge) || '—'}
          {linkedBattle.side_judge && `, ${displayName(linkedBattle.side_judge)}`}
        </p>
      )}

      {isAuthenticated && p1 && p2 && !winner && (
        <div className="mt-2 pt-2 border-t border-border-soft">
          {error && <p className="text-red mb-1.5">{error}</p>}

          {!mode && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setMode('new')}
                className="text-xs bg-accent text-bg rounded px-2 py-1"
              >
                Записать бой
              </button>
              {candidates.length > 0 && (
                <button
                  onClick={() => setMode('existing')}
                  className="text-xs border border-border rounded px-2 py-1 text-ink-soft hover:border-accent"
                >
                  Готовый бой
                </button>
              )}
            </div>
          )}

          {mode === 'existing' && (
            <ExistingBattlePicker
              candidates={candidates}
              displayName={displayName}
              submitting={submitting}
              onSubmit={handleLinkExisting}
              onCancel={() => setMode(null)}
            />
          )}

          {mode === 'new' && (
            <NewBattleForm
              p1={p1}
              p2={p2}
              users={users}
              displayName={displayName}
              submitting={submitting}
              onSubmit={handleRecordNew}
              onCancel={() => setMode(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ExistingBattlePicker({ candidates, displayName, submitting, onSubmit, onCancel }) {
  const [battleId, setBattleId] = useState('')

  return (
    <div className="space-y-1.5">
      <select
        className={`${inputClass} text-xs py-1`}
        value={battleId}
        onChange={(e) => setBattleId(e.target.value)}
      >
        <option value="" disabled>
          бой…
        </option>
        {candidates.map((b) => (
          <option key={b.id} value={b.id}>
            {new Date(b.date).toLocaleDateString('ru-RU')} ·{' '}
            {b.winner ? `победил ${displayName(b.winner)}` : 'без победителя'}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <button
          onClick={() => battleId && onSubmit(Number(battleId))}
          disabled={!battleId || submitting}
          className="text-xs bg-accent text-bg rounded px-2 py-1 disabled:opacity-50"
        >
          OK
        </button>
        <button onClick={onCancel} className="text-xs text-faint hover:text-ink px-1">
          Отмена
        </button>
      </div>
    </div>
  )
}

function NewBattleForm({ p1, p2, users, displayName, submitting, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    type: 'ТС',
    winner: '',
    is_ranked: false,
    main_judge: '',
    side_judge: '',
    date: toDatetimeLocal(new Date().toISOString()),
    notes: '',
  })

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      type: form.type,
      fighter1: p1.user,
      fighter2: p2.user,
      winner: form.winner || null,
      is_ranked: form.is_ranked,
      main_judge: form.main_judge || null,
      side_judge: form.side_judge || null,
      date: new Date(form.date).toISOString(),
      notes: form.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <select
        className={`${inputClass} text-xs py-1`}
        value={form.type}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="ТС">ТС — Тренировочная Схватка</option>
        <option value="РС">РС — Ролевая Схватка</option>
      </select>

      <select
        className={`${inputClass} text-xs py-1`}
        value={form.winner}
        onChange={(e) => update('winner', e.target.value)}
      >
        <option value="">ничья</option>
        <option value={p1.user}>{displayName(p1.user)}</option>
        <option value={p2.user}>{displayName(p2.user)}</option>
      </select>

      <label className="flex items-center gap-1.5 text-ink-soft">
        <input
          type="checkbox"
          checked={form.is_ranked}
          onChange={(e) => update('is_ranked', e.target.checked)}
        />
        ранговый / квестовый
      </label>

      <select
        className={`${inputClass} text-xs py-1`}
        value={form.main_judge}
        onChange={(e) => update('main_judge', e.target.value)}
        required={form.is_ranked}
      >
        <option value="">гл. судья{form.is_ranked ? ' *' : ' (необязательно)'}</option>
        {users.map((u) => (
          <option key={u.username} value={u.username}>
            {u.display_name}
          </option>
        ))}
      </select>

      <select
        className={`${inputClass} text-xs py-1`}
        value={form.side_judge}
        onChange={(e) => update('side_judge', e.target.value)}
      >
        <option value="">бок. судья (необязательно)</option>
        {users.map((u) => (
          <option key={u.username} value={u.username}>
            {u.display_name}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        className={`${inputClass} text-xs py-1`}
        value={form.date}
        onChange={(e) => update('date', e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="заметки (необязательно)"
        className={`${inputClass} text-xs py-1`}
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
      />

      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={submitting}
          className="text-xs bg-accent text-bg rounded px-2 py-1 disabled:opacity-50"
        >
          {submitting ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-faint hover:text-ink px-1">
          Отмена
        </button>
      </div>
    </form>
  )
}
