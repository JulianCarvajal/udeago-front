import { MOCK_EVENTS } from '@/features/events/mocks/events.mock'
import { EventCard } from '@/features/events/ui/EventCard'

interface EventsPageProps {
  title?: string
}

export function EventsPage({ title = 'Próximos eventos' }: EventsPageProps) {
  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-5">{title}</h2>
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:gap-5">
        {MOCK_EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
