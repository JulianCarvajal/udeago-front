import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listAnnouncements } from '@/services/announcements.service'
import type { Announcement } from '@/types/announcement'

function formatAnnouncementDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Link
      to={`/announcements/${announcement.id}`}
      className="flex-none w-[84%] sm:w-[68%] md:w-[48%] lg:w-[32%] rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow snap-start"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-green-100 text-green-700">
          Novedad
        </span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatAnnouncementDate(announcement.date)}</span>
      </div>

      <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
        {announcement.title}
      </h3>

      <p className="text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-4">
        {announcement.description}
      </p>
    </Link>
  )
}

export function AnnouncementsCarousel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAnnouncements() {
      setIsLoading(true)
      setError(null)

      try {
        const rows = await listAnnouncements()
        if (isMounted) {
          setAnnouncements(rows.slice(0, 5))
        }
      } catch {
        if (isMounted) {
          setError('No fue posible cargar las novedades en este momento.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAnnouncements()

    return () => {
      isMounted = false
    }
  }, [])

  const hasItems = useMemo(() => announcements.length > 0, [announcements])

  const handleScroll = (direction: 'left' | 'right') => {
    const node = scrollRef.current
    if (!node) {
      return
    }

    const amount = Math.round(node.clientWidth * 0.82)
    node.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section className="px-4 pt-4 md:px-6 md:pt-5">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-green-50 via-white to-emerald-50 border border-green-100/80 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-green-700 mb-1">
              <Megaphone size={16} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">Novedades</span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">Ultimos avisos y novedades</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Mantente al dia con los anuncios mas recientes de la universidad.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              aria-label="Desplazar novedades a la izquierda"
            >
              <ChevronLeft size={18} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              aria-label="Desplazar novedades a la derecha"
            >
              <ChevronRight size={18} className="mx-auto" />
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Cargando novedades...</p>}

        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && !hasItems && (
          <div className="rounded-2xl border border-dashed border-green-200 bg-white/80 p-4 text-sm text-gray-500">
            Aun no hay novedades publicadas.
          </div>
        )}

        {!isLoading && !error && hasItems && (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 md:pb-1"
          >
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}