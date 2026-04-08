export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin'
}

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'forbidden' | 'error'
