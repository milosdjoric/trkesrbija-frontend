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
  // Advanced stats
  averageGrade: number // % - prosečni nagib
  maxGradeUp: number // % - maksimalni uspon
  maxGradeDown: number // % - maksimalni pad
  itraPoints: number // ITRA bodovi
  effortDistance: number // km - ekvivalentna ravna distanca
  difficulty: 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' // težinska kategorija
  difficultyLabel: string // srpski naziv kategorije
  isLoop: boolean // da li je kružna ruta
  averageElevation: number // m - prosečna visina
}

export type TrackPoint = {
  lat: number
  lng: number
  elevation: number
  distance: number // km from start
}

export type ClimbSegment = {
  startKm: number // km od starta
  endKm: number // km od starta
  length: number // dužina segmenta u km
  elevationGain: number // m uspona
  averageGrade: number // prosečni nagib %
}

export type ParsedGpx = {
  stats: GpxStats
  points: TrackPoint[]
  topClimbs: ClimbSegment[] // top 10 uspona
}

/**
 * Calculate ITRA difficulty category based on ITRA points
 */
function getItraDifficulty(itraPoints: number): { difficulty: GpxStats['difficulty']; label: string } {
  if (itraPoints < 25) return { difficulty: 'XXS', label: 'Veoma laka' }
  if (itraPoints < 45) return { difficulty: 'XS', label: 'Laka' }
  if (itraPoints < 75) return { difficulty: 'S', label: 'Srednja' }
  if (itraPoints < 115) return { difficulty: 'M', label: 'Teška' }
  if (itraPoints < 155) return { difficulty: 'L', label: 'Veoma teška' }
  if (itraPoints < 210) return { difficulty: 'XL', label: 'Ultra' }
  return { difficulty: 'XXL', label: 'Ekstremna' }
}

/**
 * Detect climb segments from track points
 * A climb is a continuous section where elevation is generally increasing
 */
