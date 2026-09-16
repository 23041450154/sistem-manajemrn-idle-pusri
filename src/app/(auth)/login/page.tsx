import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// Form login NPP/password DIHAPUS -> aplikasi SSO-only.
// /login = pintu masuk: sudah login -> home role; 403 -> /forbidden;
// selain itu -> langsung ke SSO (NEXA).
export default async function LoginPage() {
  const { status, user, forbidden } = await getCurrentUserAction();

  if (forbidden) {
    redirect("/forbidden");
  }
  if (status && user) {
    redirect(homePathForRole(user.role));
  }
  const url = ssoLoginUrl();
  redirect(url ?? "/error?type=config");
}
