import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchCurrentUser, logoutAdmin, startAdminOAuthLogin } from '@/auth/auth.api'
import type { AuthStatus, AuthUser } from '@/auth/auth.types'
import { AuthContext } from '@/auth/useAuth'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean 
  refreshSession: () => Promise<AuthUser | null>
  login: () => Promise<void>
  logout: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refreshSession = useCallback(async () => {
    try {
      setStatus('loading')
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
      setStatus(currentUser ? 'authenticated' : 'anonymous')
      return currentUser
    } catch {
      setUser(null)
      setStatus('error')
      return null
    }
  }, [])

  const login = useCallback(async () => {
    await startAdminOAuthLogin()
  }, [])

  const logout = useCallback(async () => {
    await logoutAdmin()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession()
  }, [refreshSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && user !== null,
      isAdmin: status === 'authenticated' && user?.role === 'admin',
      isLoading: status === 'loading',
      refreshSession,
      login,
      logout,
    }),
    [login, logout, refreshSession, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
