'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { Button } from '@/components/button'
import { XMarkIcon, MapIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

type GpxUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function GpxUpload({ value, onChange, label = 'GPX fajl' }: GpxUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  // Extract filename from URL
  const filename = value ? value.split('/').pop() : null

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <MapIcon className="size-8 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {filename || 'GPX fajl'}
            </div>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <ArrowDownTrayIcon className="size-3" />
              Preuzmi
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
      ) : (
        <UploadDropzone
          endpoint="gpxFile"
          onUploadBegin={() => {
            console.log('GPX Upload starting...')
            setIsUploading(true)
          }}
          onClientUploadComplete={(res) => {
            setIsUploading(false)
            console.log('GPX Upload complete, response:', res)
            const url = res?.[0]?.ufsUrl || res?.[0]?.url
            if (url) {
              console.log('Setting GPX URL:', url)
              onChange(url)
            }
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false)
            console.error('Upload error:', error)
            alert(`Greška pri uploadu: ${error.message}`)
          }}
          className="ut-allowed-content:text-zinc-500 ut-label:text-zinc-700 ut-upload-icon:text-emerald-500 dark:ut-allowed-content:text-zinc-400 dark:ut-label:text-zinc-300 dark:ut-upload-icon:text-emerald-400 border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50"
          appearance={{
            container: 'border-2 border-dashed rounded-lg p-6',
            uploadIcon: 'text-emerald-500',
            label: 'text-sm text-zinc-600 dark:text-zinc-400',
            allowedContent: 'text-xs text-zinc-500',
            button: 'ut-ready:bg-emerald-600 ut-ready:hover:bg-emerald-700 ut-uploading:bg-emerald-400 text-sm',
          }}
          content={{
            label: 'Prevuci GPX fajl ovde ili klikni za izbor',
            allowedContent: 'GPX fajlovi do 8MB',
            button({ ready, isUploading }) {
              if (isUploading) return 'Upload u toku...'
              if (ready) return 'Izaberi GPX'
              return 'Priprema...'
            },
          }}
        />
      )}
    </div>
  )
}
