import { FileText, Plus, Server, PowerOff, CheckCircle, Wrench, Clock, FileQuestion } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ChartSection } from "@/components/ChartSection";
import { UpcomingInspections } from "@/components/UpcomingInspections";
import { RecentActivities } from "@/components/RecentActivities";
import styles from "@/app/dashboard/dashboard.module.css";

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
          <button className={styles.btnPrimary}>
            <Plus className="w-4 h-4" />
            Daftarkan Peralatan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Charts Section */}
      <ChartSection />

      {/* Bottom Section: Tables & Activity */}
      <div className={styles.bottomGrid}>
        <div className={styles.upcomingWrapper}>
          <UpcomingInspections />
        </div>
        <div>
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
