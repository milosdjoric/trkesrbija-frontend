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

  function getFilename() {
    if (filename) return filename.endsWith('.gpx') ? filename : `${filename}.gpx`
    try {
      const pathname = new URL(url).pathname
      const name = decodeURIComponent(pathname.split('/').pop() || '')
      if (name && name.endsWith('.gpx')) return name
    } catch {}
    return 'staza.gpx'
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(url)
      const blob = new Blob([await res.blob()], { type: 'application/gpx+xml' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = getFilename()
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
      className={className ?? 'inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary'}
    >
      <ArrowDownTrayIcon className="size-4" />
      {downloading ? 'Preuzimanje...' : 'Preuzmi GPX'}
    </button>
  )
}
