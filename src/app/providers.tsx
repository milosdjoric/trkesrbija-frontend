'use client'

import { AuthProvider } from '@/app/auth/auth-context'
import { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>
}
