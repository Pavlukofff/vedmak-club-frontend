import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, extractErrorMessage } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { isAuthenticated, refreshMe } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('В ссылке нет токена подтверждения.')
      return
    }
    api
      .get('/accounts/verify-email/', { params: { token } })
      .then(async () => {
        setStatus('success')
        if (isAuthenticated) await refreshMe()
      })
      .catch((error) => {
        setStatus('error')
        setMessage(extractErrorMessage(error, 'Ссылка недействительна или уже использована.'))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="max-w-md mx-auto text-center py-10">
      {status === 'loading' && <p className="text-muted">Проверяем ссылку…</p>}
      {status === 'success' && (
        <>
          <h1 className="text-xl font-semibold mb-2">Почта подтверждена</h1>
          <p className="text-sm text-muted mb-6">
            Теперь можно загрузить собственный аватар в личном кабинете.
          </p>
          <Link to="/cabinet" className="text-teal hover:underline text-sm">
            В личный кабинет
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-xl font-semibold mb-2 text-red">Не получилось подтвердить</h1>
          <p className="text-sm text-muted">{message}</p>
        </>
      )}
    </div>
  )
}
