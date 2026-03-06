const GREEN = '#4ade80'
const GREEN_BRAND = '#22c55e'

function LogoBadge({ sub, dark }: { sub: string; dark: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 10, border: `1px solid ${dark ? '#ffffff12' : '#00000012'}` }}>
        <rect width="64" height="64" rx="14" fill={dark ? '#111' : '#fff'} />
        <circle cx="32" cy="32" r="18" fill="none" stroke={dark ? '#222' : '#e5e7eb'} strokeWidth="7" />
        <path d="M32 14 A18 18 0 1 1 14 32" fill="none" stroke={GREEN_BRAND} strokeWidth="7" strokeLinecap="round" />
        <circle cx="32" cy="14" r="4.5" fill={GREEN_BRAND} />
        <circle cx="14" cy="32" r="4.5" fill={GREEN_BRAND} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <span style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.01em', color: GREEN }}>trke</span>
        <span style={{ fontSize: 31, fontWeight: 300, color: sub }}>srbija</span>
      </div>
    </div>
  )
}

export type TemplateMode = 'najava' | 'najave' | 'info' | 'rezultati'

export type NajaveEvent = {
  naziv: string
  datum: string
  distance: string
}

export const defaultData = {
  najava: {
    naziv: 'Niski Polumaraton',
    datum: '15. jun 2025.',
    mesto: 'Nis, Srbija',
    distanca: '21.1 km',
    cta: 'Prijavi se na trkesrbija.rs',
  },
  najave: {
    naslov: 'Predstojeće trke',
    cta: 'Više informacija na trkesrbija.rs',
  },
  info: {
    naziv: 'Fruska Gora Trail',
    distanca: '42 km',
    visina: '1.200 m D+',
    start: '07:00h — Centar Iriga',
    rok: 'Prijave do 10. maja',
  },
  rezultati: {
    naziv: 'Beogradski Maraton',
    datum: '4. april 2025.',
    prvak: 'Marko Nikolic',
    vreme: '2:28:14',
    top2: 'Jovan Petrovic — 2:31:05',
    top3: 'Stefan Djordic — 2:33:44',
  },
}

export type TemplateData = typeof defaultData

export const fieldConfig: Record<TemplateMode, Array<{ key: string; label: string }>> = {
  najava: [
    { key: 'naziv', label: 'Naziv trke' },
    { key: 'datum', label: 'Datum' },
    { key: 'mesto', label: 'Mesto' },
    { key: 'distanca', label: 'Distanca' },
    { key: 'cta', label: 'Poziv na akciju (CTA)' },
  ],
  najave: [
    { key: 'naslov', label: 'Naslov' },
    { key: 'cta', label: 'Poziv na akciju (CTA)' },
  ],
  info: [
    { key: 'naziv', label: 'Naziv trke' },
    { key: 'distanca', label: 'Distanca' },
    { key: 'visina', label: 'Visinska razlika' },
    { key: 'start', label: 'Start' },
    { key: 'rok', label: 'Rok za prijave' },
  ],
  rezultati: [
    { key: 'naziv', label: 'Naziv trke' },
    { key: 'datum', label: 'Datum trke' },
    { key: 'prvak', label: 'Pobednik' },
    { key: 'vreme', label: 'Vreme pobednika' },
    { key: 'top2', label: '2. mesto' },
    { key: 'top3', label: '3. mesto' },
  ],
}

// ── Shared styles ───────────────────────────────────────────────────────────

const outerStyle = (bg: string, padding = 32): React.CSSProperties => ({
  width: '100%',
  height: '100%',
  background: bg,
  fontFamily: 'Urbanist, sans-serif',
  display: 'flex',
  flexDirection: 'column',
  padding,
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
})

// ── Zone Components ─────────────────────────────────────────────────────────

function TemplateHeader({ badge, sub, dark }: { badge: string; sub: string; dark: boolean }) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <LogoBadge sub={sub} dark={dark} />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: `${GREEN}18`,
          border: `1px solid ${GREEN}40`,
          borderRadius: 20,
          padding: '4px 12px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {badge}
        </span>
      </div>
    </div>
  )
}

function TemplateTitle({ title, subtitle, text, sub }: { title: string; text: string; sub: string; subtitle?: string }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: text, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>{subtitle}</div>}
    </div>
  )
}

function TemplateContent({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', minHeight: 0 }}>
      {children}
    </div>
  )
}

function TemplateFooter({ cta }: { cta: string }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ background: GREEN, borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a', letterSpacing: '0.02em' }}>{cta}</div>
      </div>
    </div>
  )
}

