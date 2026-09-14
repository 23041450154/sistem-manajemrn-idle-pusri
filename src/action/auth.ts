"use server";

import { cookies } from "next/headers";
import type { LoginRequest, LoginResponse, User } from "../types/Auth";
import { redirect } from "next/navigation";
import { homePathForRole } from "../lib/roles";
import { API_URL } from "@/config/api";
import { clearAuthCookies } from "@/lib/auth-cookies";

function cookieConfig(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: true,
    ...(maxAge ? { maxAge } : {}),
  };
}

// Dipakai internal oleh loginAction; tidak diekspor (knip: dead export).
async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await res.json().catch(() => null);
    const token = result?.data?.token;
    const user = result?.data?.user;

    if (!res.ok || !token) {
      return {
        status: false,
        message: result?.error || result?.message || "login gagal",
        token: null,
        user: undefined,
      };
    }

    const cookieStorage = await cookies();

    cookieStorage.set("token", token, cookieConfig(60 * 30));
    if (user) {
      cookieStorage.set("user", JSON.stringify(user), cookieConfig(60 * 30));
    }

    return {
      status: true,
      message: result?.message || "login berhasil",
      token: token,
      user: user,
    };
  } catch (error: unknown) {
    console.error(error);
    return {
      status: false,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Koneksi lambat atau tidak merespons. Silakan coba kembali beberapa saat lagi."
          : "Terjadi kendala saat masuk ke sistem. Silakan coba kembali.",
      token: null,
    };
  }
}

export async function loginAction(
  // Nama _prevState: parameter pertama wajib ada untuk kontrak useActionState,
  // tapi memang tidak dipakai di badan aksi ini.
  _prevState: LoginResponse,
  formData: FormData,
): Promise<LoginResponse> {
  const npp = String(formData.get("npp") || "");
  const password = String(formData.get("password") || "");

  if (!npp || !password) {
    return {
      status: false,
      message: "Login Gagal",
      token: null,
    };
  }

  const result = await login({
    npp,
    password,
  });

  if (result.status && result.user) {
    redirect(homePathForRole(result.user.role));
  }

  return result;
}

// Header auth ke backend. Cookie sesi app bernama "token": isinya access_token
// SSO (setelah login SSO) atau JWT internal (setelah login NPP). Backend
// meng-auto-deteksi jenisnya. Konsisten dgn seluruh server action di api.ts.
async function authHeadersFromCookies(): Promise<{
  token: string | null;
  headers: Record<string, string>;
}> {
  const token = (await cookies()).get("token")?.value;
  if (token) {
    return { token, headers: { Authorization: `Bearer ${token}` } };
  }
  return { token: null, headers: {} };
}

export async function getCurrentUserAction() {
  const { token, headers } = await authHeadersFromCookies();

  if (!token) {
    return { status: false, message: "sesi tidak ditemukan", token: null, user: null };
  }

  // Model "ikut dokumen": backend memvalidasi ulang access_token ke
  // {SSO}/protect/authme setiap request, lalu mengembalikan user lokal.
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers,
      cache: "no-store",
    });
    if (res.status === 401) {
      // Best-effort clear; saat dipanggil dari render, delete mungkin no-op —
      // tapi tidak boleh melempar. Redirect ke /login ditangani pemanggil.
      await clearAuthCookies();
      return { status: false, message: "sesi berakhir", token: null, user: null };
    }
    const result = await res.json().catch(() => null);
    const user: User | undefined = result?.data;
    if (res.ok && user?.name) {
      return { status: true, message: "user ditemukan", token, user };
    }
  } catch (error) {
    // Network error: jangan hapus cookie, biar tidak menendang user saat backend
    // sesaat tidak reachable.
    console.error("Gagal mengambil user:", error);
    return { status: false, message: "backend tidak merespons", token, user: null };
  }

  await clearAuthCookies();
  return { status: false, message: "user tidak ditemukan", token: null, user: null };
}

/**
 * Cek apakah sesi masih valid (dipakai layout/route). Model SSO: backend
 * memvalidasi ulang access_token ke {SSO}/protect/authme.
 */
export async function ensureAuthOrClear(): Promise<{ valid: boolean; token: string | null }> {
  const { token, headers } = await authHeadersFromCookies();
  if (!token) return { valid: false, token: null };
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers,
      cache: "no-store",
    });
    if (res.status === 401) {
      await clearAuthCookies();
      return { valid: false, token: null };
    }
    return { valid: res.ok, token };
  } catch {
    // network down: anggap masih valid, jangan hapus cookie
    return { valid: true, token };
  }
}

/**
 * Logout mengikuti dokumen service SSO:
 *  1) Bersihkan cookie lokal (jalur NPP: token/user) di server action.
 *  2) Kembalikan URL backend {API}/api/logout?redirect={SSO}/api/login...
 *     Halaman logout melakukan navigasi top-level ke URL ini supaya cookie
 *     SSO (access_token/refresh_token, HttpOnly=false, parent domain) ikut
 *     terkirim; backend backchannel revoke ke SSO lalu expire cookie & redirect.
 */
export async function logoutAction(): Promise<string> {
  await clearAuthCookies();

  const ssoBaseUrl = process.env.NEXT_PUBLIC_API_SSO?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

  const logoutUrl = new URL(`${API_URL}/api/logout`);
  if (ssoBaseUrl && clientId) {
    logoutUrl.searchParams.set(
      "redirect",
      `${ssoBaseUrl}/api/login?client_id=${clientId}`,
    );
  }
  return logoutUrl.toString();
}
