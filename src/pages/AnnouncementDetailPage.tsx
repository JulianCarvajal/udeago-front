import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAnnouncementById } from '@/services/announcements.service'
import type { Announcement } from '@/types/announcement'

function formatAnnouncementDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function AnnouncementDetailPage() {
  const { announcementId } = useParams<{ announcementId: string }>()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAnnouncement() {
      if (!announcementId) {
        setIsLoading(false)
        setAnnouncement(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const row = await getAnnouncementById(announcementId)
        if (isMounted) {
          setAnnouncement(row)
        }
      } catch {
        if (isMounted) {
          setError('No fue posible cargar la novedad en este momento.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAnnouncement()

    return () => {
      isMounted = false
    }
  }, [announcementId])

  if (isLoading) {
    return (
      <section className="px-4 py-5 md:px-6 md:py-6">
        <div className="max-w-3xl">
          <p className="text-sm md:text-base font-semibold text-gray-700">Cargando novedad...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="px-4 py-5 md:px-6 md:py-6">
        <div className="max-w-3xl">
          <p className="text-sm md:text-base font-semibold text-red-700">{error}</p>
          <Link to="/" className="text-sm font-medium text-green-700 mt-3 inline-flex">
            Volver al inicio
          </Link>
        </div>
      </section>
    )
  }

  if (!announcement) {
    return (
      <section className="px-4 py-5 md:px-6 md:py-6">
        <div className="max-w-3xl">
          <p className="text-sm md:text-base font-semibold text-gray-700">Novedad no encontrada</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4">La novedad que buscas no existe o ya no esta disponible.</p>
          <Link to="/" className="text-sm font-medium text-green-700">
            Volver al inicio
          </Link>
        </div>
      </section>
    )
  }

  return (
    <article className="px-4 py-5 md:px-6 md:py-6">
      <Link to="/" className="inline-block text-xs md:text-sm font-medium text-green-700 mb-3 md:mb-4">
        ← Volver al inicio
      </Link>

      <div className="max-w-3xl rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
          <span className="text-xs md:text-sm text-gray-400">{formatAnnouncementDate(announcement.date)}</span>
        </div>

        <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug mb-3">{announcement.title}</h1>

        <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
          {announcement.description}
        </p>

        {announcement.user && (
          <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Publicado por: </span>
              {announcement.user.name ?? announcement.user.email ?? 'Administrador'}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}