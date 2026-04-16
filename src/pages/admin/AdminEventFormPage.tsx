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

const DEFAULT_STATUS_ID = ''

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

function validateForm(form: FormState): FormErrors {
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

  if (!form.dateStart) {
    errors.dateStart = 'La fecha de inicio es obligatoria.'
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

  const parsedEventId = useMemo(() => eventId ?? '', [eventId])

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

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = toPayload(form)

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

          <div className="space-y-2">
            <label htmlFor="dateStart" className="text-xs md:text-sm font-medium text-gray-700">
              Fecha de inicio *
            </label>
            <input
              id="dateStart"
              type="datetime-local"
              value={form.dateStart}
              onChange={(e) => handleFieldChange('dateStart', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            {errors.dateStart && <p className="text-xs text-red-600">{errors.dateStart}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="dateEnd" className="text-xs md:text-sm font-medium text-gray-700">
              Fecha de fin
            </label>
            <input
              id="dateEnd"
              type="datetime-local"
              value={form.dateEnd}
              onChange={(e) => handleFieldChange('dateEnd', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
            {errors.dateEnd && <p className="text-xs text-red-600">{errors.dateEnd}</p>}
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
