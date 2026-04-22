import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { UI_TEXT } from '../../constants/uiText'
import { useAuthContext } from '../auth/AuthProvider'
import { getAdminLang, setAdminLang, type AdminLang } from '../../constants/lang'
import { useState } from 'react'

function linkClassName(isActive: boolean) {
  const base =
    'inline-flex items-center justify-center rounded-[calc(var(--fe-radius)+999px)] border px-4 py-2 text-sm font-semibold transition-colors'
  if (isActive) {
    return `${base} border-transparent bg-[rgb(var(--fe-text))] text-white`
  }
  return `${base} border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-text))] hover:bg-white`
}

export function AppLayout() {
  const auth = useAuthContext()
  const navigate = useNavigate()
  const [lang, setLang] = useState<AdminLang>(() => getAdminLang())

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-8 md:px-8 md:pb-20 md:pt-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-wide text-[rgb(var(--fe-muted))]">{UI_TEXT.appName}</div>
            <div className="mt-1 text-xs text-[rgb(var(--fe-muted))]">{auth.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => {
                const next = (e.target.value === 'en' ? 'en' : 'vi') as AdminLang
                setLang(next)
                setAdminLang(next)
                navigate(0)
              }}
              className="rounded-[calc(var(--fe-radius)+999px)] border border-[rgb(var(--fe-line))] bg-white px-4 py-2 text-sm font-semibold text-[rgb(var(--fe-text))] hover:bg-[rgb(var(--fe-surface))]"
              aria-label="Ngôn ngữ"
            >
              <option value="vi">VI</option>
              <option value="en">EN</option>
            </select>

            <button
              type="button"
              className="rounded-[calc(var(--fe-radius)+999px)] border border-[rgb(var(--fe-line))] bg-white px-4 py-2 text-sm font-semibold text-[rgb(var(--fe-text))] hover:bg-[rgb(var(--fe-surface))]"
              onClick={() => {
                auth.signOut()
                navigate(ROUTES.login)
              }}
            >
              {UI_TEXT.signOut}
            </button>
          </div>
        </div>

        <nav className="mt-7 flex flex-wrap items-center gap-2 md:gap-3">
          <NavLink to={ROUTES.dashboard} className={({ isActive }) => linkClassName(isActive)}>
            {UI_TEXT.dashboard}
          </NavLink>

          {auth.isAdmin ? (
            <>
              <NavLink to={ROUTES.users} className={({ isActive }) => linkClassName(isActive)}>
                {UI_TEXT.users}
              </NavLink>
              <NavLink to={ROUTES.cafes} className={({ isActive }) => linkClassName(isActive)}>
                {UI_TEXT.cafes}
              </NavLink>
            </>
          ) : null}

          <NavLink to={ROUTES.menuCategories} className={({ isActive }) => linkClassName(isActive)}>
            {UI_TEXT.menuCategories}
          </NavLink>
          <NavLink to={ROUTES.menuItems} className={({ isActive }) => linkClassName(isActive)}>
            {UI_TEXT.menuItems}
          </NavLink>
        </nav>

        <main className="mt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

