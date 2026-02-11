'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type TagsInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  label?: string
  suggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
  'ultra',
  'maraton',
  'polumaraton',
  '10k',
  '5k',
  'noćna',
  'brdska',
  'šumska',
  'gradska',
  'relay',
  'kids',
  'štafeta',
  'trail',
  'asfalt',
]

export function TagsInput({
  value = [],
  onChange,
  label = 'Tagovi',
  suggestions = DEFAULT_SUGGESTIONS
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed) return

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  // Filter suggestions to show only ones not already added
  const availableSuggestions = suggestions.filter((s) => !value.includes(s))

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {/* Tags display and input */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-300 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800">
        {value.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:text-emerald-900 dark:hover:text-emerald-200"
            >
              <XMarkIcon className="size-4" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Dodaj tag...' : ''}
          className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-1 text-sm focus:outline-none"
        />
      </div>

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-zinc-500">Predlozi:</span>
          {availableSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
            >
              #{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
