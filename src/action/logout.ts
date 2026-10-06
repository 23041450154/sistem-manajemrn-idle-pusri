"use server";

/**
 * Logout sisi-server (gaya master / 21b6fea): cookie lokal dibersihkan di sini,
 * lalu backend diminta ikut menghapus cookie HttpOnly gateway.
 *
 * Kenapa file terpisah, bukan di src/action/auth.ts? Sejak refactor SPA
 * (f2f1f99) file itu jadi modul sisi-BROWSER tanpa "use server" dan dipakai
 * komponen "use client" (AuthProvider, /login, /logout). `next/headers` tidak
 * bisa di-import dari sana. Bagian yang butuh cookie jar server dipisah ke sini.
 *
 * Urutan penting: token dibaca SEBELUM cookie dihapus. clearAuthCookies() juga
 * membuang access_token/refresh_token, jadi sesudah itu permintaan berbasis
 * cookie tidak lagi bisa mengidentifikasi sesi — karena itu token dikirim
 * eksplisit lewat Authorization: Bearer agar backend tetap bisa backchannel
 * revoke ke Keycloak. (Di aplikasi SSO-only, sesi utama ada di access_token,
 * jadi itu yang diutamakan; `token` hanya fallback login NPP lama.)
 */
import { cookies } from "next/headers";
import { API_URL } from "@/config/api";
import { clearAuthCookies } from "@/lib/auth-cookies";

export async function logoutAction(): Promise<string | null> {
  let token: string | undefined;
  try {
    const jar = await cookies();
    token =
      jar.get("access_token")?.value || jar.get("token")?.value || undefined;
  } catch {}
  await clearAuthCookies();

  // Best-effort: minta backend juga hapus cookie HttpOnly gateway.
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers,
      cache: "no-store",
    }).catch(() => {});
  } catch {}

  const ssoBaseUrl = process.env.NEXT_PUBLIC_API_SSO?.replace(/\/$/, "");
  return ssoBaseUrl ? `${ssoBaseUrl}/api/logout` : null;
}
