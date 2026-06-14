import { apiFetch } from '@/services/api'
import { API_BASE_URL } from '@/config/env'

const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`

export interface CategoryOption {
  id: string
  name: string
}

export async function listCategories(): Promise<CategoryOption[]> {
  const response = await apiFetch(CATEGORIES_ENDPOINT, {
    method: 'GET',
    auth: false,
  })

  if (!response.ok) {
    throw new Error('Failed to load categories')
  }

  const payload = (await response.json()) as
    | CategoryOption[]
    | { data?: CategoryOption[]; items?: CategoryOption[]; categories?: CategoryOption[] }

  const rows = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.items ?? payload.categories ?? []

  return rows
    .filter((row) => Boolean(row?.id) && Boolean(row?.name))
    .map((row) => ({ id: row.id, name: row.name }))
}
