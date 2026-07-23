"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getEquipments, getObjectTypes } from "@/action/api";
import { 
  Search, AlertCircle, RefreshCw, Filter, Plus, X,
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, Upload, Wrench, CheckCircle 
} from "lucide-react";

// Tipe Data menyesuaikan dengan struktur standar Asset/Equipment
type AssetState = "REGISTERED" | "VALIDATED" | "REJECTED" | "IDLE" | "DALAM_PERBAIKAN" | "READY_TO_REUSE";
type ApprovalState = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NEED_REVISION";

interface Equipment {
  id: string;
  kodeAlat: string;
  namaAlat: string;
  plant: string;
  jenisAlat: string;
  tanggalRegistrasi: string;
  statusAset: AssetState;
  statusPersetujuan: ApprovalState;
}



export default function RendalIdlePage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States untuk Filter & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState(""); // State untuk yang diketik (belum enter)
  const [plantFilter, setPlantFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{key: keyof Equipment, direction: 'asc' | 'desc'} | null>(null);

  // States untuk Modal Perbaikan & Detail
  const [repairModal, setRepairModal] = useState<Equipment | null>(null);
  const [detailModal, setDetailModal] = useState<Equipment | null>(null);
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  
  const ITEMS_PER_PAGE = 15;

  const handleSubmitRepair = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRepair(true);
    setTimeout(() => {
      setIsSubmittingRepair(false);
      alert("Berhasil! Hasil perbaikan dan bukti biaya telah disimpan. Status alat berubah menjadi Ready to Reuse.");
      setRepairModal(null);
    }, 1500);
  };

  const fetchEquipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, objTypes] = await Promise.all([
        getEquipments(),
        getObjectTypes()
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData = data.map((item: any) => {
        let objectTypeName = "Belum Ditentukan";
        if (item.object_type?.name) {
          objectTypeName = item.object_type.name;
        } else if (item.objectType?.name) {
          objectTypeName = item.objectType.name;
        } else {
          const otId = item.id_object_type || item.object_type_id || item.objectTypeId;
          if (otId && objTypes) {
            const found = objTypes.find((o: any) => o.id === otId || o.id === Number(otId));
            if (found) objectTypeName = found.name;
          }
        }

        return {
          id: item.id?.toString() || "-",
          kodeAlat: item.equipment_code,
          namaAlat: item.name,
          plant: item.plant,
          jenisAlat: objectTypeName,
          tanggalRegistrasi: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : "-",
          statusAset: (item.status?.name || (item.status_id === 2 ? "VALIDATED" : item.status_id === 3 ? "REJECTED" : item.status_id === 4 ? "IDLE" : "REGISTERED")).toUpperCase(),
          statusPersetujuan: "PENDING", // TODO: match with approvals later if needed
        };
      });
      setEquipments(mappedData as Equipment[]);
    } catch (err: unknown) {
      console.error(err);
      setError("Gagal terhubung ke database. Menampilkan data kosong atau periksa kembali koneksi backend Anda.");
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEquipments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    const result = equipments.filter(item => {
      const matchSearch = item.kodeAlat?.toLowerCase().includes(search.toLowerCase()) || 
                          item.namaAlat?.toLowerCase().includes(search.toLowerCase());
      const matchPlant = plantFilter === "Semua" || item.plant === plantFilter;
      const matchStatus = statusFilter === "Semua" || item.statusAset === statusFilter;
      return matchSearch && matchPlant && matchStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key] || "").toLowerCase();
        const valB = String(b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [equipments, search, plantFilter, statusFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleSort = (key: keyof Equipment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Equipment) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-[#0A356A]" /> 
      : <ArrowDown className="w-3.5 h-3.5 text-[#0A356A]" />;
  };

  const getStatusBadge = (status: AssetState) => {
    const styles: Record<string, string> = {
      REGISTERED: "bg-blue-100 text-blue-800 border-blue-200",
      VALIDATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      IDLE: "bg-purple-100 text-purple-800 border-purple-200",
      DALAM_PERBAIKAN: "bg-amber-50 text-amber-700 border-amber-200",
      READY_TO_REUSE: "bg-teal-50 text-teal-700 border-teal-200",
    };
    const style = styles[status] || "bg-gray-50 text-gray-700 border-gray-200";
    return <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-2 py-0.5 rounded border tracking-wide whitespace-nowrap shadow-sm ${style}`}>{status.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pt-4 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Klasik Profesional */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Rendal</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#0A356A] font-semibold">Idle Equipment</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Data Idle Equipment</h1>
            <p className="text-sm text-gray-500 mt-1">Daftar seluruh peralatan idle yang terhubung dengan database utama.</p>
          </div>
          <button 
            onClick={fetchEquipments}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Kontrol Tabel (Filter & Pencarian) */}
      <div className="bg-white p-4 border border-gray-200 rounded-t-xl shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari Kode atau Nama Alat (Tekan Enter)..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {(plantFilter !== "Semua" || statusFilter !== "Semua") && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 border border-white"></span>
              )}
            </button>

            {(plantFilter !== "Semua" || statusFilter !== "Semua" || search !== "" || searchInput !== "") && (
              <button 
                onClick={() => {
                  setPlantFilter("Semua");
                  setStatusFilter("Semua");
                  setSearch("");
                  setSearchInput("");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                title="Reset Pencarian & Filter"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            )}
            
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
            
            <Link href="/rendal/register-equipment" className="flex items-center gap-2 bg-[#0A356A] hover:bg-[#062854] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Register Equipment
            </Link>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plant:</span>
              <select 
                value={plantFilter} 
                onChange={(e) => setPlantFilter(e.target.value)} 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#0A356A] cursor-pointer font-medium"
              >
                <option value="Semua">Semua Plant</option>
                <option value="P-1">Plant 1</option>
                <option value="P-2">Plant 2</option>
                <option value="P-3">Plant 3</option>
                <option value="P-4">Plant 4</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#0A356A] cursor-pointer font-medium"
              >
                <option value="Semua">Semua Status</option>
                <option value="IDLE">IDLE</option>
                <option value="REGISTERED">REGISTERED</option>
                <option value="VALIDATED">VALIDATED</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Area Tabel Klasik */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kodeAlat')}>
                  <div className="flex items-center gap-1">KODE ALAT {getSortIcon('kodeAlat')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('namaAlat')}>
                  <div className="flex items-center gap-1">NAMA ALAT {getSortIcon('namaAlat')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('plant')}>
                  <div className="flex items-center gap-1">PLANT {getSortIcon('plant')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('jenisAlat')}>
                  <div className="flex items-center gap-1">JENIS ALAT {getSortIcon('jenisAlat')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tanggalRegistrasi')}>
                  <div className="flex items-center gap-1">TGL REGISTRASI {getSortIcon('tanggalRegistrasi')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('statusAset')}>
                  <div className="flex items-center gap-1">STATUS {getSortIcon('statusAset')}</div>
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <RefreshCw className="w-6 h-6 text-[#0A356A] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">Memuat data dari database...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-800">Tidak ada data ditemukan</p>
                      <p className="text-sm text-gray-500 mt-1">Coba sesuaikan filter pencarian atau pastikan database Anda tidak kosong.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-[#0A356A] whitespace-nowrap">
                      {item.kodeAlat}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">
                      {item.namaAlat}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {item.plant}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {item.jenisAlat}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {item.tanggalRegistrasi}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {getStatusBadge(item.statusAset)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      {item.statusAset === "DALAM_PERBAIKAN" && (
                        <button 
                          onClick={() => setRepairModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm ml-auto"
                          title="Catat Hasil Perbaikan"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Perbaikan</span>
                        </button>
                      )}
                      {item.statusAset !== "DALAM_PERBAIKAN" && (
                        <button 
                          onClick={() => setDetailModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-[#0A356A] hover:text-white border border-gray-200 px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm ml-auto" 
                          title="Lihat Detail"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
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
        {!isLoading && filteredData.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-sm font-medium text-gray-500">
              Menampilkan {paginatedData.length} data (Total {filteredData.length})
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Pencatatan Perbaikan */}
      {repairModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Pencatatan Hasil Perbaikan</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{repairModal.kodeAlat} - {repairModal.namaAlat}</p>
                </div>
              </div>
              <button onClick={() => setRepairModal(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRepair} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 leading-relaxed shadow-sm">
                Unggah bukti biaya dan deskripsi tindakan perbaikan di bawah ini untuk merubah status peralatan menjadi <strong>Ready to Reuse</strong>.
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Deskripsi Perbaikan <span className="text-red-500">*</span></label>
                <textarea required rows={3} placeholder="Jelaskan tindakan perbaikan/refurbish yang telah dilakukan secara detail..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm"></textarea>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Total Biaya Aktual <span className="text-red-500">*</span></label>
                <div className="relative shadow-sm rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-bold">Rp</span>
                  </div>
                  <input required type="number" min="0" placeholder="Contoh: 15000000" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Unggah Bukti Biaya / Nota Perbaikan <span className="text-red-500">*</span></label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:bg-emerald-50/30 hover:border-emerald-400 cursor-pointer transition-colors bg-gray-50/50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm font-bold text-gray-700">Pilih file nota / invoice perbaikan</span>
                  <span className="text-[10px] text-gray-500 mt-1">Mendukung format PDF, JPG, PNG (Maks. 5MB)</span>
                  <input required type="file" className="hidden" />
                </label>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" disabled={isSubmittingRepair} onClick={() => setRepairModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
                <button type="submit" disabled={isSubmittingRepair} className="px-5 py-2 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-colors shadow-md flex items-center gap-2 disabled:opacity-70">
                  {isSubmittingRepair ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isSubmittingRepair ? "Menyimpan..." : "Simpan & Ubah Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Informasi Aset */}
      {detailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-[#0A356A]" />
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">Detail Aset Idle</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{detailModal.kodeAlat}</p>
                </div>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Alat</p>
                  <p className="text-sm font-bold text-gray-900">{detailModal.namaAlat}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kode Alat</p>
                  <p className="text-sm font-bold text-gray-900">{detailModal.kodeAlat}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Plant</p>
                  <p className="text-sm font-medium text-gray-800">{detailModal.plant}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jenis Alat</p>
                  <p className="text-sm font-medium text-gray-800">{detailModal.jenisAlat}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tanggal Registrasi</p>
                  <p className="text-sm font-medium text-gray-800">{detailModal.tanggalRegistrasi}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Aset</p>
                  <div className="mt-1">{getStatusBadge(detailModal.statusAset)}</div>
                </div>
              </div>

              {detailModal.statusAset === "REGISTERED" && (
                <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 leading-relaxed shadow-sm">
                  <strong>Catatan:</strong> Aset ini masih berstatus <em>REGISTERED</em>. Ia sedang menunggu tim <strong>Inspeksi Teknik</strong> untuk melakukan validasi teknis. Setelah divalidasi (layak pakai), aset akan diteruskan ke Manajer untuk persetujuan akhir (menjadi <em>IDLE</em>).
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end bg-gray-50">
              <button onClick={() => setDetailModal(null)} className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
