import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow backend API calls — no rewrites needed since we use NEXT_PUBLIC_API_URL
  experimental: {},
  // Silence the d3 ESM warning
  transpilePackages: [],
}

export default nextConfig
