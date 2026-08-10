"use server"

import { cookies } from "next/headers"
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "../types/Auth"
import { redirect } from "next/navigation"
import { homePathForRole } from "../lib/roles"



const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.testing.naufal.me"

function cookieConfig(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: true,
    ...(maxAge ? { maxAge } : {})
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
      signal: controller.signal
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
        user: undefined
      };
    }

    const cookieStorage = await cookies()

    cookieStorage.set("token", token, cookieConfig(60 * 30));
    if (user) {
      cookieStorage.set("user", JSON.stringify(user), cookieConfig(60 * 30))
    }

    return {
      status: true,
      message: result?.message || "login berhasil",
      token: token,
      user: user
    }
  }
  catch (error: any) {
    console.error(error)
    return {
      status: false,
      message: error.name === 'AbortError' 
        ? "Koneksi lambat atau tidak merespons. Silakan coba kembali beberapa saat lagi." 
        : "Terjadi kendala saat masuk ke sistem. Silakan coba kembali.",
      token: null
    }
  }

}


export async function loginAction(
  prevState: LoginResponse,
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
  const cookieStorage = await cookies()
  const token = cookieStorage.get("token")?.value
  const userStorage = cookieStorage.get("user")?.value

  if (!token) {
    return {
      status: false,
      message: "token tidak ditemukan",
      token: null,
      user: null,
    }
  }

  if (userStorage) {
    try {
      const user: User = JSON.parse(userStorage)
      if(user && user.name) {
        return {
          status: true,
          message: "user ditemukan",
          token: token,
          user: user,
        }
      }
    } catch (e) {
      return {
        status: false,
        message: "terjadi kesalahan",
        token: null,
        user: null,
      }
    }

  }

  return {
    status: false,
    message: "terjadi kesalahan",
    token: null,
    user: null,
  }
}

export async function logoutAction() {
  const cookieStorage = await cookies()
  const token = cookieStorage.get("token")?.value

  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error("Gagal memanggil API logout:", error)
    }
  }

  cookieStorage.delete("token")
  cookieStorage.delete("user")
  redirect("/login")
}
