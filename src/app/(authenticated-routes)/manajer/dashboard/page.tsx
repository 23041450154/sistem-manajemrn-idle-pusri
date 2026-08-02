import { cookies } from "next/headers";
import Link from "next/link";
import { 
  CheckSquare, Clock, CheckCircle, RefreshCw, 
  FileText, Eye, Server, Activity, Trash2 
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
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

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Pengajuan"
          value={totalApprovals.toString()}
          icon={FileText}
          iconBgColor="bg-blue-50"
          iconColor="text-[#0556B3]"
        />
        <StatCard
          title="Menunggu Review"
          value={pendingCount.toString()}
          icon={Clock}
          iconBgColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Sedang Direview"
          value={inReviewCount.toString()}
          icon={Eye}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Disetujui"
          value={approvedCount.toString()}
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Perlu Revisi"
          value={revisionCount.toString()}
          icon={RefreshCw}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Idle Equipment"
          value={idleCount.toString()}
          icon={Activity}
          iconBgColor="bg-gray-50"
          iconColor="text-gray-500"
        />
      </div>

      {/* Alert Banner jika ada pengajuan menunggu */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
            </span>
            <span className="text-[13px] text-yellow-800 font-medium">
              Terdapat <strong className="font-bold">{pendingCount} pengajuan</strong> yang menunggu review Anda.
            </span>
          </div>
          <Link
            href="/manajer/approve"
            className="text-[11px] font-bold text-yellow-700 hover:text-yellow-900 bg-white px-3 py-1.5 rounded-md border border-yellow-300 shadow-sm transition-colors uppercase tracking-wide"
          >
            Review Sekarang
          </Link>
        </div>
      )}

      {/* Tabel Section */}
      <div className={styles.bottomGrid}>
        {/* Tabel: Butuh Tindakan */}
        <div className={styles.upcomingWrapper}>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-800">
                  Butuh Tindakan
                </h2>
                {actionNeeded.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {actionNeeded.length}
                  </span>
                )}
              </div>
              <Link
                href="/manajer/approve"
                className="text-[12px] font-semibold text-[#0556B3] hover:underline"
              >
                Lihat Semua →
              </Link>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">No. Request</th>
                    <th className="px-6 py-3">Kode Aset</th>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actionNeeded.slice(0, 5).map((app: any) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-[#0A356A]">
                        {app.request_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {app.equipment_code ||
                          app.equipment?.equipment_code ||
                          "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {app.request_date
                          ? new Date(app.request_date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(app.approval_status)}
                      </td>
                    </tr>
                  ))}
                  {actionNeeded.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-400 italic"
                      >
                        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-300" />
                        Semua pengajuan telah ditindaklanjuti.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabel: Riwayat Terbaru */}
        <div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[15px] font-bold text-gray-800">
                Riwayat Terbaru
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentHistory.length > 0 ? (
                recentHistory.map((app: any) => (
                  <div
                    key={app.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">
                        {app.request_number}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {app.equipment_code ||
                          app.equipment?.equipment_code ||
                          "-"}{" "}
                        ·{" "}
                        {app.request_date
                          ? new Date(app.request_date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      {getStatusBadge(app.approval_status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-10 text-center text-gray-400 italic text-[13px]">
                  Belum ada riwayat persetujuan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Equipment */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-[15px] font-bold text-gray-800">
            Distribusi Status Peralatan
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(() => {
              const registered = equipments.filter(
                (eq: any) => eq.status?.name === "REGISTERED"
              ).length;
              const validated = equipments.filter(
                (eq: any) => eq.status?.name === "VALIDATED"
              ).length;
              const idle = equipments.filter(
                (eq: any) => eq.status?.name === "IDLE"
              ).length;
              const rejected = equipments.filter(
                (eq: any) => eq.status?.name === "REJECTED"
              ).length;

              const items = [
                {
                  label: "Registered",
                  count: registered,
                  color: "bg-blue-500",
                  bg: "bg-blue-50",
                  text: "text-blue-700",
                },
                {
                  label: "Validated",
                  count: validated,
                  color: "bg-green-500",
                  bg: "bg-green-50",
                  text: "text-green-700",
                },
                {
                  label: "Idle",
                  count: idle,
                  color: "bg-indigo-500",
                  bg: "bg-indigo-50",
                  text: "text-indigo-700",
                },
                {
                  label: "Rejected",
                  count: rejected,
                  color: "bg-red-500",
                  bg: "bg-red-50",
                  text: "text-red-700",
                },
              ];

              return items.map((item) => (
                <div
                  key={item.label}
                  className={`${item.bg} rounded-xl p-4 border border-gray-100`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                    ></div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${item.text}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {item.count}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {totalEquipment > 0
                      ? ((item.count / totalEquipment) * 100).toFixed(1)
                      : 0}
                    % dari total
                  </p>
                </div>
              ));
            })()}
          </div>

          {/* Progress bar visual */}
          {totalEquipment > 0 && (
            <div className="mt-5">
              <div className="flex rounded-full h-3 overflow-hidden bg-gray-100">
                {(() => {
                  const registered = equipments.filter(
                    (eq: any) => eq.status?.name === "REGISTERED"
                  ).length;
                  const validated = equipments.filter(
                    (eq: any) => eq.status?.name === "VALIDATED"
                  ).length;
                  const idle = equipments.filter(
                    (eq: any) => eq.status?.name === "IDLE"
                  ).length;
                  const rejected = equipments.filter(
                    (eq: any) => eq.status?.name === "REJECTED"
                  ).length;

                  return (
                    <>
                      <div
                        className="bg-blue-500 transition-all"
                        style={{
                          width: `${(registered / totalEquipment) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-green-500 transition-all"
                        style={{
                          width: `${(validated / totalEquipment) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-indigo-500 transition-all"
                        style={{
                          width: `${(idle / totalEquipment) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-red-500 transition-all"
                        style={{
                          width: `${(rejected / totalEquipment) * 100}%`,
                        }}
                      ></div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Registered
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Validated
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Idle
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Rejected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
