import type { AuthUser } from '@/auth/auth.types'

const MOCK_ADMIN_USER: AuthUser = {
  id: 'admin-001',
  name: 'Administrador UdeAGo',
  email: 'admin@udeago.local',
  role: 'admin',
}

// Simula sesión en localStorage durante desarrollo
export function mockFetchCurrentUser(): AuthUser | null {
  const storedSession = localStorage.getItem('__dev_admin_session')
  if (storedSession === 'authenticated') {
    return MOCK_ADMIN_USER
  }
  return null
}

export async function mockStartAdminOAuthLogin(): Promise<void> {
  // Simula login instantáneo con un delay
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem('__dev_admin_session', 'authenticated')
      resolve()
    }, 800)
  })
}

export async function mockLogoutAdmin(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem('__dev_admin_session')
      resolve()
    }, 300)
  })
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV
}
