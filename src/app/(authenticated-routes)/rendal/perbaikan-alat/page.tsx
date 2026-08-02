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
    namaAlat: "Turbine Gas Generator Unit 3 Area Ammonia Plant P- III...",
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
  {
    id: "604",
    kodeAlat: "P-IB-PMP-001",
    namaAlat: "Centrifugal Pump 150HP",
    plant: "PUSRI-IB",
    lokasiPenyimpanan: "PUSRI-IB - Pabrik III",
    tanggalMasukPemeliharaan: "2026-08-02",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "605",
    kodeAlat: "P-III-MOT-010",
    namaAlat: "Electric Motor 200kW",
    plant: "PUSRI-III",
    lokasiPenyimpanan: "PUSRI-III - Pabrik IV",
    tanggalMasukPemeliharaan: "2026-07-27",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "606",
    kodeAlat: "P-II-PMP-105",
    namaAlat: "Boiler Feed Pump BFP-102",
    plant: "PUSRI-II",
    lokasiPenyimpanan: "PUSRI-II - Area Utility Boiler",
    tanggalMasukPemeliharaan: "2026-07-20",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "607",
    kodeAlat: "P-IB-GEN-002",
    namaAlat: "Diesel Generator Backup 1.2MW",
    plant: "PUSRI-IB",
    lokasiPenyimpanan: "PUSRI-IB - Power Station",
    tanggalMasukPemeliharaan: "2026-07-25",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "608",
    kodeAlat: "P-IV-COMP-302",
    namaAlat: "Ammonia Gas Compressor C-302",
    plant: "PUSRI-IV",
    lokasiPenyimpanan: "PUSRI-IV - Ammonia Plant",
    tanggalMasukPemeliharaan: "2026-07-30",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "609",
    kodeAlat: "P-IIB-FAN-101",
    namaAlat: "Induced Draft Fan ID-FAN-101",
    plant: "PUSRI-IIB",
    lokasiPenyimpanan: "PUSRI-IIB - Utility Boiler",
    tanggalMasukPemeliharaan: "2026-08-01",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
  {
    id: "610",
    kodeAlat: "P-III-TUR-202",
    namaAlat: "Steam Turbine Drive ST-202",
    plant: "PUSRI-III",
    lokasiPenyimpanan: "PUSRI-III - Ammonia Synthesis Loop",
    tanggalMasukPemeliharaan: "2026-07-29",
    statusAset: "MAINTENANCE",
    statusId: 6,
  },
];

