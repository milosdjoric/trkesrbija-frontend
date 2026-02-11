'use client'

import { useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { XMarkIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline'

type GalleryUploadProps = {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  maxImages?: number
}

export function GalleryUpload({ value = [], onChange, label = 'Galerija', maxImages = 10 }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const remainingSlots = maxImages - value.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      if (filesToUpload.length > 0) {
        await startUpload(filesToUpload)
      }
    }
    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const canAddMore = value.length < maxImages

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label} ({value.length}/{maxImages})
        </label>
      )}

      {/* Image grid */}
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

        {/* Add button */}
        {canAddMore && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              isUploading
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20'
                : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/50 dark:hover:border-zinc-500'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <svg className="size-6 animate-spin text-emerald-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="mt-1 text-xs text-emerald-600">Upload...</span>
              </>
            ) : (
              <>
                <PlusIcon className="size-6 text-zinc-400" />
                <span className="mt-1 text-xs text-zinc-500">Dodaj slike</span>
              </>
            )}
          </label>
        )}
      </div>

      {value.length === 0 && !isUploading && (
        <p className="text-xs text-zinc-500">Klikni na + da dodaš slike u galeriju</p>
      )}
    </div>
  )
}
