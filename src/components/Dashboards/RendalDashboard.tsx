import Link from "next/link";
import { FileText, Plus, Server, PowerOff, CheckCircle, Wrench, Clock, FileQuestion } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ChartSection } from "@/components/ChartSection";
import { UpcomingInspections } from "@/components/UpcomingInspections";
import { RecentActivities } from "@/components/RecentActivities";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";
import { getEquipments } from "@/action/api";

export default async function RendalDashboard() {
  const equipments = await getEquipments() || [];
  
  const totalPeralatan = equipments.length;
  const idleCount = equipments.filter((e: any) => e.status?.name === 'IDLE').length;
  const readyCount = equipments.filter((e: any) => e.status?.name === 'READY_TO_REUSE').length;
  const repairCount = equipments.filter((e: any) => e.status?.name === 'DALAM_PERBAIKAN').length;
  const inspectionCount = equipments.filter((e: any) => e.status?.name === 'REGISTERED').length;
  
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Peralatan"
          value={totalPeralatan.toString()}
          icon={Server}
          trend="12%"
          iconBgColor="bg-blue-50"
          iconColor="text-[#0556B3]"
        />
        <StatCard
          title="Idle Equipment"
          value={idleCount.toString()}
          icon={PowerOff}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Siap Digunakan"
          value={readyCount.toString()}
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          title="Butuh Perbaikan"
          value={repairCount.toString()}
          icon={Wrench}
          iconBgColor="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          title="Menunggu Inspeksi"
          value={inspectionCount.toString()}
          icon={Clock}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Permintaan"
          value="0"
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
