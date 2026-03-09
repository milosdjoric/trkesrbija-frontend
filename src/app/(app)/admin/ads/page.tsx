'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { ImageUpload } from '@/components/image-upload'
import { Input } from '@/components/input'
import { LoadingState } from '@/components/loading-state'
import { Select } from '@/components/select'
import { useToast } from '@/components/toast'
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useCallback, useEffect, useState } from 'react'

// ============================================================================
// Types
// ============================================================================

type AdTier = 'GOLD' | 'SILVER' | 'BRONZE'
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
  tier: AdTier
  imageUrl: string
  linkUrl: string
  altText: string | null
  isActive: boolean
  startDate: string
  endDate: string
  placements: AdPlacement[]
  clicks: number
  impressions: number
  createdAt: string
}

const TIER_LABELS: Record<AdTier, string> = {
  GOLD: 'Zlatni',
  SILVER: 'Srebrni',
  BRONZE: 'Bronzani',
}

const TIER_COLORS: Record<AdTier, 'yellow' | 'zinc' | 'amber'> = {
  GOLD: 'yellow',
  SILVER: 'zinc',
  BRONZE: 'amber',
}

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  HERO_BANNER: 'Hero baner',
  IN_FEED: 'In-feed kartica',
  EVENT_SIDEBAR: 'Event sidebar',
  RESULTS_BANNER: 'Rezultati baner',
  CALENDAR_SIDEBAR: 'Kalendar sidebar',
  FOOTER_BANNER: 'Footer baner',
}

const ALL_PLACEMENTS: AdPlacement[] = [
  'HERO_BANNER',
  'IN_FEED',
  'EVENT_SIDEBAR',
  'RESULTS_BANNER',
  'CALENDAR_SIDEBAR',
  'FOOTER_BANNER',
]

const TIER_DEFAULT_PLACEMENTS: Record<AdTier, AdPlacement[]> = {
  GOLD: ['HERO_BANNER', 'IN_FEED', 'EVENT_SIDEBAR', 'RESULTS_BANNER', 'CALENDAR_SIDEBAR', 'FOOTER_BANNER'],
  SILVER: ['IN_FEED', 'EVENT_SIDEBAR', 'RESULTS_BANNER', 'FOOTER_BANNER'],
  BRONZE: ['RESULTS_BANNER', 'CALENDAR_SIDEBAR', 'FOOTER_BANNER'],
}

// ============================================================================
// GraphQL
// ============================================================================

const ADS_QUERY = `
  query Ads($isActive: Boolean) {
    ads(isActive: $isActive) {
      id title tier imageUrl linkUrl altText isActive
      startDate endDate placements clicks impressions createdAt
    }
  }
`

const CREATE_AD_MUTATION = `
  mutation CreateAd($input: CreateAdInput!) {
    createAd(input: $input) {
      id title tier
    }
  }
`

const UPDATE_AD_MUTATION = `
  mutation UpdateAd($id: ID!, $input: UpdateAdInput!) {
    updateAd(id: $id, input: $input) {
      id title tier imageUrl linkUrl altText isActive
      startDate endDate placements clicks impressions createdAt
    }
  }
`

const DELETE_AD_MUTATION = `
  mutation DeleteAd($id: ID!) {
    deleteAd(id: $id)
  }
`

// ============================================================================
// Component
// ============================================================================

type FormData = {
  title: string
  tier: AdTier
  imageUrl: string
  linkUrl: string
  altText: string
  startDate: string
  endDate: string
  placements: AdPlacement[]
}

const emptyForm: FormData = {
  title: '',
  tier: 'GOLD',
  imageUrl: '',
  linkUrl: '',
  altText: '',
  startDate: '',
  endDate: '',
  placements: TIER_DEFAULT_PLACEMENTS.GOLD,
}

