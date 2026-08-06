"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { getEquipments, getObjectTypes, createReuseRequest, getReuseRequests, getAttachmentsByEquipmentId, deleteEquipment } from "@/action/api";
import { 
  Search, Eye, X, ChevronRight, Send, 
  CheckCircle2, Clock, AlertCircle, FileSpreadsheet,
  RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Plus,
  UserCheck, Wrench, Info, FileText, Pencil, Trash2
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { EditEquipmentDialog } from "@/components/EditEquipmentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface EquipmentItem {
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

interface ReuseRequestItem {
  id: string;
  request_number: string;
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  requesting_unit: string;
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

export default function UnitKerjaKatalogPage() {
  const { isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState<"katalog" | "permintaan">("katalog");
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [reuseRequests, setReuseRequests] = useState<ReuseRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit & Delete Dialog State for Admin
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEquipment = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await deleteEquipment(deleteItem.id);
      if (res.success) {
        setEquipments(prev => prev.filter(e => e.id !== deleteItem.id));
        setIsDeleteOpen(false);
        setDeleteItem(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

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
  const [sortConfig, setSortConfig] = useState<{key: keyof EquipmentItem, direction: 'asc' | 'desc'} | null>(null);

  // Modals
  const [detailModalItem, setDetailModalItem] = useState<EquipmentItem | null>(null);
  const [reuseModalItem, setReuseModalItem] = useState<EquipmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Attachment States (for registered photos)
  const [attachments, setAttachments] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reuse Form State
  const [formData, setFormData] = useState({
    request_number: "",
    requesting_unit: "",
    target_plant: "",
    start_date: "",
    end_date: "",
    justification: "",
    estimated_cost_avoidance: 0,
    contact_person: "Budi Santoso",
    contact_npp: "100002",
    contact_phone: "0812-7890-1122",
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const tableElem = document.getElementById("katalog-table-container");
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rawEqList, objTypes, rawRequests] = await Promise.all([
        getEquipments(),
        getObjectTypes().catch(() => []),
        getReuseRequests().catch(() => []),
      ]);

      const mappedEquipments: EquipmentItem[] = (rawEqList || []).map((item: any) => {
        let catName = "Peralatan Umum";
        if (item.object_type?.name) catName = item.object_type.name;
        else if (item.objectType?.name) catName = item.objectType.name;
        else if (item.object_type_id && objTypes) {
          const found = objTypes.find((o: any) => String(o.id) === String(item.object_type_id));
          if (found) catName = found.name;
        }

        const rawStatus = (item.status?.name || item.status || "").toUpperCase();
        let normalizedStatus = "IDLE";
        if (rawStatus.includes("READY") || rawStatus.includes("SIAP")) normalizedStatus = "READY_TO_REUSE";
        else if (rawStatus.includes("VALIDATED") || rawStatus.includes("VALID")) normalizedStatus = "READY_TO_REUSE";
        else if (rawStatus.includes("REGISTERED")) normalizedStatus = "REGISTERED";
        else if (rawStatus.includes("PERBAIKAN") || rawStatus.includes("MAINTENANCE")) normalizedStatus = "DALAM_PERBAIKAN";
        else if (rawStatus.includes("DISPOSED") || rawStatus.includes("HAAPUS")) normalizedStatus = "DISPOSED";
        else if (rawStatus.includes("IDLE")) normalizedStatus = "IDLE";

        let specText = item.specification || item.specifications || item.specs;
        if (!specText && item.description) specText = item.description;

        return {
          id: String(item.id),
          equipment_code: item.equipment_code || `EQ-2026-${item.id}`,
          name: item.name || item.nama || "Equipment Tanpa Nama",
          plant: item.plant || item.plant_description || "STG & Boilers",
          plant_description: item.plant_description || item.plant || "STG & Boilers",
          object_type_name: catName,
          status_name: normalizedStatus,
          condition_name: item.condition?.name || item.condition || "Baik (Bisa Digunakan)",
          storage_location: item.storage_location?.name || item.location || "Gudang Utama Pusri",
          serial_number: item.serial_number || item.sn || "SN-8849-PX",
          vendor: item.vendor || item.manufacturer || "Siemens / Ebara",
          year_of_purchase: item.year_of_purchase || item.year || 2020,
          book_value: item.book_value || item.bookValue || 150000000,
          original_value: item.original_value || 350000000,
          estimated_reuse_value: item.estimated_reuse_value || item.reuseValue || 280000000,
          specifications: specText || "Daya: 75 kW, Tegangan: 380V / 3 Phase, RPM: 1450, Material: SS316, Pressure Rating: 16 Bar",
          capacity: item.capacity || "120 m³/jam",
          notes: item.notes || "Kondisi terpreservasi rutin, minyak pelumas & seal dalam kondisi baik.",
          created_at: item.created_at || new Date().toISOString(),
          raw_data: item,
        };
      });

      // Filter only IDLE and READY_TO_REUSE
      setEquipments(mappedEquipments.filter(e => e.status_name === "IDLE" || e.status_name === "READY_TO_REUSE"));

      // Mapped Reuse Requests
      const reqList: ReuseRequestItem[] = (rawRequests || []).map((r: any) => ({
        id: String(r.id),
        request_number: r.request_number || `REQ-REUSE-2026-${r.id}`,
        equipment_id: String(r.equipment_id || ""),
        equipment_code: r.equipment_code || r.equipment?.equipment_code || "EQ-99",
        equipment_name: r.equipment_name || r.equipment?.name || "Equipment Reuse",
        requesting_unit: r.requesting_unit || "Unit Kerja Operasi",
        target_plant: r.target_plant || "Plant PUSRI IB",
        start_date: r.start_date || new Date().toISOString().split("T")[0],
        end_date: r.end_date || "-",
        justification: r.justification || "Penggantian darurat pompa eksisting yang rusak.",
        estimated_cost_avoidance: r.estimated_cost_avoidance || 250000000,
        contact_person: r.contact_person || "Budi Santoso",
        contact_npp: r.contact_npp || "100002",
        contact_phone: r.contact_phone || "0812-7890-1122",
        status: r.status || "PENDING",
        created_at: r.created_at || new Date().toISOString(),
      }));

      setReuseRequests(reqList);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Gagal memuat katalog data peralatan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter List Options
  const plantOptions = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((eq) => set.add(eq.plant));
    return ["Semua", ...Array.from(set)];
  }, [equipments]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((eq) => set.add(eq.object_type_name));
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

      const matchPlant = selectedPlant === "Semua" || eq.plant === selectedPlant;
      const matchCategory = selectedCategory === "Semua" || eq.object_type_name === selectedCategory;
      const matchStatus =
        selectedStatus === "Semua" ||
        (selectedStatus === "READY_TO_REUSE" && (eq.status_name === "READY_TO_REUSE" || eq.status_name === "VALIDATED")) ||
        (selectedStatus === "IDLE" && eq.status_name === "IDLE");

      return matchSearch && matchPlant && matchCategory && matchStatus;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = String(a[sortConfig!.key]).toLowerCase();
        const valB = String(b[sortConfig!.key]).toLowerCase();
        if (valA < valB) return sortConfig!.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig!.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [equipments, search, selectedPlant, selectedCategory, selectedStatus, sortConfig]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedPlant, selectedStatus, selectedCategory]);

  const paginatedEquipments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEquipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEquipments, currentPage]);

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);

  // Quick Stats
  const readyCount = equipments.filter((e) => e.status_name === "READY_TO_REUSE" || e.status_name === "VALIDATED").length;
  const idleCount = equipments.filter((e) => e.status_name === "IDLE").length;

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
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EquipmentItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" /> : 
      <ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />;
  };

  const loadAttachments = async (equipmentId: string) => {
    setAttachments([]);
    try {
      const res = await getAttachmentsByEquipmentId(equipmentId);
      if (res && Array.isArray(res)) {
        setAttachments(res);
      }
    } catch (err) {
      console.error("Error loading attachments:", err);
    }
  };

  // Handle Opening Modal Pengajuan
  const handleOpenReuseModal = (item: EquipmentItem) => {
    setReuseModalItem(item);
    loadAttachments(item.id);
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      request_number: `REQ-REUSE/PUSRI/${new Date().getFullYear()}/${randomSeq}`,
      requesting_unit: "",
      target_plant: "",
      start_date: "",
      end_date: "",
      justification: "",
      estimated_cost_avoidance: item.estimated_reuse_value || 0,
      contact_person: "Budi Santoso",
      contact_npp: "100002",
      contact_phone: "0812-7890-1122",
    });
  };

  // Submit Reuse Form
  const handleSubmitReuseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuseModalItem) return;

    if (!formData.justification.trim()) {
      showNotification("error", "Harap isi tujuan penggunaan / justifikasi proyek.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        equipment_id: reuseModalItem.id,
        request_number: formData.request_number,
        requesting_unit: formData.requesting_unit,
        target_plant: formData.target_plant,
        start_date: formData.start_date,
        end_date: formData.end_date,
        justification: formData.justification,
        estimated_cost_avoidance: Number(formData.estimated_cost_avoidance) || 0,
        contact_person: formData.contact_person,
        contact_npp: formData.contact_npp,
        contact_phone: formData.contact_phone,
      };

      const res = await createReuseRequest(payload);
      if (res.success) {
        showNotification("success", res.message || "Permintaan reuse berhasil dikirim!");

        const newReq: ReuseRequestItem = {
          id: res.data?.id || `REQ-${Date.now()}`,
          request_number: formData.request_number,
          equipment_id: reuseModalItem.id,
          equipment_code: reuseModalItem.equipment_code,
          equipment_name: reuseModalItem.name,
          requesting_unit: formData.requesting_unit,
          target_plant: formData.target_plant,
          start_date: formData.start_date,
          end_date: formData.end_date,
          justification: formData.justification,
          estimated_cost_avoidance: Number(formData.estimated_cost_avoidance) || 0,
          contact_person: formData.contact_person,
          contact_npp: formData.contact_npp,
          contact_phone: formData.contact_phone,
          status: "PENDING",
          created_at: new Date().toISOString(),
        };

        setReuseRequests([newReq, ...reuseRequests]);
        setReuseModalItem(null);
      } else {
        showNotification("error", res.message || "Gagal mengirim pengajuan reuse.");
      }
    } catch (err: any) {
      showNotification("error", err?.message || "Terjadi kesalahan sistem saat pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      READY_TO_REUSE: "bg-[#DCFCE7] text-[#16A34A]",
      IDLE: "bg-[#E0E7FF] text-[#4F46E5]",
    };
    const labels: Record<string, string> = {
      READY_TO_REUSE: "Ready to Use",
      IDLE: "Ready to Use",
    };
    return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${styles[status] || "bg-gray-100 text-gray-700"}`}>{labels[status] || status}</span>;
  };

  const getActionButton = (item: EquipmentItem) => {
    return (
      <div className="flex flex-wrap items-center gap-1 justify-center w-full max-w-[120px] mx-auto">
        <button 
          title="Detail Eagle Eye" 
          type="button"
          onClick={(e) => {
            e.preventDefault();
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
          type="button"
          onClick={(e) => { e.preventDefault(); handleOpenReuseModal(item); }} 
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded transition-colors flex flex-col items-center"
        >
          <Send className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[8px] font-bold">Ajukan</span>
        </button>
        {isAdmin && (
          <>
            <Tooltip content="Edit">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={(e) => { e.preventDefault(); setEditItem(item); setIsEditOpen(true); }}
                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Hapus">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={(e) => { e.preventDefault(); setDeleteItem(item); setIsDeleteOpen(true); }}
                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span className="text-[13px] font-medium">{notification.message}</span>
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
             <span className="text-[13px] text-blue-900 font-medium">Terdapat <strong className="font-bold">{readyCount} aset siap pakai</strong> dan <strong className="font-bold">{idleCount} aset idle</strong> yang tersedia untuk pengajuan reuse.</span>
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
        <div id="katalog-table-container" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
          
          {/* Toolbar / Filters */}
          <div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
            
            {/* Search */}
            <div className="flex w-full lg:w-auto gap-2">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari Kode atau Nama Alat..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                  className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400" 
                />
              </div>
              <button 
                onClick={() => setSearch(searchInput)}
                className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
              >
                Cari
              </button>
            </div>
            
            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer">
                {plantOptions.map((p) => (
                  <option key={p} value={p}>{p === "Semua" ? "Semua Plant" : p}</option>
                ))}
              </select>

              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[140px] cursor-pointer">
                <option value="Semua">Semua Status</option>
                <option value="READY_TO_REUSE">Ready to Use</option>
                <option value="IDLE">Ready to Use</option>
              </select>

              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 max-w-[180px] cursor-pointer">
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c === "Semua" ? "Semua Kategori" : c}</option>
                ))}
              </select>
              
              <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
              
              <button 
                onClick={resetFilter} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                title="Reset semua filter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b-2 border-gray-300">
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('equipment_code')}>
                    <div className="flex items-center">Kode {getSortIcon('equipment_code')}</div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('name')}>
                    <div className="flex items-center">Nama Equipment {getSortIcon('name')}</div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('plant')}>
                    <div className="flex items-center">Plant {getSortIcon('plant')}</div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('object_type_name')}>
                    <div className="flex items-center">Kategori {getSortIcon('object_type_name')}</div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('status_name')}>
                    <div className="flex items-center">Status {getSortIcon('status_name')}</div>
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Nilai Estimasi
                  </th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      Memuat data katalog...
                    </td>
                  </tr>
                ) : paginatedEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-900">Data Tidak Ditemukan</p>
                        <p className="text-[11px] text-gray-500 mt-1">Coba sesuaikan filter pencarian Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEquipments.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                      <td className="px-1.5 py-1 whitespace-nowrap text-[10px] font-bold text-[#0A356A]">
                        {item.equipment_code}
                      </td>
                      <td className="px-1.5 py-1">
                        <div className="text-[10px] font-medium text-gray-700 leading-tight line-clamp-2" title={item.name}>{item.name}</div>
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
                        Rp {(item.estimated_reuse_value || 0).toLocaleString("id-ID")}
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
          
          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[11px] font-medium text-gray-500">
              Menampilkan {filteredEquipments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)} dari {filteredEquipments.length} data (10 baris/halaman)
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
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
                  className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Tab Riwayat Permintaan */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Daftar Permintaan Reuse</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Status dan alur persetujuan permohonan peminjaman aset idle.</p>
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
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">No. Pengajuan</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Unit Pemohon</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Target Plant</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Justifikasi</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tgl Pengajuan</th>
                  <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {reuseRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileSpreadsheet className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[13px] font-medium text-gray-900">Belum Ada Permintaan Reuse</p>
                        <p className="text-[11px] text-gray-500 mt-1">Anda belum pernah mengajukan permohonan peminjaman peralatan idle.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reuseRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-1.5 py-1 font-mono font-bold text-blue-700 text-[10px]">{req.request_number}</td>
                      <td className="px-1.5 py-1">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-900 leading-tight">{req.equipment_name}</span>
                           <span className="text-[9px] text-gray-500 mt-0.5">{req.equipment_code}</span>
                        </div>
                      </td>
                      <td className="px-1.5 py-1 font-semibold text-gray-800 text-[10px]">{req.requesting_unit}</td>
                      <td className="px-1.5 py-1 text-gray-700 text-[10px]">{req.target_plant}</td>
                      <td className="px-1.5 py-1 text-gray-600 text-[9px] max-w-[200px] line-clamp-2" title={req.justification}>{req.justification}</td>
                      <td className="px-1.5 py-1 text-gray-500 text-[10px]">{new Date(req.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-1.5 py-1">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          Menunggu Review
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination placeholder */}
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[11px] font-medium text-gray-500">
              Total {reuseRequests.length} permintaan
            </span>
          </div>
        </div>
      )}

      {/* MODAL DETAIL – Matches revisi-validasi modal style */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setDetailModalItem(null)} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">
                  Detail Spesifikasi Aset
                </h2>
                <span className="text-gray-300">|</span>
                <span className="text-[13px] font-semibold text-[#0A356A]">{detailModalItem.equipment_code}</span>
              </div>
              <button onClick={() => setDetailModalItem(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
              
              {/* Asset Info Ribbon */}
              <div className="bg-[#f0f7ff] border border-blue-100 rounded-lg p-3 mb-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 flex items-center gap-5 overflow-hidden">
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Nama Peralatan</span>
                    <span className="font-bold text-[13px] text-blue-900 truncate">{detailModalItem.name}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Plant</span>
                    <span className="font-bold text-[13px] text-blue-900">{detailModalItem.plant}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div className="flex-1 min-w-52">
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Kategori</span>
                    <span className="text-blue-800 text-[12px] truncate block">{detailModalItem.object_type_name}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  {/* Foto Registrasi */}
                  <div className="flex flex-col gap-1 border-l border-blue-200 pl-4">
                    <span className="text-[9px] font-bold text-blue-700/60 uppercase block">Foto Registrasi</span>
                    <div className="flex gap-1.5">
                      {attachments.length > 0 ? (
                        attachments.slice(0, 2).map((att: any, idx: number) => (
                          <div 
                            key={idx}
                            className="h-10 w-14 bg-white rounded border border-blue-100 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-xs shrink-0"
                            onClick={() => setPreviewImage(att.file_url || att.url)}
                            title={`Foto ${idx+1}`}
                          >
                            <img src={att.file_url || att.url} alt={`Foto Aset ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-blue-800/60 font-medium italic">Tidak ada foto</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(detailModalItem.status_name)}
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Spesifikasi & Data Teknis</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Vendor / Manufacture</span>
                    <p className="text-[12px] font-bold text-gray-900">{detailModalItem.vendor}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Serial Number</span>
                    <p className="text-[12px] font-bold text-gray-900">{detailModalItem.serial_number}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Tahun Pembelian</span>
                    <p className="text-[12px] font-bold text-gray-900">{detailModalItem.year_of_purchase}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Kapasitas</span>
                    <p className="text-[12px] font-bold text-gray-900">{detailModalItem.capacity}</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-400 block mb-1">Spesifikasi Detail</span>
                  <p className="text-[12px] font-medium text-gray-800 leading-relaxed">{detailModalItem.specifications}</p>
                </div>
              </div>

              {/* Condition & Financial */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Kondisi Fisik</span>
                  <p className="text-[12px] font-bold text-gray-900">{detailModalItem.condition_name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{detailModalItem.notes}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Estimasi Nilai Reuse</span>
                  <p className="text-[14px] font-extrabold text-blue-700">Rp {(detailModalItem.estimated_reuse_value || 0).toLocaleString("id-ID")}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Lokasi: {detailModalItem.storage_location}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-white rounded-b-xl shrink-0">
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

      {/* MODAL FORMULIR PENGAJUAN REUSE – Matches revisi-validasi modal style */}
      {reuseModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setReuseModalItem(null)} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">
                  Formulir Pengajuan Reuse
                </h2>
                <span className="text-gray-300">|</span>
                <span className="text-[13px] font-semibold text-[#0A356A]">{reuseModalItem.equipment_code}</span>
              </div>
              <button onClick={() => setReuseModalItem(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
              
              {/* Asset Info Ribbon */}
              <div className="bg-[#f0f7ff] border border-blue-100 rounded-lg p-3 mb-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 flex items-center gap-5 overflow-hidden">
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Nama Peralatan</span>
                    <span className="font-bold text-[13px] text-blue-900 truncate">{reuseModalItem.name}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Plant Asal</span>
                    <span className="font-bold text-[13px] text-blue-900">{reuseModalItem.plant}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Estimasi Nilai</span>
                    <span className="font-bold text-[13px] text-blue-900">Rp {(reuseModalItem.estimated_reuse_value || 0).toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  {/* Foto Registrasi */}
                  <div className="flex flex-col gap-1 border-l border-blue-200 pl-4">
                    <span className="text-[9px] font-bold text-blue-700/60 uppercase block">Foto Registrasi</span>
                    <div className="flex gap-1.5">
                      {attachments.length > 0 ? (
                        attachments.slice(0, 2).map((att: any, idx: number) => (
                          <div 
                            key={idx}
                            className="h-10 w-14 bg-white rounded border border-blue-100 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-xs shrink-0"
                            onClick={() => setPreviewImage(att.file_url || att.url)}
                            title={`Foto ${idx+1}`}
                          >
                            <img src={att.file_url || att.url} alt={`Foto Aset ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-blue-800/60 font-medium italic">Tidak ada foto</span>
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
                  <h4 className="text-[13px] font-bold text-blue-900">Permohonan Penggunaan Kembali (Reuse)</h4>
                  <p className="text-[12px] text-blue-800 mt-1 font-medium">
                    Lengkapi spesifikasi target penggunaan dan justifikasi peminjaman peralatan berikut.
                  </p>
                </div>
              </div>

              {/* Form Grid – matches revisi-validasi form pattern */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <form id="reuse-form" onSubmit={handleSubmitReuseForm}>
                
                  {/* Row 1: Identifikasi */}
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-4">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">No. Referensi Pengajuan</label>
                      <input type="text" value={formData.request_number} disabled className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 font-mono" />
                    </div>
                    <div className="col-span-4">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">Unit Kerja Pemohon</label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.requesting_unit}
                        onChange={(e) => setFormData({ ...formData, requesting_unit: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A]"
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">Target Plant / Lokasi</label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.target_plant}
                        onChange={(e) => setFormData({ ...formData, target_plant: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Tanggal & Nilai */}
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-4">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">Tgl Mulai Mobilisasi</label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A] cursor-pointer"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Est. Tanggal Selesai <span className="text-gray-400 font-normal">(Ops)</span></label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#0A356A] cursor-pointer"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Est. Cost Avoidance (Rp)</label>
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
                        <label className="block text-[11px] font-semibold text-gray-700">Tujuan Penggunaan & Justifikasi</label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={formData.justification}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          setFormData({ ...formData, justification: e.target.value });
                        }}
                        placeholder="Jelaskan secara rinci alasan peminjaman, urgensi operasional..."
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none overflow-hidden min-h-[50px] transition-all focus:border-[#0A356A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Catatan Tambahan <span className="text-gray-400 font-normal">(Ops)</span></label>
                      <textarea
                        rows={2}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="Informasi tambahan untuk pihak Rendal..."
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] outline-none overflow-hidden min-h-[50px] transition-all focus:border-[#0A356A]"
                      />
                    </div>
                  </div>

                </form>
              </div>
            </div>

            {/* Footer Actions – matches revisi-validasi footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setReuseModalItem(null)}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="reuse-form"
                disabled={isSubmitting}
                className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#062854] rounded-md transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mengirim Pengajuan...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Kirim Pengajuan Reuse</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Overlay Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button 
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Edit & Delete Dialogs for Admin */}
      <EditEquipmentDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={fetchData}
        equipment={editItem}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteItem(null); }}
        onConfirm={handleDeleteEquipment}
        title="Hapus Peralatan"
        description={`Apakah Anda yakin ingin menghapus peralatan ${deleteItem?.equipment_code || ''}?`}
        isDeleting={isDeleting}
      />

    </div>
  );
}
