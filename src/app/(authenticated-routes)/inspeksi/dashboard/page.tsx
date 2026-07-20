import { cookies } from "next/headers";
import { Server, CheckCircle, Clock, AlertTriangle, FileText, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";

const API_URL = process.env.API_URL || "http://localhost:8080";

async function fetchDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  try {
    // Fetch equipments
    const equipRes = await fetch(`${API_URL}/api/equipment`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const equipData = await equipRes.json();
    const equipments = equipData?.data || [];

    // Fetch approvals
    const appRes = await fetch(`${API_URL}/api/approvals`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const appData = await appRes.json();
    const approvals = appData?.data || [];

    return { equipments, approvals };
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return { equipments: [], approvals: [] };
  }
}

export default async function InspeksiDashboardPage() {
  const { equipments, approvals } = await fetchDashboardData();

  // Basic stats processing
  const totalAssets = equipments.length;
  // Count assets where status (from backend enum) might be IDLE or condition is bad
  const idleAssets = equipments.filter((eq: any) => eq.status?.name === "IDLE" || eq.is_utilizable === false).length; 
  
  // Pending Inspection requests
  const pendingInspeksi = approvals.filter((a: any) => a.current_step === "INSPEKSI_TEKNIK" && a.approval_status === "PENDING");
  const pendingCount = pendingInspeksi.length;
  
  // Completed/Approved inspections (general metric)
  const disetujuiCount = approvals.filter((a: any) => a.approval_status === "APPROVED").length;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Inspeksi Teknik</h1>
          <p className={styles.pageSubtitle}>
            Ringkasan kegiatan inspeksi dan status peralatan terkini.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline}>
            <FileText className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Peralatan"
          value={totalAssets.toString()}
          icon={Server}
          iconBgColor="bg-blue-50"
          iconColor="text-[#0556B3]"
        />
        <StatCard
          title="Menunggu Inspeksi"
          value={pendingCount.toString()}
          icon={Clock}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          title="Inspeksi Selesai"
          value={disetujuiCount.toString()}
          icon={CheckCircle}
          iconBgColor="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          title="Idle Equipment"
          value={idleAssets.toString()}
          icon={Activity}
          iconBgColor="bg-gray-50"
          iconColor="text-gray-500"
        />
      </div>

      {/* Tabel Menunggu Inspeksi */}
      <div className="mt-8 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-[15px] font-bold text-gray-800">Menunggu Inspeksi (Terbaru)</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">No. Request</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Alat</th>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingInspeksi.slice(0, 5).map((app: any) => (
                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-900">{app.request_number}</td>
                  <td className="px-6 py-4">{app.request_type}</td>
                  <td className="px-6 py-4">{app.equipment?.name || app.equipment?.equipment_code || "N/A"}</td>
                  <td className="px-6 py-4">{new Date(app.request_date).toLocaleDateString("id-ID")}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-orange-100 text-orange-700">
                      Menunggu Inspeksi
                    </span>
                  </td>
                </tr>
              ))}
              {pendingInspeksi.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                    Tidak ada antrean inspeksi saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
