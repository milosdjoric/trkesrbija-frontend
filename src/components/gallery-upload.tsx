'use client'

import { useRef, useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CloudUploadIcon } from '@/components/icons/cloud-upload-icon'

type GalleryUploadProps = {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  maxImages?: number
}

export function GalleryUpload({ value = [], onChange, label = 'Galerija', maxImages = 10 }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('galleryImages', {
    onClientUploadComplete: (res) => {
      setIsUploading(false)
      if (res && res.length > 0) {
        const newUrls = res.map((r) => r.ufsUrl || r.url).filter(Boolean) as string[]
        onChange([...value, ...newUrls])
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false)
      console.error('Gallery upload error:', error)
      alert(`Greška pri uploadu: ${error.message}`)
    },
    onUploadBegin: () => {
      setIsUploading(true)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const remainingSlots = maxImages - value.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      if (filesToUpload.length > 0) {
        await startUpload(filesToUpload)
      }
    }
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const remainingSlots = maxImages - value.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      if (filesToUpload.length > 0) {
        await startUpload(filesToUpload)
      }
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

  const removeImage = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const canAddMore = value.length < maxImages

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label} <span className="text-zinc-500">({value.length}/{maxImages})</span>
        </label>
      )}

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div key={url} className="group relative aspect-square">
              <img
                src={url}
                alt={`Galerija ${index + 1}`}
                className="h-full w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAddMore && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-700/50'
              : 'border-zinc-300 bg-zinc-900/50 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800/80 dark:hover:border-zinc-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex aspect-[4/3] flex-col items-center justify-center p-6">
            {isUploading ? (
              <>
                <svg className="size-12 animate-spin text-zinc-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="mt-3 text-sm text-zinc-400">Upload u toku...</span>
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-24 text-zinc-400 dark:text-zinc-500" />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Prevuci slike ovde ili klikni za izbor
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Maksimalna veličina: 4MB po slici
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
