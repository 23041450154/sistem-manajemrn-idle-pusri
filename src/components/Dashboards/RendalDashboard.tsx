import Link from "next/link";
import {
  FileText,
  Plus,
  Server,
  PowerOff,
  CheckCircle,
  Wrench,
  Clock,
  FileQuestion,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ChartSection } from "@/components/ChartSection";
import { UpcomingInspections } from "@/components/UpcomingInspections";
import { RecentActivities } from "@/components/RecentActivities";
import { buttonVariants } from "@/components/ui/button";
import { getEquipments } from "@/action/api";

export default async function RendalDashboard() {
  const equipments: { status?: { name?: string } }[] =
    (await getEquipments()) || [];

  const totalPeralatan = equipments.length;
  const countBy = (name: string) =>
    equipments.filter((e) => e.status?.name === name).length;
  const idleCount = countBy("IDLE");
  const readyCount = countBy("READY_TO_REUSE");
  const repairCount = countBy("DALAM_PERBAIKAN");
  const inspectionCount = countBy("REGISTERED");

  return (
    <div className="page-container">
      {/* Header Overview */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Selamat datang kembali, berikut ringkasan status aset hari ini.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={buttonVariants({ variant: "brandOutline", size: "lg" })}
          >
            <FileText className="w-4 h-4" />
            Buat Laporan
          </button>
          <Link
            href="/rendal/register-equipment"
            className={buttonVariants({ variant: "brand", size: "lg" })}
          >
            <Plus className="w-4 h-4" />
            Daftarkan Peralatan
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
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
      <div className="bottom-grid">
        <div className="upcoming-wrapper">
          <UpcomingInspections />
        </div>
        <div>
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
