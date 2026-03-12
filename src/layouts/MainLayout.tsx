import { type ReactNode } from 'react'
import { Home, CalendarDays, Megaphone, type LucideIcon } from 'lucide-react'

export type ActivePage = 'home' | 'events' | 'announcements'

interface NavItem {
  id: ActivePage
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',          label: 'Inicio',   Icon: Home },
  { id: 'events',        label: 'Eventos',  Icon: CalendarDays },
  { id: 'announcements', label: 'Anuncios', Icon: Megaphone },
]

interface MainLayoutProps {
  children: ReactNode
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
}

export function MainLayout({ children, activePage, onNavigate }: MainLayoutProps) {
  return (
    // Fondo exterior gris simula "pantalla de PC fuera del teléfono"
    <div className="min-h-screen bg-gray-200 flex justify-center">
      {/* Contenedor max-w-md = frame de teléfono en desktop */}
      <div className="w-full max-w-md bg-white flex flex-col h-screen shadow-xl">

        {/* Header fijo en la parte superior */}
        <header className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center">
          <span className="text-lg font-bold text-green-700 tracking-tight">UdeAGo</span>
        </header>

        {/* Contenido principal — área scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* NavBar inferior estilo app móvil */}
        <nav className="shrink-0 bg-white border-t border-gray-100">
          <div className="flex">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                    isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

      </div>
    </div>
  )
}
