'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

type SocialMediaInputProps = {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
}

const SOCIAL_ICONS: Record<string, { icon: string; color: string }> = {
  facebook: { icon: 'f', color: 'bg-blue-600' },
  instagram: { icon: 'ig', color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400' },
  strava: { icon: 's', color: 'bg-orange-500' },
  twitter: { icon: 'x', color: 'bg-black dark:bg-white dark:text-black' },
  youtube: { icon: 'yt', color: 'bg-red-600' },
  tiktok: { icon: 'tt', color: 'bg-black' },
}

function getSocialType(url: string): string | null {
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('strava.com')) return 'strava'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  return null
}

export function SocialMediaInput({ value = [], onChange, label = 'Društvene mreže' }: SocialMediaInputProps) {
  const [newUrl, setNewUrl] = useState('')

  const addUrl = () => {
    const trimmed = newUrl.trim()
    if (!trimmed) return

    // Add https:// if missing
    let url = trimmed
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    if (!value.includes(url)) {
      onChange([...value, url])
    }
    setNewUrl('')
  }

  const removeUrl = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addUrl()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {/* Existing links */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, index) => {
            const socialType = getSocialType(url)
            const socialInfo = socialType ? SOCIAL_ICONS[socialType] : null

            return (
              <div
                key={url}
                className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-1 pr-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                {socialInfo ? (
                  <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${socialInfo.color}`}>
                    {socialInfo.icon}
                  </span>
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-full bg-zinc-400 text-xs font-bold text-white">
                    🔗
                  </span>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[150px] truncate text-zinc-700 hover:text-zinc-900 dark:text-zinc-300"
                >
                  {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
                <button
                  type="button"
                  onClick={() => removeUrl(index)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add new link */}
      <div className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://facebook.com/..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!newUrl.trim()}
          className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        >
          <PlusIcon className="size-5" />
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Podržano: Facebook, Instagram, Strava, Twitter/X, YouTube, TikTok
      </p>
    </div>
  )
}
