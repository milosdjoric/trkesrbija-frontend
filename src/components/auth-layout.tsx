import type React from 'react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-main p-2">
      <div className="flex grow items-center justify-center p-6 lg:rounded-xl lg:border lg:border-border-primary lg:bg-card lg:p-10">
        {children}
      </div>
    </main>
  )
}
