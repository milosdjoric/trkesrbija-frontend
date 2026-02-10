'use client'

import { AuthLogo } from '@/components/auth-logo'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { PasswordStrength, validatePassword } from '@/components/password-strength'
import { Strong, Text, TextLink } from '@/components/text'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValidation = validatePassword(password)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Neispravan link za resetovanje. Molimo zatražite novi.')
      return
    }

    if (!passwordValidation.isValid) {
      setError('Molimo ispunite sve zahteve za lozinku')
      return
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ResetPassword($input: ResetPasswordInput!) {
              resetPassword(input: $input) {
                success
                message
              }
            }
          `,
          variables: { input: { token, newPassword: password } },
        }),
      })

      const json = await res.json()

      if (json.errors?.length) {
        throw new Error(json.errors[0].message)
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Došlo je do greške')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <AuthLogo />
        <Heading>Neispravan link za resetovanje</Heading>
        <Text>
          Ovaj link za resetovanje lozinke je neispravan ili je istekao. Molimo zatražite novi.
        </Text>
        <Button onClick={() => router.push('/forgot-password')} className="w-full">
          Zatraži novi link
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <AuthLogo />
        <Heading>Lozinka uspešno resetovana</Heading>
        <Text>
          Vaša lozinka je uspešno resetovana. Sada se možete prijaviti sa novom lozinkom.
        </Text>
        <Button onClick={() => router.push('/login')} className="w-full">
          Idi na prijavu
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <AuthLogo />
      <div>
        <Heading>Postavi novu lozinku</Heading>
        <Text className="mt-2">Unesi svoju novu lozinku ispod.</Text>
      </div>

      {error && <Text className="text-red-600 dark:text-red-500">{error}</Text>}

      <Field>
        <Label>Nova lozinka</Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
          autoComplete="new-password"
          required
          disabled={loading}
        />
        <PasswordStrength password={password} className="mt-2" />
      </Field>

      <Field>
        <Label>Potvrdi novu lozinku</Label>
        <Input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (error) setError(null)
          }}
          autoComplete="new-password"
          required
          disabled={loading}
        />
        {confirmPassword && password !== confirmPassword && (
          <Text className="mt-1 text-sm text-red-600 dark:text-red-500">Lozinke se ne poklapaju</Text>
        )}
      </Field>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
      >
        {loading ? 'Resetovanje…' : 'Resetuj lozinku'}
      </Button>

      <Text>
        Sećaš se lozinke?{' '}
        <TextLink href="/login">
          <Strong>Prijavi se</Strong>
        </TextLink>
      </Text>
    </form>
  )
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="grid w-full max-w-sm grid-cols-1 gap-8">
          <AuthLogo />
          <Heading>Učitavanje…</Heading>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
