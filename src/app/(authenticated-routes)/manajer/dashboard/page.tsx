import { cookies } from "next/headers";
import Link from "next/link";
import { Trash2, CheckSquare } from "lucide-react";
import { CostAvoidanceSection } from "@/components/CostAvoidanceSection";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";

const API_URL = process.env.API_URL || "http://localhost:8080";

async function fetchDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const [equipRes, appRes] = await Promise.all([
      fetch(`${API_URL}/api/equipment`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/api/approvals`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const equipData = await equipRes.json();
    const appData = await appRes.json();

    return {
      equipments: equipData?.data || [],
      approvals: appData?.data || [],
    };
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return { equipments: [], approvals: [] };
  }
}

export default async function ManajerDashboardPage() {
  const { equipments, approvals } = await fetchDashboardData();

  // --- Statistik Approval ---
  const totalApprovals = approvals.length;
  const pendingCount = approvals.filter(
    (a: any) => a.approval_status === "PENDING"
  ).length;
  const inReviewCount = approvals.filter(
    (a: any) => a.approval_status === "IN_REVIEW"
  ).length;
  const approvedCount = approvals.filter(
    (a: any) => a.approval_status === "APPROVED"
  ).length;
  const revisionCount = approvals.filter(
    (a: any) => a.approval_status === "REVISION_REQUIRED"
  ).length;

  // --- Statistik Equipment ---
  const totalEquipment = equipments.length;
  const idleCount = equipments.filter(
    (eq: any) => eq.status?.name === "IDLE"
  ).length;

  // --- Tabel: Butuh Tindakan (PENDING + IN_REVIEW) ---
  const actionNeeded = approvals
    .filter(
      (a: any) =>
        a.approval_status === "PENDING" || a.approval_status === "IN_REVIEW"
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.request_date).getTime() - new Date(a.request_date).getTime()
    );

  // --- Tabel: Riwayat Terbaru (APPROVED + REVISION_REQUIRED) ---
  const recentHistory = approvals
    .filter(
      (a: any) =>
        a.approval_status === "APPROVED" ||
        a.approval_status === "REVISION_REQUIRED"
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.updated_at || b.request_date).getTime() -
        new Date(a.updated_at || a.request_date).getTime()
    )
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-yellow-100 text-yellow-700">
            Menunggu Review
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700">
            Sedang Direview
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-green-100 text-green-700">
            Disetujui
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-100 text-purple-700">
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

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
