import { Link } from 'react-router-dom'
import { CalendarPlus, ClipboardList, Users } from 'lucide-react'

const adminCards = [
  {
    title: 'Eventos',
    description: 'Crear, editar y publicar eventos del campus.',
    href: '/admin/events',
    icon: ClipboardList,
  },
  {
    title: 'Nuevo evento',
    description: 'Acceso rápido al flujo de creación de eventos.',
    href: '/admin/events/new',
    icon: CalendarPlus,
  },
  {
    title: 'Acceso',
    description: 'Cuenta y estado de sesión de administrador autorizado.',
    href: '/admin/access',
    icon: Users,
  },
]

export function AdminDashboardPage() {
  return (
    <section className="max-w-5xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">Panel de administracion</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Gestiona el contenido publico y los flujos administrativos desde este espacio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 h-11 w-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <h2 className="text-sm md:text-base font-semibold text-gray-900">{card.title}</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">{card.description}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
