import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_URL, isTargetLoginHost } from "@/config/api";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";

  // Jika diakses dari luar domain SSO dev perusahaan (misalnya di local atau Vercel),
  // langsung alihkan ke halaman SSO perusahaan bukan menampilkan form login lokal.
  if (!isTargetLoginHost(host)) {
    redirect(LOGIN_URL);
  }

  return (
    <div>
      <LoginForm />
    </div>
  );
}
