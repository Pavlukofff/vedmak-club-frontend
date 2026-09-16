import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import NavDropdown from './NavDropdown'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm transition-colors ${
    isActive ? 'text-accent-ink bg-accent-soft' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
  }`

const GAME_LINKS = [
  { to: '/battles', label: 'Бои' },
  { to: '/bestiary', label: 'Бестиарий' },
  { to: '/tasks', label: 'Задания' },
  { to: '/ranks', label: 'Ранги' },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/shop', label: 'Магазин' },
]

const CLUB_LINKS = [
  { to: '/blog', label: 'Блог' },
  { to: '/festivals', label: 'Фестивали' },
  { to: '/schedule', label: 'Расписание' },
  { to: '/codex', label: 'Кодекс' },
  { to: '/subscriptions', label: 'Абонементы' },
  { to: '/fundraisers', label: 'Сборы средств' },
]

export default function Layout() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [socialLinks, setSocialLinks] = useState([])

  useEffect(() => {
    // В подвале — только ссылки клуба и оружейни; ссылки мастеров школ
    // (их может быть много) смотрят на отдельной странице /social.
    api
      .get('/social-links/')
      .then(({ data }) => setSocialLinks(data.filter((l) => l.owner_type !== 'master')))
      .catch(() => setSocialLinks([]))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <header className="border-b border-border-soft sticky top-0 z-10 bg-bg/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-full border border-accent text-accent flex items-center justify-center font-display font-semibold text-sm">
              Ц
            </span>
            <span className="font-display font-semibold text-base leading-tight">
              Цех ведьмаков
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Главная
            </NavLink>
            <NavLink to="/users" className={navLinkClass}>
              Участники
            </NavLink>
            <NavDropdown label="Игра" items={GAME_LINKS} />
            <NavDropdown label="О клубе" items={CLUB_LINKS} />
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? null : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/cabinet"
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-2"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-surface-2 border border-border" />
                  )}
                  <span className="text-sm text-ink-soft hidden sm:inline">
                    {user.display_name}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-faint hover:text-red px-2 py-1.5 rounded-md hover:bg-surface-2"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-ink-soft hover:text-ink px-3 py-1.5 rounded-md hover:bg-surface-2"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-accent text-bg font-medium px-3 py-1.5 rounded-md hover:opacity-90"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border-soft">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-faint">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span>Цех ведьмаков · вымышленный фехтовальный клуб</span>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                {socialLinks.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ink"
                  >
                    {l.label || l.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
          <Link to="/social" className="block mt-2 hover:text-ink">
            все ссылки клуба и школ →
          </Link>
        </div>
      </footer>
    </div>
  )
}
