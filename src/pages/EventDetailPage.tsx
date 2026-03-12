import { Link, useParams } from 'react-router-dom'
import { MOCK_EVENTS } from '@/features/events/mocks/events.mock'

function formatDateRange(start: string, end?: string): string {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const startDate = formatter.format(new Date(start))

  if (!end) {
    return startDate
  }

  const endFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${startDate} - ${endFormatter.format(new Date(end))}`
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const event = MOCK_EVENTS.find((item) => item.id === Number(eventId))

  if (!event) {
    return (
      <section className="px-4 py-5 md:px-6 md:py-6">
        <div className="max-w-3xl">
          <p className="text-sm md:text-base font-semibold text-gray-700">Event not found</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4">The event you are looking for does not exist in mock data.</p>
          <Link to="/" className="text-sm font-medium text-green-700">
            Back to home
          </Link>
        </div>
      </section>
    )
  }

  return (
    <article className="px-4 py-5 md:px-6 md:py-6">
      <Link to="/" className="inline-block text-xs md:text-sm font-medium text-green-700 mb-3 md:mb-4">
        ← Back to events
      </Link>

      <div className="max-w-4xl rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white lg:grid lg:grid-cols-5">
        <div className="lg:col-span-2">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="w-full h-48 md:h-56 lg:h-full object-cover" />
          ) : (
            <div className="w-full h-44 md:h-56 lg:h-full bg-gray-200 flex items-center justify-center">
              <span className="text-5xl">📅</span>
            </div>
          )}
        </div>

        <div className="p-4 md:p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {event.categoryId}
            </span>
            <span className="text-xs md:text-sm text-gray-400">{event.virtual ? 'Virtual' : 'On-site'}</span>
          </div>

          <h1 className="text-base md:text-xl font-bold text-gray-900 leading-snug mb-2">{event.title}</h1>
          <p className="text-xs md:text-sm text-gray-500 mb-4 leading-relaxed">{event.description}</p>

          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 md:p-4 space-y-2">
            <p className="text-xs md:text-sm text-gray-700">
              <span className="font-semibold">Date: </span>
              {formatDateRange(event.dateStart, event.dateEnd)}
            </p>
            {event.link && (
              <p className="text-xs md:text-sm text-gray-700 break-all">
                <span className="font-semibold">Access link: </span>
                <a href={event.link} className="text-green-700 font-medium" target="_blank" rel="noreferrer">
                  {event.link}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
