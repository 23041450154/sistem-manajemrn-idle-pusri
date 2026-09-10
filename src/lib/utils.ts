import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Prefix jalur absolut aplikasi dengan basePath deployment (reverse proxy).
 * Origin sengaja TIDAK dibuat di sini — datang dari platform saat runtime.
 * next/link dan router.replace sudah otomatis basePath-aware; helper ini hanya
 * untuk navigasi manual (window.location) dan aset <img>/CSS.
 */
export function withBasePath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return `${base}${path}`;
}

/** Tanggal singkat id-ID ("5 Agu 2026"). Kosong/gagal parse → "-". */
export function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Tanggal + jam id-ID untuk audit trail. */
export function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
