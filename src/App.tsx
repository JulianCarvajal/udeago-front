import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/HomePage'
import { AnnouncementsPage } from '@/pages/AnnouncementsPage'
import { RecordingsPage } from '@/pages/RecordingsPage'
import { EventDetailPage } from '@/pages/EventDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/recordings" element={<RecordingsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
