import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import styles from "./dashboard.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      console.error("Gagal membaca cookie role di layout", e);
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar role={role} />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.mainArea}>{children}</main>
      </div>
    </div>
  );
}
