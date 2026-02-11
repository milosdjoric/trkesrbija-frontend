'use client'

import { useEffect, useRef, useState } from 'react'
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
  distance: number // in km
  elevationGain: number // in meters
  elevationLoss: number // in meters
  minElevation: number
  maxElevation: number
}

export function GpxMap({ gpxUrl, className = '' }: GpxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GpxStats | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
    }).setView([44.0, 21.0], 8) // Serbia center

    mapInstanceRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    // Fetch and parse GPX file
    fetch(gpxUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch GPX file')
        return res.text()
      })
      .then((gpxText) => {
        const parser = new DOMParser()
        const gpxDoc = parser.parseFromString(gpxText, 'application/xml')

        // Check for parsing errors
        const parseError = gpxDoc.querySelector('parsererror')
        if (parseError) {
          throw new Error('Invalid GPX file format')
        }

        // Extract track points
        const trackPoints: L.LatLng[] = []
        const elevations: number[] = []

        // Try to get track points from <trkpt> elements
        const trkpts = gpxDoc.querySelectorAll('trkpt')
        trkpts.forEach((pt) => {
          const lat = parseFloat(pt.getAttribute('lat') || '0')
          const lon = parseFloat(pt.getAttribute('lon') || '0')
          const ele = pt.querySelector('ele')
          if (lat && lon) {
            trackPoints.push(L.latLng(lat, lon))
            if (ele) {
              elevations.push(parseFloat(ele.textContent || '0'))
            }
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
              if (ele) {
                elevations.push(parseFloat(ele.textContent || '0'))
              }
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
              if (ele) {
                elevations.push(parseFloat(ele.textContent || '0'))
              }
            }
          })
        }

        if (trackPoints.length === 0) {
          throw new Error('No track points found in GPX file')
        }

        // Calculate statistics
        let totalDistance = 0
        let elevationGain = 0
        let elevationLoss = 0

        for (let i = 1; i < trackPoints.length; i++) {
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

        setStats({
          distance: totalDistance / 1000, // Convert to km
          elevationGain: Math.round(elevationGain),
          elevationLoss: Math.round(elevationLoss),
          minElevation: elevations.length > 0 ? Math.round(Math.min(...elevations)) : 0,
          maxElevation: elevations.length > 0 ? Math.round(Math.max(...elevations)) : 0,
        })

        // Draw the track as a polyline
        const polyline = L.polyline(trackPoints, {
          color: '#10b981', // emerald-500
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

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        className="h-[300px] w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
        style={{ zIndex: 0 }}
      />

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

      {/* Stats */}
      {stats && !loading && !error && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            <span className="inline-block size-2 rounded-full bg-green-500 mr-1"></span>
            Start
          </span>
          <span>
            <span className="inline-block size-2 rounded-full bg-red-500 mr-1"></span>
            Cilj
          </span>
          {stats.distance > 0 && (
            <span>Dužina: {stats.distance.toFixed(1)} km</span>
          )}
          {stats.elevationGain > 0 && (
            <span>Uspon: +{stats.elevationGain}m</span>
          )}
          {stats.elevationLoss > 0 && (
            <span>Pad: -{stats.elevationLoss}m</span>
          )}
        </div>
      )}
    </div>
  )
}
