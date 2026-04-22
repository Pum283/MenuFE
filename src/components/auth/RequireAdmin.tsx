import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuthContext } from './AuthProvider'

type Props = {
  children: React.ReactNode
}

export function RequireAdmin({ children }: Props) {
  const auth = useAuthContext()

  if (!auth.isAdmin) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return children
}

