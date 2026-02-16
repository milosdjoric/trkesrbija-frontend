'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ClimbSegment, GpxStats, TrackPoint } from '@/lib/gpx-parser'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type GpxAnalyzerViewProps = {
  stats: GpxStats
  points: TrackPoint[]
  topClimbs: ClimbSegment[]
}

export function GpxAnalyzerView({ stats, points, topClimbs }: GpxAnalyzerViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.Marker | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'street' | 'topo' | 'satellite'>('street')
  const [hoveredPoint, setHoveredPoint] = useState<TrackPoint | null>(null)

  const layersRef = useRef<{
    street?: L.TileLayer
    topo?: L.TileLayer
    satellite?: L.TileLayer
  }>({})

  const switchLayer = useCallback((layer: 'street' | 'topo' | 'satellite') => {
    const map = mapInstanceRef.current
    if (!map) return

    Object.values(layersRef.current).forEach((l) => {
      if (l) map.removeLayer(l)
    })

    const selectedLayer = layersRef.current[layer]
    if (selectedLayer) {
      selectedLayer.addTo(map)
    }

    setActiveLayer(layer)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = mapContainerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [isFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 100)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Update hover marker position
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !hoveredPoint) return

    if (!hoverMarkerRef.current) {
      const hoverIcon = L.divIcon({
        className: 'hover-marker',
        html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
      hoverMarkerRef.current = L.marker([hoveredPoint.lat, hoveredPoint.lng], { icon: hoverIcon }).addTo(map)
    } else {
      hoverMarkerRef.current.setLatLng([hoveredPoint.lat, hoveredPoint.lng])
    }
  }, [hoveredPoint])

  // Remove hover marker when not hovering
  useEffect(() => {
    if (!hoveredPoint && hoverMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(hoverMarkerRef.current)
      hoverMarkerRef.current = null
    }
  }, [hoveredPoint])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || points.length === 0) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([44.0, 21.0], 8)

    mapInstanceRef.current = map

    // Create tile layers
    layersRef.current.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })

    layersRef.current.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
    })

    layersRef.current.satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri',
        maxZoom: 18,
      }
    )

    // Add default layer
    layersRef.current.street.addTo(map)

    // Draw the track
    const trackPoints = points.map((p) => L.latLng(p.lat, p.lng))
    const polyline = L.polyline(trackPoints, {
      color: '#10b981',
      weight: 4,
      opacity: 0.9,
    }).addTo(map)

    // Add start marker
    const startIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.marker(trackPoints[0], { icon: startIcon }).bindPopup('Start').addTo(map)

    // Add finish marker
    const finishIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.marker(trackPoints[trackPoints.length - 1], { icon: finishIcon }).bindPopup('Cilj').addTo(map)

    // Fit map to track bounds
    map.fitBounds(polyline.getBounds(), { padding: [30, 30] })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [points])

  // Handle elevation profile hover
  const handleProfileHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (points.length === 0) return

      const container = e.currentTarget
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width

      // Chart area is from 10% to 98% of width (same as gpx-map.tsx)
      const chartStart = width * 0.1
      const chartEnd = width * 0.98
      const chartWidth = chartEnd - chartStart

      // Calculate relative position within chart area
      const relativeX = (x - chartStart) / chartWidth
      if (relativeX < 0 || relativeX > 1) {
        setHoveredPoint(null)
        return
      }

      const index = Math.round(relativeX * (points.length - 1))
      const point = points[index]
      if (point) {
        setHoveredPoint(point)
      }
    },
    [points]
  )

  const handleProfileLeave = useCallback(() => {
    setHoveredPoint(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.distance.toFixed(2)} km</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Dužina</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.elevationGain} m</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Uspon (D+)</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.elevationLoss} m</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Pad (D-)</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.minElevation} m</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Min visina</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.maxElevation} m</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Max visina</div>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className={`relative ${isFullscreen ? 'bg-white p-4 dark:bg-zinc-900' : ''}`}
      >
        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
        />

        {/* Layer switcher */}
        <div className="absolute right-3 top-3 z-[1000] flex gap-1 rounded-lg bg-white p-1 shadow-md dark:bg-zinc-800">
          {(['street', 'topo', 'satellite'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => switchLayer(layer)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeLayer === layer
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {layer === 'street' ? 'Ulice' : layer === 'topo' ? 'Topo' : 'Satelit'}
            </button>
          ))}
        </div>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 z-[1000] rounded-lg bg-white p-2 shadow-md hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          title={isFullscreen ? 'Izađi iz celog ekrana' : 'Ceo ekran'}
        >
          <svg className="size-5 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Advanced Stats */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Napredne statistike</h3>
          <a
            href="https://itra.run/FAQ/ItraScore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400"
          >
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ITRA dokumentacija
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* ITRA Points */}
          <div>
            <div className="flex min-h-[30px] items-baseline gap-2">
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">{stats.itraPoints}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">km-effort</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">ITRA bodovi</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Formula: km + D+ / 100
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div className="flex min-h-[30px] items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  stats.difficulty === 'XXS' || stats.difficulty === 'XS'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : stats.difficulty === 'S'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : stats.difficulty === 'M'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {stats.difficulty}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{stats.difficultyLabel}</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">ITRA kategorizacija težine staze</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              {stats.difficulty === 'XXS' && '0 ITRA poena (0-24 km-effort)'}
              {stats.difficulty === 'XS' && '1 ITRA poen (25-44 km-effort)'}
              {stats.difficulty === 'S' && '2 ITRA poena (45-74 km-effort)'}
              {stats.difficulty === 'M' && '3 ITRA poena (75-114 km-effort)'}
              {stats.difficulty === 'L' && '4 ITRA poena (115-154 km-effort)'}
              {stats.difficulty === 'XL' && '5 ITRA poena (155-209 km-effort)'}
              {stats.difficulty === 'XXL' && '6 ITRA poena (210+ km-effort)'}
            </div>
          </div>

          {/* Effort Distance */}
          <div>
            <div className="flex min-h-[30px] items-center text-lg font-semibold text-zinc-900 dark:text-white">{stats.effortDistance} km</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Effort distanca</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Švajcarska metoda: km + D+/100 + D-/200
            </div>
          </div>

          {/* Average Elevation */}
          <div>
            <div className="min-h-[30px] text-lg font-semibold text-zinc-900 dark:text-white">{stats.averageElevation} m</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Prosečna visina</div>
          </div>

          {/* Average Grade */}
          <div>
            <div className="min-h-[30px] text-lg font-semibold text-zinc-900 dark:text-white">{stats.averageGrade}%</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Prosečni nagib</div>
          </div>

          {/* Max Grade Up */}
          <div>
            <div className="min-h-[30px] text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{stats.maxGradeUp}%</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Max uspon</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Najstrmiji segment (min 100m)
            </div>
          </div>

          {/* Max Grade Down */}
          <div>
            <div className="min-h-[30px] text-lg font-semibold text-red-600 dark:text-red-400">-{stats.maxGradeDown}%</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Max pad</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Najstrmiji spust (min 100m)
            </div>
          </div>

          {/* Loop */}
          <div>
            <div className="min-h-[30px] text-lg font-semibold text-zinc-900 dark:text-white">
              {stats.isLoop ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Da
                </span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">Ne</span>
              )}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Kružna ruta</div>
            <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Start i cilj unutar 500m
            </div>
          </div>
        </div>

        {/* ITRA Info Note */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
            <strong>Napomena:</strong> Zvanični ITRA bodovi mogu biti umanjeni za trke sa više identičnih krugova ili
            previše okrepnih stanica. Ova analiza koristi osnovnu km-effort formulu.{' '}
            <a
              href="https://itra.run/FAQ/ItraScore"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800 dark:hover:text-blue-200"
            >
              Više informacija →
            </a>
          </p>
        </div>
      </div>

      {/* Elevation Profile */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Visinski profil</span>
          {hoveredPoint && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {hoveredPoint.distance.toFixed(1)} km · {Math.round(hoveredPoint.elevation)} m
            </span>
          )}
        </div>
        <div
          className="relative h-[120px] w-full cursor-crosshair rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
          onMouseMove={handleProfileHover}
          onMouseLeave={handleProfileLeave}
        >
          {/* Y-axis labels - positioned outside SVG */}
          <div className="pointer-events-none absolute left-2 top-2 text-[10px] text-zinc-400">{stats.maxElevation}m</div>
          <div className="pointer-events-none absolute bottom-6 left-2 text-[10px] text-zinc-400">{stats.minElevation}m</div>

          {/* X-axis labels - positioned outside SVG */}
          <div className="pointer-events-none absolute bottom-1 left-10 text-[10px] text-zinc-400">0</div>
          <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-zinc-400">{stats.distance.toFixed(1)}km</div>

          {/* Hover indicator - HTML elements for perfect positioning */}
          {hoveredPoint && (
            <>
              {/* Vertical line */}
              <div
                className="pointer-events-none absolute top-[5%] h-[70%] w-px border-l border-dashed border-blue-500"
                style={{ left: `${10 + (hoveredPoint.distance / stats.distance) * 88}%` }}
              />
              {/* Circle marker */}
              <div
                className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-md"
                style={{
                  left: `${10 + (hoveredPoint.distance / stats.distance) * 88}%`,
                  top: `${5 + (1 - (hoveredPoint.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 70}%`,
                }}
              />
            </>
          )}

          {/* SVG for the chart only */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-zinc-300 dark:text-zinc-600" />
              </pattern>
              <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="10" y="5" width="88" height="70" fill="url(#grid)" />

            {/* Elevation area */}
            <path
              d={`
                M 10 75
                ${points.map((point) => {
                  const x = 10 + (point.distance / stats.distance) * 88
                  const y = 75 - ((point.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 70
                  return `L ${x} ${y}`
                }).join(' ')}
                L 98 75
                Z
              `}
              fill="url(#elevationGradient)"
              opacity="0.3"
            />

            {/* Elevation line */}
            <path
              d={`
                M ${10 + ((points[0]?.distance || 0) / stats.distance) * 88} ${75 - ((points[0]?.elevation || 0) - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1) * 70}
                ${points.slice(1).map((point) => {
                  const x = 10 + (point.distance / stats.distance) * 88
                  const y = 75 - ((point.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 70
                  return `L ${x} ${y}`
                }).join(' ')}
              `}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      {/* Top Climbs */}
      {topClimbs.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-4 text-sm font-medium text-zinc-900 dark:text-white">
            Top {topClimbs.length} uspon{topClimbs.length === 1 ? '' : topClimbs.length < 5 ? 'a' : 'a'}
          </h3>
          <div className="space-y-2">
            {topClimbs.map((climb, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
              >
                {/* Rank */}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {index + 1}
                </div>

                {/* Climb info */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {climb.startKm} km → {climb.endKm} km
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ({climb.length} km)
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    +{climb.elevationGain}m · prosečno {climb.averageGrade}%
                  </div>
                </div>

                {/* Grade badge */}
                <div
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    climb.averageGrade < 5
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : climb.averageGrade < 10
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : climb.averageGrade < 15
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {climb.averageGrade}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
