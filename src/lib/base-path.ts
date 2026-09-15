/**
 * SATU SUMBER KEBENARAN basePath deployment (reverse proxy pass-through).
 *
 * Deploy prod: https://har.pusri.dev/idle  -> basePath "/idle".
 * Proxy TIDAK men-strip prefix, jadi Next harus melayani di /idle dan semua
 * URL yang dibuat manual harus ikut di-prefix.
 *
 * Default "/idle" dipakai bila NEXT_PUBLIC_BASE_URL tidak diset SAMA SEKALI,
 * supaya nilai saat build dan saat runtime tidak pernah berbeda (perbedaan
 * itulah yang bikin /idle/* jadi 404). String kosong yang di-set EKSPLISIT
 * tetap dihormati (deploy di root).
 *
 * PENTING: next.config.ts menghitung nilai yang sama secara terpisah (tidak
 * bisa meng-import modul src). Bila rumus di sini diubah, ubah juga di sana.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_URL ?? "/idle")
  .trim()
  .replace(/\/+$/, "")
  .replace(/^([^/])/, "/$1");
