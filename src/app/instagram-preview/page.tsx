'use client'

import {
  defaultData,
  PostInfo,
  PostNajava,
  PostNajave,
  PostRezultati,
  type NajaveEvent,
  type TemplateData,
  type TemplateMode,
} from '@/components/instagram-templates'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Preview() {
  const sp = useSearchParams()

  let mode: TemplateMode = 'najava'
  let dark = true
  let data: TemplateData = defaultData
  let najaveEvents: NajaveEvent[] = []

  const encoded = sp.get('d')
  if (encoded) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))))
      mode = decoded.mode ?? 'najava'
      dark = decoded.dark ?? true
      data = { ...defaultData, ...decoded.data }
      najaveEvents = decoded.najaveEvents ?? []
    } catch {
      // fallback to defaults
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <div
        style={{
          width: '100vmin',
          height: '100vmin',
        }}
      >
        {mode === 'najava' && <PostNajava data={data.najava} dark={dark} />}
        {mode === 'najave' && <PostNajave data={data.najave} events={najaveEvents} dark={dark} />}
        {mode === 'info' && <PostInfo data={data.info} dark={dark} />}
        {mode === 'rezultati' && <PostRezultati data={data.rezultati} dark={dark} />}
      </div>
    </div>
  )
}

export default function InstagramPreviewPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff' }}>
          Ucitavanje...
        </div>
      }
    >
      <Preview />
    </Suspense>
  )
}
