export function AnnouncementsPage() {
  return (
    <section className="px-4 py-5 md:px-6 md:py-6">
      <div className="max-w-3xl">
        <h1 className="text-base md:text-lg font-bold text-gray-800">Avisos de bienestar</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4 md:mb-5">Comunicados importantes compartidos por el equipo de bienestar universitario.</p>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-semibold text-amber-700 mb-1">Aun no hay avisos publicados</p>
          <p className="text-xs md:text-sm text-amber-700/80 leading-relaxed">
            Esta pagina ya esta lista. Cuando se habilite la integracion con backend, aqui apareceran avisos urgentes y generales.
          </p>
        </div>
      </div>
    </section>
  )
}
