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
        {/* Logo icon — open circle with gap at top-right */}
        <svg width="72" height="72" viewBox="0 0 100 100" style={{ marginBottom: 20 }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#00D084" strokeWidth="10" strokeLinecap="round" strokeDasharray="210" strokeDashoffset="30" transform="rotate(-90 50 50)" />
        </svg>

        {/* Brand name */}
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 800, letterSpacing: '-1px' }}>
          <span style={{ color: '#00D084' }}>trke</span>
          <span style={{ color: '#ffffff' }}>srbija</span>
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
