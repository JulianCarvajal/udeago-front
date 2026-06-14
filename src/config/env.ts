const DEFAULT_API_BASE_URL = 'https://udeago-back.onrender.com'

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
)