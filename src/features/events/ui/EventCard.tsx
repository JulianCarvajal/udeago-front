import type { Event } from '@/types/event'
import { Link } from 'react-router-dom'

// Colores por categoría. Se expanden cuando lleguen nuevas categorías desde la BD.
const CATEGORY_STYLES: Record<string, { badge: string; bg: string }> = {
  Académico:      { badge: 'bg-blue-100 text-blue-700',    bg: 'bg-blue-400' },
  Administrativo: { badge: 'bg-amber-100 text-amber-700',  bg: 'bg-amber-400' },
  Bienestar:      { badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-400' },
  Cultura:        { badge: 'bg-violet-100 text-violet-700', bg: 'bg-violet-400' },
  Deporte:        { badge: 'bg-orange-100 text-orange-700', bg: 'bg-orange-400' },
  Recorrido:      { badge: 'bg-teal-100 text-teal-700',    bg: 'bg-teal-400' },
}

const DEFAULT_STYLE = { badge: 'bg-gray-100 text-gray-600', bg: 'bg-gray-300' }

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const styles = CATEGORY_STYLES[event.categoryId] ?? DEFAULT_STYLE

  return (
    <Link
      to={`/events/${event.id}`}
      className="block rounded-xl shadow-sm overflow-hidden bg-white border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200 md:hover:-translate-y-0.5"
    >
      {/* Imagen: si no hay imageUrl se usa un placeholder de color de la categoría */}
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-40 md:h-44 object-cover"
        />
      ) : (
        <div className={`w-full h-36 md:h-44 ${styles.bg} flex items-center justify-center opacity-80`}>
          <span className="text-5xl select-none">📅</span>
        </div>
      )}

      <div className="p-4 md:p-5">
        {/* Fila: badge de categoría + fecha de inicio */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles.badge}`}>
            {event.categoryId}
          </span>
          <span className="text-xs md:text-sm text-gray-400">{formatDate(event.dateStart)}</span>
        </div>

        {/* Título */}
        <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug mb-1">
          {event.title}
        </h3>

        {/* Descripción truncada */}
        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 md:line-clamp-3 mb-3">
          {event.description}
        </p>

        {/* Modalidad */}
        <div className="flex items-center text-xs md:text-sm text-gray-400">
          {event.virtual ? (
            <>
              <span>🔗</span>
              <span className="ml-1">Evento virtual</span>
              {event.link && (
                <span className="ml-auto text-blue-500 font-medium">Ver enlace →</span>
              )}
            </>
          ) : (
            <>
              <span>📍</span>
              <span className="ml-1">Presencial</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
