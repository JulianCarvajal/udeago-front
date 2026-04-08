import type { AuthUser } from '@/auth/auth.types'
import { isDevelopment, mockFetchCurrentUser, mockLogoutAdmin, mockStartAdminOAuthLogin } from '@/auth/auth.dev.mock'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // En desarrollo, usar mocks
  if (isDevelopment()) {
    return mockFetchCurrentUser()
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to fetch current user')
  }

  return response.json() as Promise<AuthUser>
}

export async function startAdminOAuthLogin(): Promise<void> {
  // En desarrollo, usar mock
  if (isDevelopment()) {
    await mockStartAdminOAuthLogin()
    // Redirigir al callback after mock login
    window.location.href = `${window.location.origin}/admin/auth/callback`
    return
  }

  const callbackUrl = `${window.location.origin}/admin/auth/callback`
  const loginUrl = new URL(`${API_BASE_URL}/auth/oauth/admin`, window.location.origin)
  loginUrl.searchParams.set('redirect_uri', callbackUrl)
  window.location.href = loginUrl.toString()
}

export async function logoutAdmin(): Promise<void> {
  // En desarrollo, usar mock
  if (isDevelopment()) {
    await mockLogoutAdmin()
    return
  }

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
