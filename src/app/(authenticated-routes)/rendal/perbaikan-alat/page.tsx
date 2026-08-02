"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments, completeEquipmentMaintenance, getAttachmentsByEquipmentId } from "@/action/api";
import { 
  Wrench, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Upload, 
  X, 
  Loader2, 
  ChevronRight, 
  Database,
  Eye
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

const INITIAL_MAINTENANCE_SAMPLES: MaintenanceEquipment[] = [
  {
    id: "601",
    kodeAlat: "P-IB-PMP-102",
    namaAlat: "Pompa Centrifugal Boiler B-101",
    plant: "PUSRI-IB",
    lokasiPenyimpanan: "PUSRI-IB - Bengkel Pemeliharaan Sentral",
    tanggalMasukPemeliharaan: "2026-07-15",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "602",
    kodeAlat: "STG-1-GEN-004",
    namaAlat: "Turbin Generator STG-1 5MW",
    plant: "STG-1",
    lokasiPenyimpanan: "STG-1 - Area Pemeliharaan Utilitas",
    tanggalMasukPemeliharaan: "2026-07-18",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "603",
    kodeAlat: "P-IIB-COMP-201",
    namaAlat: "High Pressure Gas Compressor C-201",
    plant: "PUSRI-IIB",
    lokasiPenyimpanan: "PUSRI-IIB - Gudang Perbaikan Mekanik IIB",
    tanggalMasukPemeliharaan: "2026-07-22",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
];

export default function PerbaikanAlatPage() {
  const [equipments, setEquipments] = useState<MaintenanceEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Toast State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<MaintenanceEquipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Form Fields State (Komponen Form FE-007)
  const [actualCost, setActualCost] = useState("0"); // Raw number string
  const [displayCost, setDisplayCost] = useState("Rp 0"); // Masked string e.g. "Rp 25.000.000"
  const [conditionId, setConditionId] = useState(""); // "1" for BAGUS, "2" for RUSAK RINGAN
  const [preservationStatus, setPreservationStatus] = useState(""); // "Preserved" or "Not Preserved"
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const loadEquipments = async () => {
    setIsLoading(true);
    try {
      const data = await getEquipments();
      const completedIds: string[] = JSON.parse(localStorage.getItem("completed_maintenance_ids") || "[]");

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

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = useMemo(() => {
    return filteredEquipments.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredEquipments, currentPage]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenModal = async (asset: MaintenanceEquipment) => {
    setSelectedAsset(asset);
    setActualCost("0");
    setDisplayCost("Rp 0");
    setConditionId("");
    setPreservationStatus("");
    setUploadedFiles([]);
    setExistingFiles([]);
    setIsModalOpen(true);
    
    try {
      const files = await getAttachmentsByEquipmentId(asset.id);
      if (files && Array.isArray(files)) {
        setExistingFiles(files);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedAsset(null);
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

  const isFileValid = useMemo(() => {
    return uploadedFiles.length > 0 || existingFiles.length > 0;
  }, [uploadedFiles, existingFiles]);

  const isFormInvalid = !isCostValid || !isConditionValid || !isPreservationValid || !isFileValid;

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

      uploadedFiles.forEach((file) => {
        formData.append("proof_document", file);
        formData.append("file", file);
        formData.append("bukti_bayar", file);
      });

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
        }, 4000);
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
    <div className="max-w-7xl mx-auto pt-4 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div 
          className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md border ${
            notification.type === "success" 
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
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Area Control Bar */}
      <div className="bg-white p-4 border border-gray-200 rounded-t-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Kode atau Nama Alat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] transition-all outline-none"
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

        <div className="text-xs text-gray-500 font-semibold self-end sm:self-center">
          Total Peralatan: <span className="font-bold text-[#0A356A] text-sm">{filteredEquipments.length}</span>
        </div>
      </div>

      {/* Tabel Klasik App (Persis seperti rendal/idle) */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">KODE ALAT</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">NAMA PERALATAN</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">LOKASI PENYIMPANAN</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">TGL MASUK PEMELIHARAAN</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">STATUS</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2 className="w-6 h-6 text-[#0A356A] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">Memuat data peralatan dalam perbaikan...</p>
                  </td>
                </tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Database className="w-8 h-8 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-800">Tidak ada peralatan ditemukan</p>
                      <p className="text-sm text-gray-500 mt-1">Tidak ada peralatan yang sedang dalam perbaikan atau cocok dengan pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEquipments.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#f8fafc] transition-colors">
                    {/* Kode Alat */}
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#0A356A] whitespace-nowrap">
                      {asset.kodeAlat}
                    </td>

                    {/* Nama Alat */}
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                      {asset.namaAlat}
                    </td>

                    {/* Lokasi Penyimpanan */}
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {asset.lokasiPenyimpanan}
                    </td>

                    {/* Tgl Masuk Pemeliharaan */}
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      {asset.tanggalMasukPemeliharaan}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        asset.statusAset === "READY TO REUSE" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-orange-100 text-orange-800 border-orange-200"
                      }`}>
                        {asset.statusAset || "MAINTENANCE"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      {asset.statusAset === "READY TO REUSE" ? (
                        <div className="flex justify-end">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <CheckCircle2 className="w-4 h-4" />
                            Selesai
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(asset)}
                          className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#082850] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ml-auto"
                          title="Selesaikan Perbaikan"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Selesaikan Perbaikan</span>
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
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-[12px] font-medium text-gray-500">
              Menampilkan {filteredEquipments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)} dari {filteredEquipments.length} data (10 baris/halaman)
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md text-[12px] font-bold flex items-center justify-center transition-colors ${
                        currentPage === page
                          ? "bg-[#0A356A] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form Detail Realisasi Pemeliharaan (Persis seperti modal di rendal/idle) */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
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
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed shadow-sm">
                Unggah bukti biaya dan lengkapi detail realisasi perbaikan di bawah ini untuk mengubah status peralatan menjadi <strong>Ready to Reuse</strong>.
              </div>

              {/* Komponen 1: Biaya Aktual Perbaikan (Rupiah) */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Biaya Aktual Perbaikan (Rupiah) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayCost}
                  onChange={handleCostChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Format ketikan otomatis menjadi mata uang Rupiah.
                </p>
              </div>

              {/* Grid Komponen 2 & 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Komponen 2: Dropdown Kondisi Fisik Pasca-Perbaikan */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Kondisi Fisik Pasca-Perbaikan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={conditionId}
                    onChange={(e) => setConditionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Kondisi --</option>
                    <option value="1">BAGUS</option>
                    <option value="2">RUSAK RINGAN</option>
                  </select>
                </div>

                {/* Komponen 3: Dropdown Status Preservasi Terbaru */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Status Preservasi Terbaru <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={preservationStatus}
                    onChange={(e) => setPreservationStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Pilih Preservasi --</option>
                    <option value="Preserved">Preserved</option>
                    <option value="Not Preserved">Not Preserved</option>
                  </select>
                </div>

              </div>

              {/* Komponen 4: Unggah Berkas Bukti Bayar / Dokumen SPK */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Unggah Berkas Bukti Bayar / Dokumen SPK <span className="text-red-500">*</span>
                </label>
                
                <div className={`border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center ${(uploadedFiles.length > 0 || existingFiles.length > 0) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-400'}`}>
                  
                  {/* File Previews Grid */}
                  {(uploadedFiles.length > 0 || existingFiles.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 w-full">
                      {existingFiles.map((file, idx) => {
                        const isImage = file.type?.startsWith("image/") || file.file_url?.match(/\.(jpg|jpeg|png)$/i) || file.name?.match(/\.(jpg|jpeg|png)$/i);
                        return (
                          <div 
                            key={`existing-${idx}`} 
                            className="relative group bg-white border border-blue-200 rounded-lg overflow-hidden flex flex-col shadow-sm"
                          >
                            {isImage ? (
                              <div 
                                className="w-full h-20 bg-gray-100 flex-shrink-0 cursor-pointer relative group/img overflow-hidden"
                                onClick={() => setPreviewImageUrl(file.file_url || file.url)}
                              >
                                <img src={file.file_url || file.url} alt="preview" className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-20 bg-gray-50 flex items-center justify-center flex-shrink-0 border-b border-gray-100">
                                <FileText className="w-8 h-8 text-[#0A356A]" />
                              </div>
                            )}
                            <div className="p-1.5 flex flex-col bg-white">
                              <span className="font-semibold text-gray-800 text-[10px] truncate">{file.name || "Dokumen"}</span>
                              <span className="text-[9px] text-gray-500">Dari Database</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-white/90 backdrop-blur text-gray-600 hover:text-red-600 p-1 rounded-md shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {uploadedFiles.map((file, idx) => {
                        const isImage = file.type.startsWith("image/");
                        return (
                          <div 
                            key={idx} 
                            className="relative group bg-white border border-blue-200 rounded-lg overflow-hidden flex flex-col shadow-sm"
                          >
                            {isImage ? (
                              <div 
                                className="w-full h-20 bg-gray-100 flex-shrink-0 cursor-pointer relative group/img overflow-hidden"
                                onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-20 bg-gray-50 flex items-center justify-center flex-shrink-0 border-b border-gray-100">
                                <FileText className="w-8 h-8 text-[#0A356A]" />
                              </div>
                            )}
                            <div className="p-1.5 flex flex-col bg-white">
                              <span className="font-semibold text-gray-800 text-[10px] truncate">{file.name}</span>
                              <span className="text-[9px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="absolute top-1 right-1 bg-white/90 backdrop-blur text-gray-600 hover:text-red-600 p-1 rounded-md shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload Trigger Area */}
                  <label className="flex flex-col items-center justify-center text-center cursor-pointer w-full">
                    {uploadedFiles.length === 0 ? (
                      <>
                        <Upload className="w-5 h-5 text-gray-400 mb-1.5" />
                        <span className="text-xs font-bold text-gray-700">Pilih file bukti bayar / dokumen SPK</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Mendukung format PDF, JPG, PNG. Minimal 1 berkas.</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A356A] bg-white px-3 py-1.5 rounded border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Tambah Berkas Lagi
                      </div>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isFormInvalid || isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-xs font-bold transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Image Preview Lightbox */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImageUrl(null)}>
          <button 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImageUrl} 
            alt="Full Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </div>
  );
}