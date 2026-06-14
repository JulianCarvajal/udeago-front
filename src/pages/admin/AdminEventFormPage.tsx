import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  EventApiError,
  createEvent,
  getEventById,
  updateEvent,
  type EventUpsertInput,
} from '@/services/events.service'
import { listCategories, type CategoryOption } from '@/services/categories.service'
import { listStatuses, type StatusOption } from '@/services/status.service'
import type { Event } from '@/types/event'

interface FormState {
  title: string
  categoryId: string
  statusId: string
  virtual: boolean
  dateStart: string
  dateEnd: string
  description: string
  link: string
  imageUrl: string
  videoUrl: string
  location: string
  capacity: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

interface DateDraftState {
  startDate: string
  startHour: string
  startMinute: string
  endDate: string
  endHour: string
  endMinute: string
}

const DEFAULT_STATUS_ID = ''
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']

function emptyForm(): FormState {
  return {
    title: '',
    categoryId: '',
    statusId: DEFAULT_STATUS_ID,
    virtual: false,
    dateStart: '',
    dateEnd: '',
    description: '',
    link: '',
    imageUrl: '',
    videoUrl: '',
    location: '',
    capacity: '',
  }
}

function emptyDateDrafts(): DateDraftState {
  return {
    startDate: '',
    startHour: '',
    startMinute: '',
    endDate: '',
    endHour: '',
    endMinute: '',
  }
}

function toInputDateTime(value?: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function splitDateTime(value?: string): { date: string; hour: string; minute: string } {
  const dateTime = toInputDateTime(value)

  if (!dateTime) {
    return { date: '', hour: '', minute: '' }
  }

  const [date, time] = dateTime.split('T')
  const [hour = '', minute = ''] = (time ?? '').split(':')

  return { date: date ?? '', hour, minute }
}

function combineDateTime(date: string, hour: string, minute: string): string {
  if (!date || !hour || !minute) {
    return ''
  }

  return `${date}T${hour}:${minute}`
}

function mapFormFromEvent(event: Event): FormState {
  return {
    title: event.title,
    categoryId: event.category?.id ?? '',
    statusId: event.status?.id ?? DEFAULT_STATUS_ID,
    virtual: event.virtual,
    dateStart: toInputDateTime(event.dateStart),
    dateEnd: toInputDateTime(event.dateEnd),
    description: event.description,
    link: event.link ?? '',
    imageUrl: event.imageUrl ?? '',
    videoUrl: event.videoUrl ?? '',
    location: event.location ?? '',
    capacity: event.capacity ? String(event.capacity) : '',
  }
}

function validateForm(form: FormState, drafts: DateDraftState): FormErrors {
  const errors: FormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'El titulo es obligatorio.'
  }

  if (!form.categoryId.trim()) {
    errors.categoryId = 'La categoria es obligatoria.'
  }

  if (!form.statusId.trim()) {
    errors.statusId = 'El estado es obligatorio.'
  }

  const startDateComplete = Boolean(drafts.startDate && drafts.startHour && drafts.startMinute)
  const endDateComplete = Boolean(drafts.endDate && drafts.endHour && drafts.endMinute)
  const endDateTouched = Boolean(drafts.endDate || drafts.endHour || drafts.endMinute)

  if (!startDateComplete) {
    errors.dateStart = 'Selecciona la fecha y la hora de inicio.'
  }

  if (endDateTouched && !endDateComplete) {
    errors.dateEnd = 'Si defines el fin, completa fecha y hora.'
  }

  if (form.dateEnd && form.dateStart && new Date(form.dateEnd) < new Date(form.dateStart)) {
    errors.dateEnd = 'La fecha de fin debe ser igual o posterior a la de inicio.'
  }

  if (!form.description.trim()) {
    errors.description = 'La descripcion es obligatoria.'
  }

  if (form.virtual && !form.link.trim()) {
    errors.link = 'Los eventos virtuales deben incluir un enlace de acceso.'
  }

  return errors
}

function toPayload(form: FormState): EventUpsertInput {
  return {
    title: form.title.trim(),
    categoryId: form.categoryId,
    statusId: form.statusId,
    virtual: form.virtual,
    dateStart: new Date(form.dateStart).toISOString(),
    dateEnd: form.dateEnd ? new Date(form.dateEnd).toISOString() : undefined,
    description: form.description.trim(),
    link: form.link.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    videoUrl: form.videoUrl.trim() || undefined,
    location: form.location.trim() || undefined,
    capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
  }
}

export function AdminEventFormPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const isEditMode = Boolean(eventId)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [dateDrafts, setDateDrafts] = useState<DateDraftState>(emptyDateDrafts)

  const parsedEventId = useMemo(() => eventId ?? '', [eventId])

