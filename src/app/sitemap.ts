import type { MetadataRoute } from 'next'
import { gql } from '@/app/lib/api'

// Force dynamic rendering - sitemap fetches data from API
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

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

  const events = eventsData?.raceEvents ?? []
  const races = racesData?.races ?? []

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

  // Race results pages
  const resultPages: MetadataRoute.Sitemap = races.map((race) => ({
    url: `${siteUrl}/races/${race.slug}/results`,
    lastModified: new Date(race.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...eventPages, ...racePages, ...resultPages]
}
