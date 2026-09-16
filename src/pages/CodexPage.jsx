import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function CodexPage() {
  const [codex, setCodex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/codex/')
      .then(({ data }) => setCodex(data))
      .catch(() => setError('Не удалось загрузить кодекс цеха.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Кодекс цеха</h1>
      <p className="text-sm text-muted mb-8">
        Правила и устав клуба. Редактируется только через админ-панель.
      </p>

      {error && <p className="text-sm text-red mb-6">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : codex && !codex.content ? (
        <p className="text-sm text-muted">Текст кодекса пока не загружен.</p>
      ) : (
        codex && (
          <>
            <div className="text-sm text-ink-soft leading-relaxed space-y-3 mb-4">
              {codex.content.split('\n').map((line, i) =>
                line ? <p key={i}>{line}</p> : <div key={i} className="h-1" />,
              )}
            </div>
            <p className="text-xs text-faint border-t border-border-soft pt-3">
              Обновлён {new Date(codex.updated_at).toLocaleDateString('ru-RU')}
            </p>
          </>
        )
      )}
    </div>
  )
}
