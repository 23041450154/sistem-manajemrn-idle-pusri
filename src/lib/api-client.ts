// Klien API sisi-BROWSER (SPA). Dipakai menggantikan server action supaya
// panggilan BE terjadi dari browser — bukan dari pod Next yang TIDAK bisa
// resolve host publik ingress di dalam cluster (getaddrinfo ENOTFOUND).
//
// Base URL = SAME-ORIGIN: {origin}{basePath}/air. Contoh:
//   - lokal (lewat proxy) : http://localhost:3222/idle/air
//   - dev                 : https://har.pusri.dev/idle/air
// Karena same-origin, cookie sesi `token` (HttpOnly) OTOMATIS ikut terkirim
// (credentials: "include") tanpa perlu dibaca JS -> tetap aman dari XSS, dan
// tanpa CORS. Override eksplisit via NEXT_PUBLIC_API_URL bila benar-benar beda host.
import { BASE_PATH } from "./base-path";

export function apiBase(): string {
  const override = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (override) return override;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${BASE_PATH}/air`;
  }
  // Fallback SSR (jarang dipakai di SPA): path relatif same-origin.
  return `${BASE_PATH}/air`;
}

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  raw?: unknown;
  error?: string;
};

// apiFetch: fetch same-origin + credentials include. Melempar HANYA saat
// gangguan jaringan (dipakai pemanggil untuk membedakan "backend down").
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init?.headers },
  });
}

// apiJson: helper GET/POST yang mengembalikan JSON ter-parse + status.
export async function apiJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await apiFetch(path, init);
    const raw = await res.json().catch(() => null);
    const data = (raw && typeof raw === "object" && "data" in raw
      ? (raw as { data: T }).data
      : (raw as T)) as T;
    return {
      ok: res.ok,
      status: res.status,
      data,
      raw,
      error: res.ok ? undefined : (raw?.error ?? raw?.message ?? `HTTP ${res.status}`),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network error" };
  }
}
