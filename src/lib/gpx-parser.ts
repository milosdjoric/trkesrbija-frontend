/**
 * GPX parsing utilities
 * Extracts track points, calculates statistics and elevation profile data
 */

export type GpxStats = {
  distance: number // km
  elevationGain: number // m
  elevationLoss: number // m
  minElevation: number // m
  maxElevation: number // m
  pointCount: number
  startPoint: { lat: number; lng: number } | null
  endPoint: { lat: number; lng: number } | null
  name: string | null
}

export type TrackPoint = {
  lat: number
  lng: number
  elevation: number
  distance: number // km from start
}

export type ParsedGpx = {
  stats: GpxStats
  points: TrackPoint[]
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in meters
}

/**
 * Parse GPX file content and extract statistics and track points
 */
export function parseGpx(gpxText: string): ParsedGpx {
  const parser = new DOMParser()
  const gpxDoc = parser.parseFromString(gpxText, 'application/xml')

  const parseError = gpxDoc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Neispravan GPX format fajla')
  }

  // Get track name
  const nameElement = gpxDoc.querySelector('trk > name') || gpxDoc.querySelector('metadata > name')
  const name = nameElement?.textContent || null

  const rawPoints: { lat: number; lng: number; elevation: number }[] = []

  // Try to get track points from <trkpt> elements
  const trkpts = gpxDoc.querySelectorAll('trkpt')
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0')
    const lon = parseFloat(pt.getAttribute('lon') || '0')
    const ele = pt.querySelector('ele')
    if (lat && lon) {
      const elevation = ele ? parseFloat(ele.textContent || '0') : 0
      rawPoints.push({ lat, lng: lon, elevation })
    }
  })

  // If no track points, try route points <rtept>
  if (rawPoints.length === 0) {
    const rtepts = gpxDoc.querySelectorAll('rtept')
    rtepts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0')
      const lon = parseFloat(pt.getAttribute('lon') || '0')
      const ele = pt.querySelector('ele')
      if (lat && lon) {
        const elevation = ele ? parseFloat(ele.textContent || '0') : 0
        rawPoints.push({ lat, lng: lon, elevation })
      }
    })
  }

  // If no points found, try waypoints <wpt>
  if (rawPoints.length === 0) {
    const wpts = gpxDoc.querySelectorAll('wpt')
    wpts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0')
      const lon = parseFloat(pt.getAttribute('lon') || '0')
      const ele = pt.querySelector('ele')
      if (lat && lon) {
        const elevation = ele ? parseFloat(ele.textContent || '0') : 0
        rawPoints.push({ lat, lng: lon, elevation })
      }
    })
  }

  if (rawPoints.length === 0) {
    throw new Error('GPX fajl ne sadrži tačke rute')
  }

  // Calculate statistics and build track points with distance
  let totalDistance = 0
  let elevationGain = 0
  let elevationLoss = 0
  const elevations: number[] = []
  const points: TrackPoint[] = []

  for (let i = 0; i < rawPoints.length; i++) {
    const point = rawPoints[i]
    elevations.push(point.elevation)

    if (i > 0) {
      const prev = rawPoints[i - 1]
      totalDistance += haversineDistance(prev.lat, prev.lng, point.lat, point.lng)

      const elevDiff = point.elevation - prev.elevation
      if (elevDiff > 0) {
        elevationGain += elevDiff
      } else {
        elevationLoss += Math.abs(elevDiff)
      }
    }

    // Sample points for elevation profile (max ~200 points)
    const sampleRate = Math.max(1, Math.floor(rawPoints.length / 200))
    if (i % sampleRate === 0 || i === rawPoints.length - 1) {
      points.push({
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation,
        distance: totalDistance / 1000, // km
      })
    }
  }

  const stats: GpxStats = {
    distance: totalDistance / 1000, // km
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    minElevation: elevations.length > 0 ? Math.round(Math.min(...elevations)) : 0,
    maxElevation: elevations.length > 0 ? Math.round(Math.max(...elevations)) : 0,
    pointCount: rawPoints.length,
    startPoint: rawPoints.length > 0 ? { lat: rawPoints[0].lat, lng: rawPoints[0].lng } : null,
    endPoint:
      rawPoints.length > 0
        ? { lat: rawPoints[rawPoints.length - 1].lat, lng: rawPoints[rawPoints.length - 1].lng }
        : null,
    name,
  }

  return { stats, points }
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Greška pri čitanju fajla'))
    reader.readAsText(file)
  })
}
