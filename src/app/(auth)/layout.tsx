import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AuthLayout } from '@/components/auth-layout'
import Providers from '../providers'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  // If a refresh token cookie exists, treat the user as logged in and block auth pages
  if (refreshToken) {
    redirect('/')
  }

  return (
    <Providers>
      <AuthLayout>{children}</AuthLayout>
    </Providers>
  )
}
