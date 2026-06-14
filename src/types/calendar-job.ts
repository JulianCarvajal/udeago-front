export interface CalendarJobEventSummary {
  id: string
  title?: string
}

export interface CalendarJobAuthorSummary {
  id: string
  name?: string
  email?: string
}

export interface CalendarJob {
  id: string
  eventId?: string
  totalEmails: number
  totalBatches: number
  processedEmails: number
  failedEmails: number
  progress: number
  status: string
  message?: string
  fileName?: string
  createdAt?: string
  updatedAt?: string
  startedAt?: string
  finishedAt?: string
  event: CalendarJobEventSummary | null
  user: CalendarJobAuthorSummary | null
}

export interface CalendarJobUploadResult {
  calendarJobId: string
  totalEmails: number
  totalBatches: number
  message: string
}