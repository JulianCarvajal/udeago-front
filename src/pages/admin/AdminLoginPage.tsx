import { useAuth } from '@/auth/useAuth'
import { ShieldCheck, Mail } from 'lucide-react'

export function AdminLoginPage() {
  const { login, status } = useAuth()

  const handleLogin = async () => {
    await login()
  }

  return (
    <section className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin login</h1>
            <p className="text-xs text-gray-500">OAuth access for authorized university accounts only.</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-4">
          <div className="flex items-start gap-3">
            <Mail size={16} className="mt-0.5 text-green-700" />
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Use the institutional OAuth account authorized by the backend. There is no public registration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={status === 'loading'}
          className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-60"
        >
          Continue with Google
        </button>
      </div>
    </section>
  )
}
