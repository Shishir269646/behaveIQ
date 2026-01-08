/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_ML_API_BASE_URL: process.env.NEXT_PUBLIC_ML_API_BASE_URL || 'http://localhost:8000/ml/v1',
    NEXT_PUBLIC_SDK_URL: process.env.NEXT_PUBLIC_SDK_URL,
  },
  images: {
    domains: ['cdn.behaveiq.com'],
  },
}

export default nextConfig;