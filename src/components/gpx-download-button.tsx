'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'

type GpxDownloadButtonProps = {
  url: string
  filename?: string
  className?: string
}

export function GpxDownloadButton({ url, filename, className }: GpxDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const resolvedFilename = filename || decodeURIComponent(url.split('/').pop() || 'staza.gpx')

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = resolvedFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      // Fallback: open in new tab
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className ?? 'inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}
    >
      <ArrowDownTrayIcon className="size-4" />
      {downloading ? 'Preuzimanje...' : 'Preuzmi GPX'}
    </button>
  )
}
