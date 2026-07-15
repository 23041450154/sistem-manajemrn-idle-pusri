import { cookies } from "next/headers";
import RendalDashboard from "@/components/Dashboards/RendalDashboard";
import InspeksiDashboard from "@/components/Dashboards/InspeksiDashboard";
import UnitKerjaDashboard from "@/components/Dashboards/UnitKerjaDashboard";

export default async function UnifiedDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  let role = "admin_rendal"; // Default fallback

  if (token) {
    try {
      // Decode dummy JWT payload (base64)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/, "/");
      const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
      const payload = JSON.parse(jsonPayload);
      
      if (payload.role) {
        role = payload.role;
      }
    } catch (e) {
      console.error("Gagal membaca cookie role di server", e);
    }
  }

  // Render dashboard yang sesuai dengan rolenya
  if (role === "inspeksi") {
    return <InspeksiDashboard />;
  }

  if (role === "unit_kerja") {
    return <UnitKerjaDashboard />;
  }

  // Jika admin_rendal atau tidak diketahui, kembalikan ke dashboard utama
  return <RendalDashboard />;
}
