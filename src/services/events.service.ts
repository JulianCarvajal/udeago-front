import { mapEventFromApi, mapEventsFromApi, mapEventToApiUpsertDto } from '@/features/events/mappers/event.mapper'
import type { EventApiDto } from '@/features/events/api/event.dto'
import { apiFetch } from '@/services/api'
import type { Event } from '@/types/event'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const EVENTS_ENDPOINT = `${API_BASE_URL}/events`

export interface EventUpsertInput {
  title: string
  description: string
  categoryName: string
  statusValue: string
  dateStart: string
  dateEnd?: string
  virtual: boolean
  link?: string
  imageUrl?: string
  videoUrl?: string
  location?: string
  capacity?: number
}

function buildDomainEvent(input: EventUpsertInput): Event {
  const now = new Date().toISOString()
  return {
    id: '',
    title: input.title,
    description: input.description,
    pubDate: now,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    virtual: input.virtual,
    link: input.link,
    videoUrl: input.videoUrl,
    imageUrl: input.imageUrl,
    location: input.location,
    capacity: input.capacity,
    category: input.categoryName
      ? {
          id: input.categoryName,
          name: input.categoryName,
        }
      : null,
    status: input.statusValue
      ? {
          id: input.statusValue,
          status: input.statusValue,
        }
      : null,
    manager: null,
  }
}

async function parseEventsListResponse(response: Response): Promise<Event[]> {
  const payload = (await response.json()) as EventApiDto[] | { data?: EventApiDto[]; items?: EventApiDto[] }
  const rows = Array.isArray(payload) ? payload : payload.data ?? payload.items ?? []
  
  console.log('[DEBUG] Events API raw response:', { payload, rowsCount: rows.length })
  
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
    throw new Error('Failed to load events')
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
    throw new Error('Failed to load event')
  }

  return parseEventResponse(response)
}

export async function createEvent(input: EventUpsertInput): Promise<Event> {
  const body = mapEventToApiUpsertDto(buildDomainEvent(input))
  const response = await apiFetch(EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Failed to create event')
  }

  const createdEvent = await parseEventResponse(response)

  if (!createdEvent) {
    throw new Error('Invalid create event response')
  }

  return createdEvent
}

export async function updateEvent(eventId: string, input: EventUpsertInput): Promise<Event | null> {
  const body = mapEventToApiUpsertDto(buildDomainEvent(input))
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
    throw new Error('Failed to update event')
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
    throw new Error('Failed to delete event')
  }

  return true
}