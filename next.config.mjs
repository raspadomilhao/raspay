/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless']
  },
  env: {
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWw-o18aGEtH5VJyNjhQRFN-JHoOmqKMFoO4Z4NLB5ZBHSd2F6eY8M',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || 'YUKKRJQbFsajiUIhKoH3UiSTXwbvyeNVggGFWSjVTDI'
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
