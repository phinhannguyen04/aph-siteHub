import type { NextConfig } from 'next'

const target =
  process.env.SITEHUB_DEV_API_TARGET ?? `http://localhost:${process.env.API_PORT ?? 3000}`
const config: NextConfig = {
  poweredByHeader: false,
  // The container image sets NEXT_OUTPUT=standalone; local `next start` keeps the default output.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/health', destination: `${target}/health` },
    ]
  },
}
// Next 16+ does not run ESLint during build; Biome owns linting.
export default config