  const setDraftValue = (key: keyof DateDraftState, value: string) => {
    setDateDrafts((current) => {
      const next = { ...current, [key]: value }
      const nextStart = combineDateTime(next.startDate, next.startHour, next.startMinute)
      const nextEnd = combineDateTime(next.endDate, next.endHour, next.endMinute)

      setForm((currentForm) => ({
        ...currentForm,
        dateStart: nextStart,
        dateEnd: nextEnd,
      }))

      return next
    })

    setErrors((current) => {
      const fieldKey = key.startsWith('start') ? 'dateStart' : 'dateEnd'

      if (!current[fieldKey]) {
        return current
      }

      const next = { ...current }
      delete next[fieldKey]
      return next
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadMetadataOptions() {
      try {
        const [categories, statuses] = await Promise.all([listCategories(), listStatuses()])

        if (!isMounted) {
          return
        }

        setCategoryOptions(categories)
        setStatusOptions(statuses)

        setForm((current) => {
          if (current.statusId || statuses.length === 0) {
            return current
          }

          const programmed = statuses.find((row) => row.status.toUpperCase() === 'PROGRAMADO')
          return {
            ...current,
            statusId: programmed?.id ?? statuses[0]?.id ?? '',
          }
        })
      } catch {
        if (isMounted) {
          setCategoryOptions([])
          setStatusOptions([])
        }
      }
    }

    void loadMetadataOptions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    if (!parsedEventId) {
      setIsNotFound(true)
      setIsInitialLoading(false)
      return
    }

    let isMounted = true

    async function loadEvent() {
      setIsInitialLoading(true)
      setIsNotFound(false)
      setSubmitError(null)

      try {
        const event = await getEventById(parsedEventId)
        if (!isMounted) {
          return
        }

        if (!event) {
          setIsNotFound(true)
          return
        }

        setForm(mapFormFromEvent(event))
        const startParts = splitDateTime(event.dateStart)
        const endParts = splitDateTime(event.dateEnd)

        setDateDrafts({
          startDate: startParts.date,
          startHour: startParts.hour,
          startMinute: startParts.minute,
          endDate: endParts.date,
          endHour: endParts.hour,
          endMinute: endParts.minute,
        })
      } catch {
        if (isMounted) {
          setSubmitError('No fue posible cargar el evento seleccionado.')
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadEvent()

    return () => {
      isMounted = false
    }
  }, [isEditMode, parsedEventId])

  const handleFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }

      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const submissionForm: FormState = {
      ...form,
      dateStart: combineDateTime(dateDrafts.startDate, dateDrafts.startHour, dateDrafts.startMinute),
      dateEnd: combineDateTime(dateDrafts.endDate, dateDrafts.endHour, dateDrafts.endMinute),
    }

    const nextErrors = validateForm(submissionForm, dateDrafts)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = toPayload(submissionForm)

      if (isEditMode) {
        const updated = await updateEvent(parsedEventId, payload)

        if (!updated) {
          setSubmitError('El evento ya no existe. Actualiza e intenta de nuevo.')
          return
        }

        navigate('/admin/events', {
          replace: true,
          state: { notice: `El evento "${updated.title}" se actualizo correctamente.` },
        })
        return
      }

      const created = await createEvent(payload)

      navigate('/admin/events', {
        replace: true,
        state: { notice: `El evento "${created.title}" se creo correctamente.` },
      })
    } catch (err) {
      if (err instanceof EventApiError) {
        if (err.status === 401) {
          setSubmitError('Tu sesion expiro. Inicia sesion nuevamente.')
          return
        }

        if (err.status === 403) {
          setSubmitError('Solo usuarios ADMIN pueden crear o editar eventos.')
          return
        }

        setSubmitError(err.message || 'No fue posible guardar el evento en este momento. Intenta de nuevo.')
        return
      }

      setSubmitError('No fue posible guardar el evento en este momento. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitialLoading) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Cargando datos del evento...</p>
        </div>
      </section>
    )
  }

  if (isNotFound) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-base md:text-lg font-semibold text-amber-900">Evento no encontrado</h1>
          <p className="mt-1 text-sm text-amber-800">El evento que intentas editar no existe.</p>
          <Link to="/admin/events" className="mt-4 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
            Volver a la tabla de eventos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar evento' : 'Crear evento'}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Completa los campos obligatorios y guarda los cambios para mantener actualizado el catalogo de eventos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
        {submitError && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="title" className="text-xs md:text-sm font-medium text-gray-700">
              Titulo *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Titulo del evento"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-xs md:text-sm font-medium text-gray-700">
              Categoria *
            </label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => handleFieldChange('categoryId', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">Selecciona una categoria</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-xs md:text-sm font-medium text-gray-700">
              Estado *
            </label>
            <select
              id="status"
              value={form.statusId}
              onChange={(e) => handleFieldChange('statusId', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">Selecciona un estado</option>
              {statusOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.status}
                </option>
              ))}
            </select>
            {errors.statusId && <p className="text-xs text-red-600">{errors.statusId}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-xs md:text-sm font-medium text-gray-700">
              Ubicacion (opcional)
            </label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Bloque 16, auditorio principal"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="capacity" className="text-xs md:text-sm font-medium text-gray-700">
              Cupos (opcional)
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => handleFieldChange('capacity', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="200"
            />
          </div>

          <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 md:p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                📅
              </div>
              <div>
                <h2 className="text-sm md:text-base font-semibold text-gray-900">Horario del evento</h2>
                <p className="mt-1 text-xs md:text-sm text-gray-500">Elige primero la fecha y luego la hora exacta. Para eventos largos, completa también el fin.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <label htmlFor="dateStart-date" className="text-xs md:text-sm font-medium text-gray-700">
                      Inicio del evento *
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Define cuándo empieza el evento.</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-700">
                    Obligatorio
                  </span>
                </div>

                <div className="space-y-3">
                  <input
                    id="dateStart-date"
                    type="date"
                    value={dateDrafts.startDate}
                    onChange={(e) => setDraftValue('startDate', e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <div className="space-y-1.5">
                      <label htmlFor="dateStart-hour" className="text-xs font-medium text-gray-700">
                        Hora
                      </label>
                      <select
                        id="dateStart-hour"
                        value={dateDrafts.startHour}
                        onChange={(e) => setDraftValue('startHour', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <option value="">--</option>
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pb-3 text-center text-lg font-semibold text-gray-400">:</div>

                    <div className="space-y-1.5">
                      <label htmlFor="dateStart-minute" className="text-xs font-medium text-gray-700">
                        Minutos
                      </label>
                      <select
                        id="dateStart-minute"
                        value={dateDrafts.startMinute}
                        onChange={(e) => setDraftValue('startMinute', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <option value="">--</option>
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {errors.dateStart && <p className="mt-3 text-xs text-red-600">{errors.dateStart}</p>}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <label htmlFor="dateEnd-date" className="text-xs md:text-sm font-medium text-gray-700">
                      Fin del evento
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Opcional. Úsalo para eventos de varios días.</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Opcional
                  </span>
                </div>

                <div className="space-y-3">
                  <input
                    id="dateEnd-date"
                    type="date"
                    value={dateDrafts.endDate}
                    onChange={(e) => setDraftValue('endDate', e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <div className="space-y-1.5">
                      <label htmlFor="dateEnd-hour" className="text-xs font-medium text-gray-700">
                        Hora
                      </label>
                      <select
                        id="dateEnd-hour"
                        value={dateDrafts.endHour}
                        onChange={(e) => setDraftValue('endHour', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <option value="">--</option>
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pb-3 text-center text-lg font-semibold text-gray-400">:</div>

                    <div className="space-y-1.5">
                      <label htmlFor="dateEnd-minute" className="text-xs font-medium text-gray-700">
                        Minutos
                      </label>
                      <select
                        id="dateEnd-minute"
                        value={dateDrafts.endMinute}
                        onChange={(e) => setDraftValue('endMinute', e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <option value="">--</option>
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {errors.dateEnd && <p className="mt-3 text-xs text-red-600">{errors.dateEnd}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="virtual" className="text-xs md:text-sm font-medium text-gray-700">
              Modalidad del evento
            </label>
            <select
              id="virtual"
              value={form.virtual ? 'virtual' : 'on-site'}
              onChange={(e) => handleFieldChange('virtual', e.target.value === 'virtual')}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="on-site">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="link" className="text-xs md:text-sm font-medium text-gray-700">
              Enlace de acceso {form.virtual ? '*' : '(opcional)'}
            </label>
            <input
              id="link"
              type="url"
              value={form.link}
              onChange={(e) => handleFieldChange('link', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="https://..."
            />
            {errors.link && <p className="text-xs text-red-600">{errors.link}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="text-xs md:text-sm font-medium text-gray-700">
              Descripcion *
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="min-h-28 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Describe el objetivo, publico y logistica del evento"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="imageUrl" className="text-xs md:text-sm font-medium text-gray-700">
              URL de imagen (opcional)
            </label>
            <input
              id="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="videoUrl" className="text-xs md:text-sm font-medium text-gray-700">
              URL de video (opcional)
            </label>
            <input
              id="videoUrl"
              type="url"
              value={form.videoUrl}
              onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar evento' : 'Crear evento'}
          </button>

          <Link
            to="/admin/events"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
