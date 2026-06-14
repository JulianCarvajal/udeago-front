import { mapEventFromApi, mapEventsFromApi } from '@/features/events/mappers/event.mapper'
import type { EventApiDto, EventApiUpsertDto } from '@/features/events/api/event.dto'
import { apiFetch } from '@/services/api'
import type { Event } from '@/types/event'
import { API_BASE_URL } from '@/config/env'

const EVENTS_ENDPOINT = `${API_BASE_URL}/events`

export class EventApiError extends Error {
  public readonly status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)
    this.name = 'EventApiError'
    this.status = status
  }
}

export interface EventUpsertInput {
  title: string
  description: string
  categoryId: string
  statusId: string
  dateStart: string
  dateEnd?: string
  virtual: boolean
  link?: string
  imageUrl?: string
  videoUrl?: string
  location?: string
  capacity?: number
}

function mapInputToApiUpsertDto(input: EventUpsertInput): EventApiUpsertDto {
  return {
    title: input.title,
    description: input.description,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    virtual: input.virtual,
    link: input.link,
    image: input.imageUrl,
    video: input.videoUrl,
    location: input.location,
    capacity: input.capacity,
    id_category: input.categoryId,
    id_status: input.statusId,
  }
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

async function throwEventApiError(response: Response, fallbackMessage: string): Promise<never> {
  const payload = await safeReadResponseBody(response)
  const message = pickErrorMessage(payload) ?? fallbackMessage
  throw new EventApiError(response.status, message)
}

async function parseEventsListResponse(response: Response): Promise<Event[]> {
  const payload = (await response.json()) as
    | EventApiDto[]
    | { data?: EventApiDto[]; items?: EventApiDto[]; events?: EventApiDto[]; results?: EventApiDto[] }
  const rows = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.items ?? payload.events ?? payload.results ?? []

  return mapEventsFromApi(rows)
}

async function parseEventResponse(response: Response): Promise<Event | null> {
  if (response.status === 404) {
    return null
  }

  const payload = (await response.json()) as EventApiDto | { data?: EventApiDto; item?: EventApiDto }
  const row = 'id' in payload ? payload : payload.data ?? payload.item

  if (!row) {
    return null
  }

  return mapEventFromApi(row)
}

export async function listEvents(): Promise<Event[]> {
  const response = await apiFetch(EVENTS_ENDPOINT, {
    method: 'GET',
    auth: false,
  })

  if (!response.ok) {
    await throwEventApiError(response, 'No fue posible cargar los eventos')
  }

  return parseEventsListResponse(response)
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const response = await apiFetch(`${EVENTS_ENDPOINT}/${eventId}`, {
    method: 'GET',
    auth: false,
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwEventApiError(response, 'No fue posible cargar el evento')
  }

  return parseEventResponse(response)
}

export async function createEvent(input: EventUpsertInput): Promise<Event> {
  const body = mapInputToApiUpsertDto(input)
  const response = await apiFetch(EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    await throwEventApiError(response, 'No fue posible crear el evento')
  }

  const createdEvent = await parseEventResponse(response)

  if (!createdEvent) {
    throw new Error('Respuesta invalida al crear el evento')
  }

  return createdEvent
}

export async function updateEvent(eventId: string, input: EventUpsertInput): Promise<Event | null> {
  const body = mapInputToApiUpsertDto(input)
  const response = await apiFetch(`${EVENTS_ENDPOINT}/${eventId}`, {
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
    await throwEventApiError(response, 'No fue posible actualizar el evento')
  }

  return parseEventResponse(response)
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const response = await apiFetch(`${EVENTS_ENDPOINT}/${eventId}`, {
    method: 'DELETE',
  })

  if (response.status === 404) {
    return false
  }

  if (!response.ok) {
    await throwEventApiError(response, 'No fue posible cancelar el evento')
  }

  return true
}