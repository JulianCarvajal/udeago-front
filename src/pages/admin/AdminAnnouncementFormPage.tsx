import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnnouncementApiError, createAnnouncement, getAnnouncementById, updateAnnouncement, type AnnouncementUpsertInput } from '@/services/announcements.service'
import { listStatuses } from '@/services/status.service'
import type { Announcement } from '@/types/announcement'

interface FormState {
  title: string
  description: string
  statusId: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function emptyForm(): FormState {
  return {
    title: '',
    description: '',
    statusId: '',
  }
}

function mapFormFromAnnouncement(announcement: Announcement): FormState {
  return {
    title: announcement.title,
    description: announcement.description,
    statusId: announcement.status?.id ?? '',
  }
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'El titulo es obligatorio.'
  }

  if (!form.description.trim()) {
    errors.description = 'La descripcion es obligatoria.'
  }

  return errors
}

function toPayload(form: FormState): AnnouncementUpsertInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    statusId: form.statusId,
  }
}

export function AdminAnnouncementFormPage() {
  const { announcementId } = useParams<{ announcementId: string }>()
  const isEditMode = Boolean(announcementId)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isInitialLoading, setIsInitialLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)

  const parsedAnnouncementId = useMemo(() => announcementId ?? '', [announcementId])

  useEffect(() => {
    let isMounted = true

    async function loadStatuses() {
      try {
        const rows = await listStatuses()

        if (!isMounted) {
          return
        }

        setForm((current) => {
          if (current.statusId || rows.length === 0) {
            return current
          }

          const activeStatus = rows.find((row) => row.status.toUpperCase() === 'ACTIVO')
          return {
            ...current,
            statusId: activeStatus?.id ?? rows[0]?.id ?? '',
          }
        })
      } catch {}
    }

    void loadStatuses()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    if (!parsedAnnouncementId) {
      setIsNotFound(true)
      setIsInitialLoading(false)
      return
    }

    let isMounted = true

    async function loadAnnouncement() {
      setIsInitialLoading(true)
      setIsNotFound(false)
      setSubmitError(null)

      try {
        const announcement = await getAnnouncementById(parsedAnnouncementId)
        if (!isMounted) {
          return
        }

        if (!announcement) {
          setIsNotFound(true)
          return
        }

        setForm(mapFormFromAnnouncement(announcement))
      } catch {
        if (isMounted) {
          setSubmitError('No fue posible cargar el anuncio seleccionado.')
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadAnnouncement()

    return () => {
      isMounted = false
    }
  }, [isEditMode, parsedAnnouncementId])

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

    if (!form.statusId.trim()) {
      setSubmitError('No fue posible determinar el estado del anuncio. Recarga la pagina e intenta de nuevo.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = toPayload(form)

      if (isEditMode) {
        const updated = await updateAnnouncement(parsedAnnouncementId, payload)

        if (!updated) {
          setSubmitError('El anuncio ya no existe. Actualiza e intenta de nuevo.')
          return
        }

        navigate('/admin/announcements', {
          replace: true,
          state: { notice: `El anuncio "${updated.title}" se actualizo correctamente.` },
        })
        return
      }

      const created = await createAnnouncement(payload)

      navigate('/admin/announcements', {
        replace: true,
        state: { notice: `El anuncio "${created.title}" se creo correctamente.` },
      })
    } catch (err) {
      if (err instanceof AnnouncementApiError) {
        if (err.status === 401) {
          setSubmitError('Tu sesion expiro. Inicia sesion nuevamente.')
          return
        }

        if (err.status === 403) {
          setSubmitError('Solo usuarios ADMIN pueden crear o editar anuncios.')
          return
        }

        setSubmitError(err.message || 'No fue posible guardar el anuncio en este momento. Intenta de nuevo.')
        return
      }

      setSubmitError('No fue posible guardar el anuncio en este momento. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitialLoading) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Cargando datos del anuncio...</p>
        </div>
      </section>
    )
  }

  if (isNotFound) {
    return (
      <section className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-base md:text-lg font-semibold text-amber-900">Anuncio no encontrado</h1>
          <p className="mt-1 text-sm text-amber-800">El anuncio que intentas editar no existe.</p>
          <Link to="/admin/announcements" className="mt-4 inline-flex text-sm font-medium text-green-700 hover:text-green-800">
            Volver al listado de anuncios
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar anuncio' : 'Crear anuncio'}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Completa la informacion del aviso que se mostrara en la seccion de novedades.
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
              placeholder="Titulo del anuncio"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="text-xs md:text-sm font-medium text-gray-700">
              Descripcion *
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="min-h-32 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              placeholder="Describe el anuncio o la novedad"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar anuncio' : 'Crear anuncio'}
          </button>

          <Link
            to="/admin/announcements"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}