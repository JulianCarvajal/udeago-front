export function AdminLoadingPage() {
  return (
    <section className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />
        <p className="text-sm font-medium text-gray-700">Checking admin session...</p>
      </div>
    </section>
  )
}
