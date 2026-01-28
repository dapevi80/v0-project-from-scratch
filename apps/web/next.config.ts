import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Redirigir CTAs a la app principal
  async redirects() {
    return [
      {
        source: '/cotizar',
        destination: process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecorrieron.mx',
        permanent: false,
      },
      {
        source: '/acceso',
        destination: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecorrieron.mx'}/acceso`,
        permanent: false,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
