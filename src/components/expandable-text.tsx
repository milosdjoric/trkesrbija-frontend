'use client'

import { useRef, useState, useEffect } from 'react'

interface ExpandableTextProps {
  text: string
  /** Maximum number of visible lines before truncation (default: 5) */
  maxLines?: number
  /** Label for the expand button (default: 'Pogledaj više') */
  buttonLabel?: string
  className?: string
}

export function ExpandableText({ text, maxLines = 5, buttonLabel = 'Pogledaj više', className = '' }: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    // Check if the text overflows the clamped height
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
    const maxHeight = lineHeight * maxLines
    setNeedsTruncation(el.scrollHeight > maxHeight + 2) // +2 for rounding tolerance
  }, [text, maxLines])

  return (
    <div>
      <p
        ref={textRef}
        className={`text-sm/6 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap ${className}`}
        style={
          !isExpanded && needsTruncation
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isExpanded ? 'Prikaži manje' : buttonLabel}
        </button>
      )}
    </div>
  )
}
