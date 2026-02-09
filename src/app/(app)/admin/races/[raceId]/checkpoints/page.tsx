'use client'

import { useAuth } from '@/app/auth/auth-context'
import {
  assignJudge,
  createCheckpoint,
  deleteCheckpoint,
  fetchEventCheckpoints,
  fetchRaceCheckpoints,
  fetchUsers,
  gql,
  setRaceCheckpoints as setRaceCheckpointsApi,
  unassignJudge,
  updateCheckpoint,
  type CreateCheckpointInput,
  type EventCheckpoint,
  type RaceCheckpoint,
  type User,
} from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { EmptyState } from '@/components/empty-state'
import { Field, Label } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { LoadingState } from '@/components/loading-state'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/formatters'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

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

const RACE_QUERY = `
  query Race($raceId: ID!) {
    races(limit: 1000) {
      id
      raceName
      length
      startDateTime
      raceEvent {
        id
        eventName
        slug
      }
    }
  }
`

export default function AdminCheckpointsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const raceId = params.raceId as string
  const loadedRef = useRef(false)

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [eventCheckpoints, setEventCheckpoints] = useState<EventCheckpoint[]>([])
  const [raceCheckpoints, setRaceCheckpoints] = useState<RaceCheckpoint[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCheckpoint, setEditingCheckpoint] = useState<EventCheckpoint | null>(null)
  const [assigningCheckpoint, setAssigningCheckpoint] = useState<EventCheckpoint | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      // Load race info
      const raceData = await gql<{
        races: Array<{
          id: string
          raceName: string | null
          length: number
          startDateTime: string
          raceEvent: { id: string; eventName: string; slug: string }
        }>
      }>(RACE_QUERY, { raceId }, { accessToken })

      const foundRace = raceData.races.find((r) => r.id === raceId)
      if (foundRace) {
        setRace(foundRace)

        // Load event checkpoints (fizičke lokacije)
        const eventCps = await fetchEventCheckpoints(foundRace.raceEvent.id, accessToken)
        setEventCheckpoints(eventCps)

        // Load race checkpoints (sa redosledom)
        const raceCps = await fetchRaceCheckpoints(raceId, accessToken)
        setRaceCheckpoints(raceCps.sort((a, b) => a.orderIndex - b.orderIndex))
      }

      // Load users for judge assignment
      const userList = await fetchUsers(undefined, 100, accessToken)
      setUsers(userList)
    } catch (err) {
      console.error('Failed to load data:', err)
      toast('Greška pri učitavanju podataka', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, raceId, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadData()
    }
  }, [authLoading, user, accessToken, loadData, router])

  // Create checkpoint for event
  async function handleCreate() {
    if (!formName.trim() || !race) return

    try {
      const input: CreateCheckpointInput = {
        raceEventId: race.raceEvent.id,
        name: formName.trim(),
      }
      await createCheckpoint(input, accessToken)
      setShowCreateDialog(false)
      resetForm()
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Checkpoint uspešno kreiran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Kreiranje checkpoint-a nije uspelo', 'error')
    }
  }

  // Update checkpoint
  async function handleUpdate() {
    if (!editingCheckpoint || !formName.trim()) return

    try {
      await updateCheckpoint(editingCheckpoint.id, { name: formName.trim() }, accessToken)
      setEditingCheckpoint(null)
      resetForm()
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Checkpoint uspešno ažuriran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Ažuriranje checkpoint-a nije uspelo', 'error')
    }
  }

  // Delete checkpoint from event
  async function handleDelete(checkpointId: string) {
    const confirmed = await confirm({
      title: 'Obriši checkpoint',
      message: 'Da li ste sigurni da želite da obrišete ovaj checkpoint? Biće uklonjen sa svih trka.',
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteCheckpoint(checkpointId, accessToken)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Checkpoint uspešno obrisan', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Brisanje checkpoint-a nije uspelo', 'error')
    }
  }

  // Add checkpoint to race (at the end)
  async function handleAddToRace(checkpointId: string) {
    const maxOrder = raceCheckpoints.length > 0 ? Math.max(...raceCheckpoints.map((c) => c.orderIndex)) : -1
    const newCheckpoints = [
      ...raceCheckpoints.map((rc) => ({
        checkpointId: rc.checkpointId,
        orderIndex: rc.orderIndex,
        distance: rc.distance,
      })),
      { checkpointId, orderIndex: maxOrder + 1, distance: null },
    ]

    setSaving(true)
    try {
      await setRaceCheckpointsApi({ raceId, checkpoints: newCheckpoints }, accessToken)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Checkpoint dodat u trku', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Dodavanje checkpoint-a nije uspelo', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Remove checkpoint from race
  async function handleRemoveFromRace(checkpointId: string) {
    const newCheckpoints = raceCheckpoints
      .filter((rc) => rc.checkpointId !== checkpointId)
      .map((rc, idx) => ({
        checkpointId: rc.checkpointId,
        orderIndex: idx,
        distance: rc.distance,
      }))

    setSaving(true)
    try {
      await setRaceCheckpointsApi({ raceId, checkpoints: newCheckpoints }, accessToken)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Checkpoint uklonjen iz trke', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Uklanjanje checkpoint-a nije uspelo', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Move checkpoint up/down in order
  async function handleMoveCheckpoint(checkpointId: string, direction: 'up' | 'down') {
    const currentIndex = raceCheckpoints.findIndex((rc) => rc.checkpointId === checkpointId)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === raceCheckpoints.length - 1) return

    const newCheckpoints = [...raceCheckpoints]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Swap
    ;[newCheckpoints[currentIndex], newCheckpoints[targetIndex]] = [
      newCheckpoints[targetIndex],
      newCheckpoints[currentIndex],
    ]

    // Recalculate order indices
    const orderedCheckpoints = newCheckpoints.map((rc, idx) => ({
      checkpointId: rc.checkpointId,
      orderIndex: idx,
      distance: rc.distance,
    }))

    setSaving(true)
    try {
      await setRaceCheckpointsApi({ raceId, checkpoints: orderedCheckpoints }, accessToken)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
    } catch (err: any) {
      toast(err?.message ?? 'Promena redosleda nije uspela', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Assign judge
  async function handleAssignJudge() {
    if (!assigningCheckpoint || !selectedUserId) return

    try {
      await assignJudge(selectedUserId, assigningCheckpoint.id, accessToken)
      setAssigningCheckpoint(null)
      setSelectedUserId('')
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Sudija uspešno dodeljen', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Dodela sudije nije uspela', 'error')
    }
  }

  // Unassign judge
  async function handleUnassignJudge(userId: string) {
    const confirmed = await confirm({
      title: 'Ukloni sudiju',
      message: 'Da li ste sigurni da želite da uklonite ovog sudiju?',
      confirmText: 'Ukloni',
      cancelText: 'Otkaži',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await unassignJudge(userId, accessToken)
      loadedRef.current = false
      await loadData()
      loadedRef.current = true
      toast('Sudija uspešno uklonjen', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Uklanjanje sudije nije uspelo', 'error')
    }
  }

  function resetForm() {
    setFormName('')
  }

  function openEditDialog(checkpoint: EventCheckpoint) {
    setFormName(checkpoint.name)
    setEditingCheckpoint(checkpoint)
  }

  function openCreateDialog() {
    resetForm()
    setShowCreateDialog(true)
  }

  // Get checkpoints not yet in this race
  const checkpointsInRace = new Set(raceCheckpoints.map((rc) => rc.checkpointId))
  const availableCheckpoints = eventCheckpoints.filter((cp) => !checkpointsInRace.has(cp.id))

  // Get available users (not assigned to any checkpoint)
  const assignedUserIds = new Set(eventCheckpoints.flatMap((cp) => cp.assignedJudges.map((j) => j.id)))
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id))

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
          <Heading>Checkpoint-i</Heading>
          <Text className="mt-1">
            {race.raceName ?? race.raceEvent.eventName} • {formatDate(race.startDateTime)} • {race.length} km
          </Text>
        </div>

        <div className="flex gap-2">
          <Button href={`/admin/races/${raceId}/registrations`} outline>
            Prijave
          </Button>
        </div>
      </div>

      {/* Race Checkpoints - Raspored za ovu trku */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Subheading>Raspored checkpoint-a za ovu trku</Subheading>
        </div>

        <div className="mt-4 space-y-2">
          {raceCheckpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
              <Text>Nema checkpoint-a za ovu trku. Dodajte ih iz liste ispod.</Text>
            </div>
          ) : (
            raceCheckpoints.map((rc, idx) => (
              <div
                key={rc.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Badge color="blue">{rc.orderIndex}</Badge>
                  <span className="font-medium">{rc.checkpoint.name}</span>
                  {rc.distance && <span className="text-sm text-zinc-500">({rc.distance} km)</span>}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    plain
                    onClick={() => handleMoveCheckpoint(rc.checkpointId, 'up')}
                    disabled={idx === 0 || saving}
                  >
                    <ArrowUpIcon className="size-4" />
                  </Button>
                  <Button
                    plain
                    onClick={() => handleMoveCheckpoint(rc.checkpointId, 'down')}
                    disabled={idx === raceCheckpoints.length - 1 || saving}
                  >
                    <ArrowDownIcon className="size-4" />
                  </Button>
                  <Button plain onClick={() => handleRemoveFromRace(rc.checkpointId)} disabled={saving}>
                    <XMarkIcon className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available checkpoints from event */}
      {availableCheckpoints.length > 0 && (
        <div className="mt-6">
          <Text className="text-sm text-zinc-500">Dostupni checkpoint-i (klikni da dodaš):</Text>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableCheckpoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => handleAddToRace(cp.id)}
                disabled={saving}
                className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-sm hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/30"
              >
                <PlusIcon className="mr-1 inline size-3" />
                {cp.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event Checkpoints - Sve fizičke lokacije */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <Subheading>Sve checkpoint lokacije ({race.raceEvent.eventName})</Subheading>
          <Button onClick={openCreateDialog} outline>
            <PlusIcon className="size-4" />
            Nova lokacija
          </Button>
        </div>

        <Text className="mt-1 text-sm text-zinc-500">
          Ovde su sve checkpoint lokacije za ovaj event. Možete ih dodati/ukloniti iz bilo koje trke ovog eventa.
        </Text>

        <div className="mt-4 space-y-3">
          {eventCheckpoints.length === 0 ? (
            <EmptyState
              title="Nema definisanih checkpoint lokacija"
              description="Dodajte checkpoint lokacije za ovaj event."
              action={{ label: 'Dodaj prvu lokaciju', onClick: openCreateDialog }}
            />
          ) : (
            eventCheckpoints.map((checkpoint) => (
              <div key={checkpoint.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{checkpoint.name}</span>
                      {checkpointsInRace.has(checkpoint.id) && (
                        <Badge color="green" className="text-xs">
                          U ovoj trci
                        </Badge>
                      )}
                    </div>

                    {/* Assigned Judges */}
                    <div className="mt-3">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Dodeljeni sudije:</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {checkpoint.assignedJudges.length === 0 ? (
                          <span className="text-sm text-zinc-400">Nema dodeljenih sudija</span>
                        ) : (
                          checkpoint.assignedJudges.map((judge) => (
                            <Badge key={judge.id} color="blue" className="flex items-center gap-1">
                              {judge.name || judge.email}
                              <button
                                onClick={() => handleUnassignJudge(judge.id)}
                                className="ml-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                              >
                                <XMarkIcon className="size-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                        <button
                          onClick={() => setAssigningCheckpoint(checkpoint)}
                          className="inline-flex items-center gap-1 rounded border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
                        >
                          <UserPlusIcon className="size-3" />
                          Dodaj
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button plain onClick={() => openEditDialog(checkpoint)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button plain onClick={() => handleDelete(checkpoint.id)}>
                      <TrashIcon className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Checkpoint Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Nova checkpoint lokacija</DialogTitle>
        <DialogDescription>Dodajte novu checkpoint lokaciju za event {race.raceEvent.eventName}.</DialogDescription>
        <DialogBody>
          <Field>
            <Label>Naziv *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="npr. Start, CP1 - Avala, Cilj"
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShowCreateDialog(false)}>
            Otkaži
          </Button>
          <Button onClick={handleCreate}>Kreiraj</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Checkpoint Dialog */}
      <Dialog open={!!editingCheckpoint} onClose={() => setEditingCheckpoint(null)}>
        <DialogTitle>Izmeni checkpoint</DialogTitle>
        <DialogBody>
          <Field>
            <Label>Naziv *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="npr. Start, CP1 - Avala, Cilj"
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setEditingCheckpoint(null)}>
            Otkaži
          </Button>
          <Button onClick={handleUpdate}>Sačuvaj</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Judge Dialog */}
      <Dialog open={!!assigningCheckpoint} onClose={() => setAssigningCheckpoint(null)}>
        <DialogTitle>Dodeli sudiju</DialogTitle>
        <DialogDescription>
          Izaberite korisnika koji će biti sudija na checkpoint-u &quot;{assigningCheckpoint?.name}&quot;.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Korisnik</Label>
            <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Izaberite korisnika...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.email})
                </option>
              ))}
            </Select>
          </Field>
          {availableUsers.length === 0 && (
            <Text className="mt-2 text-amber-600">Svi korisnici su već dodeljeni checkpoint-ima.</Text>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setAssigningCheckpoint(null)}>
            Otkaži
          </Button>
          <Button onClick={handleAssignJudge} disabled={!selectedUserId}>
            Dodeli
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
