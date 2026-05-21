import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, FileSpreadsheet, History, LoaderCircle, Upload } from 'lucide-react'
import { listEvents } from '@/services/events.service'
import { CalendarJobApiError, getCalendarJobById, listCalendarJobsByEvent, uploadCalendarJob } from '@/services/calendar-jobs.service'
import type { CalendarJob, CalendarJobUploadResult } from '@/types/calendar-job'
import type { Event } from '@/types/event'

type FileState = File | null

const POLLING_INTERVAL_MS = 3000
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatEventLabel(event: Event): string {
  const parts = [event.title]

  if (event.dateStart) {
    parts.push(new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(event.dateStart)))
  }

  if (event.category?.name) {
    parts.push(event.category.name)
  }

  return parts.filter(Boolean).join(' · ')
}

function getStatusLabel(status: string): string {
  const normalized = status.toUpperCase()

  if (normalized === 'COMPLETADO') {
    return 'Completado'
  }

  if (normalized === 'FALLIDO') {
    return 'Fallido'
  }

  if (normalized === 'PROCESANDO') {
    return 'Procesando'
  }

  if (normalized === 'PENDIENTE') {
    return 'Pendiente'
  }

  return normalized
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase()

  if (normalized === 'COMPLETADO') {
    return 'bg-green-100 text-green-700'
  }

  if (normalized === 'FALLIDO') {
    return 'bg-red-100 text-red-700'
  }

  if (normalized === 'PROCESANDO') {
    return 'bg-blue-100 text-blue-700'
  }

  return 'bg-gray-100 text-gray-600'
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

function getProgressValue(job?: CalendarJob | null): number {
  if (!job) {
    return 0
  }

  if (Number.isFinite(job.progress)) {
    return Math.max(0, Math.min(100, Math.round(job.progress)))
  }

  if (job.totalEmails > 0) {
    return Math.max(0, Math.min(100, Math.round((job.processedEmails / job.totalEmails) * 100)))
  }

  return 0
}

function isFinalJobStatus(status: string): boolean {
  const normalized = status.toUpperCase()
  return normalized === 'COMPLETADO' || normalized === 'FALLIDO'
}

function getHelpText(file: FileState): string {
  if (!file) {
    return 'Selecciona un archivo .xlsx o .xls con una sola columna de correos.'
  }

  return `${file.name} · ${(file.size / 1024).toFixed(1)} KB`
}

export function AdminCalendarJobsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileState>(null)
  const [eventError, setEventError] = useState<string | null>(null)
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<CalendarJob | null>(null)
  const [history, setHistory] = useState<CalendarJob[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const pollingTimeoutRef = useRef<number | null>(null)

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsEventsLoading(true)
      setEventError(null)

      try {
        const rows = await listEvents()
        if (!isMounted) {
          return
        }

        setEvents(rows)
        const firstAvailable = rows.find((event) => !event.deletedAt)
        setSelectedEventId((current) => current || firstAvailable?.id || rows[0]?.id || '')
      } catch {
        if (isMounted) {
          setEventError('No fue posible cargar los eventos disponibles.')
        }
      } finally {
        if (isMounted) {
          setIsEventsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setSelectedFile(null)
    setSelectedJob(null)
    setSubmitError(null)
    setSubmitNotice(null)
    setHistory([])
    setHistoryError(null)

    if (!selectedEventId) {
      return
    }

    let isMounted = true

    async function loadHistory() {
      setHistoryLoading(true)

      try {
        const rows = await listCalendarJobsByEvent(selectedEventId)
        if (isMounted) {
          setHistory(rows)
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof CalendarJobApiError && error.status === 404) {
            setHistory([])
          } else {
            setHistoryError('No fue posible cargar el historial de cargas para este evento.')
          }
        }
      } finally {
        if (isMounted) {
          setHistoryLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isMounted = false
    }
  }, [selectedEventId])

  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current)
      }
    }
  }, [])

  const stopPolling = () => {
    if (pollingTimeoutRef.current !== null) {
      window.clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }

    setIsPolling(false)
  }

  const refreshHistory = async (eventId = selectedEventId) => {
    if (!eventId) {
      return
    }

    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const rows = await listCalendarJobsByEvent(eventId)
      setHistory(rows)
    } catch {
      setHistoryError('No fue posible actualizar el historial de cargas.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const scheduleJobPolling = (jobId: string) => {
    stopPolling()
    setIsPolling(true)

    const tick = async () => {
      try {
        const row = await getCalendarJobById(jobId)

        if (!row) {
          setSelectedJob(null)
          stopPolling()
          return
        }

        setSelectedJob(row)

        const progress = getProgressValue(row)
        if (progress >= 100 || isFinalJobStatus(row.status)) {
          stopPolling()
          await refreshHistory(row.eventId ?? selectedEventId)
          return
        }

        pollingTimeoutRef.current = window.setTimeout(() => {
          void tick()
        }, POLLING_INTERVAL_MS)
      } catch {
        setSubmitError('No fue posible actualizar el progreso del proceso. Puedes revisar el historial más tarde.')
        stopPolling()
      }
    }

    pollingTimeoutRef.current = window.setTimeout(() => {
      void tick()
    }, POLLING_INTERVAL_MS)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setSelectedFile(null)
      return
    }

    const extension = getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null)
      setSubmitError('Solo se permiten archivos .xlsx o .xls.')
      event.target.value = ''
      return
    }

    setSubmitError(null)
    setSelectedFile(file)
  }

  const handleStartUpload = async () => {
    if (!selectedEventId) {
      setSubmitError('Primero debes seleccionar un evento.')
      return
    }

    if (!selectedFile) {
      setSubmitError('Selecciona un archivo Excel antes de continuar.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitNotice(null)

    try {
      const result: CalendarJobUploadResult = await uploadCalendarJob(selectedEventId, selectedFile)
      setSubmitNotice(result.message)
      setSelectedJob({
        id: result.calendarJobId,
        eventId: selectedEventId,
        totalEmails: result.totalEmails,
        totalBatches: result.totalBatches,
        processedEmails: 0,
        failedEmails: 0,
        progress: 0,
        status: 'PROCESANDO',
        message: result.message,
        event: selectedEvent,
        user: null,
      })
      await refreshHistory(selectedEventId)
      scheduleJobPolling(result.calendarJobId)
    } catch (error) {
      if (error instanceof CalendarJobApiError) {
        if (error.status === 401) {
          setSubmitError('Tu sesion expiro. Inicia sesion nuevamente.')
          return
        }

        if (error.status === 403) {
          setSubmitError('Solo usuarios ADMIN pueden iniciar cargas de calendario.')
          return
        }

        if (error.status === 404) {
          setSubmitError('El evento seleccionado no existe.')
          return
        }

        setSubmitError(error.message)
        return
      }

      setSubmitError('No fue posible iniciar la carga. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressValue = getProgressValue(selectedJob)
  const canStart = Boolean(selectedEventId && selectedFile && !isSubmitting && !isEventsLoading)

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">Carga de invitados por Excel</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Selecciona un evento, sube un archivo con correos y sigue el progreso del agendamiento en Google Calendar.
          </p>
        </div>

        <Link
          to="/admin/events"
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 transition-colors"
        >
          Volver a eventos
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <CalendarDays size={18} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">Paso 1</span>
            </div>

            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">Selecciona el evento</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">Este proceso se vincula a un único evento ya creado.</p>

            {isEventsLoading && <p className="text-sm text-gray-500">Cargando eventos...</p>}
            {eventError && <p className="text-sm text-red-600">{eventError}</p>}

            {!isEventsLoading && !eventError && (
              <div className="space-y-3">
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Selecciona un evento</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id} disabled={Boolean(event.deletedAt)}>
                      {formatEventLabel(event)}{event.deletedAt ? ' (cancelado)' : ''}
                    </option>
                  ))}
                </select>

                {selectedEvent && (
                  <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
                    <p className="font-semibold">{selectedEvent.title}</p>
                    <p className="mt-1 text-green-800">
                      {selectedEvent.category?.name ?? 'General'} · {selectedEvent.virtual ? 'Virtual' : 'Presencial'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <FileSpreadsheet size={18} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">Paso 2</span>
            </div>

            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">Sube el archivo Excel</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              El archivo debe tener una sola columna con correos válidos. Se aceptan .xlsx y .xls.
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-green-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-800"
            />

            <p className="mt-3 text-xs text-gray-500">{getHelpText(selectedFile)}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleStartUpload()}
                disabled={!canStart}
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSubmitting ? 'Iniciando...' : 'Iniciar carga'}
              </button>

              <button
                type="button"
                onClick={() => void refreshHistory()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                Actualizar historial
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              El sistema procesará los correos en segundo plano y actualizará el evento en Google Calendar.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <History size={18} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">Paso 3</span>
            </div>

            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-4">Estado actual</h2>

            {submitError && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}
            {submitNotice && <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">{submitNotice}</div>}

            {selectedJob ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(selectedJob.status)}`}>
                      {getStatusLabel(selectedJob.status)}
                    </span>
                    <span className="text-xs text-gray-500">{progressValue}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-700 transition-all" style={{ width: `${progressValue}%` }} />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">{selectedJob.message ?? 'El proceso está en curso.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedJob.totalEmails}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Procesados</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedJob.processedEmails}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Fallidos</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedJob.failedEmails}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Lotes</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedJob.totalBatches}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Job: </span>
                    {selectedJob.id}
                  </p>
                  <p>
                    <span className="font-semibold">Iniciado: </span>
                    {formatDateTime(selectedJob.createdAt ?? selectedJob.startedAt)}
                  </p>
                  <p>
                    <span className="font-semibold">Actualizado: </span>
                    {formatDateTime(selectedJob.updatedAt ?? selectedJob.finishedAt)}
                  </p>
                  {isPolling && <p className="text-green-700 font-medium">Actualizando progreso cada 3 segundos...</p>}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Aquí verás el progreso del proceso una vez inicies la carga.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <History size={18} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">Paso 4</span>
            </div>

            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">Historial por evento</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">Revisa las cargas recientes asociadas al evento seleccionado.</p>

            {historyLoading && <p className="text-sm text-gray-500">Cargando historial...</p>}
            {historyError && <p className="text-sm text-red-600">{historyError}</p>}

            {!historyLoading && !historyError && history.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Aun no hay cargas registradas para este evento.
              </div>
            )}

            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
              {history.map((job) => {
                const progress = getProgressValue(job)

                return (
                  <div key={job.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{job.fileName ?? 'Carga de Excel'}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDateTime(job.createdAt ?? job.startedAt)}</p>
                      </div>

                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-green-700" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {job.processedEmails}/{job.totalEmails} procesados
                      </span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}