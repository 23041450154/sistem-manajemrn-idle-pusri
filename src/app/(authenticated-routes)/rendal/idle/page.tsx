"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, AlertCircle, RefreshCw, Filter, Plus, X,
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download 
} from "lucide-react";

// Tipe Data menyesuaikan dengan struktur standar Asset/Equipment
type AssetState = "REGISTERED" | "VALIDATED" | "REJECTED" | "IDLE";
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

const MOCK_EQUIPMENTS: Equipment[] = [
  { id: "1", kodeAlat: "VLV-202-UR3", namaAlat: "Control Valve V-202 Urea", plant: "Urea III", jenisAlat: "Valve", tanggalRegistrasi: "2023-10-24", statusAset: "VALIDATED", statusPersetujuan: "PENDING" },
  { id: "2", kodeAlat: "HE-205", namaAlat: "Heat Exchanger HE-205", plant: "P-3", jenisAlat: "Static Equipment", tanggalRegistrasi: "2023-11-15", statusAset: "VALIDATED", statusPersetujuan: "IN_REVIEW" },
  { id: "3", kodeAlat: "V-409", namaAlat: "Pressure Vessel V-409", plant: "P-2", jenisAlat: "Static Equipment", tanggalRegistrasi: "2023-11-02", statusAset: "IDLE", statusPersetujuan: "APPROVED" },
  { id: "4", kodeAlat: "T-552", namaAlat: "Steam Turbine T-552", plant: "P-4", jenisAlat: "Rotating Equipment", tanggalRegistrasi: "2023-11-18", statusAset: "IDLE", statusPersetujuan: "APPROVED" },
  { id: "5", kodeAlat: "K-901", namaAlat: "Gas Compressor K-901", plant: "P-1", jenisAlat: "Rotating Equipment", tanggalRegistrasi: "2023-11-20", statusAset: "REGISTERED", statusPersetujuan: "PENDING" },
  { id: "6", kodeAlat: "P-101A", namaAlat: "Feed Water Pump P-101A", plant: "P-2", jenisAlat: "Rotating Equipment", tanggalRegistrasi: "2023-11-21", statusAset: "VALIDATED", statusPersetujuan: "IN_REVIEW" },
];

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
  
  const ITEMS_PER_PAGE = 15;

  const fetchEquipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Ganti ke endpoint real Anda jika backend API CRUD sudah siap (misalnya: "/api/equipments")
      // Karena menurut dokumentasi saat ini API untuk CRUD peralatan belum dibuat di backend Go,
      // kita gunakan data dummy (Mock Data) sementara agar UI bisa dilihat dan diuji.
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi delay jaringan
      setEquipments(MOCK_EQUIPMENTS);
      
    } catch (err: any) {
      console.error(err);
      setError("Gagal terhubung ke database. Menampilkan data kosong atau periksa kembali koneksi backend Anda.");
      setEquipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    let result = equipments.filter(item => {
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
    };
    const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${style}`}>{status}</span>;
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
      
    </div>
  );
}