export default function AdminAdsPage() {
  const { accessToken } = useAuth()
  const { toast } = useToast()

  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<string>('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadAds = useCallback(async () => {
    if (!accessToken) return
    try {
      const isActive = filterActive === '' ? undefined : filterActive === 'true'
      const data = await gql<{ ads: Ad[] }>(ADS_QUERY, { isActive }, { accessToken })
      setAds(data.ads ?? [])
    } catch (err) {
      console.error('Failed to load ads:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken, filterActive])

  useEffect(() => {
    if (accessToken) loadAds()
  }, [accessToken, loadAds])

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(ad: Ad) {
    setEditingId(ad.id)
    setForm({
      title: ad.title,
      tier: ad.tier,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      altText: ad.altText || '',
      startDate: ad.startDate.slice(0, 10),
      endDate: ad.endDate.slice(0, 10),
      placements: ad.placements,
    })
    setShowForm(true)
  }

  function handleTierChange(tier: AdTier) {
    setForm((prev) => ({
      ...prev,
      tier,
      placements: TIER_DEFAULT_PLACEMENTS[tier],
    }))
  }

  function togglePlacement(p: AdPlacement) {
    setForm((prev) => ({
      ...prev,
      placements: prev.placements.includes(p)
        ? prev.placements.filter((x) => x !== p)
        : [...prev.placements, p],
    }))
  }

  async function handleSave() {
    if (!form.title || !form.imageUrl || !form.linkUrl || !form.startDate || !form.endDate) {
      toast('Popunite sva obavezna polja', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const data = await gql<{ updateAd: Ad }>(
          UPDATE_AD_MUTATION,
          {
            id: editingId,
            input: {
              title: form.title,
              tier: form.tier,
              imageUrl: form.imageUrl,
              linkUrl: form.linkUrl,
              altText: form.altText || null,
              startDate: new Date(form.startDate).toISOString(),
              endDate: new Date(form.endDate).toISOString(),
              placements: form.placements,
            },
          },
          { accessToken }
        )
        setAds((prev) => prev.map((a) => (a.id === editingId ? data.updateAd : a)))
        toast('Oglas ažuriran', 'success')
      } else {
        await gql(
          CREATE_AD_MUTATION,
          {
            input: {
              title: form.title,
              tier: form.tier,
              imageUrl: form.imageUrl,
              linkUrl: form.linkUrl,
              altText: form.altText || null,
              startDate: new Date(form.startDate).toISOString(),
              endDate: new Date(form.endDate).toISOString(),
              placements: form.placements,
            },
          },
          { accessToken }
        )
        toast('Oglas kreiran', 'success')
        setLoading(true)
        loadAds()
      }
      setShowForm(false)
    } catch (err: any) {
      toast(err?.message ?? 'Greška', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj oglas?')) return
    try {
      await gql(DELETE_AD_MUTATION, { id }, { accessToken })
      setAds((prev) => prev.filter((a) => a.id !== id))
      toast('Oglas obrisan', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška', 'error')
    }
  }

  async function handleToggleActive(ad: Ad) {
    try {
      const data = await gql<{ updateAd: Ad }>(
        UPDATE_AD_MUTATION,
        { id: ad.id, input: { isActive: !ad.isActive } },
        { accessToken }
      )
      setAds((prev) => prev.map((a) => (a.id === ad.id ? data.updateAd : a)))
      toast(data.updateAd.isActive ? 'Oglas aktiviran' : 'Oglas deaktiviran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška', 'error')
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Belgrade',
    })
  }

  function getStatus(ad: Ad): { label: string; color: 'green' | 'amber' | 'zinc' | 'red' } {
    if (!ad.isActive) return { label: 'Neaktivan', color: 'zinc' }
    const now = new Date()
    const start = new Date(ad.startDate)
    const end = new Date(ad.endDate)
    if (now < start) return { label: 'Zakazan', color: 'amber' }
    if (now > end) return { label: 'Istekao', color: 'red' }
    return { label: 'Aktivan', color: 'green' }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Oglasi</Heading>
          <p className="mt-1 text-sm text-text-secondary">
            {ads.length} {ads.length === 1 ? 'oglas' : 'oglasa'} ukupno
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <PlusIcon className="size-4" />
          Novi oglas
        </Button>
      </div>

      {/* Filter */}
      <div className="mt-4">
        <Select
          value={filterActive}
          onChange={(e) => {
            setFilterActive(e.target.value)
            setLoading(true)
          }}
        >
          <option value="">Svi oglasi</option>
          <option value="true">Aktivni</option>
          <option value="false">Neaktivni</option>
        </Select>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mt-6 rounded-lg border border-border-primary bg-card p-6">
          <h3 className="text-lg font-semibold text-text-primary">
            {editingId ? 'Izmeni oglas' : 'Novi oglas'}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Naziv *</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Interni naziv oglasa" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Paket *</label>
              <Select value={form.tier} onChange={(e) => handleTierChange(e.target.value as AdTier)}>
                <option value="GOLD">Zlatni</option>
                <option value="SILVER">Srebrni</option>
                <option value="BRONZE">Bronzani</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Početak *</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Kraj *</label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">Link destinacija *</label>
              <Input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">Alt tekst</label>
              <Input value={form.altText} onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))} placeholder="Opis slike za pristupačnost" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                value={form.imageUrl || null}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url || '' }))}
                endpoint="adImage"
                label="Slika oglasa *"
                description="Prevuci sliku ovde ili klikni za izbor (max 4MB)"
              />
            </div>
          </div>

          {/* Placements */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-text-primary">Pozicije</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLACEMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlacement(p)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.placements.includes(p)
                      ? 'bg-brand-green text-white'
                      : 'bg-surface text-text-secondary hover:bg-card-hover'
                  }`}
                >
                  {PLACEMENT_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Čuvam...' : editingId ? 'Sačuvaj izmene' : 'Kreiraj oglas'}
            </Button>
            <Button plain onClick={() => setShowForm(false)}>
              Otkaži
            </Button>
          </div>
        </div>
      )}

      {/* Ads List */}
      <div className="mt-6 space-y-4">
        {ads.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Nema oglasa</p>
        ) : (
          ads.map((ad) => {
            const status = getStatus(ad)
            const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0'

            return (
              <div key={ad.id} className="rounded-lg border border-border-primary bg-card p-4">
                <div className="flex gap-4">
                  {/* Preview */}
                  <div className="hidden shrink-0 sm:block">
                    <img src={ad.imageUrl} alt={ad.altText || ad.title} className="h-20 w-32 rounded-md object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-primary">{ad.title}</span>
                      <Badge color={TIER_COLORS[ad.tier]}>{TIER_LABELS[ad.tier]}</Badge>
                      <Badge color={status.color}>{status.label}</Badge>
                    </div>

                    <div className="mt-1 text-xs text-text-secondary">
                      {formatDate(ad.startDate)} — {formatDate(ad.endDate)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {ad.placements.map((p) => (
                        <span key={p} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-text-secondary">
                          {PLACEMENT_LABELS[p]}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-4 text-xs text-text-secondary">
                      <span>{ad.impressions.toLocaleString()} prikaza</span>
                      <span>{ad.clicks.toLocaleString()} klikova</span>
                      <span>CTR: {ctr}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-start gap-2">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium ${
                        ad.isActive
                          ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      }`}
                    >
                      {ad.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                    </button>
                    <button
                      onClick={() => openEditForm(ad)}
                      className="cursor-pointer rounded-lg bg-surface p-1.5 text-text-secondary hover:bg-card-hover"
                    >
                      <PencilIcon className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="cursor-pointer rounded-lg bg-surface p-1.5 text-red-400 hover:bg-red-900/20"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
