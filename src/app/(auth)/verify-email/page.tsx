'use client'

import { AuthLogo } from '@/components/auth-logo'
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
        setErrorMessage(err?.message ?? 'Došlo je do greške')
        setStatus('error')
      }
    }

    verifyEmail()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <AuthLogo className="mx-auto" />
        <Heading>Verifikacija emaila…</Heading>
        <div className="flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-border-secondary border-t-white" />
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <AuthLogo className="mx-auto" />
        <XCircleIcon className="mx-auto size-16 text-red-500" />
        <Heading>Neispravan link za verifikaciju</Heading>
        <Text>
          Ovaj link za verifikaciju je neispravan ili nedostaje. Molimo proverite vaš email za ispravan link ili
          zatražite novi.
        </Text>
        <Button onClick={() => router.push('/login')} className="w-full">
          Idi na prijavu
        </Button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
        <AuthLogo className="mx-auto" />
        <XCircleIcon className="mx-auto size-16 text-red-500" />
        <Heading>Verifikacija nije uspela</Heading>
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-red-400">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <Text className="text-red-300">{errorMessage}</Text>
        </div>
        <Text>Link za verifikaciju je možda istekao ili je već korišćen.</Text>
        <div className="space-y-3">
          <Button onClick={() => router.push('/login')} className="w-full">
            Idi na prijavu
          </Button>
          <Text className="text-sm">
            Treba vam novi link?{' '}
            <TextLink href="/resend-verification">
              <Strong>Pošalji ponovo verifikacioni email</Strong>
            </TextLink>
          </Text>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
      <AuthLogo className="mx-auto" />
      <CheckCircleIcon className="mx-auto size-16 text-brand-green" />
      <Heading>Email verifikovan!</Heading>
      <Text>Vaš email je uspešno verifikovan. Sada možete pristupiti svim funkcijama vašeg naloga.</Text>
      <Button onClick={() => router.push('/')} className="w-full">
        Idi na početnu
      </Button>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="grid w-full max-w-sm grid-cols-1 gap-8 text-center">
          <AuthLogo className="mx-auto" />
          <Heading>Učitavanje…</Heading>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
