import { spawnSync } from 'node:child_process'
import withSerwistInit from '@serwist/next'

const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ?? crypto.randomUUID()

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/orders/:slug',
        destination: '/',
        permanent: false,
      },
      {
        source: '/orders',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default withSerwist(nextConfig)
