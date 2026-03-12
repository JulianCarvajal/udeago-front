export function AnnouncementsPage() {
  return (
    <section className="px-4 py-5 md:px-6 md:py-6">
      <div className="max-w-3xl">
        <h1 className="text-base md:text-lg font-bold text-gray-800">Wellbeing announcements</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4 md:mb-5">Important updates shared by the university wellbeing team.</p>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-semibold text-amber-700 mb-1">No announcements yet</p>
          <p className="text-xs md:text-sm text-amber-700/80 leading-relaxed">
            This page is ready. Once the backend integration is available, urgent and general announcements will appear here.
          </p>
        </div>
      </div>
    </section>
  )
}
