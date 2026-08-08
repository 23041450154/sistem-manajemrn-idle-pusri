import Link from "next/link";
import { Trash2, CheckSquare } from "lucide-react";
import { CostAvoidanceSection } from "@/components/CostAvoidanceSection";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";

export default function ManajerDashboardPage() {
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Manajer Rendal</h1>
          <p className={styles.pageSubtitle}>
            Ringkasan persetujuan dan status peralatan idle terkini.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/manajer/disposal" className={styles.btnOutline}>
            <Trash2 className="w-4 h-4 text-red-600" />
            Persetujuan Disposal
          </Link>
          <Link href="/manajer/approve" className={styles.btnPrimary}>
            <CheckSquare className="w-4 h-4" />
            Persetujuan Validasi
          </Link>
        </div>
      </div>

      {/* Cost Avoidance Section */}
      <CostAvoidanceSection />
    </div>
  );
}
