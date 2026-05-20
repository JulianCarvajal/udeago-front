import type { Announcement } from '@/types/announcement'
import type { AnnouncementApiDto, AnnouncementApiUpsertDto } from '@/features/announcements/api/announcement.dto'

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
    return 'ACTIVO'
  }

  const normalized = status.toUpperCase()

  if (normalized === 'ACTIVE') {
    return 'ACTIVO'
  }

  if (normalized === 'CANCELLED') {
    return 'CANCELADO'
  }

  return normalized
}

function mapStatus(status: AnnouncementApiDto['status']): Announcement['status'] {
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
  const rawStatus = toStringValue(status.status) ?? toStringValue(status.name)
  const normalized = normalizeStatusValue(rawStatus)

  return {
    id: id ?? normalized,
    status: normalized,
  }
}

function mapUser(user: AnnouncementApiDto['user']): Announcement['user'] {
  if (!user) {
    return null
  }

  if (typeof user === 'string') {
    return {
      id: user,
    }
  }

  const id = toStringValue(user.id) ?? toStringValue(user._id)

  if (!id) {
    return null
  }

  return {
    id,
    name: toStringValue(user.name) ?? undefined,
    email: toStringValue(user.email) ?? undefined,
  }
}

export function mapAnnouncementFromApi(dto: AnnouncementApiDto): Announcement {
  const date = dto.date ?? dto.createdAt ?? dto.updatedAt ?? new Date().toISOString()

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    date,
    createdAt: dto.createdAt ?? undefined,
    updatedAt: dto.updatedAt ?? undefined,
    deletedAt: dto.deletedAt ?? undefined,
    status: mapStatus(dto.status),
    user: mapUser(dto.user),
  }
}

export function mapAnnouncementsFromApi(dtos: AnnouncementApiDto[]): Announcement[] {
  return dtos.map(mapAnnouncementFromApi)
}

export function mapAnnouncementToApiUpsertDto(announcement: {
  title: string
  description: string
  statusId: string
}): AnnouncementApiUpsertDto {
  return {
    title: announcement.title,
    description: announcement.description,
    id_status: announcement.statusId,
  }
}