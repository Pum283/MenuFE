import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuthContext } from './AuthProvider'

type Props = {
  children: React.ReactNode
}

export function RequireAuth({ children }: Props) {
  const auth = useAuthContext()
  const location = useLocation()

  if (!auth.isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  return children
}

