import type { Event } from '@/types/event'
import type { EventApiDto, EventApiUpsertDto } from '@/features/events/api/event.dto'

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

function normalizeStatusValue(status: string | null): string {
  if (!status) {
    return 'PROGRAMADO'
  }

  const normalized = status.toUpperCase()

  if (normalized === 'ACTIVE') {
    return 'ACTIVO'
  }

  if (normalized === 'CANCELLED') {
    return 'CANCELADO'
  }

  if (normalized === 'DRAFT') {
    return 'PROGRAMADO'
  }

  return normalized
}

function mapCategory(category: EventApiDto['category']): Event['category'] {
  if (!category) {
    return null
  }

  if (typeof category === 'string') {
    return {
      id: category,
      name: category,
    }
  }

  const id = toStringValue(category.id) ?? toStringValue(category._id) ?? toStringValue(category.name)
  const name = toStringValue(category.name)

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
  }
}

function mapStatus(status: EventApiDto['status']): Event['status'] {
  if (!status) {
    return null
  }

  if (typeof status === 'string') {
    const normalized = normalizeStatusValue(status)
    return {
      id: normalized,
      status: normalized,
    }
  }

  const id = toStringValue(status.id) ?? toStringValue(status._id)
  const rawValue = toStringValue(status.status) ?? toStringValue(status.name)
  const normalizedValue = normalizeStatusValue(rawValue)

  if (!normalizedValue) {
    return null
  }

  return {
    id: id ?? normalizedValue,
    status: normalizedValue,
  }
}

function mapManager(manager: EventApiDto['manager']): Event['manager'] {
  if (!manager) {
    return null
  }

  if (typeof manager === 'string') {
    return {
      id: manager,
    }
  }

  const id = toStringValue(manager.id) ?? toStringValue(manager._id)

  if (!id) {
    return null
  }

  return {
    id,
    name: toStringValue(manager.name) ?? undefined,
    email: toStringValue(manager.email) ?? undefined,
  }
}

export function mapEventFromApi(dto: EventApiDto): Event {
  const pubDate = dto.pubDate ?? dto.pub_date ?? dto.dateStart ?? dto.date_start ?? new Date().toISOString()
  const dateStart = dto.dateStart ?? dto.date_start ?? pubDate
  const dateEnd = dto.dateEnd ?? dto.date_end
  const deletedAt = dto.deletedAt ?? dto.deleted_at

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    pubDate,
    dateStart,
    dateEnd: dateEnd ?? undefined,
    virtual: dto.virtual,
    link: dto.link ?? undefined,
    videoUrl: dto.video ?? undefined,
    imageUrl: dto.image ?? dto.image_url ?? undefined,
    location: dto.location ?? undefined,
    capacity: dto.capacity ?? undefined,
    category: mapCategory(dto.category),
    status: mapStatus(dto.status),
    manager: mapManager(dto.manager),
    deletedAt: deletedAt ?? undefined,
  }
}

export function mapEventsFromApi(dtos: EventApiDto[]): Event[] {
  return dtos.map(mapEventFromApi)
}

export function mapEventToApiUpsertDto(event: Event): EventApiUpsertDto {
  return {
    title: event.title,
    description: event.description,
    pubDate: event.pubDate,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd ?? null,
    virtual: event.virtual,
    link: event.link ?? null,
    image: event.imageUrl ?? null,
    video: event.videoUrl ?? null,
    location: event.location ?? null,
    capacity: event.capacity ?? null,
    category: event.category?.name ?? null,
    status: normalizeStatusValue(event.status?.status ?? null),
  }
}