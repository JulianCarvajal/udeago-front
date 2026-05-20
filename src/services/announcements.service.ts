import { apiFetch } from '@/services/api'
import type { Announcement } from '@/types/announcement'
import { mapAnnouncementFromApi, mapAnnouncementsFromApi, mapAnnouncementToApiUpsertDto } from '@/features/announcements/mappers/announcement.mapper'
import type { AnnouncementApiDto } from '@/features/announcements/api/announcement.dto'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const ANNOUNCEMENTS_ENDPOINT = `${API_BASE_URL}/announcements`

export class AnnouncementApiError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AnnouncementApiError'
    this.status = status
  }
}

export interface AnnouncementUpsertInput {
  title: string
  description: string
  statusId: string
}

async function safeReadResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text()
    if (!text) {
      return null
    }

    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function pickErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const rows = payload as { message?: unknown; error?: unknown; detail?: unknown }

  if (typeof rows.message === 'string' && rows.message.trim()) {
    return rows.message
  }

  if (Array.isArray(rows.message) && rows.message.length > 0) {
    const first = rows.message[0]
    if (typeof first === 'string' && first.trim()) {
      return first
    }
  }

  if (typeof rows.error === 'string' && rows.error.trim()) {
    return rows.error
  }

  if (typeof rows.detail === 'string' && rows.detail.trim()) {
    return rows.detail
  }

  return null
}

async function throwAnnouncementApiError(response: Response, fallbackMessage: string): Promise<never> {
  const payload = await safeReadResponseBody(response)
  throw new AnnouncementApiError(response.status, pickErrorMessage(payload) ?? fallbackMessage)
}

async function parseAnnouncementsListResponse(response: Response): Promise<Announcement[]> {
  const payload = (await response.json()) as
    | AnnouncementApiDto[]
    | { data?: AnnouncementApiDto[]; items?: AnnouncementApiDto[]; announcements?: AnnouncementApiDto[]; results?: AnnouncementApiDto[] }

  const rows = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.items ?? payload.announcements ?? payload.results ?? []

  return mapAnnouncementsFromApi(rows)
}

async function parseAnnouncementResponse(response: Response): Promise<Announcement | null> {
  if (response.status === 404) {
    return null
  }

  const payload = (await response.json()) as AnnouncementApiDto | { data?: AnnouncementApiDto; item?: AnnouncementApiDto }
  const row = 'id' in payload ? payload : payload.data ?? payload.item

  if (!row) {
    return null
  }

  return mapAnnouncementFromApi(row)
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const response = await apiFetch(ANNOUNCEMENTS_ENDPOINT, {
    method: 'GET',
    auth: false,
  })

  if (!response.ok) {
    await throwAnnouncementApiError(response, 'No fue posible cargar los anuncios')
  }

  return parseAnnouncementsListResponse(response)
}

export async function getAnnouncementById(announcementId: string): Promise<Announcement | null> {
  const response = await apiFetch(`${ANNOUNCEMENTS_ENDPOINT}/${announcementId}`, {
    method: 'GET',
    auth: false,
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwAnnouncementApiError(response, 'No fue posible cargar el anuncio')
  }

  return parseAnnouncementResponse(response)
}

export async function createAnnouncement(input: AnnouncementUpsertInput): Promise<Announcement> {
  const body = mapAnnouncementToApiUpsertDto(input)
  const response = await apiFetch(ANNOUNCEMENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    await throwAnnouncementApiError(response, 'No fue posible crear el anuncio')
  }

  const createdAnnouncement = await parseAnnouncementResponse(response)

  if (!createdAnnouncement) {
    throw new Error('Respuesta invalida al crear el anuncio')
  }

  return createdAnnouncement
}

export async function updateAnnouncement(announcementId: string, input: AnnouncementUpsertInput): Promise<Announcement | null> {
  const body = mapAnnouncementToApiUpsertDto(input)
  const response = await apiFetch(`${ANNOUNCEMENTS_ENDPOINT}/${announcementId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwAnnouncementApiError(response, 'No fue posible actualizar el anuncio')
  }

  return parseAnnouncementResponse(response)
}

export async function deleteAnnouncement(announcementId: string): Promise<boolean> {
  const response = await apiFetch(`${ANNOUNCEMENTS_ENDPOINT}/${announcementId}`, {
    method: 'DELETE',
  })

  if (response.status === 404) {
    return false
  }

  if (!response.ok) {
    await throwAnnouncementApiError(response, 'No fue posible eliminar el anuncio')
  }

  return true
}