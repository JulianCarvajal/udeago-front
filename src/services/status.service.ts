import { apiFetch } from '@/services/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const STATUS_ENDPOINT = `${API_BASE_URL}/master-data/status`

export interface StatusOption {
  id: string
  status: string
}

export async function listStatuses(): Promise<StatusOption[]> {
  const response = await apiFetch(STATUS_ENDPOINT, {
    method: 'GET',
    auth: false,
  })

  if (!response.ok) {
    throw new Error('Failed to load statuses')
  }

  const payload = (await response.json()) as
    | StatusOption[]
    | { data?: StatusOption[]; items?: StatusOption[]; statuses?: StatusOption[] }

  const rows = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.items ?? payload.statuses ?? []

  return rows
    .filter((row) => Boolean(row?.id) && Boolean(row?.status))
    .map((row) => ({ id: row.id, status: row.status }))
}
