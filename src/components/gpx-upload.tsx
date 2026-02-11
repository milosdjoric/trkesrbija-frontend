'use client'

import { useRef, useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { XMarkIcon, MapIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'

type GpxUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function GpxUpload({ value, onChange, label = 'GPX fajl' }: GpxUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('gpxFile', {
    onClientUploadComplete: (res) => {
      setIsUploading(false)
      setShowFileInput(false)
      console.log('GPX Upload complete, response:', res)
      const url = res?.[0]?.ufsUrl || res?.[0]?.url
      if (url) {
        console.log('Setting GPX URL:', url)
        onChange(url)
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false)
      console.error('Upload error:', error)
      alert(`Greška pri uploadu: ${error.message}`)
    },
    onUploadBegin: () => {
      console.log('GPX Upload starting...')
      setIsUploading(true)
    },
  })

  // Extract filename from URL
  const filename = value ? decodeURIComponent(value.split('/').pop() || '') : null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await startUpload(Array.from(files))
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await startUpload(Array.from(files))
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

  const handleDropzoneClick = () => {
    setShowFileInput(true)
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleCancel = () => {
    setShowFileInput(false)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {value ? (
        // Uploaded file display
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
      ) : isUploading ? (
        // Uploading state
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-600 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <svg className="size-5 animate-spin text-emerald-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Upload u toku...
            </span>
          </div>
        </div>
      ) : showFileInput ? (
        // File selection mode
        <div
          className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,application/gpx+xml,application/octet-stream"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <DocumentIcon className="size-8 text-emerald-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Prevuci GPX fajl ovde ili klikni dugme
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectFile}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Izaberi GPX
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Odustani
              </button>
            </div>
            <p className="text-xs text-zinc-500">GPX fajlovi do 8MB</p>
          </div>
        </div>
      ) : (
        // Initial clickable state
        <button
          type="button"
          onClick={handleDropzoneClick}
          className="w-full rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-zinc-600 dark:bg-zinc-800/50 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
        >
          <DocumentIcon className="mx-auto size-6 text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Klikni za dodavanje GPX fajla
          </p>
        </button>
      )}
    </div>
  )
}
