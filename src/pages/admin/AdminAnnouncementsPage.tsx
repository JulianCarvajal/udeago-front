import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnnouncementApiError, deleteAnnouncement, listAnnouncements } from '@/services/announcements.service'
import type { Announcement } from '@/types/announcement'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function AdminAnnouncementsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const locationState = location.state as { notice?: string } | null
    if (locationState?.notice) {
      setNotice(locationState.notice)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    let isMounted = true

    async function loadAnnouncements() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await listAnnouncements()
        if (isMounted) {
          setAnnouncements(data)
        }
      } catch {
        if (isMounted) {
          setError('No fue posible cargar los anuncios en este momento.')
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

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    const confirmed = window.confirm(`Deseas eliminar "${announcement.title}"? Esta accion lo ocultara del listado publico.`)
    if (!confirmed) {
      return
    }

    setDeletingId(announcement.id)
    setError(null)
    setNotice(null)

    try {
      const deleted = await deleteAnnouncement(announcement.id)

      if (!deleted) {
        setError('El anuncio seleccionado ya no existe.')
        return
      }

      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id))
      setNotice(`El anuncio "${announcement.title}" fue eliminado correctamente.`)
    } catch (err) {
      if (err instanceof AnnouncementApiError) {
        if (err.status === 401) {
          setError('Tu sesion expiro. Inicia sesion nuevamente.')
          return
        }

        if (err.status === 403) {
          setError('Solo usuarios ADMIN pueden administrar anuncios.')
          return
        }
      }

      setError('No fue posible eliminar el anuncio en este momento. Intenta de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Gestion de anuncios</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Crea, edita y elimina novedades visibles en el inicio de la aplicacion.</p>
        </div>

        <Link
          to="/admin/announcements/new"
          className="shrink-0 rounded-xl bg-green-700 px-3 py-2 text-xs md:text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          Nuevo anuncio
        </Link>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Titulo</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Autor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>
                    Cargando anuncios...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td className="px-4 py-6 text-sm text-red-600" colSpan={4}>
                    No fue posible cargar los anuncios en este momento.
                  </td>
                </tr>
              )}

              {!isLoading && !error && announcements.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>
                    Aun no hay anuncios publicados.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{announcement.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(announcement.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {announcement.user?.name ?? announcement.user?.email ?? 'Administrador'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/announcements/${announcement.id}/edit`} className="font-medium text-green-700 hover:text-green-800">
                          Editar
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === announcement.id}
                          onClick={() => void handleDeleteAnnouncement(announcement)}
                          className="font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === announcement.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}