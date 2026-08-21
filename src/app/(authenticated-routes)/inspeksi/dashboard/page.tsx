"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { getEquipments, getApprovals } from "@/action/api";
import { statusName } from "@/lib/equipment-status";

export default function InspeksiDashboardPage() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eqData] = await Promise.all([getEquipments()]);
      setEquipments(Array.isArray(eqData) ? eqData : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const totalAssets = equipments.length;

  const pendingAssets = useMemo(() => {
    return equipments.filter((eq) => {
      const st = statusName(
        typeof eq.status === "string" ? eq.status : eq.status?.name,
      );
      return st === "REGISTERED" || st === "";
    });
  }, [equipments]);

  const validatedAssetsCount = useMemo(() => {
    return equipments.filter((eq) => {
      const st = statusName(
        typeof eq.status === "string" ? eq.status : eq.status?.name,
      );
      return st === "VALIDATED" || st === "READY_TO_USE" || st === "REUSED";
    }).length;
  }, [equipments]);

  const repairOrScrapCount = useMemo(() => {
    return equipments.filter((eq) => {
      const st = statusName(
        typeof eq.status === "string" ? eq.status : eq.status?.name,
      );
      return (
        st === "REPAIR" ||
        st === "SCRAP" ||
        st === "DISPOSAL_RECOMMENDED" ||
        st === "REJECTED"
      );
    }).length;
  }, [equipments]);

  // Filtered table queue
  const filteredPending = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pendingAssets;
    return pendingAssets.filter((eq) => {
      const code = eq.equipment_code || eq.kodeAlat || "";
      const name = eq.name || eq.namaAlat || "";
      const plant = eq.plant?.name || eq.plant || "";
      return (
        code.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        plant.toLowerCase().includes(q)
      );
    });
  }, [pendingAssets, search]);

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-10 space-y-6">
      {/* Top Banner Header */}
      <div className="relative bg-gradient-to-br from-[#0A356A] via-[#0D478A] to-[#0556B3] text-white p-6 sm:p-8 rounded-2xl shadow-md border border-[#0A356A]/20 overflow-hidden">
        {/* Background Overlay Decoration */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-md mb-3 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Inspeksi Teknik & Validasi Kelayakan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Dashboard Inspeksi Teknik
            </h1>
            <p className="text-sm text-blue-100/90 mt-2 font-normal leading-relaxed">
              Pusat pengawasan kelayakan peralatan idle, pemantauan inspeksi
              berkala, dan penjaminan mutu kesehatan alat PT Pupuk Sriwidjaja
              Palembang.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/inspeksi/validasi"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#0A356A] rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0A356A]" />
              <span>Validasi Kelayakan</span>
            </Link>
            <Link
              href="/inspeksi/inspeksi-berkala"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-200" />
              <span>Inspeksi Berkala</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Summary Section (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Peralatan
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0A356A]">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {isLoading ? "..." : totalAssets}
            </span>
            <span className="text-xs text-gray-500 font-medium">unit</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Total aset idle terdaftar
          </p>
        </div>

        {/* Antrean Validasi */}
        <div className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Menunggu Validasi
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {isLoading ? "..." : pendingAssets.length}
            </span>
            <span className="text-xs text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
              Perlu Tindakan
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Aset baru menunggu pemeriksaan
          </p>
        </div>

        {/* Tervalidasi (Ready to Use) */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Tervalidasi / Ready
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">
              {isLoading ? "..." : validatedAssetsCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">unit</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Layak operasional & direkomendasikan
          </p>
        </div>

        {/* Perbaikan / Scrap */}
        <div className="bg-white p-5 rounded-xl border border-rose-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Perbaikan / Scrap
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">
              {isLoading ? "..." : repairOrScrapCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">unit</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">
            Rusak ringan, sedang, atau scrap
          </p>
        </div>
      </div>

      {/* Shortcut Feature Cards Grid (3 Navigation Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Feature 1 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#0A356A]/10 text-[#0A356A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0A356A] transition-colors">
              Validasi Kelayakan Aset
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Lakukan pemeriksaan fisik, pengujian teknis, dan penetapan status
              kelayakan aset baru terdaftar.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Pemeriksaan Awal
            </span>
            <Link
              href="/inspeksi/validasi"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A356A] group-hover:translate-x-1 transition-transform"
            >
              <span>Buka Validasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Inspeksi Berkala
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Jadwalkan dan catat hasil inspeksi rutin berkala untuk memastikan
              kesehatan aset idle terjaga.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Monitoring Rutin
            </span>
            <Link
              href="/inspeksi/inspeksi-berkala"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform"
            >
              <span>Buka Inspeksi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
              Validasi Perbaikan Alat
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Pemeriksaan ulang dan verifikasi fungsi pada peralatan yang telah
              selesai diperbaiki oleh tim Pemeliharaan.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Uji Ulang Pasca Perbaikan
            </span>
            <Link
              href="/inspeksi/validasi-ulang"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform"
            >
              <span>Buka Validasi Perbaikan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Table Section: Antrean Validasi Kelayakan Terbaru */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>Antrean Validasi Kelayakan</span>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                {pendingAssets.length} Menunggu
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Peralatan terdaftar terbaru yang membutuhkan validasi teknis.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode/nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            <Link
              href="/inspeksi/validasi"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0A356A] hover:text-[#062854] bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[40px]">
                  No
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[130px]">
                  Kode Alat
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left">
                  Nama Peralatan
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[100px]">
                  Plant
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[120px]">
                  Tanggal Registrasi
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[140px]">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[110px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs text-gray-500"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0A356A]" />
                    Memuat antrean validasi...
                  </td>
                </tr>
              ) : filteredPending.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs text-gray-400 italic"
                  >
                    {search
                      ? "Tidak ada peralatan yang sesuai dengan kata kunci pencarian."
                      : "Tidak ada antrean validasi kelayakan saat ini."}
                  </td>
                </tr>
              ) : (
                filteredPending.slice(0, 5).map((eq: any, idx: number) => (
                  <tr
                    key={eq.id || idx}
                    className="hover:bg-gray-50/60 transition-colors h-[48px]"
                  >
                    <td className="px-4 py-2 text-xs text-gray-500 text-center font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-[#0A356A] text-center truncate">
                      {eq.equipment_code || eq.kodeAlat || "-"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs font-semibold text-gray-800 truncate"
                      title={eq.name || eq.namaAlat}
                    >
                      {eq.name || eq.namaAlat || "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 font-medium text-center truncate">
                      {eq.plant?.name || eq.plant || "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 font-medium text-center font-mono text-[11px]">
                      {eq.created_at
                        ? new Date(eq.created_at).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-center">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
                        Menunggu Validasi
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center w-[110px]">
                      <Link
                        href="/inspeksi/validasi"
                        className="inline-flex items-center justify-center gap-1 bg-[#0A356A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Validasi
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
