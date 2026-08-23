import Link from "next/link";
import { Trash2, CheckSquare } from "lucide-react";
import { CostAvoidanceSection } from "@/components/CostAvoidanceSection";
import { buttonVariants } from "@/components/ui/button";

export default function ManajerDashboardPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Manajer Rendal</h1>
          <p className="page-subtitle">
            Ringkasan persetujuan dan status peralatan idle terkini.
          </p>
        </div>
        <div className="header-actions">
          <Link
            href="/manajer/scrap"
            className={buttonVariants({ variant: "brandOutline", size: "lg" })}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            Persetujuan Scrap
          </Link>
          <Link
            href="/manajer/approve"
            className={buttonVariants({ variant: "brand", size: "lg" })}
          >
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
