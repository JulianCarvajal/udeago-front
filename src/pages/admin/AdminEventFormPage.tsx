import { useParams } from 'react-router-dom'

export function AdminEventFormPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const isEditMode = Boolean(eventId)

  return (
    <section className="max-w-5xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit event' : 'Create event'}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          This is the scaffold for the admin form. It will later receive validation and save actions.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-11 rounded-xl bg-gray-50 border border-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-11 rounded-xl bg-gray-50 border border-gray-100" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-28 rounded-xl bg-gray-50 border border-gray-100" />
          </div>
        </div>
      </div>
    </section>
  )
}
