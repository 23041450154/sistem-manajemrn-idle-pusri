import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// Halaman "/" = TRANSIT (loading.tsx tampil saat cek sesi). Alur:
// - valid               -> redirect ke home sesuai role
// - 403 (tak terdaftar) -> /forbidden
// - error backend       -> /error?type=server
// - baru pulang dari SSO (?sso=1) tapi sesi TETAP gagal -> /error?type=sso
//   (PENTING: jangan lempar ke SSO lagi -> mencegah loop tak berujung)
// - 401 kadaluarsa      -> /error?type=expired
// - belum login         -> mulai SSO (form NPP dihapus, SSO-only)
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const backFromSSO = sp?.sso === "1";

  const { status, user, forbidden, expired, error } =
    await getCurrentUserAction();

  if (forbidden) {
    redirect("/forbidden");
  }
  if (status && user) {
    redirect(homePathForRole(user.role));
  }
  // Sudah kembali dari SSO tapi sesi tetap tidak terbentuk -> STOP, jangan loop.
  if (backFromSSO) {
    redirect("/error?type=sso");
  }
  if (error) {
    redirect("/error?type=server");
  }
  if (expired) {
    redirect("/error?type=expired");
  }

  const url = ssoLoginUrl();
  redirect(url ?? "/error?type=config");
}
