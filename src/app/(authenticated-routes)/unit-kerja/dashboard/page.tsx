"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getEquipments, 
  getReuseRequests 
} from "@/action/api";
import { 
  Package, 
  Send, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  Building2, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  RefreshCw,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface EquipmentItem {
  id: string;
  equipment_code: string;
  name: string;
  plant: string;
  object_type_name: string;
  status_name: string;
  storage_location?: string;
  estimated_reuse_value?: number;
}

interface ReuseRequestItem {
  id: string;
  request_number: string;
  equipment_code: string;
  equipment_name: string;
  installation_location: string;
  target_plant: string;
  justification: string;
  estimated_cost_avoidance?: number;
  status: string;
  created_at: string;
}

export default function UnitKerjaDashboardPage() {
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [reuseRequests, setReuseRequests] = useState<ReuseRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawEqList, rawRequests] = await Promise.all([
        getEquipments().catch(() => []),
        getReuseRequests().catch(() => []),
      ]);

      // Process Equipments
      const mappedEquipments: EquipmentItem[] = (rawEqList || []).map((item: any) => {
        let plantStr = "STG & Boilers";
        if (typeof item.plant === "string") plantStr = item.plant;
        else if (item.plant && typeof item.plant === "object") plantStr = item.plant.name || item.plant.plant || "STG & Boilers";

        let catName = item.object_type?.name || item.objectType?.name || item.object_type_name || "Peralatan Utama";
        if (typeof catName === "object") catName = catName.name || "Peralatan Utama";

        const rawStatus = (typeof item.status === "object" ? item.status?.name : item.status || "").toUpperCase();
        let normalizedStatus = "IDLE";
        if (rawStatus.includes("READY") || rawStatus.includes("SIAP") || rawStatus.includes("VALIDATED") || rawStatus.includes("VALID")) {
          normalizedStatus = "READY_TO_REUSE";
        }

        return {
          id: String(item.id),
          equipment_code: String(item.equipment_code || `EQ-2026-${item.id}`),
          name: String(item.name || item.nama || "Equipment Idle"),
          plant: String(plantStr),
          object_type_name: String(catName),
          status_name: normalizedStatus,
          storage_location: String(item.storage_location || item.location || "Gudang Utama Pusri"),
          estimated_reuse_value: Number(item.estimated_reuse_value) || 250000000,
        };
      });

      // Process Requests
      const reqList: ReuseRequestItem[] = (rawRequests || []).map((r: any) => {
        let installLocStr = "Area Ammonia P-IB";
        if (typeof r.installation_location === "string") installLocStr = r.installation_location;
        else if (r.installation_location && typeof r.installation_location === "object") installLocStr = r.installation_location.name || "Area Ammonia P-IB";
        else if (typeof r.installationLocation === "string") installLocStr = r.installationLocation;

        let targetPlantStr = "Plant PUSRI IB";
        if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
        else if (r.target_plant && typeof r.target_plant === "object") targetPlantStr = r.target_plant.name || "Plant PUSRI IB";

        return {
          id: String(r.id),
          request_number: String(r.request_number || r.requestNumber || `REQ-REUSE-2026-${r.id}`),
          equipment_code: String(r.equipment_code || r.equipmentCode || r.equipment?.equipment_code || "EQ-99"),
          equipment_name: String(r.equipment_name || r.equipmentName || r.equipment?.name || "Equipment Reuse"),
          installation_location: String(installLocStr),
          target_plant: String(targetPlantStr),
          justification: typeof r.justification === "string" ? r.justification : "Peminjaman aset idle untuk efisiensi proyek",
          estimated_cost_avoidance: Number(r.estimated_cost_avoidance || r.estimatedCostAvoidance) || 250000000,
          status: String(r.status || r.approval_status || r.approvalStatus || "PENDING"),
          created_at: String(r.created_at || r.createdAt || new Date().toISOString()),
        };
      });

      setEquipments(mappedEquipments.filter(e => e.status_name === "READY_TO_REUSE" || e.status_name === "IDLE"));
      setReuseRequests(reqList);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Metrics Calculations
  const readyToUseCount = equipments.length;
  const totalSubmittedRequests = reuseRequests.length;
  const approvedRequestsCount = reuseRequests.filter(r => r.status.toUpperCase().includes("APPROV")).length;
  const pendingRequestsCount = reuseRequests.filter(r => r.status.toUpperCase().includes("PENDING") || r.status.toUpperCase().includes("REVIEW")).length;

  const totalCostAvoidance = reuseRequests
    .filter(r => r.status.toUpperCase().includes("APPROV"))
    .reduce((sum, item) => sum + (item.estimated_cost_avoidance || 0), 0);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes("APPROV")) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Disetujui</span>;
    }
    if (s.includes("REJECT")) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Ditolak</span>;
    }
    if (s.includes("REVISI")) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Perlu Revisi</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Menunggu Review</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-12 font-sans space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A356A] via-[#0D4488] to-[#1253A4] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Building2 className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-400/20 backdrop-blur-sm text-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-300/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Unit Kerja Operasi
              </span>
              <span className="text-blue-200 text-xs">• PT Pupuk Sriwidjaja Palembang</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dashboard Manajemen Asset Idle</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl font-medium">
              Pantau ketersediaan peralatan idle, ajukan permohonan penggunaan kembali (reuse), dan lacak status persetujuan aset terkini.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href="/unit-kerja/permintaan"
              className="px-4 py-2.5 bg-white text-[#0A356A] hover:bg-blue-50 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 group"
            >
              <Package className="w-4 h-4 text-[#0A356A]" />
              Lihat Katalog Ready to Use
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Ready to Use */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aset Ready to Use</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{readyToUseCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Siap diajukan peminjaman
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Package className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <Link href="/unit-kerja/permintaan" className="text-[11px] font-bold text-[#0A356A] hover:underline flex items-center gap-1">
              Buka Katalog <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Permintaan Diajukan */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Permintaan</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalSubmittedRequests}</h3>
              <p className="text-[11px] text-blue-600 font-medium mt-1">
                {pendingRequestsCount} dalam alur review
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Send className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <Link href="/unit-kerja/permintaan" className="text-[11px] font-bold text-[#0A356A] hover:underline flex items-center gap-1">
              Lihat Riwayat <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Disetujui */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Disetujui Rendal</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{approvedRequestsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Permohonan disetujui
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">Telah siap dimobilisasi</span>
          </div>
        </div>

        {/* Card 4: Cost Avoidance */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cost Avoidance</p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                Rp {totalCostAvoidance.toLocaleString("id-ID")}
              </h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">
                Estimasi penghematan
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">Efisiensi pengadaan baru</span>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Permintaan Reuse Terbaru (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0A356A]" />
                  Status Permintaan Reuse Unit Kerja
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Daftar pengajuan peminjaman peralatan idle terkini dari unit kerja Anda.</p>
              </div>
              <Link 
                href="/unit-kerja/permintaan" 
                className="text-[12px] font-bold text-[#0A356A] hover:underline flex items-center gap-1"
              >
                Lihat Semua ({reuseRequests.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/95 backdrop-blur-xs">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[35px]">No.</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">No. Pengajuan</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Equipment</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lokasi Instalasi</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0A356A]" />
                        Memuat data permintaan reuse...
                      </td>
                    </tr>
                  ) : reuseRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                        Belum ada permohonan penggunaan kembali (reuse) yang diajukan.
                      </td>
                    </tr>
                  ) : (
                    reuseRequests.slice(0, 5).map((req, idx) => (
                      <tr key={req.id} className="hover:bg-gray-50/80 transition-colors align-middle font-bold text-[11px]">
                        <td className="px-3 py-2.5 text-center text-gray-500 font-medium">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-blue-700 font-bold whitespace-nowrap">{req.request_number}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold leading-tight">{req.equipment_name}</span>
                            <span className="text-[9.5px] text-gray-500 font-mono mt-0.5">{req.equipment_code}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-800 font-bold">{req.installation_location}</td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Catalog Preview & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Action Banner */}
          <div className="bg-gradient-to-br from-[#0A356A] to-[#1253A4] text-white rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Pengajuan Peminjaman Baru
            </h3>
            <p className="text-[11.5px] text-blue-100 mt-1.5 leading-relaxed font-medium">
              Temukan peralatan siap pakai di katalog dan ajukan peminjaman secara langsung dengan mudah.
            </p>
            <Link 
              href="/unit-kerja/permintaan"
              className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Ajukan Reuse Sekarang
            </Link>
          </div>

          {/* Catalog Preview Box */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0A356A]" />
                Katalog Equipment Idle ({equipments.length})
              </h4>
              <Link href="/unit-kerja/permintaan" className="text-[10.5px] font-bold text-[#0A356A] hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-gray-500">Memuat katalog...</div>
              ) : equipments.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">Tidak ada alat ready to use.</div>
              ) : (
                equipments.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 hover:bg-blue-50/40 transition-colors flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-[11.5px] font-bold text-gray-900 truncate" title={item.name}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-medium">
                        <span className="font-mono text-blue-700 font-bold">{item.equipment_code}</span>
                        <span>•</span>
                        <span>{item.plant}</span>
                      </div>
                    </div>
                    <Link 
                      href="/unit-kerja/permintaan"
                      className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-[#0A356A] hover:text-white text-[10px] font-bold rounded transition-colors shrink-0"
                    >
                      Ajukan
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
