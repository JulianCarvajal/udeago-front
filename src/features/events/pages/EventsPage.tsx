import { useEffect, useState } from 'react'
import { EventCard } from '@/features/events/ui/EventCard'
import { listEvents } from '@/services/events.service'
import type { Event } from '@/types/event'

interface EventsPageProps {
  title?: string
}

export function EventsPage({ title = 'Próximos eventos' }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsLoading(true)
      setError(null)

      try {
        const rows = await listEvents()
        if (isMounted) {
          setEvents(rows)
        }
      } catch {
        if (isMounted) {
          setError('Unable to load events right now.')
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

  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-5">{title}</h2>

      {isLoading && <p className="text-sm text-gray-500">Loading events...</p>}

      {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <p className="text-sm text-gray-500">No events available yet.</p>
      )}

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:gap-5">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
