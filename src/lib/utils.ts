import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BASE_PATH } from "./base-path";

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
  return `${BASE_PATH}${path}`;
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

/** Tanggal hari ini (YYYY-MM-DD) dalam zona waktu Asia/Jakarta untuk default/max input date. */
export function todayLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Konversi string tanggal/ISO ke YYYY-MM-DD (Asia/Jakarta) tanpa pergeseran hari UTC. */
export function formatIsoDate(iso?: string | null): string {
  if (!iso) return "-";
  const trimmed = iso.trim();
  if (!trimmed || trimmed === "-") return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
