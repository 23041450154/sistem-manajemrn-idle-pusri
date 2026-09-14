"use server";

import { cookies } from "next/headers";

/**
 * Hapus semua cookie auth. Pakai di setiap exit point selain /api/logout:
 * token invalid/expired, user tidak ditemukan, logout manual.
 * ponytail: tambah nama cookie di sini + backend clearAuthCookies bila nambah cookie baru.
 */
export async function clearAuthCookies() {
  // Dibungkus try/catch: saat dipanggil dari render Server Component, mutasi
  // cookie bisa no-op / melempar. Tidak boleh menggagalkan render (memicu loop).
  try {
    const jar = await cookies();
    for (const name of ["access_token", "refresh_token", "token", "user"]) {
      try {
        jar.delete(name);
      } catch {}
    }
  } catch {}
}

export async function hasAuthToken(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(jar.get("access_token")?.value || jar.get("token")?.value);
}
