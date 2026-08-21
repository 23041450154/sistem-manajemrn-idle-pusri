"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Search,
  Wrench,
  RefreshCw,
  Filter,
} from "lucide-react";
import { getEquipments, deleteEquipment } from "@/action/api";
import { statusBadgeStyle, statusText } from "@/lib/equipment-status";

// ponytail: bentuk baris equipment dari API belum punya DTO bersama; ini subset
// field yang benar-benar dipakai halaman ini. Kalau DTO backend sudah ada, ganti.
type EquipmentRow = {
  id?: number | string;
  ID?: number | string;
  equipment_id?: number | string;
  equipmentCode?: string;
  equipment_code?: string;
  name?: string | { name?: string };
  plant?: string | { name?: string; description?: string };
  status?: { name?: string } | null;
  status_id?: number;
};

const nameOf = (eq: EquipmentRow) =>
  typeof eq.name === "string" ? eq.name : eq.name?.name || "-";

const plantOf = (eq: EquipmentRow) =>
  typeof eq.plant === "string"
    ? eq.plant
    : eq.plant?.name || eq.plant?.description || "-";

export default function EquipmentManagementPage() {
  const [equipments, setEquipments] = useState<EquipmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("Semua Plant");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      setEquipments(await getEquipments());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEquipments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return equipments.filter((eq) => {
      const matchSearch =
        !query ||
        eq.equipment_code?.toLowerCase().includes(query) ||
        nameOf(eq).toLowerCase().includes(query) ||
        plantOf(eq).toLowerCase().includes(query);
      const matchPlant =
        plantFilter === "Semua Plant" || plantOf(eq) === plantFilter;
      return matchSearch && matchPlant;
    });
  }, [search, plantFilter, equipments]);

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    const targetId =
      selectedItem.id ||
      selectedItem.ID ||
      selectedItem.equipment_id ||
      selectedItem.equipmentCode;

    if (!targetId) {
      setNotification({
        type: "error",
        message: "Gagal menghapus: ID aset tidak dikenali.",
      });
      setIsSubmitting(false);
      return;
    }

    const res = await deleteEquipment(String(targetId));
    setIsSubmitting(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: "Berhasil menghapus data aset dari sistem!",
      });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({
        type: "error",
        message:
          "Gagal menghapus aset: " + (res.message || "Silakan coba lagi."),
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Teks badge = nama status dari backend apa adanya (lihat lib/equipment-status).
  // ponytail: statusId hanya dipakai kalau relasi status belum di-preload.
  const getStatusBadge = (
    status: { name?: string } | null,
    statusId: number,
  ) => {
    const raw = status?.name || String(statusId || "");
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${statusBadgeStyle(raw)}`}
      >
        {statusText(raw) || "-"}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-700">
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-[13px] font-medium leading-snug">
            {notification.message}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A356A] rounded-2xl px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Manajemen Data Peralatan
            </h1>
            <p className="text-xs text-blue-200/90 mt-0.5 font-medium">
              Inventaris peralatan terdaftar di seluruh plant PT Pupuk
              Sriwidjaja.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh Data
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kode Alat, Nama, atau Plant..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={plantFilter}
            onChange={(e) => {
              setPlantFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer"
          >
            <option value="Semua Plant">Semua Plant / Pabrik</option>
            <option value="PUSRI-IB">PUSRI-IB</option>
            <option value="PUSRI-IIB">PUSRI-IIB</option>
            <option value="PUSRI-III">PUSRI-III</option>
            <option value="PUSRI-IV">PUSRI-IV</option>
            <option value="STG-1">STG-1 (Utilitas)</option>
          </select>
        </div>
      </div>

      {/* Tabel Aset */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">
              Memuat data aset peralatan...
            </p>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Data Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Tidak ada data aset terdaftar yang cocok dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Kode Aset
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Nama Peralatan
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Plant
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Status Aset
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedEquipments.map((item, index) => (
                  <tr
                    key={item.id || item.ID || item.equipment_id || index}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-semibold text-[#0A356A]">
                      {item.equipment_code}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                      {nameOf(item)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                      {plantOf(item)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status ?? null, item.status_id ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDeleteOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        title="Hapus Data Aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredEquipments.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan{" "}
              {filteredEquipments.length === 0
                ? 0
                : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
              -{" "}
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredEquipments.length,
              )}{" "}
              dari {filteredEquipments.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                          currentPage === page
                            ? "bg-[#0A356A] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Hapus (Konfirmasi) */}
      {isDeleteOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isSubmitting && setIsDeleteOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Konfirmasi Penghapusan Aset
            </h3>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">
              Anda akan menghapus data aset{" "}
              <span className="font-bold text-slate-900">
                &quot;{selectedItem.equipment_code} - {nameOf(selectedItem)}
                &quot;
              </span>{" "}
              dari database.
              <br />
              <br />
              Tindakan ini permanen dan akan menghapus semua riwayat persetujuan
              atau inspeksi yang terhubung dengan aset ini.
            </p>

            <div className="flex items-center gap-3 w-full justify-center mt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors w-full disabled:opacity-70"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#dc2626] text-white rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isSubmitting ? "Menghapus..." : "Ya, Hapus Aset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
