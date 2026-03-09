'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

// Routes excluded from analytics tracking
const EXCLUDED_PREFIXES = ['/admin', '/judge', '/instagram-preview']

export function GoogleTagManager() {
  const pathname = usePathname()
  if (!GTM_ID) return null
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  )
}

export function GoogleTagManagerNoScript() {
  const pathname = usePathname()
  if (!GTM_ID) return null
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
