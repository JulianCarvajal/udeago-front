import { MOCK_EVENTS } from '@/features/events/mocks/events.mock'
import { EventCard } from '@/features/events/ui/EventCard'

interface EventsPageProps {
  title?: string
}

export function EventsPage({ title = 'Próximos eventos' }: EventsPageProps) {
  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-bold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-4">
        {MOCK_EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
