import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MobileAppFrame } from '@/components/layout/MobileAppFrame'
import { useAuth } from '@/auth/useAuth'
import { CalendarPlus, Eye, LayoutDashboard, LogOut } from 'lucide-react'
import { disableAdminPreviewMode } from '@/utils/adminPreview'

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/events', label: 'Eventos' },
  { to: '/admin/announcements', label: 'Anuncios' },
  { to: '/admin/events/new', label: 'Nuevo evento' },
  { to: '/admin/announcements/new', label: 'Nuevo anuncio' },
  { to: '/admin/calendar-jobs', label: 'Cargas Excel' },
  { to: '/admin/access', label: 'Acceso' },
]

function getCurrentPageLabel(pathname: string): string {
  if (pathname === '/admin') {
    return 'Panel principal'
  }

  if (pathname === '/admin/events') {
    return 'Gestión de eventos'
  }

  if (pathname === '/admin/announcements') {
    return 'Gestión de anuncios'
  }

  if (pathname === '/admin/events/new') {
    return 'Crear evento'
  }

  if (pathname === '/admin/announcements/new') {
    return 'Crear anuncio'
  }

  if (pathname === '/admin/calendar-jobs') {
    return 'Carga de invitados'
  }

  if (pathname.includes('/admin/events/') && pathname.endsWith('/edit')) {
    return 'Editar evento'
  }

  if (pathname.includes('/admin/announcements/') && pathname.endsWith('/edit')) {
    return 'Editar anuncio'
  }

  if (pathname === '/admin/access') {
    return 'Acceso de administrador'
  }

  return 'Administración'
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardRoute = location.pathname === '/admin'
  const currentPageLabel = getCurrentPageLabel(location.pathname)

  const handleLogout = async () => {
    disableAdminPreviewMode()
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <MobileAppFrame>
      <header className="shrink-0 bg-white border-b border-gray-100">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
          <div>
            <Link
              to="/admin"
              className="text-lg md:text-xl font-bold text-green-700 tracking-tight transition-colors hover:text-green-800"
            >
              UdeAGo Admin
            </Link>
            <p className="text-[11px] md:text-xs text-gray-500 mt-1">{currentPageLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/calendar-jobs"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              title="Abrir carga de invitados"
            >
              <CalendarPlus size={14} />
              <span className="hidden sm:inline">Cargas Excel</span>
            </Link>

            <Link
              to="/?preview=admin"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              title="Abrir vista publica"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Ver sitio publico</span>
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Cerrar sesion</span>
            </button>
          </div>
        </div>

        <nav className="px-4 pb-3 md:px-6 md:pb-4">
          <div className="flex flex-wrap gap-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-4 py-5 md:px-6 md:py-6">
          <div className="max-w-5xl mx-auto mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs md:text-sm text-gray-500">Sesion iniciada como {user?.email}</p>

            {!isDashboardRoute && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-green-700 hover:text-green-800"
              >
                <LayoutDashboard size={14} />
                Volver al panel de administracion
              </Link>
            )}
          </div>

          <Outlet />
        </div>
      </main>
    </MobileAppFrame>
  )
}
