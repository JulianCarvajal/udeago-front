import type { AuthSession, AuthUser } from '@/auth/auth.types'

const AUTH_SESSION_STORAGE_KEY = 'udeago.auth.session.v1'
const SESSION_TTL_MS = 55 * 60 * 1000
const ADMIN_ROLE_NAME = 'ADMIN'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function normalizeRole(rawRole: unknown): AuthUser['role'] | null {
  if (isRecord(rawRole)) {
    const id = toStringValue(rawRole.id) ?? toStringValue(rawRole._id) ?? toStringValue(rawRole.roleId) ?? toStringValue(rawRole.rol)?.toLowerCase()
    const rol = toStringValue(rawRole.rol) ?? toStringValue(rawRole.role) ?? toStringValue(rawRole.name)

    if (!rol) {
      return null
    }

    return {
      id: id ?? rol.toLowerCase(),
      rol,
    }
  }

  const rol = toStringValue(rawRole)

  if (!rol) {
    return null
  }

  return {
    id: rol.toLowerCase(),
    rol,
  }
}

export function isAdminRole(role: AuthUser['role'] | null | undefined): boolean {
  return role?.rol.toUpperCase() === ADMIN_ROLE_NAME
}

export function normalizeAuthUser(rawUser: unknown): AuthUser | null {
  if (typeof rawUser === 'string') {
    const parsedUser = parseJson<unknown>(rawUser)
    return parsedUser ? normalizeAuthUser(parsedUser) : null
  }

  if (!isRecord(rawUser)) {
    return null
  }

  const id = toStringValue(rawUser.id) ?? toStringValue(rawUser._id)
  const email = toStringValue(rawUser.email)
  const name = toStringValue(rawUser.name)
  const avatarUrl = toStringValue(rawUser.avatarUrl) ?? toStringValue(rawUser.avatar_url)
  const providerId = toStringValue(rawUser.providerId) ?? toStringValue(rawUser.provider_id)
  const lastLogin = toStringValue(rawUser.lastLogin) ?? toStringValue(rawUser.last_login)
  const role = normalizeRole(rawUser.role ?? rawUser.roles ?? rawUser.userRole)

  if (!id || !email || !name || !providerId || !role) {
    return null
  }

  return {
    id,
    email,
    name,
    avatarUrl: avatarUrl ?? null,
    providerId,
    lastLogin: lastLogin ?? null,
    role,
  }
}

function readStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null
  }

  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
  const parsedSession = parseJson<AuthSession>(rawSession)

  if (!parsedSession || !parsedSession.accessToken || !parsedSession.user) {
    return null
  }

  if (Date.now() >= parsedSession.expiresAt) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }

  return parsedSession
}

export function getStoredAuthSession(): AuthSession | null {
  return readStoredSession()
}

export function getStoredAuthToken(): string | null {
  return readStoredSession()?.accessToken ?? null
}

export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function buildAuthSession(accessToken: string, user: AuthUser, expiresInSeconds = SESSION_TTL_MS / 1000): AuthSession {
  return {
    accessToken,
    user,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  }
}

export function buildAuthSessionFromPayload(payload: unknown): AuthSession | null {
  if (!isRecord(payload)) {
    return null
  }

  const accessToken = toStringValue(payload.access_token ?? payload.accessToken ?? payload.token)
  const expiresInRaw = payload.expires_in ?? payload.expiresIn
  const expiresInSeconds = typeof expiresInRaw === 'number' && Number.isFinite(expiresInRaw) && expiresInRaw > 0 ? expiresInRaw : SESSION_TTL_MS / 1000
  const normalizedUser = normalizeAuthUser(payload.user ?? payload.account ?? payload.me ?? payload.profile)

  if (!accessToken || !normalizedUser) {
    return null
  }

  return buildAuthSession(accessToken, normalizedUser, expiresInSeconds)
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

function extractCallbackPayload(location: Location): Record<string, unknown> | null {
  const searchParams = new URLSearchParams(location.search)
  const hashParams = location.hash.startsWith('#') ? new URLSearchParams(location.hash.slice(1)) : new URLSearchParams()
  const rawSession = searchParams.get('session') ?? searchParams.get('payload') ?? hashParams.get('session') ?? hashParams.get('payload')

  if (rawSession) {
    const parsedSession = parseJson<Record<string, unknown>>(rawSession)
    if (parsedSession) {
      return parsedSession
    }
  }

  const accessToken = searchParams.get('access_token') ?? searchParams.get('accessToken') ?? searchParams.get('token') ?? hashParams.get('access_token') ?? hashParams.get('accessToken') ?? hashParams.get('token')
  const userValue = searchParams.get('user') ?? hashParams.get('user')
  const expiresInValue = searchParams.get('expires_in') ?? searchParams.get('expiresIn') ?? hashParams.get('expires_in') ?? hashParams.get('expiresIn')

  if (!accessToken && !userValue) {
    return null
  }

  const payload: Record<string, unknown> = {}

  if (accessToken) {
    payload.access_token = accessToken
  }

  if (userValue) {
    payload.user = parseJson<Record<string, unknown>>(userValue) ?? userValue
  }

  if (expiresInValue) {
    payload.expires_in = Number(expiresInValue)
  }

  return payload
}

export function buildAuthSessionFromCallback(location: Location): AuthSession | null {
  const payload = extractCallbackPayload(location)

  if (!payload) {
    return null
  }

  return buildAuthSessionFromPayload(payload)
}
