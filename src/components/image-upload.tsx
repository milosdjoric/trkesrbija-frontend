'use client'

import { useRef, useState } from 'react'
import { useUploadThing } from '@/lib/uploadthing'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CloudUploadIcon } from '@/components/icons/cloud-upload-icon'

type ImageUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  endpoint: 'eventImage' | 'galleryImages' | 'profileImage'
  label?: string
  description?: string
}

export function ImageUpload({
  value,
  onChange,
  endpoint,
  label = 'Slika',
  description = 'Prevuci sliku ovde ili klikni za izbor'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing(endpoint, {
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
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="aspect-video w-full max-w-md rounded-lg border border-dark-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-zinc-500 bg-zinc-700/50'
              : 'border-dark-border bg-zinc-800/80 hover:border-zinc-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center p-6">
            {isUploading ? (
              <>
                <svg className="size-8 animate-spin text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="mt-2 text-sm text-gray-400">Upload u toku...</span>
              </>
            ) : (
              <>
                <CloudUploadIcon className="size-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">
                  {description}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
