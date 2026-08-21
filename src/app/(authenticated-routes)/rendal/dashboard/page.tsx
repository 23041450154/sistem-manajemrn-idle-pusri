import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { CostAvoidanceSection } from "@/components/CostAvoidanceSection";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";

export default function RendalDashboard() {
  return (
    <div className={styles.pageContainer}>
      {/* Header Overview */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          <p className={styles.pageSubtitle}>
            Selamat datang kembali, berikut ringkasan status aset hari ini.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline}>
            <FileText className="w-4 h-4" />
            Buat Laporan
          </button>
          <Link href="/rendal/register-equipment" className={styles.btnPrimary}>
            <Plus className="w-4 h-4" />
            Daftarkan Peralatan
          </Link>
        </div>
      </div>

      {/* Cost Avoidance Section */}
      <CostAvoidanceSection />
    </div>
  );
}
