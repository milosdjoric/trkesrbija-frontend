'use client'

import {
  defaultData,
  PostInfo,
  PostNajava,
  PostNajave,
  PostRezultati,
  StoryInfo,
  StoryNajava,
  StoryNajave,
  StoryRezultati,
  type NajaveEvent,
  type TemplateData,
  type TemplateFormat,
  type TemplateMode,
} from '@/components/instagram-templates'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const POST_W = 420
const POST_H = 420
const STORY_W = 420
const STORY_H = 747 // 420 * (1920/1080) ≈ 747

function Preview() {
  const sp = useSearchParams()
  const [scale, setScale] = useState(1)

  let mode: TemplateMode = 'najava'
  let format: TemplateFormat = 'post'
  let dark = true
  let data: TemplateData = defaultData
  let najaveEvents: NajaveEvent[] = []

  const encoded = sp.get('d')
  if (encoded) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))))
      mode = decoded.mode ?? 'najava'
      format = decoded.format ?? 'post'
      dark = decoded.dark ?? true
      data = { ...defaultData, ...decoded.data }
      najaveEvents = decoded.najaveEvents ?? []
    } catch {
      // fallback to defaults
    }
  }

  const designW = format === 'story' ? STORY_W : POST_W
  const designH = format === 'story' ? STORY_H : POST_H

  useEffect(() => {
    function calcScale() {
      const scaleX = window.innerWidth / designW
      const scaleY = window.innerHeight / designH
      setScale(Math.min(scaleX, scaleY))
    }
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }, [designW, designH])

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: designW,
          height: designH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      >
        {format === 'post' ? (
          <>
            {mode === 'najava' && <PostNajava data={data.najava} dark={dark} />}
            {mode === 'najave' && <PostNajave data={data.najave} events={najaveEvents} dark={dark} />}
            {mode === 'info' && <PostInfo data={data.info} dark={dark} />}
            {mode === 'rezultati' && <PostRezultati data={data.rezultati} dark={dark} />}
          </>
        ) : (
          <>
            {mode === 'najava' && <StoryNajava data={data.najava} dark={dark} />}
            {mode === 'najave' && <StoryNajave data={data.najave} events={najaveEvents} dark={dark} />}
            {mode === 'info' && <StoryInfo data={data.info} dark={dark} />}
            {mode === 'rezultati' && <StoryRezultati data={data.rezultati} dark={dark} />}
          </>
        )}
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
