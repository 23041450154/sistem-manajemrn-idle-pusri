/**
 * Base URL backend Gin — satu sumber kebenaran untuk semua pemakaian.
 * Urutan fallback dipertahankan dari kode lama agar tidak mengubah behavior:
 * NEXT_PUBLIC_API_URL -> API_URL -> default lokal.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://api.testing.naufal.me";

/**
 * URL SSO Login perusahaan — satu sumber kebenaran untuk pengalihan login.
 * Jika di local / vercel, user langsung diarahkan ke URL ini alih-alih form login lokal.
 */
export const LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || "https://har.pusri.dev/idle/login";

export function isTargetLoginHost(host: string | null | undefined): boolean {
  if (!host) return false;
  try {
    const target = new URL(LOGIN_URL);
    const currentHostname = host.split(":")[0].toLowerCase();
    return currentHostname === target.hostname.toLowerCase();
  } catch {
    return false;
  }
}
