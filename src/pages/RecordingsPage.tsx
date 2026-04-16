export function RecordingsPage() {
  return (
    <section className="px-4 py-5 md:px-6 md:py-6">
      <div className="max-w-3xl">
        <h1 className="text-base md:text-lg font-bold text-gray-800">Grabaciones de eventos</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1 mb-4 md:mb-5">Consulta las grabaciones de sesiones virtuales anteriores.</p>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:p-5 shadow-sm">
          <p className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Aun no hay grabaciones disponibles</p>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            Esta pagina ya tiene la estructura base. Los enlaces de grabaciones apareceran aqui despues de la integracion de datos.
          </p>
        </div>
      </div>
    </section>
  )
}