export default function PerbaikanAlatPage() {
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

  const paginatedEquipments = useMemo(() => {
    const startIndex = (currentPage - 1) * 5;
    return filteredEquipments.slice(startIndex, startIndex + 5);
  }, [filteredEquipments, currentPage]);

  const totalPages = Math.ceil(filteredEquipments.length / 5) || 1;

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
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      
      if (oversizedFiles.length > 0) {
        setNotification({
          type: "error",
          message: `Gagal mengunggah: Ukuran berkas "${oversizedFiles[0].name}" melebihi batas maksimal 5MB.`,
        });
        // Clear input value so it can trigger change event again
        e.target.value = "";
        return;
      }
      
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
    <div className="max-w-7xl mx-auto pt-2 pb-6 px-4 sm:px-6 lg:px-8 font-sans">

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md border ${notification.type === "success"
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
      <div className="mb-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>Rendal Pemeliharaan</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A356A] font-semibold">Perbaikan Alat</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-[#0A356A] tracking-tight">Daftar Perbaikan Aset</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Daftar seluruh peralatan yang saat ini berada dalam proses perbaikan (MAINTENANCE).
            </p>
          </div>
          <button
            onClick={loadEquipments}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50 h-10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Area Control Bar */}
      <div className="bg-white p-3 border border-gray-200 rounded-t-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode alat atau nama peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] transition-all outline-none h-12 font-medium"
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
          <span className="text-sm font-bold text-[#0A356A] bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-100 h-10 inline-flex items-center shadow-sm">
            {filteredEquipments.length === 0 
              ? "Menampilkan 0 peralatan"
              : `Menampilkan ${(currentPage - 1) * 5 + 1}–${Math.min(currentPage * 5, filteredEquipments.length)} dari ${filteredEquipments.length} peralatan`
            }
          </span>
        </div>
      </div>

      {/* Tabel Klasik App (Persis seperti rendal/idle) */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 h-12">
                <th className="px-3 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-center w-[5%] sticky top-0 bg-gray-100 z-10 border-b border-gray-200">NO</th>
                <th className="px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-center w-[15%] sticky top-0 bg-gray-100 z-10 border-b border-gray-200">KODE ALAT</th>
                <th className="px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-left w-[33%] sticky top-0 bg-gray-100 z-10 border-b border-gray-200">NAMA PERALATAN</th>
                <th className="px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-left w-[30%] sticky top-0 bg-gray-100 z-10 border-b border-gray-200">LOKASI PENYIMPANAN</th>
                <th className="px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-center w-[12%] whitespace-nowrap sticky top-0 bg-gray-100 z-10 border-b border-gray-200">TANGGAL MASUK</th>
                <th className="px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide text-center w-[10%] sticky top-0 bg-gray-100 z-10 border-b border-gray-200">AKSI</th>
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
                  <td colSpan={6} className="px-5 py-12 text-center bg-white">
                    <div className="flex flex-col items-center justify-center py-4">
                      <span className="text-3xl mb-2">📄</span>
                      <p className="text-base font-bold text-gray-800">Tidak ada peralatan yang sesuai.</p>
                      <p className="text-xs text-gray-500 mt-1">Coba ubah kata kunci pencarian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEquipments.map((asset, index) => (
                  <tr
                    key={asset.id}
                    className={`transition-colors border-b border-gray-100 h-[60px] ${index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                      } hover:bg-[#F8FBFF]`}
                  >
                    {/* No */}
                    <td className="px-3 py-2 text-sm font-semibold text-gray-400 text-center w-[5%]">
                      {(currentPage - 1) * 5 + index + 1}
                    </td>

                    {/* Kode Alat */}
                    <td className="px-5 py-2 text-sm font-extrabold text-[#0A356A] whitespace-nowrap overflow-hidden text-ellipsis w-[15%] text-center">
                      {asset.kodeAlat}
                    </td>

                    {/* Nama Alat */}
                    <td className="px-5 py-2 text-sm font-bold text-gray-800 w-[33%] text-left whitespace-normal break-words" title={asset.namaAlat}>
                      <div className="leading-snug">
                        {asset.namaAlat}
                      </div>
                    </td>

                    {/* Lokasi Penyimpanan */}
                    <td className="px-5 py-2 text-sm text-gray-700 w-[30%] text-left whitespace-normal break-words" title={asset.lokasiPenyimpanan}>
                      <div className="font-extrabold text-gray-900 leading-tight">
                        {asset.plant || "-"}
                      </div>
                      <div className="text-xs text-gray-500 font-semibold mt-0.5 leading-snug">
                        {asset.lokasiPenyimpanan && asset.lokasiPenyimpanan.includes(" - ")
                          ? asset.lokasiPenyimpanan.split(" - ").slice(1).join(" - ")
                          : asset.lokasiPenyimpanan || "-"}
                      </div>
                    </td>

                    {/* Tanggal Masuk Pemeliharaan */}
                    <td className="px-5 py-2 text-sm text-gray-650 whitespace-nowrap overflow-hidden text-ellipsis w-[12%] text-center">
                      {asset.tanggalMasukPemeliharaan}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-2 whitespace-nowrap w-[10%] text-center">
                      {asset.statusAset === "READY TO REUSE" ? (
                        <div className="flex justify-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 h-10 rounded-lg border border-green-200 w-full">
                            <CheckCircle2 className="w-4 h-4" />
                            Selesai
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(asset)}
                          className="inline-flex items-center justify-center gap-2 bg-[#0A356A] hover:bg-[#082850] text-white px-4 rounded-lg text-xs font-bold transition-all shadow-sm mx-auto h-10 w-full"
                          title="Selesaikan Perbaikan"
                        >
                          <Wrench className="w-4 h-4" />
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
      </div>

      {/* Pagination Controls */}
      {filteredEquipments.length > 5 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center h-10 px-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-sm"
          >
            &lt; Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold border transition-all shadow-sm ${
                currentPage === page
                  ? "bg-[#0A356A] border-[#0A356A] text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center h-10 px-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next &gt;
          </button>
        </div>
      )}

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
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-[11px] text-blue-800 leading-normal shadow-sm">
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-mono"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
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

              {/* Komponen 4: Unggah Berkas Bukti Bayar / Dokumen SPK */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Unggah Berkas Bukti Bayar / Dokumen SPK <span className="text-red-500">*</span>
                </label>

                <div className={`border-2 border-dashed rounded-lg p-3 transition-colors flex flex-col items-center justify-center ${(uploadedFiles.length > 0 || existingFiles.length > 0) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300 bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-400'}`}>

                  {/* File Previews Grid */}
                  {(uploadedFiles.length > 0 || existingFiles.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 w-full">
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
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-700">Pilih berkas bukti bayar / dokumen SPK</span>
                        <span className="text-[9px] text-gray-400 mt-0.5">Mendukung PDF, JPG, PNG. Maksimal 5MB.</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A356A] bg-white px-3 py-1.5 rounded border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Tambah Berkas
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
              <div className="mt-1 flex items-center justify-end gap-3 pt-2.5 border-t border-gray-100">
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