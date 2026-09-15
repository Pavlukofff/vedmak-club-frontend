import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { extractErrorMessage, useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      const redirectTo = location.state?.from?.pathname || '/cabinet'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Неверный логин или пароль.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Вход в цех</h1>
      <p className="text-sm text-muted mb-6">
        Ещё нет аккаунта?{' '}
        <Link to="/register" className="text-teal hover:underline">
          Зарегистрироваться
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red bg-red-soft border border-red/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <Field label="Логин">
          <input
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Пароль">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-bg font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Входим…' : 'Войти'}
        </button>
      </form>

      <div className="mt-8 text-xs text-faint border border-border-soft rounded-md px-3 py-2.5">
        Демо-доступы: <span className="font-mono">admin / AdminDemo123!</span>,{' '}
        <span className="font-mono">geralt / Demo12345!</span>,{' '}
        <span className="font-mono">yennefer / Demo12345!</span>
      </div>
    </div>
  )
}
