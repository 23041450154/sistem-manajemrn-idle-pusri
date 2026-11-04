// AUTH sisi-BROWSER (SPA). Dulu server action; kini fetch langsung dari browser
// ke BE same-origin ({origin}/idle/air) dengan cookie `token` (HttpOnly) yang
// otomatis terkirim. Alasan pindah ke client: pod Next tak bisa resolve host
// publik ingress di dalam cluster (ENOTFOUND) — lihat lib/api-client.ts.
import type { User } from "../types/Auth";
import { apiJson, apiBase } from "@/lib/api-client";
import { BASE_PATH } from "@/lib/base-path";

export type CurrentUserResult = {
  status: boolean;
  message?: string;
  user?: User | null;
  forbidden?: boolean;
  expired?: boolean;
  error?: boolean;
  // token: tak lagi tersedia di client (HttpOnly). Dipertahankan (null) demi
  // kompatibilitas pemanggil lama; jangan dijadikan sumber kebenaran sesi.
  token?: string | null;
};

// Ambil user aktif via {BE}/api/auth/me. Pemetaan status:
//  200 + user -> valid; 401 -> expired; 403 -> forbidden (tak terdaftar);
//  503 (SSO gateway sibuk) / jaringan mati -> error (JANGAN start SSO).
//  Tanpa pemetaan 503, halaman "/" memulai redirect ke SSO saat gateway sibuk,
//  pulang dengan ?sso=1, masih 503 -> /error?type=sso lagi.
export async function getCurrentUserAction(): Promise<CurrentUserResult> {
  const res = await apiJson<User>("/api/auth/me");

  if (res.status === 401) {
    return { status: false, expired: true, message: "sesi berakhir", user: null, token: null };
  }
  if (res.status === 403) {
    return { status: false, forbidden: true, message: "tidak memiliki akses", user: null, token: null };
  }
  if (res.status === 0 || res.status === 503) {
    // Gangguan jaringan / backend tak merespons / SSO gateway sibuk.
    return { status: false, error: true, message: res.error ?? "backend tidak merespons", user: null, token: null };
  }
  const user = res.data as User | undefined;
  if (res.ok && user?.name) {
    return { status: true, message: "user ditemukan", user, token: null };
  }
  return { status: false, message: res.error ?? "user tidak ditemukan", user: null, token: null };
}

/**
 * URL logout: navigasi top-level ke {BE}/api/logout supaya cookie SSO
 * (access_token/refresh_token, HttpOnly) ikut terkirim -> backend backchannel
 * revoke ke Keycloak lalu expire cookie & redirect. JANGAN hapus cookie di sini
 * (backend butuh token untuk revoke).
 */
export async function logoutAction(): Promise<string> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ssoBaseUrl = process.env.NEXT_PUBLIC_API_SSO?.replace(/\/+$/, "");
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

  const url = new URL(`${apiBase()}/api/logout`, origin || undefined);
  // DEV (NEXT_PUBLIC_LOGIN_FORM=true): tanpa ?redirect=SSO. Backend tetap
  // dipanggil (expire cookie token HttpOnly server-side) lalu redirect ke
  // FRONTEND_URL lokal. Melempar ke SSO di dev percuma — SSO tidak bisa
  // kembali ke localhost. Build prod tanpa env ini = perilaku lama (SSO).
  const isDevLogin = process.env.NEXT_PUBLIC_LOGIN_FORM === "true";
  if (!isDevLogin && ssoBaseUrl && clientId) {
    url.searchParams.set(
      "redirect",
      `${ssoBaseUrl}/api/login?client_id=${clientId}`,
    );
  } else if (isDevLogin) {
    // Pakai path relatif (tanpa host). Backend mem-whitelist URL relatif (u.Host == ""),
    // sedangkan URL absolut di luar *.pusri.dev (seperti *.vercel.app atau *.naufal.me)
    // ditolak oleh whitelist backend dan di-fallback paksa ke http://localhost:3000.
    url.searchParams.set(
      "redirect",
      `${BASE_PATH}/login`,
    );
  }
  return url.toString();
}
