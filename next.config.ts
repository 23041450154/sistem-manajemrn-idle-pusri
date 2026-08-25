import type { NextConfig } from "next";

// Host backend untuk images.remotePatterns (foto attachment /uploads).
function apiUrlFromEnv(): URL {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        "https://api.testing.naufal.me",
    );
  } catch {
    // Env ada tapi bukan URL valid -> pakai default.
    return new URL("https://api.testing.naufal.me");
  }
}

const apiUrl = apiUrlFromEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        pathname: "/uploads/**",
      },
    ],
  },
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.testing.naufal.me"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
