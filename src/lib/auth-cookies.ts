"use server";

import { cookies } from "next/headers";

/**
 * Hapus semua cookie auth. Pakai di setiap exit point selain /api/logout:
 * token invalid/expired, user tidak ditemukan, logout manual.
 * ponytail: tambah nama cookie di sini + backend clearAuthCookies bila nambah cookie baru.
 */
export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete("token");
  jar.delete("user");
  // HttpOnly SSO cookies yang mungkin diset backend gateway
  jar.delete("access_token");
  jar.delete("refresh_token");
}

export async function hasAuthToken(): Promise<boolean> {
  return Boolean((await cookies()).get("token")?.value);
}
