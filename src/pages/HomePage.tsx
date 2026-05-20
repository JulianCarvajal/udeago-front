import { EventsPage } from '@/features/events/pages/EventsPage'
import { AnnouncementsCarousel } from '@/features/announcements/ui/AnnouncementsCarousel'

export function HomePage() {
  return (
    <>
      <AnnouncementsCarousel />
      <EventsPage title="Próximos eventos" />
    </>
  )
}
