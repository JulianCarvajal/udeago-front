import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

export function AdminCallbackPage() {
  const { refreshSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      const currentUser = await refreshSession()

      if (currentUser?.role === 'admin') {
        navigate('/admin', { replace: true })
        return
      }

      navigate('/admin/login', { replace: true })
    }

    void run()
  }, [navigate, refreshSession])

  return null
}
