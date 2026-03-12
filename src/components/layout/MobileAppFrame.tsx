import type { ReactNode } from 'react'

interface MobileAppFrameProps {
  children: ReactNode
}

export function MobileAppFrame({ children }: MobileAppFrameProps) {
  return (
    <div className="min-h-screen bg-gray-200 flex justify-center md:items-center md:p-6">
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl bg-white flex flex-col h-screen md:h-[90vh] md:rounded-2xl md:shadow-xl md:overflow-hidden">
        {children}
      </div>
    </div>
  )
}
