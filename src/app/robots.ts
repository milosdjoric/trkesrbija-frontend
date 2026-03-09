import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trkesrbija.rs'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/judge/', '/my-registrations/', '/favorites/', '/settings/', '/training/', '/instagram-preview/', '/races/*/results', '/races/*/register'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
