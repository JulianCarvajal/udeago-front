import { useAuth } from '@/auth/useAuth'
import { ShieldCheck } from 'lucide-react'

export function AdminLoginPage() {
  const { login, status } = useAuth()

  const handleLogin = async () => {
    await login()
  }

  return (
    <section className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Ingreso de administracion</h1>
          <p className="text-xs md:text-sm text-gray-500">Acceso solo para cuentas institucionales autorizadas.</p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={status === 'loading'}
          className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-60"
        >
          Continuar con Google
        </button>
      </div>
    </section>
  )
}
