"use client";

import React, { useState, useEffect } from "react";
import { Trash2, CheckCircle2, XCircle, Loader2, Database, Search, Wrench, RefreshCw, Filter, Pencil, Eye } from "lucide-react";
import { getEquipments, deleteEquipment } from "@/action/api";
import { EditEquipmentDialog } from "@/components/EditEquipmentDialog";
import { DetailEquipmentDialog } from "@/components/DetailEquipmentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { ActionMenu } from "@/components/ActionMenu";

export default function EquipmentManagementPage() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [plantFilter, setPlantFilter] = useState("Semua Plant");
  
  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [detailItem, setDetailItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getEquipments();
      setEquipments(data || []);
      setFilteredEquipments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = equipments;
    if (debouncedSearch.trim() !== "") {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((eq) => 
        eq.equipment_code?.toLowerCase().includes(query) ||
        eq.name?.toLowerCase().includes(query) ||
        eq.plant?.toLowerCase().includes(query)
      );
    }
    if (plantFilter !== "Semua Plant") {
      result = result.filter((eq) => eq.plant === plantFilter);
    }
    setFilteredEquipments(result);
  }, [debouncedSearch, plantFilter, equipments]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, plantFilter]);

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    const targetId = selectedItem.id || selectedItem.ID || selectedItem.equipment_id || selectedItem.equipmentCode;
    
    if (!targetId) {
      setNotification({ type: "error", message: "Gagal menghapus: ID aset tidak dikenali." });
      setIsSubmitting(false);
      return;
    }

    const res = await deleteEquipment(targetId);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menghapus data aset dari sistem!" });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menghapus aset: " + (res.message || "Silakan coba lagi.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getStatusBadge = (statusObj: any, statusId: number) => {
    let name = (statusObj?.name || (statusId === 2 ? "VALIDATED" : statusId === 3 ? "REJECTED" : statusId === 4 ? "READY TO USE" : statusId === 6 ? "MAINTENANCE" : statusId === 5 ? "READY TO REUSE" : "REGISTERED")).toUpperCase();
    if (name === "IDLE") name = "READY TO USE";

    const styles: Record<string, string> = {
      REGISTERED: "bg-slate-100 text-slate-600 border-slate-200",
      VALIDATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      REJECTED: "bg-red-50 text-red-700 border-red-200",
      "READY TO USE": "bg-[#0A356A]/10 text-[#0A356A] border-[#0A356A]/20",
      MAINTENANCE: "bg-amber-50 text-amber-800 border-amber-200",
      "READY TO REUSE": "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border min-w-[110px] h-6 inline-flex items-center justify-center whitespace-nowrap ${styles[name] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
        {name}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-700">
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
          <span className="text-[13px] font-medium leading-snug">{notification.message}</span>
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
              Inventaris peralatan terdaftar di seluruh plant PT Pupuk Sriwidjaja.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Filters Bar (Compact Enterprise 1-Row Layout) */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-1">
          {/* Search Input (flex-1 max-w-320px) */}
          <div className="relative w-full lg:flex-1 lg:max-w-[320px] shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode Alat, Nama, atau Plant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[40px] pl-9 pr-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
            />
          </div>

          {/* Plant Dropdown (180px) */}
          <div className="relative w-full sm:w-[180px] shrink-0">
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              className="w-full h-[40px] px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer"
            >
              <option value="Semua Plant">Semua Plant</option>
              <option value="PUSRI-IB">PUSRI-IB</option>
              <option value="PUSRI-IIB">PUSRI-IIB</option>
              <option value="PUSRI-III">PUSRI-III</option>
              <option value="PUSRI-IV">PUSRI-IV</option>
              <option value="STG-1">STG-1 (Utilitas)</option>
            </select>
          </div>
        </div>

        {/* Reset Action Button (90px) */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => { setSearch(""); setPlantFilter("Semua Plant"); }}
            className="w-full sm:w-[90px] h-[40px] px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset
          </button>
        </div>
      </div>

      {/* Tabel Aset */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data aset peralatan...</p>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md">Tidak ada data aset terdaftar yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="h-[44px] align-middle">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[50px] whitespace-nowrap align-middle">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[150px] whitespace-nowrap align-middle">Kode Aset</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left whitespace-nowrap align-middle">Nama Peralatan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[110px] whitespace-nowrap align-middle">Plant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[140px] whitespace-nowrap align-middle">Status Aset</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[140px] whitespace-nowrap align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedEquipments.map((item, index) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr key={item.id || item.ID || item.equipment_id || index} className="hover:bg-slate-50/80 transition-colors h-[52px] align-middle">
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-500 text-center align-middle">{rowNum}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-mono font-bold text-[#0A356A] text-center align-middle">
                        {item.equipment_code}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900 truncate align-middle" title={item.name}>
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 text-center align-middle">
                        {item.plant || "-"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center">
                          {getStatusBadge(item.status, item.status_id)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center align-middle w-[140px]">
                        <ActionMenu
                          onView={() => { setDetailItem(item); setIsDetailOpen(true); }}
                          onEdit={() => { setEditItem(item); setIsEditOpen(true); }}
                          onDelete={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredEquipments.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan {filteredEquipments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)} dari {filteredEquipments.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

      {/* Dialog Detail */}
      <DetailEquipmentDialog
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        onEdit={() => {
          const itemToEdit = detailItem;
          setIsDetailOpen(false);
          setDetailItem(null);
          setEditItem(itemToEdit);
          setIsEditOpen(true);
        }}
        equipment={detailItem}
      />

      {/* Dialog Edit */}
      <EditEquipmentDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={() => {
          setNotification({ type: "success", message: "Berhasil memperbarui data peralatan!" });
          fetchData();
          setTimeout(() => setNotification(null), 3000);
        }}
        equipment={editItem}
      />

      {/* Dialog Hapus */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedItem(null); }}
        onConfirm={handleDelete}
        title="Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini?"
        isDeleting={isSubmitting}
      />
    </div>
  );
}
