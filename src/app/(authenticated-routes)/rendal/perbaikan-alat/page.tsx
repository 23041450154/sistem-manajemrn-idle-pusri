"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getEquipments, completeEquipmentMaintenance } from "@/action/api";
import {
  Wrench,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ChevronRight,
  Database
} from "lucide-react";

interface MaintenanceEquipment {
  id: string;
  kodeAlat: string;
  namaAlat: string;
  plant: string;
  lokasiPenyimpanan: string;
  tanggalMasukPemeliharaan: string;
  statusAset: string;
  statusId: number;
}

const INITIAL_MAINTENANCE_SAMPLES: MaintenanceEquipment[] = [];

export default function PerbaikanAlatPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<MaintenanceEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Toast State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<MaintenanceEquipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields State (Komponen Form FE-007)
  const [actualCost, setActualCost] = useState("0"); // Raw number string
  const [displayCost, setDisplayCost] = useState("Rp 0"); // Masked string e.g. "Rp 25.000.000"
  const [conditionId, setConditionId] = useState(""); // "1" for BAGUS, "2" for RUSAK RINGAN
  const [preservationStatus, setPreservationStatus] = useState(""); // "Preserved" or "Not Preserved"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadEquipments = async () => {
    setIsLoading(true);
    try {
      const data = await getEquipments();
      const completedIdsRaw: string[] = JSON.parse(localStorage.getItem("completed_maintenance_ids") || "[]");

      let completedIds = [...completedIdsRaw];
      if (Array.isArray(data)) {
        let cleaned = false;
        data.forEach((item: any) => {
          const isMaintenance =
            item.status_id === 6 ||
            item.status?.id === 6 ||
            String(item.status?.name || "").toUpperCase() === "MAINTENANCE" ||
            String(item.statusAset || "").toUpperCase() === "MAINTENANCE" ||
            String(item.statusAset || "").toUpperCase() === "DALAM_PERBAIKAN";
          if (isMaintenance && completedIds.includes(String(item.id))) {
            completedIds = completedIds.filter((id) => id !== String(item.id));
            cleaned = true;
          }
        });
        if (cleaned) {
          localStorage.setItem("completed_maintenance_ids", JSON.stringify(completedIds));
        }
      }

      let filteredData: MaintenanceEquipment[] = [];

      if (Array.isArray(data) && data.length > 0) {
        filteredData = data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => {
            const isMaintenance =
              item.status_id === 6 ||
              item.status?.id === 6 ||
              String(item.status?.name || "").toUpperCase() === "MAINTENANCE" ||
              String(item.statusAset || "").toUpperCase() === "MAINTENANCE" ||
              String(item.statusAset || "").toUpperCase() === "DALAM_PERBAIKAN";
            const isCompletedLocally = completedIds.includes(String(item.id));
            return isMaintenance || isCompletedLocally;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => {
            let locStr = item.plant || "-";
            if (item.storage_location?.name) {
              locStr = `${item.plant || ""} - ${item.storage_location.name}`;
            } else if (item.storage_location) {
              locStr = `${item.plant || ""} - ${item.storage_location}`;
            }

            const isCompletedLocally = completedIds.includes(String(item.id));

            return {
              id: String(item.id),
              kodeAlat: item.equipment_code || item.kodeAlat || "-",
              namaAlat: item.name || item.namaAlat || "-",
              plant: item.plant || "-",
              lokasiPenyimpanan: locStr,
              tanggalMasukPemeliharaan: item.updated_at
                ? new Date(item.updated_at).toISOString().split("T")[0]
                : item.created_at
                  ? new Date(item.created_at).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
              statusAset: isCompletedLocally ? "READY TO REUSE" : "MAINTENANCE",
              statusId: isCompletedLocally ? 5 : 6,
            };
          });
      }

      const sampleItems = INITIAL_MAINTENANCE_SAMPLES.map(sample => {
        if (completedIds.includes(sample.id)) {
          return { ...sample, statusAset: "READY TO REUSE", statusId: 5 };
        }
        return sample;
      }).filter(sample => !filteredData.some((f) => f.id === sample.id));

      const finalEquipmentList = [...filteredData, ...sampleItems];
      setEquipments(finalEquipmentList);
    } catch (err) {
      console.error("Error loading equipment maintenance data:", err);
      const completedIds: string[] = JSON.parse(localStorage.getItem("completed_maintenance_ids") || "[]");
      setEquipments(INITIAL_MAINTENANCE_SAMPLES.filter((s) => !completedIds.includes(s.id)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredEquipments = useMemo(() => {
    if (!searchQuery.trim()) return equipments;
    const q = searchQuery.toLowerCase();
    return equipments.filter(
      (item) =>
        item.kodeAlat.toLowerCase().includes(q) ||
        item.namaAlat.toLowerCase().includes(q) ||
        item.plant.toLowerCase().includes(q) ||
        item.lokasiPenyimpanan.toLowerCase().includes(q)
    );
  }, [equipments, searchQuery]);

  const ITEMS_PER_PAGE = 10;

  const paginatedEquipments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEquipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEquipments, currentPage]);

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE) || 1;

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");

    if (!rawVal) {
      setActualCost("0");
      setDisplayCost("Rp 0");
      return;
    }

    const numericVal = parseInt(rawVal, 10);
    setActualCost(numericVal.toString()); // Strip leading zeros
    const formatted = new Intl.NumberFormat("id-ID").format(numericVal);
    setDisplayCost(`Rp ${formatted}`);
  };

  const handleOpenModal = async (asset: MaintenanceEquipment) => {
    setSelectedAsset(asset);
    setActualCost("0");
    setDisplayCost("Rp 0");
    setConditionId("");
    setPreservationStatus("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedAsset(null);
    setModalError(null);
  };

  const isCostValid = useMemo(() => {
    if (!actualCost) return false;
    const num = parseFloat(actualCost);
    return !isNaN(num) && num >= 0 && /^\d+$/.test(actualCost);
  }, [actualCost]);

  const isConditionValid = useMemo(() => {
    return conditionId === "1" || conditionId === "2";
  }, [conditionId]);

  const isPreservationValid = useMemo(() => {
    return preservationStatus === "Preserved" || preservationStatus === "Not Preserved";
  }, [preservationStatus]);

  const isFormInvalid = !isCostValid || !isConditionValid || !isPreservationValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid || !selectedAsset || isSubmitting) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("actual_cost", actualCost);
      formData.append("condition_id", conditionId);
      formData.append("preservation_status", preservationStatus);

      const result = await completeEquipmentMaintenance(selectedAsset.id, formData);

      if (result.success) {
        setNotification({
          type: "success",
          message: "Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE",
        });

        const completedIds: string[] = JSON.parse(localStorage.getItem("completed_maintenance_ids") || "[]");
        if (!completedIds.includes(selectedAsset.id)) {
          completedIds.push(selectedAsset.id);
          localStorage.setItem("completed_maintenance_ids", JSON.stringify(completedIds));
        }

        setEquipments((prev) =>
          prev.map((item) =>
            item.id === selectedAsset.id
              ? { ...item, statusAset: "READY TO REUSE", statusId: 5 }
              : item
          )
        );
        setIsModalOpen(false);
        setSelectedAsset(null);

        setTimeout(() => {
          setNotification(null);
          router.push("/rendal/idle");
        }, 2000);
      } else {
        setNotification({
          type: "error",
          message: `Gagal menyelesaikan perbaikan: ${result.message || "Terjadi kesalahan pada server"}`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Terjadi kesalahan koneksi: ${err.message || "Gagal terhubung ke server"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-6 px-4 sm:px-6 lg:px-8 font-sans">

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md border ${notification.type === "success"
            ? "bg-gray-900 text-white border-emerald-500/30"
            : "bg-red-950 text-white border-red-500/40"
            }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold leading-tight">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Klasik Profesional Sesuai Design System Aplikasi */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Rendal Pemeliharaan</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#0A356A] font-semibold">Perbaikan Alat</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Daftar Perbaikan Aset</h1>
            <p className="text-sm text-gray-500 mt-1">
              Daftar seluruh peralatan yang saat ini berada dalam proses perbaikan (MAINTENANCE).
            </p>
          </div>
          <button
            onClick={loadEquipments}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Area Control Bar */}
      <div className="bg-white p-4 border border-gray-200 rounded-t shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode alat atau nama peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-right sm:text-left flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            {filteredEquipments.length === 0 
              ? "Menampilkan 0 peralatan"
              : `Menampilkan ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)} dari ${filteredEquipments.length} peralatan`
            }
          </span>
        </div>
      </div>

      {/* Tabel Klasik App (Persis seperti rendal/idle) */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center">NO</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center">KODE ALAT</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-left">NAMA PERALATAN</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-left">LOKASI PENYIMPANAN</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center whitespace-nowrap">TANGGAL MASUK</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2 className="w-6 h-6 text-[#0A356A] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">Memuat data peralatan...</p>
                  </td>
                </tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl mb-2">📄</span>
                      <p className="text-base font-bold text-gray-800">Tidak ada peralatan yang sesuai.</p>
                      <p className="text-xs text-gray-500 mt-1">Coba ubah kata kunci pencarian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEquipments.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-[#f8fafc] transition-colors">
                    {/* No */}
                    <td className="px-5 py-3 text-sm font-semibold text-gray-400 text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    {/* Kode Alat */}
                    <td className="px-5 py-3 text-sm font-semibold text-[#0A356A] whitespace-nowrap text-center">
                      {asset.kodeAlat}
                    </td>

                    {/* Nama Alat */}
                    <td className="px-5 py-3 text-sm font-medium text-gray-800" title={asset.namaAlat}>
                      {asset.namaAlat}
                    </td>

                    {/* Lokasi Penyimpanan */}
                    <td className="px-5 py-3 text-sm text-gray-600" title={asset.lokasiPenyimpanan}>
                      <div className="font-semibold text-gray-800 leading-tight">
                        {asset.plant || "-"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {asset.lokasiPenyimpanan && asset.lokasiPenyimpanan.includes(" - ")
                          ? asset.lokasiPenyimpanan.split(" - ").slice(1).join(" - ")
                          : asset.lokasiPenyimpanan || "-"}
                      </div>
                    </td>

                    {/* Tanggal Masuk Pemeliharaan */}
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap text-center">
                      {asset.tanggalMasukPemeliharaan}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      {asset.statusAset === "READY TO REUSE" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Selesai
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(asset)}
                          className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#0556B3] text-white px-3 py-1.5 rounded text-[10px] font-bold transition-all shadow-sm"
                          title="Selesaikan Perbaikan"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Selesaikan</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredEquipments.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-sm font-medium text-gray-500">
              Menampilkan {paginatedEquipments.length} data (Total {filteredEquipments.length})
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Modal Form Detail Realisasi Pemeliharaan (Persis seperti modal di rendal/idle) */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-[#0A356A]" />
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Pencatatan Hasil Perbaikan</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedAsset.kodeAlat} - {selectedAsset.namaAlat}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">

              <div className="bg-blue-50/50 border border-blue-100 rounded p-2.5 text-[11px] text-blue-800 leading-normal shadow-sm">
                Lengkapi detail realisasi perbaikan di bawah ini untuk mengubah status peralatan menjadi <strong>Ready to Reuse</strong>.
              </div>

              {/* Komponen 1: Biaya Aktual Perbaikan (Rupiah) */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Biaya Aktual Perbaikan (Rupiah) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayCost}
                  onChange={handleCostChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-mono"
                />
                <p className="text-[9px] text-gray-450 mt-0.5">
                  Format ketikan otomatis menjadi mata uang Rupiah.
                </p>
              </div>

              {/* Grid Komponen 2 & 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                {/* Komponen 2: Dropdown Kondisi Aset Setelah Perbaikan */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Kondisi Aset Setelah Perbaikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={conditionId}
                    onChange={(e) => setConditionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Kondisi --</option>
                    <option value="1">Bagus</option>
                    <option value="2">Rusak Ringan</option>
                  </select>
                  <p className="text-[9px] text-gray-500 mt-1 leading-tight">
                    Pilih kondisi fisik aktual aset setelah proses perbaikan selesai. Kondisi fisik tidak memengaruhi perubahan status aset menjadi READY TO REUSE.
                  </p>
                </div>

                {/* Komponen 3: Dropdown Status Preservasi Terbaru */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Status Preservasi Terbaru <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={preservationStatus}
                    onChange={(e) => setPreservationStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Preservasi --</option>
                    <option value="Preserved">Preserved</option>
                    <option value="Not Preserved">Not Preserved</option>
                  </select>
                  <p className="text-[9px] text-gray-500 mt-1 leading-tight">
                    Pilih apakah aset masih memerlukan preservasi setelah proses perbaikan selesai.
                  </p>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="mt-1 flex items-center justify-end gap-3 pt-2.5 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isFormInvalid || isSubmitting}
                  className="px-5 py-2 rounded bg-[#0A356A] hover:bg-[#0556B3] text-white text-xs font-bold transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? "Menyimpan..." : "Selesai Perbaikan"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}