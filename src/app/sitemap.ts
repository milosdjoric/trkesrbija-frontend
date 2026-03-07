import type { MetadataRoute } from 'next'
import { gql } from '@/app/lib/api'

export const revalidate = 3600 // ISR: revalidate svaki sat

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trkesrbija.rs'

type RaceEventForSitemap = {
  slug: string
  updatedAt: string
}

type RaceForSitemap = {
  slug: string
  updatedAt: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let events: RaceEventForSitemap[] = []
  let races: RaceForSitemap[] = []

  try {
    // Fetch all events
    const eventsData = await gql<{ raceEvents: RaceEventForSitemap[] }>(
      `
        query EventsForSitemap {
          raceEvents(limit: 1000, skip: 0) {
            slug
            updatedAt
          }
        }
      `,
      {}
    )
    events = eventsData?.raceEvents ?? []

    // Fetch all races
    const racesData = await gql<{ races: RaceForSitemap[] }>(
      `
        query RacesForSitemap {
          races(limit: 1000, skip: 0) {
            slug
            updatedAt
          }
        }
      `,
      {}
    )
    races = racesData?.races ?? []
  } catch (err) {
    // If backend is unavailable during build, return static pages only
    console.warn('[sitemap] Failed to fetch data from API, returning static pages only:', (err as Error).message)
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gpx-analyzer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Event pages
  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Race pages
  const racePages: MetadataRoute.Sitemap = races.map((race) => ({
    url: `${siteUrl}/races/${race.slug}`,
    lastModified: new Date(race.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Note: /races/*/results and /races/*/register are excluded from sitemap.
  // Results pages use client-side noindex when empty; register pages require auth.

  return [...staticPages, ...eventPages, ...racePages]
}
