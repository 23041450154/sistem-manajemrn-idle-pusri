import RendalDashboard from "@/components/Dashboards/RendalDashboard";
import UnitKerjaDashboard from "@/components/Dashboards/UnitKerjaDashboard";
import { getCurrentUserAction } from "@/action/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user } = await getCurrentUserAction();
  
  if (!user) {
    redirect("/login");
  }



  const role = user.role.toUpperCase();

  // Jika rolenya ADMIN (Rendal), tampilkan RendalDashboard
  if (role === "ADMIN") {
    return <RendalDashboard />;
  }

  // Jika rolenya USER (Unit Kerja) atau default fallback (termasuk Inspektor jika tidak ada dashboard khusus), tampilkan UnitKerjaDashboard
  return <UnitKerjaDashboard />;
}