function TemplateGlow() {
  return (
    <div
      style={{
        position: 'absolute',
        right: -80,
        top: -80,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${GREEN}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Post Templates ──────────────────────────────────────────────────────────

export function PostNajava({ data, dark }: { data: TemplateData['najava']; dark: boolean }) {
  const bg = dark ? '#0a0a0a' : '#f8f9f4'
  const text = dark ? '#f0f0f0' : '#111'
  const sub = dark ? '#aaa' : '#555'
  const cardBg = dark ? '#141414' : '#fff'
  const border = dark ? '#1f1f1f' : '#e8ede0'

  return (
    <div style={outerStyle(bg, 36)}>
      <TemplateGlow />

      <TemplateHeader badge="Najava trke" sub={sub} dark={dark} />
      <TemplateTitle title={data.naziv} text={text} sub={sub} />

      <TemplateContent>
        {[
          { icon: '📅', label: 'Datum', val: data.datum },
          { icon: '📍', val: data.mesto },
          { icon: '📏', val: data.distanca },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <div>
              {item.label && (
                <div
                  style={{
                    fontSize: 10,
                    color: GREEN,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 600, color: text }}>{item.val}</div>
            </div>
          </div>
        ))}
      </TemplateContent>

      <TemplateFooter cta={data.cta} />
    </div>
  )
}

export function PostInfo({ data, dark }: { data: TemplateData['info']; dark: boolean }) {
  const bg = dark ? '#0a0a0a' : '#f8f9f4'
  const text = dark ? '#f0f0f0' : '#111'
  const sub = dark ? '#888' : '#666'
  const cardBg = dark ? '#141414' : '#fff'
  const border = dark ? '#1f1f1f' : '#e8ede0'

  return (
    <div style={outerStyle(bg, 36)}>
      <TemplateGlow />

      <TemplateHeader badge="Info trke" sub={sub} dark={dark} />
      <TemplateTitle title={data.naziv} subtitle="Sve sto trebas da znas" text={text} sub={sub} />

      <TemplateContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '📏', label: 'Distanca', val: data.distanca },
            { icon: '⛰️', label: 'Visinska razlika', val: data.visina },
          ].map((item, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 10,
                  color: GREEN,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: text }}>{item.val}</div>
            </div>
          ))}
        </div>

        {[
          { icon: '🕐', label: 'Start', val: data.start },
          { icon: '⏰', label: 'Prijave', val: data.rok },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: GREEN,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{item.val}</div>
            </div>
          </div>
        ))}
      </TemplateContent>
    </div>
  )
}

export function PostRezultati({ data, dark }: { data: TemplateData['rezultati']; dark: boolean }) {
  const bg = dark ? '#0a0a0a' : '#f8f9f4'
  const text = dark ? '#f0f0f0' : '#111'
  const sub = dark ? '#888' : '#666'
  const cardBg = dark ? '#141414' : '#fff'
  const border = dark ? '#1f1f1f' : '#e8ede0'

  return (
    <div style={outerStyle(bg, 36)}>
      <TemplateGlow />

      <TemplateHeader badge="Rezultati trke" sub={sub} dark={dark} />
      <TemplateTitle title={data.naziv} subtitle={data.datum} text={text} sub={sub} />

      <TemplateContent>
        <div
          style={{
            background: `linear-gradient(135deg, ${GREEN}22, ${GREEN}08)`,
            border: `1px solid ${GREEN}50`,
            borderRadius: 10,
            padding: '14px 14px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, fontSize: 80, opacity: 0.08, lineHeight: 1 }}>
            🥇
          </div>
          <div
            style={{
              fontSize: 10,
              color: GREEN,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            🥇 Pobednik
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: text, marginBottom: 2 }}>{data.prvak}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: GREEN, letterSpacing: '-0.02em' }}>{data.vreme}</div>
        </div>

        {[
          { medal: '🥈', val: data.top2 },
          { medal: '🥉', val: data.top3 },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.medal}</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{item.val}</div>
          </div>
        ))}
      </TemplateContent>
    </div>
  )
}

export function PostNajave({
  data,
  events,
  dark,
}: {
  data: TemplateData['najave']
  events: NajaveEvent[]
  dark: boolean
}) {
  const bg = dark ? '#0a0a0a' : '#f8f9f4'
  const text = dark ? '#f0f0f0' : '#111'
  const sub = dark ? '#888' : '#666'
  const cardBg = dark ? '#141414' : '#fff'
  const border = dark ? '#1f1f1f' : '#e8ede0'

  return (
    <div style={outerStyle(bg, 36)}>
      <TemplateGlow />

      <TemplateHeader badge="Najave trka" sub={sub} dark={dark} />
      <TemplateTitle title={data.naslov} text={text} sub={sub} />

      <TemplateContent>
        {events.map((ev, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div
              style={{
                width: 3,
                alignSelf: 'stretch',
                borderRadius: 2,
                background: GREEN,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.2 }}>{ev.naziv}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: sub }}>{ev.datum}</span>
                <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>{ev.distance}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div style={{ fontSize: 13, color: sub, fontStyle: 'italic', padding: '8px 0' }}>
            Izaberi dogadjaje sa leve strane
          </div>
        )}
      </TemplateContent>

      <TemplateFooter cta={data.cta} />
    </div>
  )
}
