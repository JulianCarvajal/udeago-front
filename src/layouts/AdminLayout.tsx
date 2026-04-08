import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { MobileAppFrame } from '@/components/layout/MobileAppFrame'
import { useAuth } from '@/auth/useAuth'
import { LogOut } from 'lucide-react'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <MobileAppFrame>
      <header className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div>
          <p className="text-lg md:text-xl font-bold text-green-700 tracking-tight">UdeAGo Admin</p>
          <p className="text-[11px] md:text-xs text-gray-500 mt-1">Admin dashboard</p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-4 py-5 md:px-6 md:py-6">
          <div className="max-w-5xl mx-auto mb-4 md:mb-6">
            <p className="text-xs md:text-sm text-gray-500">Signed in as {user?.email}</p>
          </div>
          <Outlet />
        </div>
      </main>
    </MobileAppFrame>
  )
}
