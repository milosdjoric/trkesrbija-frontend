const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trkesrbija.rs'

// Organization schema for the main website
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Trke Srbija',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'Kalendar trail i uličnih trka u Srbiji. Pronađite trke, prijavite se online, pratite rezultate i GPX rute.',
    sameAs: [
      // Dodaj društvene mreže kada ih budeš imao
      // 'https://www.facebook.com/trkesrbija',
      // 'https://www.instagram.com/trkesrbija',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Website schema with search action for sitelinks search box
export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Trke Srbija',
    url: siteUrl,
    description: 'Kalendar trail i uličnih trka u Srbiji',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/events?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// SiteNavigationElement for main navigation links - helps with sitelinks
export function SiteNavigationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'Lista trka',
        description: 'Pogledajte sve predstojeće trail i ulične trke u Srbiji',
        url: `${siteUrl}/events`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'Kalendar',
        description: 'Pregledajte trke u kalendarskom prikazu',
        url: `${siteUrl}/calendar`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 3,
        name: 'GPX Analyzer',
        description: 'Analizirajte GPX fajlove i rute trka',
        url: `${siteUrl}/gpx-analyzer`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 4,
        name: 'Prijava',
        description: 'Prijavite se na svoj nalog',
        url: `${siteUrl}/login`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Event schema for individual race events
type EventJsonLdProps = {
  name: string
  description?: string
  startDate: string
  endDate?: string
  location: string
  url: string
  image?: string
  organizer?: string
}

export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location,
  url,
  image,
  organizer,
}: EventJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    description: description ?? `${name} - trail/ulična trka u Srbiji`,
    startDate,
    endDate: endDate ?? startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'RS',
        addressLocality: location,
      },
    },
    url,
    image: image ?? `${siteUrl}/og-image.png`,
    organizer: organizer
      ? {
          '@type': 'Organization',
          name: organizer,
        }
      : {
          '@type': 'Organization',
          name: 'Trke Srbija',
          url: siteUrl,
        },
    sport: 'Running',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// BreadcrumbList schema for navigation
type BreadcrumbItem = {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