function detectClimbs(
  rawPoints: { lat: number; lng: number; elevation: number }[],
  minElevationGain: number = 30 // minimum 30m gain to count as a climb
): ClimbSegment[] {
  if (rawPoints.length < 2) return []

  const climbs: ClimbSegment[] = []
  let inClimb = false
  let climbStartIdx = 0
  let climbStartDistance = 0
  let currentDistance = 0
  let climbElevationGain = 0
  let climbStartElevation = 0

  // Use smoothed elevation to avoid noise
  const smoothWindow = Math.min(5, Math.floor(rawPoints.length / 20))

  for (let i = 1; i < rawPoints.length; i++) {
    const prev = rawPoints[i - 1]
    const curr = rawPoints[i]
    const segmentDistance = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng)
    currentDistance += segmentDistance

    const elevDiff = curr.elevation - prev.elevation

    if (!inClimb && elevDiff > 0) {
      // Start of potential climb
      inClimb = true
      climbStartIdx = i - 1
      climbStartDistance = currentDistance - segmentDistance
      climbStartElevation = prev.elevation
      climbElevationGain = elevDiff
    } else if (inClimb) {
      if (elevDiff > 0) {
        // Continuing climb
        climbElevationGain += elevDiff
      } else if (elevDiff < -10) {
        // Significant drop - end of climb (allow small dips)
        if (climbElevationGain >= minElevationGain) {
          const climbLength = (currentDistance - segmentDistance - climbStartDistance) / 1000
          if (climbLength > 0.1) {
            // At least 100m long
            climbs.push({
              startKm: Math.round((climbStartDistance / 1000) * 100) / 100,
              endKm: Math.round(((currentDistance - segmentDistance) / 1000) * 100) / 100,
              length: Math.round(climbLength * 100) / 100,
              elevationGain: Math.round(climbElevationGain),
              averageGrade: Math.round((climbElevationGain / (climbLength * 1000)) * 1000) / 10,
            })
          }
        }
        inClimb = false
        climbElevationGain = 0
      }
      // Small dips (< 10m) are ignored, climb continues
    }
  }

  // Handle climb that ends at the last point
  if (inClimb && climbElevationGain >= minElevationGain) {
    const climbLength = (currentDistance - climbStartDistance) / 1000
    if (climbLength > 0.1) {
      climbs.push({
        startKm: Math.round((climbStartDistance / 1000) * 100) / 100,
        endKm: Math.round((currentDistance / 1000) * 100) / 100,
        length: Math.round(climbLength * 100) / 100,
        elevationGain: Math.round(climbElevationGain),
        averageGrade: Math.round((climbElevationGain / (climbLength * 1000)) * 1000) / 10,
      })
    }
  }

  // Sort by elevation gain (biggest climbs first) and return top 10
  return climbs.sort((a, b) => b.elevationGain - a.elevationGain).slice(0, 10)
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
  const cumulativeDistances: number[] = [0] // za računanje nagiba na većim segmentima
  let maxGradeUp = 0
  let maxGradeDown = 0

  for (let i = 0; i < rawPoints.length; i++) {
    const point = rawPoints[i]
    elevations.push(point.elevation)

    if (i > 0) {
      const prev = rawPoints[i - 1]
      const segmentDistance = haversineDistance(prev.lat, prev.lng, point.lat, point.lng)
      totalDistance += segmentDistance
      cumulativeDistances.push(totalDistance)

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

  // Računaj max nagib na segmentima od minimum 300m (da izbegnemo nerealne vrednosti)
  const minSegmentForGrade = 300 // metara
  for (let i = 0; i < rawPoints.length; i++) {
    // Nađi tačku koja je bar 50m dalje
    let j = i + 1
    while (j < rawPoints.length && cumulativeDistances[j] - cumulativeDistances[i] < minSegmentForGrade) {
      j++
    }
    if (j < rawPoints.length) {
      const segmentDistance = cumulativeDistances[j] - cumulativeDistances[i]
      const elevDiff = rawPoints[j].elevation - rawPoints[i].elevation
      const grade = (elevDiff / segmentDistance) * 100

      if (grade > maxGradeUp) maxGradeUp = grade
      if (grade < maxGradeDown) maxGradeDown = grade
    }
  }

  const distanceKm = totalDistance / 1000

  // Prosečni nagib - ukupni uspon+pad podeljen sa distancom
  const totalElevationChange = elevationGain + elevationLoss
  const averageGrade = totalDistance > 0
    ? (totalElevationChange / totalDistance) * 100
    : 0

  // ITRA bodovi: Distance (km) + (Elevation Gain (m) / 100)
  const itraPoints = distanceKm + elevationGain / 100

  // Effort distance (Švajcarska formula): Distance + (D+ / 100) + (D- / 200)
  const effortDistance = distanceKm + elevationGain / 100 + elevationLoss / 200

  // Težinska kategorija
  const { difficulty, label: difficultyLabel } = getItraDifficulty(itraPoints)

  // Provera da li je kružna ruta (start i cilj unutar 500m)
  const isLoop = rawPoints.length >= 2
    ? haversineDistance(
        rawPoints[0].lat,
        rawPoints[0].lng,
        rawPoints[rawPoints.length - 1].lat,
        rawPoints[rawPoints.length - 1].lng
      ) < 500
    : false

  // Prosečna visina
  const averageElevation = elevations.length > 0
    ? elevations.reduce((sum, e) => sum + e, 0) / elevations.length
    : 0

  const stats: GpxStats = {
    distance: distanceKm,
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
    // Advanced stats
    averageGrade: Math.round(averageGrade * 10) / 10,
    maxGradeUp: Math.round(maxGradeUp * 10) / 10,
    maxGradeDown: Math.round(Math.abs(maxGradeDown) * 10) / 10,
    itraPoints: Math.round(itraPoints * 10) / 10,
    effortDistance: Math.round(effortDistance * 10) / 10,
    difficulty,
    difficultyLabel,
    isLoop,
    averageElevation: Math.round(averageElevation),
  }

  // Detect top climbs
  const topClimbs = detectClimbs(rawPoints)

  return { stats, points, topClimbs }
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
