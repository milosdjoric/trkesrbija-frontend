'use client'

import { useAuth } from '@/app/auth/auth-context'
import {
  assignBibNumber,
  deleteRegistration,
  fetchRaceRegistrations,
  gql,
  updateRegistrationStatus,
  type RaceRegistration,
  type RegistrationStatus,
} from '@/app/lib/api'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { LoadingState } from '@/components/loading-state'
import { Select } from '@/components/select'
import { StatsGrid } from '@/components/stats-grid'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import { formatDate, formatDateSimple } from '@/lib/formatters'
import { getGenderLabel, getStatusBadge } from '@/lib/badges'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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

export default function AdminRegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [registrations, setRegistrations] = useState<RaceRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | ''>('')
  const [editingBib, setEditingBib] = useState<string | null>(null)
  const [newBibNumber, setNewBibNumber] = useState('')

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      // Load race info
      const raceData = await gql<{
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

      for (const event of raceData.raceEvents) {
        const foundRace = event.races.find((r) => r.id === raceId)
        if (foundRace) {
          setRace({
            ...foundRace,
            raceEvent: { id: event.id, eventName: event.eventName, slug: event.slug },
          })
          break
        }
      }

      // Load registrations
      const regs = await fetchRaceRegistrations(
        raceId,
        {
          status: statusFilter || undefined,
          search: search || undefined,
        },
        accessToken
      )
      setRegistrations(regs)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken, raceId, statusFilter, search])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, loadData, router])

  async function handleStatusChange(registrationId: string, newStatus: RegistrationStatus) {
    try {
      await updateRegistrationStatus(registrationId, newStatus, accessToken)
      await loadData()
      toast('Status uspešno promenjen', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Promena statusa nije uspela', 'error')
    }
  }

  async function handleAssignBib(registrationId: string) {
    if (!newBibNumber.trim()) return

    try {
      await assignBibNumber(registrationId, newBibNumber.trim(), accessToken)
      setEditingBib(null)
      setNewBibNumber('')
      await loadData()
      toast('Startni broj uspešno dodeljen', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Dodeljivanje startnog broja nije uspelo', 'error')
    }
  }

  async function handleDelete(registrationId: string) {
    const confirmed = await confirm({
      title: 'Obriši prijavu',
      message: 'Da li ste sigurni da želite da obrišete ovu prijavu? Ova akcija se ne može poništiti.',
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteRegistration(registrationId, accessToken)
      await loadData()
      toast('Prijava uspešno obrisana', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Brisanje nije uspelo', 'error')
    }
  }

  function exportToCsv() {
    const headers = ['Ime', 'Prezime', 'Email', 'Telefon', 'Datum rođenja', 'Pol', 'Status', 'Startni broj']
    const rows = registrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || '',
      formatDateSimple(r.dateOfBirth),
      getGenderLabel(r.gender),
      r.status,
      r.bibNumber || '',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `prijave-${race?.raceName || 'trka'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (authLoading || loading) {
    return <LoadingState />
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

  const stats = [
    { label: 'Ukupno prijava', value: registrations.length },
    { label: 'Na čekanju', value: registrations.filter((r) => r.status === 'PENDING').length, color: 'text-yellow-600' },
    { label: 'Potvrđeno', value: registrations.filter((r) => r.status === 'CONFIRMED').length, color: 'text-blue-600' },
    { label: 'Plaćeno', value: registrations.filter((r) => r.status === 'PAID').length, color: 'text-green-600' },
  ]

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/events/${race.raceEvent.slug}`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          {race.raceEvent.eventName}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading>Prijave za trku</Heading>
          <Text className="mt-1">
            {race.raceName ?? race.raceEvent.eventName} • {formatDate(race.startDateTime)} • {race.length} km
          </Text>
        </div>

        <div className="flex gap-2">
          <Button outline onClick={exportToCsv}>
            Export CSV
          </Button>
          <Button href={`/admin/races/${raceId}/registrations/new`}>
            <UserPlusIcon className="size-4" />
            Nova prijava
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Field className="flex-1">
          <Label className="sr-only">Pretraga</Label>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Pretraži po imenu, emailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </Field>

        <Field>
          <Label className="sr-only">Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | '')}>
            <option value="">Svi statusi</option>
            <option value="PENDING">Na čekanju</option>
            <option value="CONFIRMED">Potvrđeno</option>
            <option value="PAID">Plaćeno</option>
            <option value="CANCELLED">Otkazano</option>
          </Select>
        </Field>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} className="mt-6" />

      {/* Registrations Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr className="text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Ime i prezime</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Pol</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Startni br.</th>
              <th className="px-4 py-3">Akcije</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Nema prijava za prikaz
                </td>
              </tr>
            ) : (
              registrations.map((reg, index) => (
                <tr key={reg.id} className="text-sm">
                  <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {reg.firstName} {reg.lastName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{reg.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{reg.phone || '-'}</td>
                  <td className="px-4 py-3">{getGenderLabel(reg.gender)}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={reg.status}
                      onChange={(e) => handleStatusChange(reg.id, e.target.value as RegistrationStatus)}
                      className="w-32 text-xs"
                    >
                      <option value="PENDING">Na čekanju</option>
                      <option value="CONFIRMED">Potvrđeno</option>
                      <option value="PAID">Plaćeno</option>
                      <option value="CANCELLED">Otkazano</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {editingBib === reg.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          value={newBibNumber}
                          onChange={(e) => setNewBibNumber(e.target.value)}
                          className="w-20 text-xs"
                          placeholder="Broj"
                          autoFocus
                        />
                        <Button outline onClick={() => handleAssignBib(reg.id)} className="text-xs">
                          OK
                        </Button>
                        <Button
                          plain
                          onClick={() => {
                            setEditingBib(null)
                            setNewBibNumber('')
                          }}
                          className="text-xs"
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingBib(reg.id)
                          setNewBibNumber(reg.bibNumber || '')
                        }}
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {reg.bibNumber ? (
                          <span className="font-mono">{reg.bibNumber}</span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                        <PencilIcon className="size-3" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Obriši prijavu"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
