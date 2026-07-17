"use server"

import { cookies } from "next/headers"
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "../types/Auth"
import { redirect } from "next/navigation"



const API_URL = process.env.API_URL

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
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store"
    })

    const result = await res.json().catch(() => null)

    if (!res.ok || !result?.token) {
      return {
        status: false,
        message: result?.error || "login gagal",
        token:null
      }
    }

    const cookieStorage = await cookies()

    cookieStorage.set("token", result.token, cookieConfig(60 * 30));
    if (result.user) {
      cookieStorage.set("user", JSON.stringify(result.user), cookieConfig(60 * 30))
    }

    return {
      status: true,
      message: result.message || "login berhasil",
      token: result.token,
      user: result.user
    }
  }
  catch (error) {
    console.error(error)
    return {
      status: false,
      message: "terjadi kesalahan",
      token: null
    }
  }

}


export async function loginAction(
  prevState: LoginResponse,
  formData: FormData,
): Promise<LoginResponse> {
  const npp = String(formData.get("npp") || null);
  const password = String(formData.get("password") || null);

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
    redirect("/dashboard");
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
  cookieStorage.delete("token")
  cookieStorage.delete("user")
  redirect("/login")
}

