import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileAppFrame } from '@/components/layout/MobileAppFrame'

export function PublicLayout() {
  return (
    <MobileAppFrame>
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </MobileAppFrame>
  )
}
