import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { redirect } from "next/navigation";

// Rute /dashboard lama kini hanya pengalihan: setiap role dikirim ke
// halaman utama folder role-nya masing-masing.
export default async function DashboardPage() {
  const { user } = await getCurrentUserAction();

  if (!user) {
    redirect("/login");
  }

  redirect(homePathForRole(user.role));
}
