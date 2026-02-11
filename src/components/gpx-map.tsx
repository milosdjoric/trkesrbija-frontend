'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type GpxMapProps = {
  gpxUrl: string
  className?: string
}

type GpxStats = {
  distance: number
  elevationGain: number
  elevationLoss: number
  minElevation: number
  maxElevation: number
}

type ElevationPoint = {
  distance: number // km from start
  elevation: number // meters
  lat: number
  lng: number
}

export function GpxMap({ gpxUrl, className = '' }: GpxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GpxStats | null>(null)
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'street' | 'topo' | 'satellite'>('street')
  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null)

  // Layer references
  const layersRef = useRef<{
    street?: L.TileLayer
    topo?: L.TileLayer
    satellite?: L.TileLayer
  }>({})

  const switchLayer = useCallback((layer: 'street' | 'topo' | 'satellite') => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove all layers
    Object.values(layersRef.current).forEach((l) => {
      if (l) map.removeLayer(l)
    })

    // Add selected layer
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
      // Invalidate map size after fullscreen change
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

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

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

    layersRef.current.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 18,
    })

    // Add default layer
    layersRef.current.street.addTo(map)

    // Fetch and parse GPX file
    fetch(gpxUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch GPX file')
        return res.text()
      })
      .then((gpxText) => {
        const parser = new DOMParser()
        const gpxDoc = parser.parseFromString(gpxText, 'application/xml')

        const parseError = gpxDoc.querySelector('parsererror')
        if (parseError) {
          throw new Error('Invalid GPX file format')
        }

        const trackPoints: L.LatLng[] = []
        const elevations: number[] = []
        const elevationPoints: ElevationPoint[] = []

        // Try to get track points from <trkpt> elements
        const trkpts = gpxDoc.querySelectorAll('trkpt')
        trkpts.forEach((pt) => {
          const lat = parseFloat(pt.getAttribute('lat') || '0')
          const lon = parseFloat(pt.getAttribute('lon') || '0')
          const ele = pt.querySelector('ele')
          if (lat && lon) {
            trackPoints.push(L.latLng(lat, lon))
            const elevation = ele ? parseFloat(ele.textContent || '0') : 0
            elevations.push(elevation)
          }
        })

        // If no track points, try route points <rtept>
        if (trackPoints.length === 0) {
          const rtepts = gpxDoc.querySelectorAll('rtept')
          rtepts.forEach((pt) => {
            const lat = parseFloat(pt.getAttribute('lat') || '0')
            const lon = parseFloat(pt.getAttribute('lon') || '0')
            const ele = pt.querySelector('ele')
            if (lat && lon) {
              trackPoints.push(L.latLng(lat, lon))
              const elevation = ele ? parseFloat(ele.textContent || '0') : 0
              elevations.push(elevation)
            }
          })
        }

        // If no points found, try waypoints <wpt>
        if (trackPoints.length === 0) {
          const wpts = gpxDoc.querySelectorAll('wpt')
          wpts.forEach((pt) => {
            const lat = parseFloat(pt.getAttribute('lat') || '0')
            const lon = parseFloat(pt.getAttribute('lon') || '0')
            const ele = pt.querySelector('ele')
            if (lat && lon) {
              trackPoints.push(L.latLng(lat, lon))
              const elevation = ele ? parseFloat(ele.textContent || '0') : 0
              elevations.push(elevation)
            }
          })
        }

        if (trackPoints.length === 0) {
          throw new Error('No track points found in GPX file')
        }

        // Calculate statistics and build elevation profile data
        let totalDistance = 0
        let elevationGain = 0
        let elevationLoss = 0

        for (let i = 0; i < trackPoints.length; i++) {
          if (i > 0) {
            totalDistance += trackPoints[i - 1].distanceTo(trackPoints[i])

            if (elevations.length > i) {
              const elevDiff = elevations[i] - elevations[i - 1]
              if (elevDiff > 0) {
                elevationGain += elevDiff
              } else {
                elevationLoss += Math.abs(elevDiff)
              }
            }
          }

          // Add to elevation profile (sample every nth point to avoid too many points)
          const sampleRate = Math.max(1, Math.floor(trackPoints.length / 200))
          if (i % sampleRate === 0 || i === trackPoints.length - 1) {
            elevationPoints.push({
              distance: totalDistance / 1000,
              elevation: elevations[i] || 0,
              lat: trackPoints[i].lat,
              lng: trackPoints[i].lng,
            })
          }
        }

        setElevationData(elevationPoints)
        setStats({
          distance: totalDistance / 1000,
          elevationGain: Math.round(elevationGain),
          elevationLoss: Math.round(elevationLoss),
          minElevation: elevations.length > 0 ? Math.round(Math.min(...elevations)) : 0,
          maxElevation: elevations.length > 0 ? Math.round(Math.max(...elevations)) : 0,
        })

        // Draw the track as a polyline
        const polyline = L.polyline(trackPoints, {
          color: '#10b981',
          weight: 4,
          opacity: 0.9,
        }).addTo(map)
        polylineRef.current = polyline

        // Add start marker
        const startIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        L.marker(trackPoints[0], { icon: startIcon })
          .bindPopup('Start')
          .addTo(map)

        // Add finish marker
        const finishIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        L.marker(trackPoints[trackPoints.length - 1], { icon: finishIcon })
          .bindPopup('Cilj')
          .addTo(map)

        // Fit map to track bounds
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] })

        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading GPX:', err)
        setError(err.message || 'Failed to load GPX file')
        setLoading(false)
      })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [gpxUrl])

  // Handle elevation profile hover
  const handleProfileHover = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (elevationData.length === 0) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const padding = 40

    // Calculate which point we're hovering over
    const relativeX = (x - padding) / (width - padding * 2)
    if (relativeX < 0 || relativeX > 1) {
      setHoveredPoint(null)
      return
    }

    const index = Math.round(relativeX * (elevationData.length - 1))
    const point = elevationData[index]
    if (point) {
      setHoveredPoint(point)
    }
  }, [elevationData])

  const handleProfileLeave = useCallback(() => {
    setHoveredPoint(null)
  }, [])

  return (
    <div
      ref={mapContainerRef}
      className={`relative ${className} ${isFullscreen ? 'bg-white dark:bg-zinc-900 p-4' : ''}`}
    >
      {/* Map container */}
      <div className="relative">
        <div
          ref={mapRef}
          className={`w-full rounded-lg border border-zinc-200 dark:border-zinc-700 ${isFullscreen ? 'h-[60vh]' : 'h-[300px]'}`}
          style={{ zIndex: 0 }}
        />

        {/* Layer switcher */}
        {!loading && !error && (
          <div className="absolute top-2 right-2 z-[1000] flex gap-1 rounded-lg bg-white/90 p-1 shadow-md backdrop-blur dark:bg-zinc-800/90">
            <button
              onClick={() => switchLayer('street')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeLayer === 'street'
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Ulice
            </button>
            <button
              onClick={() => switchLayer('topo')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeLayer === 'topo'
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Topo
            </button>
            <button
              onClick={() => switchLayer('satellite')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeLayer === 'satellite'
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Satelit
            </button>
          </div>
        )}

        {/* Fullscreen button */}
        {!loading && !error && (
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-2 right-2 z-[1000] rounded-lg bg-white/90 p-2 shadow-md backdrop-blur transition-colors hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800"
            title={isFullscreen ? 'Izađi iz celog ekrana' : 'Ceo ekran'}
          >
            {isFullscreen ? (
              <svg className="size-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500">
              <svg className="size-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Učitavanje mape...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-center text-sm text-red-600 dark:text-red-400">
              <p>Greška pri učitavanju GPX fajla</p>
              <p className="text-xs opacity-75">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Elevation Profile */}
      {elevationData.length > 0 && stats && !loading && !error && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Visinski profil</span>
            {hoveredPoint && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {hoveredPoint.distance.toFixed(1)} km · {Math.round(hoveredPoint.elevation)} m
              </span>
            )}
          </div>
          <div className="relative h-[120px] w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            {/* Y-axis labels - positioned outside SVG */}
            <div className="absolute left-2 top-2 text-[10px] text-zinc-400">{stats.maxElevation}m</div>
            <div className="absolute left-2 bottom-6 text-[10px] text-zinc-400">{stats.minElevation}m</div>

            {/* X-axis labels - positioned outside SVG */}
            <div className="absolute left-10 bottom-1 text-[10px] text-zinc-400">0</div>
            <div className="absolute right-2 bottom-1 text-[10px] text-zinc-400">{stats.distance.toFixed(1)}km</div>

            {/* SVG for the chart only */}
            <svg
              className="absolute inset-0 h-full w-full cursor-crosshair"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onMouseMove={handleProfileHover}
              onMouseLeave={handleProfileLeave}
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
              <rect x="10" y="5" width="88" height="80" fill="url(#grid)" />

              {/* Elevation area */}
              <path
                d={`
                  M 10 85
                  ${elevationData.map((point) => {
                    const x = 10 + ((point.distance / stats.distance) * 88)
                    const y = 85 - ((point.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 75
                    return `L ${x} ${y}`
                  }).join(' ')}
                  L 98 85
                  Z
                `}
                fill="url(#elevationGradient)"
                opacity="0.3"
              />

              {/* Elevation line */}
              <path
                d={`
                  M ${10 + ((elevationData[0]?.distance || 0) / stats.distance) * 88} ${85 - ((elevationData[0]?.elevation || 0) - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1) * 75}
                  ${elevationData.slice(1).map((point) => {
                    const x = 10 + ((point.distance / stats.distance) * 88)
                    const y = 85 - ((point.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 75
                    return `L ${x} ${y}`
                  }).join(' ')}
                `}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Hover indicator */}
              {hoveredPoint && (
                <>
                  <line
                    x1={10 + ((hoveredPoint.distance / stats.distance) * 88)}
                    y1="5"
                    x2={10 + ((hoveredPoint.distance / stats.distance) * 88)}
                    y2="85"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={10 + ((hoveredPoint.distance / stats.distance) * 88)}
                    cy={85 - ((hoveredPoint.elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation || 1)) * 75}
                    r="3"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && !loading && !error && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            <span className="inline-block size-2 rounded-full bg-green-500 mr-1"></span>
            Start
          </span>
          <span>
            <span className="inline-block size-2 rounded-full bg-red-500 mr-1"></span>
            Cilj
          </span>
          <span>Dužina: {stats.distance.toFixed(1)} km</span>
          <span>Uspon: +{stats.elevationGain}m</span>
          <span>Pad: -{stats.elevationLoss}m</span>
          <span>Min: {stats.minElevation}m</span>
          <span>Max: {stats.maxElevation}m</span>
        </div>
      )}
    </div>
  )
}
