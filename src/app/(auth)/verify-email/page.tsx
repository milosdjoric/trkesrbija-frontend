'use client'

import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Strong, Text, TextLink } from '@/components/text'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    async function verifyEmail() {
      try {
        const res = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              mutation VerifyEmail($input: VerifyEmailInput!) {
                verifyEmail(input: $input) {
                  success
                  message
                }
              }
            `,
            variables: { input: { token } },
          }),
        })

        const json = await res.json()

        if (json.errors?.length) {
          setErrorMessage(json.errors[0].message)
          setStatus('error')
          return
        }

        setStatus('success')
      } catch (err: any) {
        setErrorMessage(err?.message ?? 'Something went wrong')
        setStatus('error')
      }
    }

    verifyEmail()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <Logo className="mx-auto h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Verifying your email...</Heading>
        <div className="flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <Logo className="mx-auto h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <XCircleIcon className="mx-auto size-16 text-red-500" />
        <Heading>Invalid verification link</Heading>
        <Text>
          This verification link is invalid or missing. Please check your email for the correct link or request a new
          one.
        </Text>
        <Button onClick={() => router.push('/login')} className="w-full">
          Go to login
        </Button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <Logo className="mx-auto h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <XCircleIcon className="mx-auto size-16 text-red-500" />
        <Heading>Verification failed</Heading>
        <Text className="text-red-600 dark:text-red-400">{errorMessage}</Text>
        <Text>The verification link may have expired or already been used.</Text>
        <div className="space-y-3">
          <Button onClick={() => router.push('/login')} className="w-full">
            Go to login
          </Button>
          <Text className="text-sm">
            Need a new link?{' '}
            <TextLink href="/resend-verification">
              <Strong>Resend verification email</Strong>
            </TextLink>
          </Text>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
      <Logo className="mx-auto h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <CheckCircleIcon className="mx-auto size-16 text-green-500" />
      <Heading>Email verified!</Heading>
      <Text>Your email has been successfully verified. You can now access all features of your account.</Text>
      <Button onClick={() => router.push('/')} className="w-full">
        Go to dashboard
      </Button>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
          <Logo className="mx-auto h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
          <Heading>Loading...</Heading>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
