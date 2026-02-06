'use client'

import { useAuth } from '@/app/auth/auth-context'
import {
  assignJudge,
  createCheckpoint,
  deleteCheckpoint,
  fetchCheckpointsWithJudges,
  fetchUsers,
  gql,
  unassignJudge,
  updateCheckpoint,
  type CheckpointWithJudges,
  type CreateCheckpointInput,
  type User,
} from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminCheckpointsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [checkpoints, setCheckpoints] = useState<CheckpointWithJudges[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCheckpoint, setEditingCheckpoint] = useState<CheckpointWithJudges | null>(null)
  const [assigningCheckpoint, setAssigningCheckpoint] = useState<CheckpointWithJudges | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formDistance, setFormDistance] = useState('')
  const [formOrderIndex, setFormOrderIndex] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

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

      // Load checkpoints
      const cps = await fetchCheckpointsWithJudges(raceId, accessToken)
      setCheckpoints(cps.sort((a, b) => a.orderIndex - b.orderIndex))

      // Load users for judge assignment
      const userList = await fetchUsers(undefined, 100, accessToken)
      setUsers(userList)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken, raceId])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, loadData, router])

  // Create checkpoint
  async function handleCreate() {
    if (!formName.trim() || !formOrderIndex.trim()) return

    try {
      const input: CreateCheckpointInput = {
        raceId,
        name: formName.trim(),
        orderIndex: parseInt(formOrderIndex, 10),
        distance: formDistance ? parseFloat(formDistance) : null,
      }
      await createCheckpoint(input, accessToken)
      setShowCreateDialog(false)
      resetForm()
      await loadData()
      toast('Checkpoint uspešno kreiran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Kreiranje checkpoint-a nije uspelo', 'error')
    }
  }

  // Update checkpoint
  async function handleUpdate() {
    if (!editingCheckpoint || !formName.trim()) return

    try {
      await updateCheckpoint(
        editingCheckpoint.id,
        {
          name: formName.trim(),
          orderIndex: formOrderIndex ? parseInt(formOrderIndex, 10) : undefined,
          distance: formDistance ? parseFloat(formDistance) : null,
        },
        accessToken
      )
      setEditingCheckpoint(null)
      resetForm()
      await loadData()
      toast('Checkpoint uspešno ažuriran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Ažuriranje checkpoint-a nije uspelo', 'error')
    }
  }

  // Delete checkpoint
  async function handleDelete(checkpointId: string) {
    const confirmed = await confirm({
      title: 'Obriši checkpoint',
      message: 'Da li ste sigurni da želite da obrišete ovaj checkpoint?',
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteCheckpoint(checkpointId, accessToken)
      await loadData()
      toast('Checkpoint uspešno obrisan', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Brisanje checkpoint-a nije uspelo', 'error')
    }
  }

  // Assign judge
  async function handleAssignJudge() {
    if (!assigningCheckpoint || !selectedUserId) return

    try {
      await assignJudge(selectedUserId, assigningCheckpoint.id, accessToken)
      setAssigningCheckpoint(null)
      setSelectedUserId('')
      await loadData()
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
      await loadData()
      toast('Sudija uspešno uklonjen', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Uklanjanje sudije nije uspelo', 'error')
    }
  }

  function resetForm() {
    setFormName('')
    setFormDistance('')
    setFormOrderIndex('')
  }

  function openEditDialog(checkpoint: CheckpointWithJudges) {
    setFormName(checkpoint.name)
    setFormDistance(checkpoint.distance?.toString() ?? '')
    setFormOrderIndex(checkpoint.orderIndex.toString())
    setEditingCheckpoint(checkpoint)
  }

  function openCreateDialog() {
    resetForm()
    // Suggest next order index
    const maxOrder = checkpoints.length > 0 ? Math.max(...checkpoints.map((c) => c.orderIndex)) : -1
    setFormOrderIndex((maxOrder + 1).toString())
    setShowCreateDialog(true)
  }

  // Get available users (those not already assigned to any checkpoint in this race)
  const assignedUserIds = new Set(checkpoints.flatMap((cp) => cp.assignedJudges.map((j) => j.id)))
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id))

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
          <Button onClick={openCreateDialog}>
            <PlusIcon className="size-4" />
            Novi checkpoint
          </Button>
        </div>
      </div>

      {/* Checkpoints List */}
      <div className="mt-6 space-y-4">
        {checkpoints.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
            <Text>Nema definisanih checkpoint-a za ovu trku.</Text>
            <Button className="mt-4" onClick={openCreateDialog}>
              <PlusIcon className="size-4" />
              Dodaj prvi checkpoint
            </Button>
          </div>
        ) : (
          checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge color="zinc">{checkpoint.orderIndex}</Badge>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {checkpoint.name}
                    </span>
                    {checkpoint.distance && (
                      <span className="text-sm text-zinc-500">({checkpoint.distance} km)</span>
                    )}
                  </div>

                  {/* Assigned Judges */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Dodeljeni sudije:
                    </div>
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

      {/* Create Checkpoint Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Novi checkpoint</DialogTitle>
        <DialogDescription>
          Dodajte checkpoint za merenje vremena na trci.
        </DialogDescription>
        <DialogBody>
          <Field className="mb-4">
            <Label>Naziv *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="npr. Start, CP1 - Avala, Cilj"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Redosled *</Label>
              <Input
                type="number"
                value={formOrderIndex}
                onChange={(e) => setFormOrderIndex(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field>
              <Label>Distanca (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formDistance}
                onChange={(e) => setFormDistance(e.target.value)}
                placeholder="0.0"
              />
            </Field>
          </div>
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
          <Field className="mb-4">
            <Label>Naziv *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="npr. Start, CP1 - Avala, Cilj"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Redosled *</Label>
              <Input
                type="number"
                value={formOrderIndex}
                onChange={(e) => setFormOrderIndex(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field>
              <Label>Distanca (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={formDistance}
                onChange={(e) => setFormDistance(e.target.value)}
                placeholder="0.0"
              />
            </Field>
          </div>
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
          Izaberite korisnika koji će biti sudija na checkpoint-u &ldquo;{assigningCheckpoint?.name}&rdquo;.
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
            <Text className="mt-2 text-amber-600">
              Svi korisnici su već dodeljeni checkpoint-ima.
            </Text>
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
