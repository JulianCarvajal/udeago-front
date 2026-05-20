import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from '@/auth/RequireAdmin'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { HomePage } from '@/pages/HomePage'
import { RecordingsPage } from '@/pages/RecordingsPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { AnnouncementDetailPage } from '@/pages/AnnouncementDetailPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminCallbackPage } from '@/pages/admin/AdminCallbackPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage'
import { AdminEventFormPage } from '@/pages/admin/AdminEventFormPage'
import { AdminAccessPage } from '@/pages/admin/AdminAccessPage'
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage'
import { AdminAnnouncementFormPage } from '@/pages/admin/AdminAnnouncementFormPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/announcements" element={<Navigate to="/" replace />} />
        <Route path="/announcements/:announcementId" element={<AnnouncementDetailPage />} />
        <Route path="/recordings" element={<RecordingsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/auth/callback" element={<AdminCallbackPage />} />

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/new" element={<AdminEventFormPage />} />
          <Route path="/admin/events/:eventId/edit" element={<AdminEventFormPage />} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/announcements/new" element={<AdminAnnouncementFormPage />} />
          <Route path="/admin/announcements/:announcementId/edit" element={<AdminAnnouncementFormPage />} />
          <Route path="/admin/access" element={<AdminAccessPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
