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

      {/* Stats Cards - Hidden sementara
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Peralatan"
          value="1,284"
          icon={Server}
          trend="12%"
          iconBgColor="bg-blue-50"
          iconColor="text-[#0556B3]"
        />
        <StatCard
          title="Idle Equipment"
          value="426"
          icon={PowerOff}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Siap Digunakan"
          value="782"
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          title="Butuh Perbaikan"
          value="54"
          icon={Wrench}
          iconBgColor="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          title="Menunggu Inspeksi"
          value="12"
          icon={Clock}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Permintaan"
          value="08"
          icon={FileQuestion}
          iconBgColor="bg-blue-50"
          iconColor="text-[#0556B3]"
        />
      </div>
      */}

      {/* Charts Section - Hidden sementara */}
      {/* <ChartSection /> */}

      {/* Cost Avoidance Section */}
      <CostAvoidanceSection />
    </div>
  );
}
