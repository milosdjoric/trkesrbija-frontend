'use client'

import { AdSlot } from '@/components/ad-slot'
import { useState, useCallback } from 'react'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { Button } from '@/components/button'
import { GpxAnalyzerViewWrapper } from '@/components/gpx-analyzer-view-wrapper'
import { parseGpx, readFileAsText, type ParsedGpx } from '@/lib/gpx-parser'
import { useUploadThing } from '@/lib/uploadthing'
import { MapIcon, ArrowUpTrayIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function GpxAnalyzerPage() {
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { startUpload } = useUploadThing('gpxAnalyzer', {
    onUploadError: (err) => {
      console.error('Upload error:', err)
    },
  })

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Molimo izaberite GPX fajl')
      return
    }

    setIsLoading(true)
    setIsUploading(true)
    setError(null)

    try {
      // 1. Start upload (parallel)
      const uploadPromise = startUpload([file])

      // 2. Parse locally
      const text = await readFileAsText(file)
      const parsed = parseGpx(text)

      // 3. Wait for upload
      const uploadResult = await uploadPromise
      if (uploadResult?.[0]?.url) {
        setUploadedUrl(uploadResult[0].url)
      }

      setParsedGpx(parsed)
      setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri obradi GPX fajla')
      setParsedGpx(null)
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }, [startUpload])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleReset = useCallback(() => {
    setParsedGpx(null)
    setFileName(null)
    setError(null)
    setUploadedUrl(null)
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Heading>GPX Analyzer</Heading>
          <Text className="mt-1">Uploadujte GPX fajl za analizu rute</Text>
        </div>
        {parsedGpx && (
          <Button outline onClick={handleReset}>
            <ArrowUpTrayIcon className="size-4" />
            Novi fajl
          </Button>
        )}
      </div>

      {/* Ad */}
      <AdSlot placement="RESULTS_BANNER" className="mt-6" />

      <div className="mt-8">
        {!parsedGpx ? (
          // Upload zone
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-brand-green bg-brand-green/10'
                : 'border-border-secondary bg-card hover:border-gray-500 hover:bg-card-hover'
            }`}
          >
            <input
              type="file"
              accept=".gpx"
              onChange={handleInputChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isLoading}
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="size-12 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
                <Text>Učitavanje...</Text>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-surface p-4">
                  <MapIcon className="size-10 text-text-secondary" />
                </div>
                <div>
                  <Subheading>Prevucite GPX fajl ovde</Subheading>
                  <Text className="mt-1">ili kliknite za izbor fajla</Text>
                </div>
                <Text className="text-xs text-text-muted">Podržani format: .gpx</Text>
              </div>
            )}
          </div>
        ) : (
          // Results
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-card p-4">
              <div className="rounded-full bg-brand-green/15 p-2">
                <MapIcon className="size-5 text-brand-green" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-text-primary">
                  {parsedGpx.stats.name || fileName}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span>{parsedGpx.stats.pointCount.toLocaleString()} tačaka</span>
                  {uploadedUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={uploadedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-green hover:text-brand-green-dark"
                      >
                        <ArrowDownTrayIcon className="size-3" />
                        Preuzmi
                      </a>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="rounded-full p-1 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            {/* Analysis view */}
            <GpxAnalyzerViewWrapper stats={parsedGpx.stats} points={parsedGpx.points} topClimbs={parsedGpx.topClimbs} />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
            {error}
          </div>
        )}
      </div>
    </>
  )
}
