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

// Deploy di belakang reverse proxy: origin (scheme://host) disediakan platform,
// aplikasi hanya perlu tahu prefix path-nya. Wajib di-set saat BUILD (di-inline
// ke bundle client), bukan saat runtime. Kosong = served dari root.
const basePath = (process.env.NEXT_PUBLIC_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/^([^/])/, "/$1");

const nextConfig: NextConfig = {
  basePath,
  // CATATAN: redirect "/" -> basePath DIHAPUS. Di produksi, reverse proxy
  // men-strip prefix "/idle" sebelum meneruskan ke Next, sehingga Next selalu
  // menerima "/". Redirect "/" -> "/idle" akan di-strip proxy jadi "/" lagi ->
  // ERR_TOO_MANY_REDIRECTS. Root "/" cukup dilayani page.tsx (arahkan ke
  // /login atau dashboard sesuai sesi).
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
