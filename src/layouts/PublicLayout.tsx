import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileAppFrame } from '@/components/layout/MobileAppFrame'
import { useAuth } from '@/auth/useAuth'
import { disableAdminPreviewMode, enableAdminPreviewMode, isAdminPreviewMode } from '@/utils/adminPreview'

export function PublicLayout() {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const previewParam = searchParams.get('preview')
  const hasActiveAdminSession = isAuthenticated && isAdmin
  const isPreviewMode = hasActiveAdminSession && (previewParam === 'admin' || isAdminPreviewMode())

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const previewParam = params.get('preview')

    if (!hasActiveAdminSession) {
      disableAdminPreviewMode()

      if (previewParam === 'admin' || previewParam === 'off') {
        params.delete('preview')
        navigate(
          {
            pathname: location.pathname,
            search: params.toString() ? `?${params.toString()}` : '',
          },
          { replace: true },
        )
      }

      return
    }

    if (previewParam === 'admin') {
      enableAdminPreviewMode()
      params.delete('preview')
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true },
      )
      return
    }

    if (previewParam === 'off') {
      disableAdminPreviewMode()
      params.delete('preview')
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true },
      )
      return
    }

  }, [hasActiveAdminSession, location.pathname, location.search, navigate])

  const handleExitPreview = () => {
    navigate(
      {
        pathname: location.pathname,
        search: '?preview=off',
      },
      { replace: true },
    )
  }

  return (
    <MobileAppFrame>
      <AppHeader />

      {isPreviewMode && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 md:px-6 md:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs md:text-sm text-amber-900">
              Modo vista previa admin: estas viendo la app como estudiante.
            </p>

            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-xs md:text-sm font-semibold text-green-700 hover:text-green-800">
                Volver al panel
              </Link>
              <button
                type="button"
                onClick={handleExitPreview}
                className="text-xs md:text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Salir de preview
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </MobileAppFrame>
  )
}
