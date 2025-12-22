/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SDK_URL: process.env.NEXT_PUBLIC_SDK_URL,
  },
  images: {
    domains: ['cdn.behaveiq.com'],
  },
}

export default nextConfig;