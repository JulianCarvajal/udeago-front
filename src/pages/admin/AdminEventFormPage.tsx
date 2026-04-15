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
    errors.title = 'Title is required.'
  }

  if (!form.categoryId.trim()) {
    errors.categoryId = 'Category is required.'
  }

  if (!form.statusId.trim()) {
    errors.statusId = 'Status is required.'
  }

  if (!form.dateStart) {
    errors.dateStart = 'Start date is required.'
  }

  if (form.dateEnd && form.dateStart && new Date(form.dateEnd) < new Date(form.dateStart)) {
    errors.dateEnd = 'End date must be equal or later than start date.'
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (form.virtual && !form.link.trim()) {
    errors.link = 'Virtual events should include an access link.'
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
          setSubmitError('Unable to load the selected event.')
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
          setSubmitError('The event no longer exists. Refresh and try again.')
          return
        }

        navigate('/admin/events', {
          replace: true,
          state: { notice: `Event "${updated.title}" updated successfully.` },
        })
        return
      }

      const created = await createEvent(payload)

      navigate('/admin/events', {
        replace: true,
        state: { notice: `Event "${created.title}" created successfully.` },
      })
    } catch (err) {
      if (err instanceof EventApiError) {
        if (err.status === 401) {
          setSubmitError('Your session has expired. Please sign in again.')
          return
        }

        if (err.status === 403) {
          setSubmitError('Only ADMIN users can create or edit events.')
          return
        }

        setSubmitError(err.message || 'Unable to save event right now. Please try again.')
        return
      }

      setSubmitError('Unable to save event right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitialLoading) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Loading event data...</p>
        </div>
      </section>
    )
  }

  if (isNotFound) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-base md:text-lg font-semibold text-amber-900">Event not found</h1>
          <p className="mt-1 text-sm text-amber-800">The event you are trying to edit does not exist.</p>
          <Link to="/admin/events" className="mt-4 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
            Back to events table
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit event' : 'Create event'}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Complete all required fields and save changes to keep the event catalog up to date.
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
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Event title"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-xs md:text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => handleFieldChange('categoryId', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">Select category</option>
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
              Status *
            </label>
            <select
              id="status"
              value={form.statusId}
              onChange={(e) => handleFieldChange('statusId', e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">Select status</option>
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
              Location (optional)
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
              Capacity (optional)
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
              Start date *
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
              End date
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
              Event mode
            </label>
            <select
              id="virtual"
              value={form.virtual ? 'virtual' : 'on-site'}
              onChange={(e) => handleFieldChange('virtual', e.target.value === 'virtual')}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="on-site">On-site</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="link" className="text-xs md:text-sm font-medium text-gray-700">
              Access link {form.virtual ? '*' : '(optional)'}
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
              Description *
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="min-h-28 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Describe the event goals, audience and logistics"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="imageUrl" className="text-xs md:text-sm font-medium text-gray-700">
              Image URL (optional)
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
              Video URL (optional)
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
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update event' : 'Create event'}
          </button>

          <Link
            to="/admin/events"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
