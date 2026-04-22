import { createContext, useContext } from 'react'
import { useAuth } from '../../hooks/useAuth'

type AuthContextValue = ReturnType<typeof useAuth>

const AuthContext = createContext<AuthContextValue | null>(null)

type Props = {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider is missing')
  return ctx
}

