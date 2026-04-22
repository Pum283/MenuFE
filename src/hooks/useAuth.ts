import { useCallback, useMemo, useState } from 'react'
import type { LoginResponse, RoleCode } from '../types/auth'

type AuthState = {
  accessToken: string | null
  roles: RoleCode[]
  email: string | null
  userId: string | null
}

const STORAGE_KEY = 'MENUFE_AUTH'

function readAuthFromStorage(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { accessToken: null, roles: [], email: null, userId: null }
  }
  try {
    const parsed = JSON.parse(raw) as AuthState
    return parsed
  } catch {
    return { accessToken: null, roles: [], email: null, userId: null }
  }
}

function persistAuth(next: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  if (next.accessToken) localStorage.setItem('MENUFE_ACCESS_TOKEN', next.accessToken)
  else localStorage.removeItem('MENUFE_ACCESS_TOKEN')
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => readAuthFromStorage())

  const isAuthenticated = Boolean(state.accessToken)
  const isAdmin = state.roles.includes('admin')

  const signIn = useCallback((res: LoginResponse) => {
    const next: AuthState = {
      accessToken: res.accessToken,
      roles: res.roles,
      email: res.email,
      userId: res.userId,
    }
    setState(next)
    persistAuth(next)
  }, [])

  const signOut = useCallback(() => {
    const next: AuthState = { accessToken: null, roles: [], email: null, userId: null }
    setState(next)
    persistAuth(next)
  }, [])

  return useMemo(
    () => ({
      ...state,
      isAuthenticated,
      isAdmin,
      signIn,
      signOut,
    }),
    [state, isAuthenticated, isAdmin, signIn, signOut],
  )
}

