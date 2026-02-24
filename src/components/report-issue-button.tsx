'use client'

import { Button } from '@/components/button'
import { ReportIssueModal } from '@/components/report-issue-modal'
import { ExclamationTriangleIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'

interface ReportIssueButtonProps {
  entityType: 'EVENT' | 'RACE'
  entityId: string
  entityName: string
}

export function ReportIssueButton({ entityType, entityId, entityName }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button outline onClick={() => setOpen(true)}>
        <ExclamationTriangleIcon className="size-4" />
        Prijavi grešku
      </Button>

      <ReportIssueModal
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </>
  )
}
