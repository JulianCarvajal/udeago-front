import type { Event } from '@/types/event'
import type { EventApiDto, EventApiUpsertDto } from '@/features/events/api/event.dto'

function normalizeStatus(status: string): Event['status'] {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'active' || normalizedStatus === 'cancelled' || normalizedStatus === 'draft') {
    return normalizedStatus
  }

  return 'draft'
}

export function mapEventFromApi(dto: EventApiDto): Event {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    categoryId: dto.category ?? '',
    pubDate: dto.pub_date,
    dateStart: dto.date_start,
    dateEnd: dto.date_end ?? undefined,
    managerId: dto.manager,
    virtual: dto.virtual,
    link: dto.link ?? undefined,
    imageUrl: dto.image_url ?? undefined,
    videoUrl: dto.video ?? undefined,
    status: normalizeStatus(dto.status),
  }
}

export function mapEventsFromApi(dtos: EventApiDto[]): Event[] {
  return dtos.map(mapEventFromApi)
}

export function mapEventToApiUpsertDto(event: Event): EventApiUpsertDto {
  return {
    title: event.title,
    description: event.description,
    category: event.categoryId || null,
    date_start: event.dateStart,
    date_end: event.dateEnd ?? null,
    virtual: event.virtual,
    link: event.link ?? null,
    image_url: event.imageUrl ?? null,
    video: event.videoUrl ?? null,
    status: event.status,
  }
}