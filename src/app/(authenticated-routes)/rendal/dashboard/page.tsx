import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { CostAvoidanceSection } from "@/components/CostAvoidanceSection";
import { buttonVariants } from "@/components/ui/button";

export default function RendalDashboard() {
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

      {/* Cost Avoidance Section */}
      <CostAvoidanceSection />
    </div>
  );
}
