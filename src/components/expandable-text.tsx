'use client'

import { useRef, useState, useEffect } from 'react'

interface ExpandableTextProps {
  text: string
  /** Maximum number of visible lines before truncation (default: 5) */
  maxLines?: number
  className?: string
}

export function ExpandableText({ text, maxLines = 5, className = '' }: ExpandableTextProps) {
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
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? 'Prikaži manje' : 'Pogledaj više'}
        </button>
      )}
    </div>
  )
}
