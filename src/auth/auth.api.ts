import { buildAuthSessionFromCallback, buildAuthSessionFromPayload, clearAuthSession, getStoredAuthSession, getStoredAuthToken, saveAuthSession } from '@/auth/auth.session'
import type { AuthSession } from '@/auth/auth.types'
import { API_BASE_URL } from '@/config/env'

const FRONTEND_CALLBACK_PATH = '/admin/auth/callback'

export function getAuthToken(): string | null {
  return getStoredAuthToken()
}

export async function startAdminOAuthLogin(): Promise<void> {
  const callbackUrl = new URL(FRONTEND_CALLBACK_PATH, window.location.origin).toString()
  const loginUrl = new URL('/auth/google', API_BASE_URL)
  loginUrl.searchParams.set('redirect_uri', callbackUrl)
  window.location.assign(loginUrl.toString())
}

export async function completeAdminOAuthCallback(location: Location = window.location): Promise<AuthSession | null> {
  const callbackSession = buildAuthSessionFromCallback(location)

  if (callbackSession) {
    saveAuthSession(callbackSession)
    return callbackSession
  }

  if (!location.search) {
    return getStoredAuthSession()
  }

  const response = await fetch(`${API_BASE_URL}/auth/google/callback${location.search}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    access_token?: string
    accessToken?: string
    token?: string
    user?: unknown
    expires_in?: number
    expiresIn?: number
  }

  const normalizedSession = buildAuthSessionFromPayload(payload)

  if (!normalizedSession) {
    return null
  }

  saveAuthSession(normalizedSession)
  return normalizedSession
}

export function hydrateStoredAuthSession(): AuthSession | null {
  return getStoredAuthSession()
}

export async function logoutAdmin(): Promise<void> {
  clearAuthSession()
}
