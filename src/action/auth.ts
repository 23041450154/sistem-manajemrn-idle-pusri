"use server";

import { cookies } from "next/headers";
import type { LoginRequest, LoginResponse, User } from "../types/Auth";
import { redirect } from "next/navigation";
import { homePathForRole, normalizeRole } from "../lib/roles";
import { API_URL } from "@/config/api";

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

export async function getCurrentUserAction() {
  const cookieStorage = await cookies();
  const token = cookieStorage.get("token")?.value;
  const userStorage = cookieStorage.get("user")?.value;

  if (!token) {
    return {
      status: false,
      message: "token tidak ditemukan",
      token: null,
      user: null,
    };
  }

  if (userStorage) {
    try {
      const user: User = JSON.parse(userStorage);
      if (user && user.name) {
        return {
          status: true,
          message: "user ditemukan",
          token: token,
          user: user,
        };
      }
    } catch {
      return {
        status: false,
        message: "terjadi kesalahan",
        token: null,
        user: null,
      };
    }
  }

  // ponytail: callback SSO backend hanya memberi cookie token. Ambil user saat
  // dibutuhkan; tambah cache session jika trafik /auth/me nanti jadi masalah.
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await res.json().catch(() => null);
    const user: User | undefined = result?.data;

    if (res.ok && user?.name) {
      return {
        status: true,
        message: "user ditemukan",
        token,
        user,
      };
    }
  } catch (error) {
    console.error("Gagal mengambil user SSO:", error);
  }

  return {
    status: false,
    message: "user tidak ditemukan",
    token: null,
    user: null,
  };
}

export async function logoutAction() {
  const cookieStorage = await cookies();
  cookieStorage.delete("token");
  cookieStorage.delete("user");

  const ssoBaseUrl = process.env.NEXT_PUBLIC_API_SSO?.replace(/\/$/, "");
  return ssoBaseUrl ? `${ssoBaseUrl}/api/logout` : null;
}

export async function ssoCallbackAction(
  code: string,
  clientId: string,
  uid?: string | null,
) {
  try {
    const callbackUrl = new URL(`${API_URL}/api/auth/callback`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("clientId", clientId);
    if (uid) callbackUrl.searchParams.set("uid", uid);

    const res = await fetch(callbackUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const result = await res.json().catch(() => null);
    const token = result?.data?.token || result?.token;
    const user = result?.data?.user || result?.user;

    if (!res.ok || !token) {
      return {
        status: false,
        message:
          result?.error || result?.message || `SSO gagal (HTTP ${res.status})`,
      };
    }

    const cookieStorage = await cookies();
    cookieStorage.set("token", token, cookieConfig(60 * 30));
    if (user) {
      cookieStorage.set("user", JSON.stringify(user), cookieConfig(60 * 30));
    }

    const role = user?.role ? normalizeRole(user.role) : undefined;
    return {
      status: true,
      redirectUrl: role ? homePathForRole(role) : "/",
    };
  } catch (error: unknown) {
    console.error("SSO callback error:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memproses SSO.",
    };
  }
}
