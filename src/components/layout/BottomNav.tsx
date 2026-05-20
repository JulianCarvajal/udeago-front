import { Home, Clapperboard, LogIn, type LucideIcon } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: Home },
  { to: '/recordings', label: 'Grabaciones', Icon: Clapperboard },
]

export function BottomNav() {
  const { isAuthenticated, status } = useAuth()
  const adminTo = isAuthenticated ? '/admin' : '/admin/login'
  const adminLabel = status === 'loading' ? 'Admin' : isAuthenticated ? 'Panel' : 'Admin'

  return (
    <nav className="shrink-0 bg-white border-t border-gray-100">
      <div className="flex md:px-4 lg:px-8">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 md:py-3 transition-colors ${
                isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-xs md:text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <Link
          to={adminTo}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 md:py-3 text-gray-400 hover:text-gray-600 transition-colors group"
          title={isAuthenticated ? 'Panel de administracion' : 'Acceso de administracion'}
        >
          <LogIn size={22} strokeWidth={1.5} className="group-hover:text-green-700" />
          <span className="text-xs md:text-sm font-normal text-[10px] md:text-xs">{adminLabel}</span>
        </Link>
      </div>
    </nav>
  )
}

