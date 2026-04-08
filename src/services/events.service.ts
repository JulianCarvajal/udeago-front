import { MOCK_EVENTS } from '@/features/events/mocks/events.mock'
import type { Event } from '@/types/event'

const EVENTS_STORAGE_KEY = 'udeago.events.v1'

export interface EventUpsertInput {
  title: string
  description: string
  categoryId: string
  dateStart: string
  dateEnd?: string
  virtual: boolean
  link?: string
  imageUrl?: string
  videoUrl?: string
  status: Event['status']
  managerId?: number
}

function cloneEvent(event: Event): Event {
  return { ...event }
}

function cloneEvents(events: Event[]): Event[] {
  return events.map(cloneEvent)
}

function getSeedEvents(): Event[] {
  return cloneEvents(MOCK_EVENTS)
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStoredEvents(): Event[] {
  if (!hasLocalStorage()) {
    return getSeedEvents()
  }

  const rawEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY)

  if (!rawEvents) {
    return getSeedEvents()
  }

  try {
    const parsed = JSON.parse(rawEvents)

    if (!Array.isArray(parsed)) {
      return getSeedEvents()
    }

    return parsed.map((item) => ({ ...item })) as Event[]
  } catch {
    return getSeedEvents()
  }
}

function saveStoredEvents(events: Event[]): void {
  if (!hasLocalStorage()) {
    return
  }

  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

function getNextEventId(events: Event[]): number {
  return events.reduce((maxId, event) => Math.max(maxId, event.id), 0) + 1
}

function buildEventFromInput(eventId: number, input: EventUpsertInput, managerId: number, pubDate: string): Event {
  return {
    id: eventId,
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    pubDate,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    managerId,
    virtual: input.virtual,
    link: input.link,
    imageUrl: input.imageUrl,
    videoUrl: input.videoUrl,
    status: input.status,
  }
}

export async function listEvents(): Promise<Event[]> {
  return cloneEvents(readStoredEvents())
}

export async function getEventById(eventId: number): Promise<Event | null> {
  const event = readStoredEvents().find((item) => item.id === eventId)
  return event ? cloneEvent(event) : null
}

export async function createEvent(input: EventUpsertInput): Promise<Event> {
  const events = readStoredEvents()
  const now = new Date().toISOString()
  const newEvent = buildEventFromInput(getNextEventId(events), input, input.managerId ?? 1, now)

  events.unshift(newEvent)
  saveStoredEvents(events)

  return cloneEvent(newEvent)
}

export async function updateEvent(eventId: number, input: EventUpsertInput): Promise<Event | null> {
  const events = readStoredEvents()
  const eventIndex = events.findIndex((item) => item.id === eventId)

  if (eventIndex === -1) {
    return null
  }

  const currentEvent = events[eventIndex]
  const updatedEvent = buildEventFromInput(
    currentEvent.id,
    input,
    input.managerId ?? currentEvent.managerId,
    currentEvent.pubDate,
  )

  events[eventIndex] = updatedEvent
  saveStoredEvents(events)

  return cloneEvent(updatedEvent)
}

export async function deleteEvent(eventId: number): Promise<boolean> {
  const events = readStoredEvents()
  const nextEvents = events.filter((item) => item.id !== eventId)

  if (nextEvents.length === events.length) {
    return false
  }

  saveStoredEvents(nextEvents)
  return true
}

export async function resetEventStore(): Promise<Event[]> {
  const seedEvents = getSeedEvents()
  saveStoredEvents(seedEvents)
  return seedEvents
}