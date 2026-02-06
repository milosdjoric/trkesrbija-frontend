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
      className={`rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600 ${className}`}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <Subheading className={icon ? 'mt-4' : ''}>{title}</Subheading>
      {description && <Text className="mt-2 text-zinc-500">{description}</Text>}
      {action && (
        <Button href={action.href} onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
