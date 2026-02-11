'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { Button } from '@/components/button'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'

type ImageUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  endpoint: 'eventImage' | 'galleryImages' | 'profileImage'
  label?: string
}

export function ImageUpload({ value, onChange, endpoint, label = 'Slika' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="h-40 w-auto rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      ) : (
        <UploadDropzone
          endpoint={endpoint}
          onUploadBegin={() => setIsUploading(true)}
          onClientUploadComplete={(res) => {
            setIsUploading(false)
            console.log('Upload complete, response:', res)
            const url = res?.[0]?.ufsUrl || res?.[0]?.url
            if (url) {
              console.log('Setting image URL:', url)
              onChange(url)
            }
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false)
            console.error('Upload error:', error)
            alert(`Greška pri uploadu: ${error.message}`)
          }}
          className="ut-allowed-content:text-zinc-500 ut-label:text-zinc-700 ut-upload-icon:text-zinc-400 dark:ut-allowed-content:text-zinc-400 dark:ut-label:text-zinc-300 dark:ut-upload-icon:text-zinc-500 border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50"
          appearance={{
            container: 'border-2 border-dashed rounded-lg p-6',
            uploadIcon: 'text-zinc-400',
            label: 'text-sm text-zinc-600 dark:text-zinc-400',
            allowedContent: 'text-xs text-zinc-500',
            button: 'ut-ready:bg-zinc-900 ut-ready:hover:bg-zinc-700 ut-uploading:bg-zinc-500 text-sm',
          }}
          content={{
            label: 'Prevuci sliku ovde ili klikni za izbor',
            allowedContent: 'Slike do 4MB (JPG, PNG, WebP)',
            button({ ready, isUploading }) {
              if (isUploading) return 'Upload u toku...'
              if (ready) return 'Izaberi sliku'
              return 'Priprema...'
            },
          }}
        />
      )}
    </div>
  )
}
