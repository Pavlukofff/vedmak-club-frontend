import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div>
      <section className="max-w-2xl mb-16">
        <span className="text-xs font-mono tracking-widest uppercase text-accent-ink bg-accent-soft px-2.5 py-1 rounded-full">
          Цех ведьмаков · «Своё Дело»
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold mt-4 mb-4 leading-tight">
          Фехтовальный клуб вселенной «Ведьмак»
        </h1>
        <p className="text-muted leading-relaxed">
          Тренировки, живые РПГ-бои, школы фехтования и цеховая иерархия — от Рекрута до
          Признанного Ведьмака. Здесь фиксируются победы, задания и трофеи цеха.
        </p>
        <div className="flex gap-3 mt-6">
          {!isAuthenticated && (
            <Link
              to="/register"
              className="bg-accent text-bg font-medium rounded-md px-4 py-2.5 text-sm hover:opacity-90"
            >
              Вступить в цех
            </Link>
          )}
          <Link
            to="/users"
            className="border border-border rounded-md px-4 py-2.5 text-sm text-ink-soft hover:border-accent hover:text-ink"
          >
            Участники цеха
          </Link>
        </div>
      </section>

      <section className="border border-border-soft rounded-lg p-6 bg-surface max-w-2xl">
        <h2 className="text-sm font-medium text-ink-soft mb-2">В разработке</h2>
        <p className="text-sm text-muted leading-relaxed">
          Блог, турниры, бестиарий, магазин, расписание и остальные разделы клуба появятся здесь
          по мере сборки фронтенда — сейчас готовы аккаунт, профили и личный кабинет.
        </p>
      </section>
    </div>
  )
}
