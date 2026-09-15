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

// Prefix path deploy di belakang reverse proxy (pass-through, TIDAK strip /idle).
//
// PENTING: next.config dibaca saat BUILD *dan* saat `next start`. basePath harus
// SAMA di kedua fase. Kalau hanya di-set saat build (aset ter-bake /idle) tapi
// hilang saat runtime, server melayani di root -> /idle/* jadi 404.
// Karena itu default-nya "/idle" bila NEXT_PUBLIC_BASE_URL tidak diset sama
// sekali (kasus runtime yang env-nya hilang). String kosong yang DI-SET secara
// eksplisit tetap dihormati (deploy di root). Override lewat env kapan pun perlu.
// HARUS SAMA PERSIS dengan src/lib/base-path.ts (next.config tidak bisa
// meng-import modul dari src). Kalau rumus di sini diubah, ubah juga di sana.
const RAW_BASE_PATH =
  process.env.NEXT_PUBLIC_BASE_URL ?? "/idle"; // undefined -> default /idle; "" -> root
const basePath = RAW_BASE_PATH.trim()
  .replace(/\/+$/, "")
  .replace(/^([^/])/, "/$1");

// Server Actions (loginAction/logoutAction dll) diproteksi CSRF: Next menolak
// bila Origin request != host. Di belakang reverse proxy, host yang dilihat Next
// bisa BEDA dari domain browser -> "Invalid Server Actions request" -> login
// gagal total. Daftarkan domain yang dipakai browser di sini (tak perlu ubah
// proxy). Override via env SERVER_ACTIONS_ALLOWED_ORIGINS (dipisah koma).
const allowedOrigins = (
  process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ??
  "har.pusri.dev,*.pusri.dev,*.pusri.co.id,*.pusri.id"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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
      allowedOrigins,
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
