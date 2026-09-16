import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const { token, user, forbidden } = await getCurrentUserAction();

  // Sesi SSO valid tapi tak terdaftar -> /forbidden (jangan tampilkan login,
  // jangan hapus cookie: mencegah loop login<->SSO).
  if (forbidden) {
    redirect("/forbidden");
  }
  // Sudah login valid -> langsung ke home sesuai role.
  if (token && user) {
    redirect(homePathForRole(user.role));
  }

  return (
    <div>
      <LoginForm />
    </div>
  );
}
