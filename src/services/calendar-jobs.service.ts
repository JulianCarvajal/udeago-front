import { apiFetch } from '@/services/api'
import { mapCalendarJobFromApi, mapCalendarJobUploadResultFromApi, mapCalendarJobsFromApi } from '@/features/calendar-jobs/mappers/calendar-job.mapper'
import type { CalendarJobApiDto, CalendarJobUploadApiDto } from '@/features/calendar-jobs/api/calendar-job.dto'
import type { CalendarJob, CalendarJobUploadResult } from '@/types/calendar-job'
import { API_BASE_URL } from '@/config/env'

const CALENDAR_JOBS_ENDPOINT = `${API_BASE_URL}/calendar-jobs`

export class CalendarJobApiError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CalendarJobApiError'
    this.status = status
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

async function throwCalendarJobApiError(response: Response, fallbackMessage: string): Promise<never> {
  const payload = await safeReadResponseBody(response)
  throw new CalendarJobApiError(response.status, pickErrorMessage(payload) ?? fallbackMessage)
}

async function parseCalendarJobsListResponse(response: Response): Promise<CalendarJob[]> {
  const payload = (await response.json()) as
    | CalendarJobApiDto[]
    | { data?: CalendarJobApiDto[]; items?: CalendarJobApiDto[]; jobs?: CalendarJobApiDto[]; calendarJobs?: CalendarJobApiDto[]; results?: CalendarJobApiDto[] }

  const rows = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.items ?? payload.jobs ?? payload.calendarJobs ?? payload.results ?? []

  return mapCalendarJobsFromApi(rows)
}

async function parseCalendarJobResponse(response: Response): Promise<CalendarJob | null> {
  if (response.status === 404) {
    return null
  }

  const payload = (await response.json()) as CalendarJobApiDto | { data?: CalendarJobApiDto; item?: CalendarJobApiDto; job?: CalendarJobApiDto; calendarJob?: CalendarJobApiDto }
  const row = 'id' in payload ? payload : payload.data ?? payload.item ?? payload.job ?? payload.calendarJob

  if (!row) {
    return null
  }

  return mapCalendarJobFromApi(row)
}

async function parseCalendarJobUploadResponse(response: Response): Promise<CalendarJobUploadResult> {
  const payload = (await response.json()) as CalendarJobUploadApiDto | { data?: CalendarJobUploadApiDto; item?: CalendarJobUploadApiDto; result?: CalendarJobUploadApiDto }

  if ('calendarJobId' in payload || 'jobId' in payload || 'id' in payload) {
    return mapCalendarJobUploadResultFromApi(payload)
  }

  const wrapper = payload as { data?: CalendarJobUploadApiDto; item?: CalendarJobUploadApiDto; result?: CalendarJobUploadApiDto }
  const row = wrapper.data ?? wrapper.item ?? wrapper.result

  if (!row) {
    throw new Error('Respuesta invalida al iniciar la carga')
  }

  return mapCalendarJobUploadResultFromApi(row)
}

export async function uploadCalendarJob(eventId: string, file: File): Promise<CalendarJobUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch(`${CALENDAR_JOBS_ENDPOINT}/upload/${eventId}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    await throwCalendarJobApiError(response, 'No fue posible iniciar la carga de invitados')
  }

  return parseCalendarJobUploadResponse(response)
}

export async function getCalendarJobById(jobId: string): Promise<CalendarJob | null> {
  const response = await apiFetch(`${CALENDAR_JOBS_ENDPOINT}/${jobId}`, {
    method: 'GET',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwCalendarJobApiError(response, 'No fue posible consultar el proceso')
  }

  return parseCalendarJobResponse(response)
}

export async function listCalendarJobsByEvent(eventId: string): Promise<CalendarJob[]> {
  const response = await apiFetch(`${CALENDAR_JOBS_ENDPOINT}/event/${eventId}`, {
    method: 'GET',
  })

  if (!response.ok) {
    await throwCalendarJobApiError(response, 'No fue posible cargar el historial de cargas')
  }

  return parseCalendarJobsListResponse(response)
}