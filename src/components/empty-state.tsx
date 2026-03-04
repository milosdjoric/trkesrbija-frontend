import { Button } from '@/components/button'
import { Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border-primary p-8 text-center ${className}`}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <Subheading className={icon ? 'mt-4' : ''}>{title}</Subheading>
      {description && <Text className="mt-2 text-text-secondary">{description}</Text>}
      {action && (
        <Button href={action.href} onClick={action.onClick} className="mt-4" outline>
          {action.label}
        </Button>
      )}
    </div>
  )
}
