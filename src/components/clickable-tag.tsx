'use client'

import Link from 'next/link'
import { Badge } from '@/components/badge'

interface ClickableTagProps {
  tag: string
  color?: 'zinc' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'
}

export function ClickableTag({ tag, color = 'zinc' }: ClickableTagProps) {
  return (
    <Link href={`/events?tag=${encodeURIComponent(tag)}`} className="transition-opacity hover:opacity-80">
      <Badge color={color}>{tag}</Badge>
    </Link>
  )
}

interface TagListProps {
  tags: string[]
  color?: ClickableTagProps['color']
}

export function TagList({ tags, color = 'zinc' }: TagListProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <ClickableTag key={tag} tag={tag} color={color} />
      ))}
    </div>
  )
}
