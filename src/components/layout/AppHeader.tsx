import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 md:px-6 md:py-4 flex items-center">
      <Link
        to="/"
        className="text-lg md:text-xl font-bold text-green-700 tracking-tight transition-colors hover:text-green-800"
        aria-label="Go to home"
      >
        UdeAGo
      </Link>
    </header>
  )
}
