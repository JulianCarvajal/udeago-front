interface RelationApiDto {
  id?: string
  _id?: string
  title?: string
  name?: string
  email?: string
}

export interface CalendarJobApiDto {
  id: string
  eventId?: string
  event_id?: string
  totalEmails?: number
  total_emails?: number
  totalBatches?: number
  total_batches?: number
  processedEmails?: number
  processed_emails?: number
  failedEmails?: number
  failed_emails?: number
  progress?: number
  status?: string
  state?: string
  message?: string
  fileName?: string
  file_name?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  startedAt?: string
  started_at?: string
  finishedAt?: string
  finished_at?: string
  event?: RelationApiDto | string | null
  user?: RelationApiDto | string | null
}

export interface CalendarJobUploadApiDto {
  calendarJobId?: string
  jobId?: string
  id?: string
  totalEmails?: number
  total_emails?: number
  totalBatches?: number
  total_batches?: number
  message?: string
}