import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Routes from the earlier per-event booking version of the concept
  redirects() {
    return [
      { source: "/book", destination: "/subscribe", permanent: false },
      { source: "/catalog", destination: "/plans", permanent: false },
    ]
  },
}

export default nextConfig
