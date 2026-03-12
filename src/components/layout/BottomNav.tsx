import { Home, Megaphone, Clapperboard, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/announcements', label: 'Announcements', Icon: Megaphone },
  { to: '/recordings', label: 'Recordings', Icon: Clapperboard },
]

export function BottomNav() {
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
      </div>
    </nav>
  )
}
