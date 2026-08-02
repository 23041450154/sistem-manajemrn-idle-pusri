import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.testing.naufal.me'}/uploads/:path*`, 
      },
    ]
  },
};

export default nextConfig;
