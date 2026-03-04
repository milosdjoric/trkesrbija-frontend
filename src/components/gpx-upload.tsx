'use client'

import { useRef, useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { CloudUploadIcon } from '@/components/icons/cloud-upload-icon'

type GpxUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function GpxUpload({ value, onChange, label = 'GPX fajl' }: GpxUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('gpxFile', {
    onClientUploadComplete: (res) => {
      setIsUploading(false)
      const url = res?.[0]?.ufsUrl || res?.[0]?.url
      if (url) {
        onChange(url)
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false)
      console.error('Upload error:', error)
      alert(`Greška pri uploadu: ${error.message}`)
    },
    onUploadBegin: () => {
      setIsUploading(true)
    },
  })

  // Extract filename from URL
  const filename = value ? decodeURIComponent(value.split('/').pop() || '') : null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await startUpload([files[0]])
    }
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await startUpload([files[0]])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      {value ? (
        // Uploaded file display
        <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-card p-3">
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-text-primary">
              {filename || 'GPX fajl'}
            </div>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
            >
              <ArrowDownTrayIcon className="size-3" />
              Preuzmi
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-1 text-text-secondary hover:bg-card-hover hover:text-text-primary"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
      ) : (
        // Upload zone
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-zinc-500 bg-zinc-700/50'
              : 'border-border-primary bg-zinc-800/80 hover:border-zinc-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,application/gpx+xml,application/octet-stream"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center p-6">
            {isUploading ? (
              <>
                <svg className="size-8 animate-spin text-text-secondary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="mt-2 text-sm text-text-secondary">Upload u toku...</span>
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-12 text-text-secondary" />
                <p className="mt-2 text-sm text-text-secondary">
                  Prevuci GPX fajl ovde ili klikni za izbor
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
