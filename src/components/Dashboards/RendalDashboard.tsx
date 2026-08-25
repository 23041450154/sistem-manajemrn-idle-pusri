import Link from "next/link";
import {
  FileText,
  Plus,
  Server,
  PowerOff,
  CheckCircle,
  Wrench,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ChartSection } from "@/components/ChartSection";
import { UpcomingInspections } from "@/components/UpcomingInspections";
import { RecentActivities } from "@/components/RecentActivities";
import { buttonVariants } from "@/components/ui/button";
import { getEquipments, getInspections, getObjectTypes } from "@/action/api";
import { statusGroup } from "@/lib/equipment-status";

export default async function RendalDashboard() {
  // Satu fetch per sumber data untuk seluruh dashboard (kartu + chart + tabel).
  const [equipments, inspections, objectTypes] = await Promise.all([
    getEquipments(),
    getInspections(),
    getObjectTypes(),
  ]);
  const equipmentList = (equipments as { status?: { name?: string } }[]) || [];

  const totalPeralatan = equipmentList.length;
  const countBy = (group: "pending" | "repair" | "ready" | "scrap") =>
    equipmentList.filter((e) => statusGroup(e) === group).length;
  // Kartu mengikuti kelompok status yang sama dengan chart & dashboard lain.
  const idleCount = countBy("pending");
  const readyCount = countBy("ready");
  const repairCount = countBy("repair");
  const inspectionCount = countBy("pending");

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
          <Link
            href="/rendal/laporan"
            className={buttonVariants({ variant: "brandOutline", size: "lg" })}
          >
            <FileText className="w-4 h-4" />
            Buat Laporan
          </Link>
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
      </div>

      {/* Charts Section */}
      <ChartSection equipments={equipments || []} />

      {/* Bottom Section: Tables & Activity */}
      <div className="bottom-grid">
        <div className="upcoming-wrapper">
          <UpcomingInspections
            inspections={inspections || []}
            objectTypes={objectTypes || []}
          />
        </div>
        <div>
          <RecentActivities equipments={equipments || []} />
        </div>
      </div>
    </div>
  );
}
