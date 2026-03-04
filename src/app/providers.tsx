'use client'

import { AuthProvider } from '@/app/auth/auth-context'
import { ConfirmProvider } from '@/components/confirm-dialog'
import { ToastProvider } from '@/components/toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  )
}
