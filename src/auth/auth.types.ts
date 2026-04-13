export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  providerId: string
  lastLogin: string | null
  role: AuthRole
}

export interface AuthRole {
  id: string
  rol: string
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
  expiresAt: number
}

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'forbidden' | 'error'
