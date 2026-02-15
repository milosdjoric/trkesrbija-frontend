'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GpxStats, TrackPoint } from '@/lib/gpx-parser'

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
}

export function GpxAnalyzerView({ stats, points }: GpxAnalyzerViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.Marker | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'street' | 'topo' | 'satellite'>('street')
  const [hoveredPoint, setHoveredPoint] = useState<TrackPoint | null>(null)
  const [hoverXPercent, setHoverXPercent] = useState<number>(0)

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

      // SVG takes full width, so calculate relative position directly
      const relativeX = x / width
      if (relativeX < 0 || relativeX > 1) {
        setHoveredPoint(null)
        return
      }

      // Store exact cursor X position for dot placement
      setHoverXPercent(relativeX * 100)

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

  // Generate elevation profile SVG path
  const generateElevationPath = () => {
    if (points.length < 2) return ''

    const minElev = stats.minElevation
    const maxElev = stats.maxElevation
    const elevRange = maxElev - minElev || 1
    const maxDist = stats.distance

    const svgWidth = 100
    const svgHeight = 100

    const pathPoints = points.map((p, i) => {
      const x = (p.distance / maxDist) * svgWidth
      const y = svgHeight - ((p.elevation - minElev) / elevRange) * svgHeight
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })

    return pathPoints.join(' ')
  }

  const generateAreaPath = () => {
    if (points.length < 2) return ''

    const minElev = stats.minElevation
    const maxElev = stats.maxElevation
    const elevRange = maxElev - minElev || 1
    const maxDist = stats.distance

    const svgWidth = 100
    const svgHeight = 100

    const pathPoints = points.map((p) => {
      const x = (p.distance / maxDist) * svgWidth
      const y = svgHeight - ((p.elevation - minElev) / elevRange) * svgHeight
      return `${x},${y}`
    })

    return `M 0,${svgHeight} L ${pathPoints.join(' L ')} L 100,${svgHeight} Z`
  }

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

      {/* Elevation Profile */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-white">Visinski profil</h3>
        <div
          className="relative h-32 cursor-crosshair"
          onMouseMove={handleProfileHover}
          onMouseLeave={handleProfileLeave}
        >
          {/* SVG Chart */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="elevationGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={generateAreaPath()} fill="url(#elevationGradient)" />
            {/* Line - using vector-effect to prevent stroke scaling */}
            <path
              d={generateElevationPath()}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Hover indicator dot and tooltip */}
          {hoveredPoint && (
            <>
              {/* Blue dot - X follows cursor exactly, Y follows elevation profile */}
              <div
                className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-md"
                style={{
                  left: `${hoverXPercent}%`,
                  top: `${100 - ((hoveredPoint.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 100}%`,
                }}
              />
              {/* Tooltip - follows cursor X position */}
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-zinc-900"
                style={{ left: `${hoverXPercent}%` }}
              >
                {hoveredPoint.distance.toFixed(1)} km | {Math.round(hoveredPoint.elevation)} m
              </div>
            </>
          )}

          {/* Axis labels */}
          <div className="absolute bottom-0 left-0 text-xs text-zinc-500 dark:text-zinc-400">0 km</div>
          <div className="absolute bottom-0 right-0 text-xs text-zinc-500 dark:text-zinc-400">
            {stats.distance.toFixed(1)} km
          </div>
          <div className="absolute left-0 top-0 text-xs text-zinc-500 dark:text-zinc-400">{stats.maxElevation} m</div>
          <div className="absolute bottom-0 left-0 -translate-y-4 text-xs text-zinc-500 dark:text-zinc-400">
            {stats.minElevation} m
          </div>
        </div>
      </div>
    </div>
  )
}
