"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList } from "lucide-react";
import Link from "next/link";
import { getEquipments } from "@/action/api";

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
}

export default function InspeksiAntreanPage() {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
    setSortConfig(null);
  };

  const filteredData = useMemo(() => {
    const filtered = data.filter((row) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase().trim();
      const code = row.equipment_code?.toLowerCase() || "";
      const name = row.name?.toLowerCase() || "";
      return code.includes(query) || name.includes(query);
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortConfig.key === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortConfig.key === 'equipment_code') {
          valA = a.equipment_code.toLowerCase();
          valB = b.equipment_code.toLowerCase();
        } else if (sortConfig.key === 'plant') {
          valA = ((typeof a.plant === 'string' ? a.plant : a.plant?.name) || a.area?.name || "").toLowerCase();
          valB = ((typeof b.plant === 'string' ? b.plant : b.plant?.name) || b.area?.name || "").toLowerCase();
        } else if (sortConfig.key === 'date') {
          valA = a.updated_at || a.created_at || "";
          valB = b.updated_at || b.created_at || "";
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, sortConfig]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" /> : 
      <ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />;
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      {/* Main Content Area (Tabel) */}
      <div id="inspeksi-table-container" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
        
        {/* Toolbar / Filters */}
        <div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          
          {/* Search */}
          <div className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari kode atau nama alat..." 
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearch(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400" 
              />
            </div>
            <button 
              onClick={() => setSearch(searchInput)}
              className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
            >
              Cari
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              title="Reset pencarian"
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
              <tr className="border-b border-gray-300">
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center w-12 whitespace-nowrap">No</th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('name')}>
                  <div className="flex items-center justify-start">Nama Alat {getSortIcon('name')}</div>
                </th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('plant')}>
                  <div className="flex items-center justify-start">Plant {getSortIcon('plant')}</div>
                </th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('date')}>
                  <div className="flex items-center justify-start">Tanggal Idle {getSortIcon('date')}</div>
                </th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Lama Idle</th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Tindakan</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-[13px] font-medium text-gray-900">Data Tidak Ditemukan</p>
                      <p className="text-[11px] text-gray-500 mt-1">Tidak ada aset IDLE untuk diinspeksi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((row, index) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const idleDateStr = row.updated_at || row.created_at || new Date().toISOString();
                  const idleDate = new Date(idleDateStr);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - idleDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const plantStr = (typeof row.plant === 'string' ? row.plant : row.plant?.name) || row.area?.name || "-";

                  return (
                    <tr key={row.id} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                      <td className="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">{rowNum}</td>
                      <td className="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left" title={row.name}>
                        <span className="leading-tight line-clamp-2 block text-left">{row.name}</span>
                        <span className="text-[11px] text-[#0A356A] font-bold block">{row.equipment_code}</span>
                      </td>
                      <td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
                        {plantStr}
                      </td>
                      <td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
                        {idleDate.toISOString().split('T')[0]}
                      </td>
                      <td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
                        {diffDays} Hari
                      </td>
                      <td className="px-3 py-3 text-[15px] text-left">
                        <div className="flex justify-start">
                          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#E0E7FF] text-[#4F46E5]">
                            READY TO USE
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-left">
                        <div className="flex justify-start opacity-90 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`} 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 px-2.5 rounded-md transition-colors flex items-center gap-1"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Mulai Inspeksi</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-500">
            Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data ({ITEMS_PER_PAGE} baris/halaman)
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
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
              onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
              disabled={currentPage === Math.max(1, totalPages)}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
