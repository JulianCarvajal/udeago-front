import { clearAuthSession, getStoredAuthToken } from '@/auth/auth.session'

export interface ApiFetchOptions extends RequestInit {
  auth?: boolean
}

export async function apiFetch(input: RequestInfo | URL, init: ApiFetchOptions = {}): Promise<Response> {
  const { auth = true, headers, ...requestInit } = init
  const requestHeaders = new Headers(headers)

  if (auth) {
    const token = getStoredAuthToken()

    if (token && !requestHeaders.has('Authorization')) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json')
  }

  console.log('[API] Fetching:', input, { method: requestInit.method ?? 'GET', auth })

  try {
    const response = await fetch(input, {
      ...requestInit,
      headers: requestHeaders,
      credentials: requestInit.credentials ?? 'include',
    })

    console.log('[API] Response status:', response.status, 'URL:', input)

    if (response.status === 401) {
      console.warn('[API] Unauthorized (401) - clearing auth session')
      clearAuthSession()
    }

    return response
  } catch (err) {
    console.error('[API] Fetch error:', err, 'URL:', input)
    throw err
  }
}