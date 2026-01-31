'use client'

import { Logo } from '@/app/logo'
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
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Invalid reset link</Heading>
        <Text>
          This password reset link is invalid or has expired. Please request a new one.
        </Text>
        <Button onClick={() => router.push('/forgot-password')} className="w-full">
          Request new reset link
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Password reset successful</Heading>
        <Text>
          Your password has been reset successfully. You can now log in with your new password.
        </Text>
        <Button onClick={() => router.push('/login')} className="w-full">
          Go to login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <div>
        <Heading>Set new password</Heading>
        <Text className="mt-2">Enter your new password below.</Text>
      </div>

      {error && <Text className="text-red-600 dark:text-red-500">{error}</Text>}

      <Field>
        <Label>New password</Label>
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
        <Label>Confirm new password</Label>
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
          <Text className="mt-1 text-sm text-red-600 dark:text-red-500">Passwords do not match</Text>
        )}
      </Field>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
      >
        {loading ? 'Resetting...' : 'Reset password'}
      </Button>

      <Text>
        Remember your password?{' '}
        <TextLink href="/login">
          <Strong>Sign in</Strong>
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
          <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
          <Heading>Loading...</Heading>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
