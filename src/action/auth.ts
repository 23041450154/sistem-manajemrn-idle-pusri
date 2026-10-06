// AUTH sisi-BROWSER (SPA). Dulu server action; kini fetch langsung dari browser
// ke BE same-origin ({origin}/idle/air) dengan cookie `token` (HttpOnly) yang
// otomatis terkirim. Alasan pindah ke client: pod Next tak bisa resolve host
// publik ingress di dalam cluster (ENOTFOUND) — lihat lib/api-client.ts.
import type { User } from "../types/Auth";
import { apiJson } from "@/lib/api-client";

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
//  jaringan mati -> error. Tidak pernah melempar.
export async function getCurrentUserAction(): Promise<CurrentUserResult> {
  const res = await apiJson<User>("/api/auth/me");

  if (res.status === 401) {
    return { status: false, expired: true, message: "sesi berakhir", user: null, token: null };
  }
  if (res.status === 403) {
    return { status: false, forbidden: true, message: "tidak memiliki akses", user: null, token: null };
  }
  if (res.status === 0) {
    // Gangguan jaringan / backend tak merespons.
    return { status: false, error: true, message: res.error ?? "backend tidak merespons", user: null, token: null };
  }
  const user = res.data as User | undefined;
  if (res.ok && user?.name) {
    return { status: true, message: "user ditemukan", user, token: null };
  }
  return { status: false, message: res.error ?? "user tidak ditemukan", user: null, token: null };
}

// logoutAction pindah ke src/action/logout.ts — butuh cookie jar server
// (next/headers), yang tidak boleh di-import dari modul sisi-browser ini.
