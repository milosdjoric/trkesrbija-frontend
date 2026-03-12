/**
 * Script to generate OG image for Trke Srbija
 * Run: npx tsx scripts/generate-og-image.tsx
 */
import React from 'react'
import { ImageResponse } from 'next/og'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function generate() {
  const image = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a2e1a 0%, #1c1c1c 30%, #1c1c1c 70%, #1a2e1a 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo icon — matching icon.svg: arc with dots */}
        <svg width="80" height="80" viewBox="0 0 64 64" style={{ marginBottom: 20 }}>
          {/* Background ring */}
          <circle cx="32" cy="32" r="18" fill="none" stroke="#333" strokeWidth="7" />
          {/* Green arc: 270° from top to left */}
          <path d="M32 14 A18 18 0 1 1 14 32" fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" />
          {/* Dot at start (top) */}
          <circle cx="32" cy="14" r="4.5" fill="#22c55e" />
          {/* Dot at end (left) */}
          <circle cx="14" cy="32" r="4.5" fill="#22c55e" />
        </svg>

        {/* Brand name — trke: extrabold, srbija: light */}
        <div style={{ display: 'flex', fontSize: 62, letterSpacing: '-1px' }}>
          <span style={{ color: '#00D084', fontWeight: 900 }}>trke</span>
          <span style={{ color: '#9ca3af', fontWeight: 300 }}>srbija</span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 28, fontWeight: 500, color: '#d1d5db', marginTop: 16 }}>
          Trail, ulične i OCR trke u Srbiji i regionu
        </div>

        {/* Divider */}
        <div style={{ width: 80, height: 3, background: '#00D084', marginTop: 24, borderRadius: 2 }} />

        {/* Features */}
        <div style={{ fontSize: 22, fontWeight: 500, color: '#9ca3af', marginTop: 24, display: 'flex', gap: 16 }}>
          <span>Kalendar</span>
          <span>·</span>
          <span>Prijave</span>
          <span>·</span>
          <span>Rezultati</span>
          <span>·</span>
          <span>GPX Analyzer</span>
          <span>·</span>
          <span>Lige</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )

  const buffer = Buffer.from(await image.arrayBuffer())
  const outPath = join(process.cwd(), 'public', 'og-image-v3.png')
  writeFileSync(outPath, buffer)
  console.log(`✅ OG image saved to ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`)
}

generate().catch(console.error)
