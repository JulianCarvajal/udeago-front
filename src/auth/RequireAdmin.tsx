import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { AdminLoadingPage } from '@/pages/admin/AdminLoadingPage'

export function RequireAdmin() {
  const { isLoading, isAdmin, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AdminLoadingPage />
  }

  if (!isAuthenticated || !isAdmin) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/admin/login?redirect=${redirectTo}`} replace />
  }

  return <Outlet />
}
