/**
 * Base URL backend Gin.
 *
 * PENTING (kluster k8s): pod FE TIDAK bisa resolve host publik ingress
 * (mis. `getaddrinfo ENOTFOUND har.pusri.dev`). Jadi:
 *  - Browser  -> URL PUBLIK (lewat ingress): NEXT_PUBLIC_API_URL.
 *  - Server (SSR / server action) -> URL INTERNAL cluster (nama Service k8s):
 *    API_URL_INTERNAL, fallback API_URL, fallback publik.
 *
 * Set `API_URL_INTERNAL` di runtime deployment ke Service BE, mis.
 * `http://idle-backend:8080` (tanpa perlu rebuild; bukan NEXT_PUBLIC).
 */
const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://har.pusri.dev/idle/air";

const INTERNAL_API_URL =
  process.env.API_URL_INTERNAL || process.env.API_URL || PUBLIC_API_URL;

export const API_URL =
  typeof window === "undefined" ? INTERNAL_API_URL : PUBLIC_API_URL;

// Diekspor terpisah untuk keperluan diagnostik (/diag) — melihat kedua nilai
// tanpa bergantung pada konteks eksekusi.
export const API_URL_PUBLIC = PUBLIC_API_URL;
export const API_URL_INTERNAL = INTERNAL_API_URL;
