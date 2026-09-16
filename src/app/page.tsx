import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// Halaman "/" = TRANSIT (loading.tsx tampil saat cek sesi). Alur:
// - valid              -> redirect ke home sesuai role
// - 403 (tak terdaftar)-> /forbidden
// - error (backend)    -> /error?type=server (pesan)
// - 401 (kadaluarsa)   -> /error?type=expired (pesan, lalu auto ke SSO)
// - belum login        -> langsung ke SSO login (form NPP dihapus, SSO-only)
export default async function Home() {
  const { status, user, forbidden, expired, error } =
    await getCurrentUserAction();

  if (forbidden) {
    redirect("/forbidden");
  }
  if (error) {
    redirect("/error?type=server");
  }
  if (expired) {
    redirect("/error?type=expired");
  }
  if (status && user) {
    redirect(homePathForRole(user.role));
  }

  // Belum login -> mulai SSO.
  const url = ssoLoginUrl();
  redirect(url ?? "/error?type=config");
}
