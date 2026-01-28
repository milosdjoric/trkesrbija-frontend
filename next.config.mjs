/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/events/:slug',
        destination: '/',
        permanent: false,
      },
      {
        source: '/events',
        destination: '/',
        permanent: false,
      },
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

export default nextConfig
