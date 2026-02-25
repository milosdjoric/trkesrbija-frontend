'use client'

import { useAuth } from '@/app/auth/auth-context'
import { AuthLogo } from '@/components/auth-logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { GoogleLogin } from '@react-oauth/google'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loginWithGoogle, isLoading, user } = useAuth()
  const loading = isLoading

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sanitize redirect param — only allow relative paths starting with /
  // to prevent open redirect attacks (e.g., //evil.com or https://evil.com)
  const rawRedirect = searchParams.get('redirect')
  const redirectTo = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/'

  useEffect(() => {
    if (user) {
      router.replace(redirectTo)
    }
  }, [user, router, redirectTo])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    try {
      await login(email, password)
      router.push(redirectTo)
    } catch (err: any) {
      setError(err?.message ?? 'Prijava nije uspela')
    }
  }

  async function handleGoogleLogin(credential: string | undefined) {
    if (!credential) return
    setError(null)
    try {
      await loginWithGoogle(credential)
      router.push(redirectTo)
    } catch (err: any) {
      setError(err?.message ?? 'Google prijava nije uspela')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <AuthLogo />
      <Heading>Prijavi se na svoj nalog</Heading>

      {error && <Text className="text-red-600 dark:text-red-500">{error}</Text>}

      <Field>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          required
        />
      </Field>

      <Field>
        <Label>Lozinka</Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
          required
        />
      </Field>

      <div className="flex items-center justify-end">
        <Text>
          <TextLink href="/forgot-password">
            <Strong>Zaboravljena lozinka?</Strong>
          </TextLink>
        </Text>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password}>
        {loading ? 'Prijavljivanje…' : 'Prijavi se'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <Text className="text-zinc-500">ili</Text>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(res) => handleGoogleLogin(res.credential)}
          onError={() => setError('Google prijava nije uspela')}
          useOneTap={false}
          width="368"
        />
      </div>

      <Text>
        Nemaš nalog?{' '}
        <TextLink href="/register">
          <Strong>Registruj se</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
