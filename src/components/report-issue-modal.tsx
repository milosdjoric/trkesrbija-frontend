'use client'

import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/dialog'
import { useToast } from '@/components/toast'
import { useState } from 'react'

const SUBMIT_REPORT_MUTATION = `
  mutation SubmitReport($input: CreateReportInput!) {
    submitReport(input: $input) {
      id
    }
  }
`

type FieldOption = {
  value: string
  label: string
}

const EVENT_FIELDS: FieldOption[] = [
  { value: 'eventName', label: 'Naziv događaja' },
  { value: 'startDateTime', label: 'Datum/vreme' },
  { value: 'startLocation', label: 'Lokacija' },
  { value: 'description', label: 'Opis' },
  { value: 'organizer', label: 'Organizator' },
  { value: 'type', label: 'Tip događaja' },
  { value: 'registrationSite', label: 'Link za prijave' },
  { value: 'other', label: 'Ostalo' },
]

const RACE_FIELDS: FieldOption[] = [
  { value: 'raceName', label: 'Naziv trke' },
  { value: 'length', label: 'Distanca (km)' },
  { value: 'elevation', label: 'Visinska razlika' },
  { value: 'startDateTime', label: 'Datum/vreme' },
  { value: 'startLocation', label: 'Lokacija starta' },
  { value: 'registrationSite', label: 'Link za prijave' },
  { value: 'other', label: 'Ostalo' },
]

interface ReportIssueModalProps {
  open: boolean
  onClose: () => void
  entityType: 'EVENT' | 'RACE'
  entityId: string
  entityName: string
}

export function ReportIssueModal({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
}: ReportIssueModalProps) {
  const { toast } = useToast()
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fields = entityType === 'EVENT' ? EVENT_FIELDS : RACE_FIELDS

  function toggleField(value: string) {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  function reset() {
    setSelectedFields(new Set())
    setMessage('')
    setEmail('')
  }

  async function handleSubmit() {
    if (selectedFields.size === 0 && !message.trim()) {
      toast('Označite bar jedno polje ili unesite komentar', 'error')
      return
    }

    setSubmitting(true)
    try {
      await gql(SUBMIT_REPORT_MUTATION, {
        input: {
          entityType,
          entityId,
          entityName,
          fields: Array.from(selectedFields),
          message: message.trim() || null,
          reporterEmail: email.trim() || null,
        },
      })

      toast('Hvala na prijavi! Proverićemo informacije.', 'success')
      reset()
      onClose()
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri slanju prijave', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogTitle>Prijavi pogrešnu informaciju</DialogTitle>

      <DialogBody>
        <p className="text-sm text-gray-400">
          Označite koje informacije su pogrešne za <strong>{entityName}</strong>
        </p>

        {/* Checkboxes */}
        <div className="mt-4 space-y-2">
          {fields.map((field) => (
            <label
              key={field.value}
              className="flex items-center gap-3 rounded-lg border border-dark-border px-3 py-2 cursor-pointer hover:bg-dark-surface-hover"
            >
              <input
                type="checkbox"
                checked={selectedFields.has(field.value)}
                onChange={() => toggleField(field.value)}
                className="size-4 rounded border-dark-border text-blue-600 focus:ring-blue-500 bg-dark-surface"
              />
              <span className="text-sm text-gray-300">{field.label}</span>
            </label>
          ))}
        </div>

        {/* Message */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300">
            Koja je ispravna informacija? (opciono)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="npr. Datum trke je 15. jun 2026, a ne 14. jun..."
            className="mt-1 w-full rounded-lg border border-dark-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-dark-surface"
          />
        </div>

        {/* Email */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-300">
            Vaš email (opciono, za kontakt)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@primer.rs"
            className="mt-1 w-full rounded-lg border border-dark-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-dark-surface"
          />
        </div>
      </DialogBody>

      <DialogActions>
        <Button
          outline
          onClick={() => {
            reset()
            onClose()
          }}
        >
          Otkaži
        </Button>
        <Button color="blue" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Slanje...' : 'Pošalji prijavu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
