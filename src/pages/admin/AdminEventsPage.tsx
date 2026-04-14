import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { deleteEvent, listEvents } from '@/services/events.service'
import type { Event } from '@/types/event'

export function AdminEventsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [events, setEvents] = useState<Event[]>([])
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

    async function loadEvents() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await listEvents()
        if (isMounted) {
          setEvents(data)
        }
      } catch {
        if (isMounted) {
          setError('Unable to load events at the moment.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [])

  const handleDeleteEvent = async (eventItem: Event) => {
    const confirmed = window.confirm(`Delete "${eventItem.title}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    setDeletingId(eventItem.id)
    setError(null)
    setNotice(null)

    try {
      const deleted = await deleteEvent(eventItem.id)

      if (!deleted) {
        setError('The selected event no longer exists.')
        return
      }

      setEvents((current) => current.filter((item) => item.id !== eventItem.id))
      setNotice(`Event "${eventItem.title}" deleted successfully.`)
    } catch {
      setError('Unable to delete event right now. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Events management</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Review, edit and publish events from a table-oriented view.</p>
        </div>

        <Link
          to="/admin/events/new"
          className="shrink-0 rounded-xl bg-green-700 px-3 py-2 text-xs md:text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          New event
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
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Title</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Mode</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                    Loading events...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td className="px-4 py-6 text-sm text-red-600" colSpan={5}>
                    Unable to load events at the moment.
                  </td>
                </tr>
              )}

              {!isLoading && !error && events.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                    No events available yet.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{event.category?.name ?? 'General'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(event.dateStart))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{event.virtual ? 'Virtual' : 'On-site'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/events/${event.id}/edit`} className="font-medium text-green-700 hover:text-green-800">
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === event.id}
                          onClick={() => void handleDeleteEvent(event)}
                          className="font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === event.id ? 'Deleting...' : 'Delete'}
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
