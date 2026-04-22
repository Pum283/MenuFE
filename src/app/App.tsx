import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { UsersPage } from '../pages/UsersPage'
import { CafesPage } from '../pages/CafesPage'
import { MenuCategoriesPage } from '../pages/MenuCategoriesPage'
import { MenuItemsPage } from '../pages/MenuItemsPage'
import { ROUTES } from '../constants/routes'
import { RequireAuth } from '../components/auth/RequireAuth'
import { RequireAdmin } from '../components/auth/RequireAdmin'

export function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route
        path={ROUTES.root}
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route
          path={ROUTES.users}
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path={ROUTES.cafes}
          element={
            <RequireAdmin>
              <CafesPage />
            </RequireAdmin>
          }
        />
        <Route path={ROUTES.menuCategories} element={<MenuCategoriesPage />} />
        <Route path={ROUTES.menuItems} element={<MenuItemsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  )
}

