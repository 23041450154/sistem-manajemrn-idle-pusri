"use client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama.
   Upgrade path: generate types dari swagger_dump.json backend. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createReuseRequest, getAttachmentsByEquipmentId } from "@/action/api";
import { statusBadgeStyle, statusText } from "@/lib/equipment-status";
import {
  Search,
  Eye,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Info,
} from "lucide-react";

export interface EquipmentItem {
  id: string;
  equipment_code: string;
  name: string;
  plant: string;
  plant_description?: string;
  object_type_name: string;
  status_name: string;
  condition_name: string;
  storage_location?: string;
  serial_number?: string;
  vendor?: string;
  year_of_purchase?: number;
  book_value?: number;
  original_value?: number;
  estimated_reuse_value?: number;
  specifications?: string;
  capacity?: string;
  notes?: string;
  created_at?: string;
  raw_data?: any;
}

export interface ReuseRequestItem {
  id: string;
  request_number: string;
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  requesting_unit: string;
  installation_location: string;
  target_plant: string;
  start_date: string;
  end_date?: string;
  justification: string;
  estimated_cost_avoidance?: number;
  contact_person: string;
  contact_npp?: string;
  contact_phone?: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  created_at: string;
}

/** Client Component: interaksi katalog/riwayat reuse — data di-fetch Server Component. */
export default function UnitKerjaIdleClient({
  equipments,
  reuseRequests,
  currentUser,
}: {
  equipments: EquipmentItem[];
  reuseRequests: ReuseRequestItem[];
  currentUser: { name?: string; npp?: string } | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"katalog" | "permintaan">(
    "katalog",
  );
  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EquipmentItem;
    direction: "asc" | "desc";
  } | null>(null);

  // Modals
  const [detailModalItem, setDetailModalItem] = useState<EquipmentItem | null>(
    null,
  );
  const [reuseModalItem, setReuseModalItem] = useState<EquipmentItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Attachment States
  const [attachments, setAttachments] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Reuse Form State
  const [formData, setFormData] = useState({
    request_number: "",
    installation_location: "",
    target_plant: "",
    start_date: "",
    end_date: "",
    justification: "",
    estimated_cost_avoidance: 0,
    contact_person: "",
    contact_npp: "",
    contact_phone: "",
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const tableElem = document.getElementById("katalog-table-container");
      if (tableElem) {
        tableElem.scrollIntoView({
          behavior: "instant" as ScrollBehavior,
          block: "start",
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Filter List Options
  const plantOptions = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((eq) => {
      if (typeof eq.plant === "string") set.add(eq.plant);
    });
    return ["Semua", ...Array.from(set)];
  }, [equipments]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((eq) => {
      if (typeof eq.object_type_name === "string") set.add(eq.object_type_name);
    });
    return ["Semua", ...Array.from(set)];
  }, [equipments]);

  // Filtered Equipment Data
  const filteredEquipments = useMemo(() => {
    const filtered = equipments.filter((eq) => {
      const matchSearch =
        search === "" ||
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.equipment_code.toLowerCase().includes(search.toLowerCase()) ||
        eq.plant.toLowerCase().includes(search.toLowerCase());

      const matchPlant =
        selectedPlant === "Semua" || eq.plant === selectedPlant;
      const matchCategory =
        selectedCategory === "Semua" ||
        eq.object_type_name === selectedCategory;
      const matchStatus =
        selectedStatus === "Semua" || eq.status_name === selectedStatus;

      return matchSearch && matchPlant && matchCategory && matchStatus;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = String(a[sortConfig!.key]).toLowerCase();
        const valB = String(b[sortConfig!.key]).toLowerCase();
        if (valA < valB) return sortConfig!.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig!.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      filtered.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
    }

    return filtered;
  }, [
    equipments,
    search,
    selectedPlant,
    selectedCategory,
    selectedStatus,
    sortConfig,
  ]);

  // Pagination Logic — reset halaman saat filter berubah (adjust during render,
  // pola resmi React pengganti setState-in-effect).
  const filterKey = `${search}|${selectedPlant}|${selectedStatus}|${selectedCategory}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const paginatedEquipments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEquipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEquipments, currentPage]);

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);

  // Reset Filter
  const resetFilter = () => {
    setSearchInput("");
    setSearch("");
    setSelectedPlant("Semua");
    setSelectedStatus("Semua");
    setSelectedCategory("Semua");
    setCurrentPage(1);
    setSortConfig(null);
  };

  // Sorting
  const handleSort = (key: keyof EquipmentItem) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EquipmentItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
    );
  };

  const loadAttachments = async (equipmentId: string) => {
    setAttachments([]);
    try {
      const res = await getAttachmentsByEquipmentId(equipmentId);
      if (res && Array.isArray(res)) {
        setAttachments(res);
      }
    } catch (e) {
      console.error("Gagal memuat attachment foto:", e);
    }
  };

  // Handle Form Open
  const handleOpenReuseModal = (item: EquipmentItem) => {
    setReuseModalItem(item);
    loadAttachments(item.id);
    const generatedReqNum = `REQ-REUSE/PUSRI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      request_number: generatedReqNum,
      installation_location: "",
      target_plant: item.plant,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      justification: "",
      estimated_cost_avoidance: item.estimated_reuse_value || 0,
      // Prefill kontak dari user yang login — bukan kontak fiktif.
      contact_person: currentUser?.name || "",
      contact_npp: currentUser?.npp ? String(currentUser.npp) : "",
      contact_phone: "",
    });
  };

  // Handle Submit Form
  const handleSubmitReuseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuseModalItem) return;

    if (!formData.justification.trim()) {
      showNotification(
        "error",
        "Harap isi tujuan penggunaan / justifikasi proyek.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        equipment_id: reuseModalItem.id,
        equipmentId: Number(reuseModalItem.id),
        request_number: formData.request_number,
        requestNumber: formData.request_number,
        installation_location: formData.installation_location,
        installationLocation: formData.installation_location,
        requesting_unit: formData.installation_location,
        target_plant: formData.target_plant,
        targetPlant: formData.target_plant,
        start_date: formData.start_date,
        reuse_date: formData.start_date,
        reuseDate: formData.start_date,
        justification: formData.justification,
        estimated_cost_avoidance:
          Number(formData.estimated_cost_avoidance) || 0,
        estimatedCostAvoidance: Number(formData.estimated_cost_avoidance) || 0,
        contact_person: formData.contact_person,
        contact_npp: formData.contact_npp,
        contact_phone: formData.contact_phone,
      };

      const res = await createReuseRequest(payload);
      if (res.success) {
        showNotification(
          "success",
          res.message || "Permintaan reuse berhasil dikirim!",
        );

        // Server action sudah revalidateApp(); tarik payload RSC terbaru
        // (katalog otomatis menyaring aset yang sudah diajukan, riwayat bertambah).
        router.refresh();
        setReuseModalItem(null);
      } else {
        showNotification(
          "error",
          res.message || "Gagal mengirim pengajuan reuse.",
        );
      }
    } catch (err) {
      showNotification(
        "error",
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat pengajuan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teks badge = nama status dari backend apa adanya (lihat lib/equipment-status).
  const getStatusBadge = (status: string) => (
    <span
      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadgeStyle(status)}`}
    >
      {statusText(status) || "-"}
    </span>
  );

  const getActionButton = (item: EquipmentItem) => {
    return (
      <div className="flex flex-wrap items-center gap-1 justify-center w-full max-w-[120px] mx-auto">
        <button
          title="Detail"
          onClick={() => {
            setDetailModalItem(item);
            loadAttachments(item.id);
          }}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-0.5 rounded transition-colors flex flex-col items-center"
        >
          <Eye className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[8px] font-bold">Detail</span>
        </button>
        <button
          title="Ajukan Reuse"
          onClick={() => handleOpenReuseModal(item)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded transition-colors flex flex-col items-center"
        >
          <Send className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[8px] font-bold">Ajukan</span>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-[13px] font-medium">
            {notification.message}
          </span>
        </div>
      )}

      {/* Action Notification Banner */}
      {equipments.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-[13px] text-blue-900 font-medium">
              Terdapat{" "}
              <strong className="font-bold">
                {equipments.length} aset Ready to Use
              </strong>{" "}
              dan{" "}
              <strong className="font-bold">
                {reuseRequests.length} permintaan
              </strong>{" "}
              sudah diajukan.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("katalog")}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                activeTab === "katalog"
                  ? "bg-[#0A356A] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Katalog ({filteredEquipments.length})
            </button>
            <button
              onClick={() => setActiveTab("permintaan")}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all relative ${
                activeTab === "permintaan"
                  ? "bg-[#0A356A] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat ({reuseRequests.length})
              {reuseRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -right-1 border border-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "katalog" ? (
        <div
          id="katalog-table-container"
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4"
        >
          {/* Toolbar / Filters */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex flex-nowrap items-end gap-2 overflow-x-auto pb-0.5">
              {/* Search Box Group (Input + Button Cari) */}
              <div className="flex-1 min-w-[240px] shrink-0">
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                  Cari Equipment
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Masukkan kode atau nama alat..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSearch(searchInput)
                      }
                      className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-gray-300 rounded-md focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 h-[34px]"
                    />
                  </div>
                  <button
                    onClick={() => setSearch(searchInput)}
                    className="px-3.5 py-1.5 bg-[#0A356A] text-white text-[12px] font-bold rounded-md hover:bg-[#062854] transition-colors whitespace-nowrap shadow-xs h-[34px]"
                  >
                    Cari
                  </button>
                </div>
              </div>

              {/* Plant Filter */}
              <div className="w-[125px] shrink-0">
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                  Plant
                </label>
                <select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-gray-300 rounded-md focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-800 font-medium cursor-pointer h-[34px]"
                >
                  {plantOptions.map((p) => (
                    <option key={p} value={p}>
                      {p === "Semua" ? "Semua Plant" : p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="w-[135px] shrink-0">
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-gray-300 rounded-md focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-800 font-medium cursor-pointer h-[34px]"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c === "Semua" ? "Semua Kategori" : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-[120px] shrink-0">
                <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-gray-300 rounded-md focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-800 font-medium cursor-pointer h-[34px]"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="READY_TO_USE">READY TO USE</option>
                </select>
              </div>

              {/* Action: Reset */}
              <div className="shrink-0">
                <button
                  onClick={resetFilter}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap h-[34px]"
                  title="Reset semua filter"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center w-[30px]">
                    No.
                  </th>
                  <th
                    className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap"
                    title="Klik untuk mengurutkan"
                    onClick={() => handleSort("equipment_code")}
                  >
                    <div className="flex items-center">
                      Kode {getSortIcon("equipment_code")}
                    </div>
                  </th>
                  <th
                    className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                    title="Klik untuk mengurutkan"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nama Equipment {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                    title="Klik untuk mengurutkan"
                    onClick={() => handleSort("plant")}
                  >
                    <div className="flex items-center">
                      Plant {getSortIcon("plant")}
                    </div>
                  </th>
                  <th
                    className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                    title="Klik untuk mengurutkan"
                    onClick={() => handleSort("object_type_name")}
                  >
                    <div className="flex items-center">
                      Kategori {getSortIcon("object_type_name")}
                    </div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th
                    className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                    title="Klik untuk mengurutkan"
                    onClick={() => handleSort("status_name")}
                  >
                    <div className="flex items-center">
                      Status {getSortIcon("status_name")}
                    </div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Nilai Estimasi
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedEquipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-900">
                          Data Tidak Ditemukan
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Coba sesuaikan filter pencarian Anda.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEquipments.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-1.5 py-1 text-center text-[10px] text-gray-500 font-medium">
                        {index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
                      </td>
                      <td className="px-1.5 py-1 whitespace-nowrap text-[10px] font-bold text-[#0A356A]">
                        {item.equipment_code}
                      </td>
                      <td className="px-1.5 py-1">
                        <div
                          className="text-[10px] font-medium text-gray-700 leading-tight line-clamp-2"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                      </td>
                      <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                        {item.plant}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                        {item.object_type_name}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                        {item.storage_location}
                      </td>
                      <td className="px-1.5 py-1">
                        {getStatusBadge(item.status_name)}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] font-bold text-gray-900">
                        Rp{" "}
                        {(item.estimated_reuse_value || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-1.5 py-1 text-center">
                        <div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                          {getActionButton(item)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredEquipments.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Menampilkan{" "}
                <strong className="font-semibold text-gray-900">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </strong>{" "}
                -{" "}
                <strong className="font-semibold text-gray-900">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredEquipments.length,
                  )}
                </strong>{" "}
                dari{" "}
                <strong className="font-semibold text-gray-900">
                  {filteredEquipments.length}
                </strong>{" "}
                alat
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 text-[11px] rounded font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#0A356A] text-white"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-[11px] border border-gray-300 rounded bg-[#0A356A] text-white font-semibold hover:bg-[#062854] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: RIWAYAT PERMINTAAN REUSE */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Daftar Permintaan Reuse
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Riwayat permohonan penggunaan kembali peralatan yang telah
                diajukan ke Rendal.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("katalog")}
              className="px-3 py-1.5 bg-[#0A356A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#062854] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Pengajuan Baru
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center w-[30px]">
                    No.
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    No. Pengajuan
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Lokasi Instalasi
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Target Plant
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Justifikasi
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Tgl Pengajuan
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {reuseRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <FileSpreadsheet className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-900">
                          Belum Ada Permintaan Reuse
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Anda belum pernah mengajukan permohonan peminjaman
                          peralatan idle.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reuseRequests.map((req, index) => (
                    <tr
                      key={req.id}
                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/80 transition-colors align-middle font-bold"
                    >
                      <td className="px-2 py-2 text-center text-[10px] text-gray-700 font-bold">
                        {index + 1}
                      </td>
                      <td className="px-2 py-2 font-mono font-bold text-blue-700 text-[10px] whitespace-nowrap">
                        {req.request_number}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-900 leading-tight">
                            {req.equipment_name}
                          </span>
                          <span className="text-[9px] text-gray-600 mt-0.5 font-mono font-bold">
                            {req.equipment_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 font-bold text-gray-900 text-[10px]">
                        {req.installation_location || req.requesting_unit}
                      </td>
                      <td className="px-2 py-2 text-gray-900 text-[10px] font-bold whitespace-nowrap">
                        {req.target_plant}
                      </td>
                      <td className="px-2 py-2">
                        <div
                          className="text-[10px] text-gray-900 leading-tight max-w-[240px] line-clamp-2 font-bold"
                          title={req.justification}
                        >
                          {req.justification}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-700 text-[10px] whitespace-nowrap font-mono font-bold">
                        {new Date(req.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                          Menunggu Review
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETAIL EQUIPMENT */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDetailModalItem(null)}
          />

          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-900">
                  Detail Peralatan
                </h3>
                <span className="text-gray-300">|</span>
                <span className="text-[13px] font-mono font-bold text-[#0A356A]">
                  {detailModalItem.equipment_code}
                </span>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-gray-50/50">
              {/* Card Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Nama Alat
                  </span>
                  <h4 className="text-base font-bold text-gray-900 leading-tight">
                    {detailModalItem.name}
                  </h4>
                  <p className="text-[12px] text-gray-500 mt-1 font-medium">
                    {detailModalItem.plant_description}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Status Ketersediaan
                  </span>
                  {getStatusBadge(detailModalItem.status_name)}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                  <h5 className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider border-b border-gray-100 pb-2">
                    Informasi Umum
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <span className="text-gray-500 font-medium">Kategori:</span>
                    <span className="font-semibold text-gray-900">
                      {detailModalItem.object_type_name}
                    </span>

                    <span className="text-gray-500 font-medium">
                      Lokasi Simpan:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {detailModalItem.storage_location}
                    </span>

                    <span className="text-gray-500 font-medium">
                      Serial Number:
                    </span>
                    <span className="font-mono font-medium text-gray-800">
                      {detailModalItem.serial_number}
                    </span>

                    <span className="text-gray-500 font-medium">
                      Manufaktur/Vendor:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {detailModalItem.vendor}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                  <h5 className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider border-b border-gray-100 pb-2">
                    Nilai Aset & Estimasi
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <span className="text-gray-500 font-medium">
                      Tahun Perolehan:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {detailModalItem.year_of_purchase}
                    </span>

                    <span className="text-gray-500 font-medium">
                      Nilai Buku:
                    </span>
                    <span className="font-semibold text-gray-900">
                      Rp{" "}
                      {(detailModalItem.book_value || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>

                    <span className="text-gray-500 font-medium">
                      Nilai Perolehan:
                    </span>
                    <span className="font-semibold text-gray-900">
                      Rp{" "}
                      {(detailModalItem.original_value || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>

                    <span className="text-gray-500 font-semibold text-emerald-700">
                      Est. Reuse Value:
                    </span>
                    <span className="font-bold text-emerald-700">
                      Rp{" "}
                      {(
                        detailModalItem.estimated_reuse_value || 0
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs & Notes */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                <h5 className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider border-b border-gray-100 pb-2">
                  Spesifikasi & Kondisi
                </h5>

                <div>
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">
                    Spesifikasi Teknik:
                  </span>
                  <p className="text-[12px] text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200 leading-relaxed font-mono">
                    {detailModalItem.specifications}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">
                    Catatan Kondisi Operasional:
                  </span>
                  <p className="text-[12px] text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200 leading-relaxed">
                    {detailModalItem.notes}
                  </p>
                </div>
              </div>

              {/* Lampiran Foto */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h5 className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
                  Foto Registrasi Peralatan
                </h5>
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {attachments.map((att: any, idx: number) => (
                      <div
                        key={idx}
                        className="h-28 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                        onClick={() => setPreviewImage(att.file_url || att.url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
                        <img
                          src={att.file_url || att.url}
                          alt={`Lampiran ${idx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium">
                          Lihat Foto
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-500 italic">
                    Belum ada foto registrasi yang dilampirkan.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const item = detailModalItem;
                  setDetailModalItem(null);
                  handleOpenReuseModal(item);
                }}
                className="px-5 py-2 rounded-lg text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#062854] transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                Ajukan Reuse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULIR PENGAJUAN REUSE */}
      {reuseModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setReuseModalItem(null)}
          />

          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">
                  Formulir Pengajuan Reuse
                </h2>
                <span className="text-gray-300">|</span>
                <span className="text-[13px] font-semibold text-[#0A356A]">
                  {reuseModalItem.equipment_code}
                </span>
              </div>
              <button
                onClick={() => setReuseModalItem(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
              {/* Asset Info Ribbon */}
              <div className="bg-[#f0f7ff] border border-blue-100 rounded-lg p-3 mb-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 flex items-center gap-5 overflow-hidden">
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">
                      Nama Peralatan
                    </span>
                    <span className="font-bold text-[13px] text-blue-900 truncate">
                      {reuseModalItem.name}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">
                      Plant Asal
                    </span>
                    <span className="font-bold text-[13px] text-blue-900">
                      {reuseModalItem.plant}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">
                      Estimasi Nilai
                    </span>
                    <span className="font-bold text-[13px] text-blue-900">
                      Rp{" "}
                      {(
                        reuseModalItem.estimated_reuse_value || 0
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  <div className="flex flex-col gap-1 border-l border-blue-200 pl-4">
                    <span className="text-[9px] font-bold text-blue-700/60 uppercase block">
                      Foto Registrasi
                    </span>
                    <div className="flex gap-1.5">
                      {attachments.length > 0 ? (
                        attachments.slice(0, 2).map((att: any, idx: number) => (
                          <div
                            key={idx}
                            className="h-10 w-14 bg-white rounded border border-blue-100 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-xs shrink-0"
                            onClick={() =>
                              setPreviewImage(att.file_url || att.url)
                            }
                            title={`Foto ${idx + 1}`}
                          >
                            {/* Thumbnail ≤64px (h-10 w-14): tetap <img> sesuai keputusan handoff */}
                            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail ≤64px, tetap <img> sesuai keputusan handoff */}
                            <img
                              src={att.file_url || att.url}
                              alt={`Foto Aset ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-blue-800/60 font-medium italic">
                          Tidak ada foto
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(reuseModalItem.status_name)}
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 mb-4 rounded-r-lg flex gap-3 shadow-sm">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-bold text-blue-900">
                    Permohonan Penggunaan Kembali (Reuse)
                  </h4>
                  <p className="text-[12px] text-blue-800 mt-1 font-medium">
                    Lengkapi spesifikasi target penggunaan dan justifikasi
                    peminjaman peralatan berikut.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <form id="reuse-form" onSubmit={handleSubmitReuseForm}>
                  {/* Row 1: Identifikasi */}
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-4">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        No. Referensi Pengajuan
                      </label>
                      <input
                        type="text"
                        value={formData.request_number}
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 font-mono"
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Lokasi Instalasi
                        </label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                          Wajib
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan lokasi instalasi"
                        value={formData.installation_location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            installation_location: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A]"
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Target Plant / Lokasi
                        </label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                          Wajib
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan target plant"
                        value={formData.target_plant}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_plant: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Tanggal & Nilai */}
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-6">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Tgl Mulai Mobilisasi
                        </label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                          Wajib
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A] cursor-pointer"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Est. Cost Avoidance (Rp)
                      </label>
                      <input
                        type="text"
                        value={`Rp ${(reuseModalItem.estimated_reuse_value || 0).toLocaleString("id-ID")}`}
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-bold text-blue-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: Justifikasi & Catatan */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Tujuan Penggunaan & Justifikasi
                        </label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                          Wajib
                        </span>
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={formData.justification}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          setFormData({
                            ...formData,
                            justification: e.target.value,
                          });
                        }}
                        placeholder="Masukkan tujuan penggunaan & justifikasi proyek"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none overflow-hidden min-h-[50px] transition-all focus:border-[#0A356A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Catatan Tambahan{" "}
                        <span className="text-gray-400 font-normal">
                          (Opsional)
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="Masukkan catatan tambahan jika ada"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none overflow-hidden min-h-[50px] transition-all focus:border-[#0A356A]"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-white flex justify-end gap-3 rounded-b-xl shrink-0">
              <button
                type="button"
                onClick={() => setReuseModalItem(null)}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="reuse-form"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#062854] disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Pengajuan Reuse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW IMAGE MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-[92vw] max-w-4xl h-[85vh] overflow-hidden rounded-lg flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
            <img
              src={previewImage}
              alt="Preview Lampiran Foto"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
