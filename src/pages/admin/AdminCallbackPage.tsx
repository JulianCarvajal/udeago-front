import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeAdminOAuthCallback } from '@/auth/auth.api'
import { useAuth } from '@/auth/useAuth'
import { isAdminRole } from '@/auth/auth.session'
import { AdminLoadingPage } from '@/pages/admin/AdminLoadingPage'

export function AdminCallbackPage() {
  const { refreshSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      await completeAdminOAuthCallback()
      const currentUser = await refreshSession()

      if (!isMounted) {
        return
      }

      if (isAdminRole(currentUser?.role)) {
        navigate('/admin', { replace: true })
        return
      }

      navigate('/admin/login', { replace: true })
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [navigate, refreshSession])

  return <AdminLoadingPage />
}
