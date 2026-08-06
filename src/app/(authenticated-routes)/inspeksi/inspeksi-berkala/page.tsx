"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, Eye, Pencil, Trash2, Wrench, Loader2, Database } from "lucide-react";
import Link from "next/link";
import { getEquipments, deleteEquipment } from "@/action/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/components/UserProvider";
import { DetailEquipmentDialog } from "@/components/DetailEquipmentDialog";
import { EditEquipmentDialog } from "@/components/EditEquipmentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ActionMenu } from "@/components/ActionMenu";

interface Equipment {
  id: string | number;
  equipment_code: string;
  name: string;
  status: string | { name: string };
  location?: string | { name: string };
  plant?: string | { name: string };
  storage_location?: { name: string };
  area?: { name: string };
  updated_at?: string; 
  created_at?: string;
  [key: string]: any;
}

export default function InspeksiAntreanPage() {
  const { isAdmin } = useUser();
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebounce(searchInput, 500);
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("Semua Plant");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [dateFilter, setDateFilter] = useState("");

  // Modal States
  const [detailItem, setDetailItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setSearch(debouncedSearchInput);
  }, [debouncedSearchInput]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getEquipments();
      if (result && result.length > 0) {
        let idleEqs = result.filter((eq: any) => {
          const statusStr = typeof eq.status === 'string' ? eq.status : eq.status?.name;
          return statusStr === "IDLE" || statusStr === "READY_TO_USE" || statusStr === "READY TO USE";
        });
        setData(idleEqs);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data peralatan:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteEquipment = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const result = await deleteEquipment(deleteItem.id);
      if (result.success) {
        setData(prev => prev.filter(e => e.id !== deleteItem.id));
        setIsDeleteOpen(false);
        setDeleteItem(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilter = () => {
    setSearchInput("");
    setSearch("");
    setPlantFilter("Semua Plant");
    setStatusFilter("Semua Status");
    setDateFilter("");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const query = search.toLowerCase().trim();
      const code = row.equipment_code?.toLowerCase() || "";
      const name = row.name?.toLowerCase() || "";
      const matchSearch = !query || code.includes(query) || name.includes(query);

      const plantStr = (typeof row.plant === 'string' ? row.plant : row.plant?.name) || row.area?.name || "";
      const matchPlant = plantFilter === "Semua Plant" || plantStr.toLowerCase().includes(plantFilter.toLowerCase());

      const statusStr = (typeof row.status === 'string' ? row.status : row.status?.name) || "READY TO USE";
      const matchStatus = statusFilter === "Semua Status" || statusStr.toUpperCase().includes(statusFilter.toUpperCase());

      const idleDateStr = row.updated_at || row.created_at || "";
      const matchDate = !dateFilter || idleDateStr.startsWith(dateFilter);

      return matchSearch && matchPlant && matchStatus && matchDate;
    });
  }, [data, search, plantFilter, statusFilter, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, plantFilter, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-[#0A356A] rounded-2xl px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Daftar Inspeksi Aset Idle
            </h1>
            <p className="text-xs text-blue-200/90 mt-0.5 font-medium">
              Daftar peralatan berstatus IDLE yang tersedia untuk diinspeksi oleh Inspektur Teknik.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Filter Section (Compact Enterprise 1-Row Responsive Layout) */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Controls: Search + Plant + Status + Date */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-1 flex-wrap lg:flex-nowrap">
          {/* Search Input (flex-1 max-w-[320px]) */}
          <div className="relative w-full lg:flex-1 lg:max-w-[320px] shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Kode atau Nama Alat..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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

          {/* Status Dropdown (180px) */}
          <div className="relative w-full sm:w-[180px] shrink-0">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full h-[40px] px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="READY TO USE">Ready to Use</option>
              <option value="IDLE">Idle</option>
            </select>
          </div>

          {/* Date Picker (170px) */}
          <div className="relative w-full sm:w-[170px] shrink-0">
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="w-full h-[40px] px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer" 
            />
          </div>
        </div>

        {/* Right Action Buttons Group (Cari 90px + Reset 90px) */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end shrink-0">
          <button 
            type="button"
            onClick={() => setSearch(searchInput)}
            className="w-full sm:w-[90px] h-[40px] bg-[#0A356A] text-white text-xs font-semibold rounded-xl hover:bg-[#0556B3] transition-colors shrink-0 flex items-center justify-center shadow-2xs"
          >
            Cari
          </button>

          <button 
            type="button"
            onClick={resetFilter} 
            className="w-full sm:w-[90px] h-[40px] px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
            title="Reset semua filter"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Table Card (List Equipment & Validasi Design System) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data inspeksi peralatan...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md">Tidak ada data peralatan IDLE yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="h-[44px] align-middle">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[50px] whitespace-nowrap align-middle">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[140px] whitespace-nowrap align-middle">Kode Alat</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left whitespace-nowrap align-middle">Nama Alat</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[110px] whitespace-nowrap align-middle">Plant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[130px] whitespace-nowrap align-middle">Tanggal Idle</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[110px] whitespace-nowrap align-middle">Lama Idle</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[140px] whitespace-nowrap align-middle">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-[200px] whitespace-nowrap align-middle">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedData.map((row, index) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const idleDateStr = row.updated_at || row.created_at || new Date().toISOString();
                  const idleDate = new Date(idleDateStr);
                  const idleDateFormatted = isNaN(idleDate.getTime()) ? "-" : idleDate.toISOString().split('T')[0];
                  
                  const diffTime = Math.abs(new Date().getTime() - (isNaN(idleDate.getTime()) ? new Date().getTime() : idleDate.getTime()));
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const plantStr = (typeof row.plant === 'string' ? row.plant : row.plant?.name) || row.area?.name || "-";

                  return (
                    <tr key={row.id || index} className="hover:bg-slate-50/80 transition-colors h-[52px] align-middle">
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-500 text-center align-middle">{rowNum}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-mono font-bold text-[#0A356A] text-center align-middle">{row.equipment_code}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900 truncate align-middle" title={row.name}>{row.name}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 text-center align-middle">{plantStr}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 text-center align-middle">{idleDateFormatted}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 text-center align-middle">{diffDays} Hari</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border min-w-[110px] h-6 inline-flex items-center justify-center whitespace-nowrap bg-[#0A356A]/10 text-[#0A356A] border-[#0A356A]/20">
                            READY TO USE
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center align-middle w-[200px]">
                        <ActionMenu
                          onView={() => { setDetailItem(row); setIsDetailOpen(true); }}
                          onEdit={() => { setEditItem(row); setIsEditOpen(true); }}
                          onDelete={() => { setDeleteItem(row); setIsDeleteOpen(true); }}
                          customActions={[
                            {
                              key: "mulai-inspeksi",
                              label: "Mulai Inspeksi",
                              href: `/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`,
                              variant: "primary",
                              permission: "validate",
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredData.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
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

      {/* Dialog Detail Equipment */}
      <DetailEquipmentDialog
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        equipment={detailItem}
      />

      {/* Dialog Edit Equipment (Khusus Admin) */}
      <EditEquipmentDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={fetchData}
        equipment={editItem}
      />

      {/* Dialog Hapus Equipment (Khusus Admin) */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteItem(null); }}
        onConfirm={handleDeleteEquipment}
        title="Hapus Peralatan"
        description={`Apakah Anda yakin ingin menghapus peralatan ${deleteItem?.equipment_code || deleteItem?.kodeAlat || ''}? Tindakan ini tidak dapat dibatalkan.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}

