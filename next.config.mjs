/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Increase memory limit for builds
    workerThreads: false,
    cpus: 1,
  },
}

export default nextConfig
