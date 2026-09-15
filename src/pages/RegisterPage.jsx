import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { useAuth } from '../lib/AuthContext'

const initialForm = {
  username: '',
  email: '',
  password: '',
  password2: '',
  display_name: '',
  birth_date: '',
  agree_to_rules: false,
}

function fieldError(errors, key) {
  const value = errors?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default function RegisterPage() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)
    try {
      await register(form)
      await login(form.username, form.password)
      navigate('/cabinet')
    } catch (error) {
      const data = error?.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        if (data.detail) setGeneralError(data.detail)
      } else {
        setGeneralError('Не удалось зарегистрироваться. Попробуйте ещё раз.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Вступить в цех</h1>
      <p className="text-sm text-muted mb-6">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-teal hover:underline">
          Войти
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="text-sm text-red bg-red-soft border border-red/30 rounded-md px-3 py-2">
            {generalError}
          </div>
        )}

        <Field label="Логин" error={fieldError(errors, 'username')}>
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            autoComplete="username"
            required
          />
        </Field>

        <Field label="Email" hint="Понадобится, если захотите загрузить свой аватар" error={fieldError(errors, 'email')}>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Отображаемое имя" hint="Ник персонажа, например «Геральт из Ривии»" error={fieldError(errors, 'display_name')}>
          <input
            className={inputClass}
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Пароль" error={fieldError(errors, 'password')}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Повтор пароля" error={fieldError(errors, 'password2')}>
            <input
              type="password"
              className={inputClass}
              value={form.password2}
              onChange={(e) => update('password2', e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <Field label="Дата рождения" hint="Можно скрыть в профиле позже" error={fieldError(errors, 'birth_date')}>
          <input
            type="date"
            className={inputClass}
            value={form.birth_date}
            onChange={(e) => update('birth_date', e.target.value)}
            required
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.agree_to_rules}
            onChange={(e) => update('agree_to_rules', e.target.checked)}
          />
          <span>Согласен(на) с правилами клуба и Кодексом цеха</span>
        </label>
        {fieldError(errors, 'agree_to_rules') && (
          <p className="text-xs text-red -mt-2">{fieldError(errors, 'agree_to_rules')}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-bg font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Создаём…' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  )
}
