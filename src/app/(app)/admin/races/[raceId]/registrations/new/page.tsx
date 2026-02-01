'use client'

import { useAuth } from '@/app/auth/auth-context'
import {
  adminRegisterForRace,
  gql,
  type AdminRegistrationInput,
  type Gender,
  type RegistrationStatus,
} from '@/app/lib/api'
import { Button } from '@/components/button'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Radio, RadioField, RadioGroup } from '@/components/radio'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { Textarea } from '@/components/textarea'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type RaceInfo = {
  id: string
  raceName: string | null
  length: number
  startDateTime: string
  raceEvent: {
    id: string
    eventName: string
    slug: string
  }
}

const RACE_WITH_EVENT_QUERY = `
  query RaceEvents {
    raceEvents(limit: 100) {
      id
      eventName
      slug
      races {
        id
        raceName
        length
        startDateTime
      }
    }
  }
`

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function AdminNewRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()

  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('MALE')
  const [status, setStatus] = useState<RegistrationStatus>('CONFIRMED')
  const [bibNumber, setBibNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadRace() {
      if (!accessToken) return

      try {
        const data = await gql<{
          raceEvents: Array<{
            id: string
            eventName: string
            slug: string
            races: Array<{
              id: string
              raceName: string | null
              length: number
              startDateTime: string
            }>
          }>
        }>(RACE_WITH_EVENT_QUERY, {}, { accessToken })

        for (const event of data.raceEvents) {
          const foundRace = event.races.find((r) => r.id === raceId)
          if (foundRace) {
            setRace({
              ...foundRace,
              raceEvent: { id: event.id, eventName: event.eventName, slug: event.slug },
            })
            break
          }
        }
      } catch (err) {
        console.error('Failed to load race:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadRace()
    }
  }, [authLoading, user, accessToken, raceId, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !dateOfBirth) {
      setError('Molimo popunite sva obavezna polja')
      return
    }

    setSubmitting(true)

    try {
      const input: AdminRegistrationInput = {
        raceId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
        status,
        bibNumber: bibNumber.trim() || null,
        notes: notes.trim() || null,
      }

      await adminRegisterForRace(input, accessToken)
      router.push(`/admin/races/${raceId}/registrations`)
    } catch (err: any) {
      setError(err?.message ?? 'Dodavanje prijave nije uspelo')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Učitavanje...</div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  if (!race) {
    return (
      <div className="py-12 text-center">
        <Heading>Trka nije pronađena</Heading>
      </div>
    )
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/admin/races/${raceId}/registrations`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Nazad na prijave
        </Link>
      </div>

      <div className="mx-auto mt-6 max-w-2xl">
        <Heading>Nova prijava</Heading>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <Subheading>{race.raceName ?? race.raceEvent.eventName}</Subheading>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {formatDate(race.startDateTime)} • {race.length} km
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Ime *</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={submitting}
              />
            </Field>

            <Field>
              <Label>Prezime *</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={submitting}
              />
            </Field>
          </div>

          <Field>
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            <Description>Email učesnika (ne mora da ima nalog)</Description>
          </Field>

          <Field>
            <Label>Telefon</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+381 60 123 4567"
              disabled={submitting}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Datum rođenja *</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                disabled={submitting}
                max={new Date().toISOString().split('T')[0]}
              />
            </Field>

            <Field>
              <Label>Pol *</Label>
              <RadioGroup value={gender} onChange={(value) => setGender(value as Gender)} className="mt-2">
                <RadioField>
                  <Radio value="MALE" disabled={submitting} />
                  <Label>Muški</Label>
                </RadioField>
                <RadioField>
                  <Radio value="FEMALE" disabled={submitting} />
                  <Label>Ženski</Label>
                </RadioField>
              </RadioGroup>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Status</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
                disabled={submitting}
              >
                <option value="PENDING">Na čekanju</option>
                <option value="CONFIRMED">Potvrđeno</option>
                <option value="PAID">Plaćeno</option>
              </Select>
            </Field>

            <Field>
              <Label>Startni broj</Label>
              <Input
                type="text"
                value={bibNumber}
                onChange={(e) => setBibNumber(e.target.value)}
                placeholder="Npr. 101"
                disabled={submitting}
              />
            </Field>
          </div>

          <Field>
            <Label>Beleške</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne beleške (vidljive samo adminima)"
              rows={3}
              disabled={submitting}
            />
          </Field>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            {submitting ? (
              <Button type="button" outline disabled>
                Odustani
              </Button>
            ) : (
              <Button href={`/admin/races/${raceId}/registrations`} outline>
                Odustani
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Dodavanje...' : 'Dodaj prijavu'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
