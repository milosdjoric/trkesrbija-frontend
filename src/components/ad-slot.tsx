'use client'

import { gql } from '@/app/lib/api'
import { useEffect, useState } from 'react'

type AdPlacement =
  | 'HERO_BANNER'
  | 'IN_FEED'
  | 'EVENT_SIDEBAR'
  | 'RESULTS_BANNER'
  | 'CALENDAR_SIDEBAR'
  | 'FOOTER_BANNER'

type Ad = {
  id: string
  title: string
  tier: string
  imageUrl: string
  linkUrl: string
  altText: string | null
}

const ACTIVE_ADS_QUERY = `
  query ActiveAdsForPlacement($placement: AdPlacement!) {
    activeAdsForPlacement(placement: $placement) {
      id
      title
      tier
      imageUrl
      linkUrl
      altText
    }
  }
`

const RECORD_IMPRESSION_MUTATION = `
  mutation RecordAdImpression($adId: ID!) {
    recordAdImpression(adId: $adId)
  }
`

const RECORD_CLICK_MUTATION = `
  mutation RecordAdClick($adId: ID!) {
    recordAdClick(adId: $adId)
  }
`

// Aspect ratios and sizing per placement
// AdSense-compatible dimensions (IAB standard sizes)
const PLACEMENT_STYLES: Record<AdPlacement, string> = {
  HERO_BANNER: 'w-full max-w-[970px] max-h-[250px]',      // Billboard 970×250
  IN_FEED: 'w-full max-w-[728px] max-h-[90px]',            // Leaderboard 728×90
  EVENT_SIDEBAR: 'w-full max-w-[300px] max-h-[250px]',     // Medium Rectangle 300×250
  RESULTS_BANNER: 'w-full max-w-[728px] max-h-[90px]',     // Leaderboard 728×90
  CALENDAR_SIDEBAR: 'w-full max-w-[728px] max-h-[90px]',   // Leaderboard 728×90
  FOOTER_BANNER: 'w-full max-w-[728px] max-h-[90px]',      // Leaderboard 728×90
}

export function AdSlot({
  placement,
  className = '',
  style,
}: {
  placement: AdPlacement
  className?: string
  style?: 'default' | 'wide'
}) {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    let cancelled = false

    gql<{ activeAdsForPlacement: Ad[] }>(ACTIVE_ADS_QUERY, { placement })
      .then((data) => {
        if (cancelled) return
        const ads = data.activeAdsForPlacement
        if (ads.length === 0) return

        // Weighted random selection — higher tier = more impressions
        const TIER_WEIGHTS: Record<string, number> = { GOLD: 3, SILVER: 2, BRONZE: 1 }
        const weighted = ads.flatMap((a) => Array(TIER_WEIGHTS[a.tier] ?? 1).fill(a))
        const picked = weighted[Math.floor(Math.random() * weighted.length)]
        setAd(picked)

        // Record impression
        gql(RECORD_IMPRESSION_MUTATION, { adId: picked.id }).catch(() => {})
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [placement])

  if (!ad) return null

  const handleClick = () => {
    gql(RECORD_CLICK_MUTATION, { adId: ad.id }).catch(() => {})
  }

  return (
    <div className={`ad-slot ${className}`}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block overflow-hidden rounded-lg"
      >
        <img
          src={ad.imageUrl}
          alt={ad.altText || ad.title}
          className={`${style === 'wide' ? 'w-full max-w-[728px] max-h-[90px]' : PLACEMENT_STYLES[placement]} mx-auto object-cover`}
        />
      </a>
      <span className="mt-1 block text-center text-[10px] text-text-secondary opacity-50">Oglas</span>
    </div>
  )
}
