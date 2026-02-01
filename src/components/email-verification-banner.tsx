'use client'

import { useAuth } from '@/app/auth/auth-context'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

export function EmailVerificationBanner() {
  const { user, accessToken } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // Don't show if no user, already verified, or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null
  }

  async function handleResend() {
    if (!user?.email || resending) return

    setResending(true)
    try {
      await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          query: `
            mutation ResendVerificationEmail($input: ResendVerificationInput!) {
              resendVerificationEmail(input: $input) {
                success
              }
            }
          `,
          variables: { input: { email: user.email } },
        }),
      })
      setResent(true)
    } catch (err) {
      console.error('Failed to resend verification email:', err)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="size-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {resent ? (
                <span>Verifikacioni email je poslat! Proverite inbox.</span>
              ) : (
                <>
                  <span className="font-medium">Molimo verifikujte vašu email adresu.</span>
                  <span className="hidden sm:inline"> Proverite inbox za verifikacioni link.</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!resent && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-medium text-amber-800 underline hover:text-amber-900 disabled:opacity-50 dark:text-amber-200 dark:hover:text-amber-100"
              >
                {resending ? 'Slanje…' : 'Pošalji ponovo'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
              aria-label="Zatvori"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
