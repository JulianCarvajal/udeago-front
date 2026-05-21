import type { CalendarJob, CalendarJobUploadResult } from '@/types/calendar-job'
import type { CalendarJobApiDto, CalendarJobUploadApiDto } from '@/features/calendar-jobs/api/calendar-job.dto'

function toStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeStatus(status: string | null): string {
  if (!status) {
    return 'PENDIENTE'
  }

  const normalized = status.toUpperCase()

  if (normalized === 'PROCESSING' || normalized === 'IN_PROGRESS') {
    return 'PROCESANDO'
  }

  if (normalized === 'COMPLETED') {
    return 'COMPLETADO'
  }

  if (normalized === 'FAILED') {
    return 'FALLIDO'
  }

  if (normalized === 'PENDING') {
    return 'PENDIENTE'
  }

  return normalized
}

function mapRelationSummary(relation: CalendarJobApiDto['event'] | CalendarJobApiDto['user']): CalendarJob['event'] | CalendarJob['user'] {
  if (!relation) {
    return null
  }

  if (typeof relation === 'string') {
    return {
      id: relation,
    }
  }

  const id = toStringValue(relation.id) ?? toStringValue(relation._id)

  if (!id) {
    return null
  }

  return {
    id,
    title: toStringValue(relation.title) ?? undefined,
    name: toStringValue(relation.name) ?? undefined,
    email: toStringValue(relation.email) ?? undefined,
  }
}

export function mapCalendarJobFromApi(dto: CalendarJobApiDto): CalendarJob {
  const totalEmails = toNumberValue(dto.totalEmails ?? dto.total_emails)
  const processedEmails = toNumberValue(dto.processedEmails ?? dto.processed_emails)
  const failedEmails = toNumberValue(dto.failedEmails ?? dto.failed_emails)
  const totalBatches = toNumberValue(dto.totalBatches ?? dto.total_batches)
  const progress = toNumberValue(dto.progress, totalEmails > 0 ? Math.min(100, Math.round((processedEmails / totalEmails) * 100)) : 0)
  const status = normalizeStatus(toStringValue(dto.status ?? dto.state))

  return {
    id: dto.id,
    eventId: toStringValue(dto.eventId ?? dto.event_id) ?? undefined,
    totalEmails,
    totalBatches,
    processedEmails,
    failedEmails,
    progress,
    status,
    message: toStringValue(dto.message) ?? undefined,
    fileName: toStringValue(dto.fileName ?? dto.file_name) ?? undefined,
    createdAt: toStringValue(dto.createdAt ?? dto.created_at) ?? undefined,
    updatedAt: toStringValue(dto.updatedAt ?? dto.updated_at) ?? undefined,
    startedAt: toStringValue(dto.startedAt ?? dto.started_at) ?? undefined,
    finishedAt: toStringValue(dto.finishedAt ?? dto.finished_at) ?? undefined,
    event: mapRelationSummary(dto.event),
    user: mapRelationSummary(dto.user),
  }
}

export function mapCalendarJobsFromApi(dtos: CalendarJobApiDto[]): CalendarJob[] {
  return dtos.map(mapCalendarJobFromApi)
}

export function mapCalendarJobUploadResultFromApi(dto: CalendarJobUploadApiDto): CalendarJobUploadResult {
  const calendarJobId = toStringValue(dto.calendarJobId ?? dto.jobId ?? dto.id)

  if (!calendarJobId) {
    throw new Error('Respuesta invalida al iniciar la carga')
  }

  return {
    calendarJobId,
    totalEmails: toNumberValue(dto.totalEmails ?? dto.total_emails),
    totalBatches: toNumberValue(dto.totalBatches ?? dto.total_batches),
    message: toStringValue(dto.message) ?? 'Proceso iniciado.',
  }
}