import { useState } from 'react'
import { MainLayout, type ActivePage } from '@/layouts/MainLayout'
import { EventsPage } from '@/features/events/pages/EventsPage'

function AnnouncementsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-center px-8">
      <span className="text-5xl select-none">📢</span>
      <p className="font-semibold text-gray-700 text-sm">Anuncios</p>
      <p className="text-gray-400 text-xs leading-relaxed">
        Los anuncios del equipo de Bienestar estarán disponibles próximamente.
      </p>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home')

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'home' && <EventsPage title="Próximos eventos" />}
      {activePage === 'events' && <EventsPage title="Todos los eventos" />}
      {activePage === 'announcements' && <AnnouncementsPlaceholder />}
    </MainLayout>
  )
}

export default App
