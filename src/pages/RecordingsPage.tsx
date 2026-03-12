export function RecordingsPage() {
  return (
    <section className="px-4 py-5 md:px-6 md:py-6">
      <div className="max-w-3xl">
        <h1 className="text-base md:text-lg font-bold text-gray-800">Event recordings</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4 md:mb-5">Watch links for previous virtual sessions.</p>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-semibold text-gray-700 mb-1">No recordings available yet</p>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            This page has the base structure. Recording links will be listed here after data integration.
          </p>
        </div>
      </div>
    </section>
  )
}
