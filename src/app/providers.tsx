'use client'

import { AuthProvider } from '@/app/auth/auth-context'
import { ConfirmProvider } from '@/components/confirm-dialog'
import { ToastProvider } from '@/components/toast'
import { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
