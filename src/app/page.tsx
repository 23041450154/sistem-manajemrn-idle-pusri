import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";

// Halaman pertama "/" = resolver sesi (loading.tsx tampil saat pengecekan):
// - user tak terdaftar / tak punya akses (403) -> /forbidden
// - sudah login valid -> redirect ke home sesuai role
// - belum login -> /login
// Ini juga tujuan redirect setelah callback SSO (backend arahkan ke FRONTEND_URL="/").
export default async function Home() {
  const { token, user, forbidden } = await getCurrentUserAction();

  if (forbidden) {
    redirect("/forbidden");
  }
  if (token && user) {
    redirect(homePathForRole(user.role));
  }
  redirect("/login");
}
