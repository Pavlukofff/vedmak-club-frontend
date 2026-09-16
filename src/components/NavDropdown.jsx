import { NavLink, useLocation } from 'react-router-dom'

export default function NavDropdown({ label, items }) {
  const location = useLocation()
  const isActiveGroup = items.some((item) => location.pathname.startsWith(item.to))

  return (
    <div className="relative group">
      <button
        type="button"
        className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
          isActiveGroup ? 'text-accent-ink bg-accent-soft' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
        }`}
      >
        {label}
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* pt-1 держит наведение непрерывным между кнопкой и списком — без него
          курсор пересекает зазор и меню закрывается раньше времени. */}
      <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-20">
        <div className="bg-surface border border-border-soft rounded-md shadow-lg py-1 min-w-[170px]">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 text-sm whitespace-nowrap ${
                  isActive ? 'text-accent-ink bg-accent-soft' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
