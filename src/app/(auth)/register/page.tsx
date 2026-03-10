'use client'

import { useAuth } from '@/app/auth/auth-context'
import { AuthLogo } from '@/components/auth-logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { PasswordStrength, validatePassword } from '@/components/password-strength'
import { Strong, Text, TextLink } from '@/components/text'
import { GoogleLogin } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Register() {
  const router = useRouter()
  const { register, loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValidation = validatePassword(password)

  async function handleGoogleLogin(credential: string | undefined) {
    if (!credential) return
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle(credential)
      router.push('/')
    } catch (err: any) {
      setError(err?.message ?? 'Google prijava nije uspela')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validate password before submit
    if (!passwordValidation.isValid) {
      setError('Molimo ispunite sve zahteve za lozinku')
      return
    }

    const emailTrimmed = email.trim()
    const nameTrimmed = name.trim()

    setLoading(true)
    try {
      await register({
        email: emailTrimmed,
        password,
        ...(nameTrimmed ? { name: nameTrimmed } : {}),
      })
      router.push('/')
    } catch (err: any) {
      setError(err?.message ?? 'Registracija nije uspela')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <AuthLogo />
      <Heading>Kreiraj svoj nalog</Heading>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-red-400">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <Text className="text-red-300">{error}</Text>
        </div>
      )}

      <Field>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
      </Field>

      <Field>
        <Label>Ime i prezime</Label>
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={loading}
        />
      </Field>

      <Field>
        <Label>Lozinka</Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading}
        />
        <PasswordStrength password={password} className="mt-2" />
      </Field>

      <CheckboxField className="hidden">
        <Checkbox
          name="marketing"
          checked={marketingOptIn}
          onChange={(checked) => setMarketingOptIn(Boolean(checked))}
        />
        <Label>Primaj obaveštenja o novostima.</Label>
      </CheckboxField>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !passwordValidation.isValid || !email.trim()}
      >
        {loading ? 'Kreiranje…' : 'Kreiraj nalog'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border-secondary" />
        <Text className="text-text-muted">ili</Text>
        <div className="h-px flex-1 bg-border-secondary" />
      </div>

      <div className="flex justify-center overflow-hidden rounded-lg">
        <GoogleLogin
          onSuccess={(res) => handleGoogleLogin(res.credential)}
          onError={() => setError('Google prijava nije uspela')}
          useOneTap={false}
          width="368"
          text="signup_with"
          theme="outline"
          shape="pill"
        />
      </div>

      <Text>
        Već imaš nalog?{' '}
        <TextLink href="/login">
          <Strong>Prijavi se</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
