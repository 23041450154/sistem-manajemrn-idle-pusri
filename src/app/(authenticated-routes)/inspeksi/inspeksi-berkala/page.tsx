"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, AlertCircle, CheckCircle2, Search, Filter, 
  Download, Printer, Eye, Plus, Info, BarChart2 
} from "lucide-react";
import Link from "next/link";

interface Inspection {
  id: number;
  equipment: {
    equipment_code: string;
    name: string;
  };
  inspection_date: string;
  inspector: string;
  require_action: {
    name: string;
  };
  notes: string;
  status: string;
}

export default function InspeksiDashboard() {
  const [data, setData] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackData: Inspection[] = [
    { id: 1, equipment: { equipment_code: "C-102", name: "Centrifugal Pump C-102" }, inspection_date: "2023-10-24T00:00:00Z", require_action: { name: "KHUSUS" }, inspector: "Budi Santoso", status: "Terlambat", notes: "" },
    { id: 2, equipment: { equipment_code: "HE-205", name: "Heat Exchanger HE-205" }, inspection_date: "2023-11-15T00:00:00Z", require_action: { name: "RUTIN" }, inspector: "Anita Wijaya", status: "Mendatang", notes: "" },
    { id: 3, equipment: { equipment_code: "V-409", name: "Pressure Vessel V-409" }, inspection_date: "2023-11-02T00:00:00Z", require_action: { name: "RUTIN" }, inspector: "Dedi Kurniawan", status: "Selesai", notes: "" },
    { id: 4, equipment: { equipment_code: "T-552", name: "Steam Turbine T-552" }, inspection_date: "2023-11-18T00:00:00Z", require_action: { name: "KHUSUS" }, inspector: "Budi Santoso", status: "Mendatang", notes: "" },
    { id: 5, equipment: { equipment_code: "K-901", name: "Compressor K-901" }, inspection_date: "2023-10-29T00:00:00Z", require_action: { name: "RUTIN" }, inspector: "Hadi Siswoyo", status: "Selesai", notes: "" },
    { id: 6, equipment: { equipment_code: "P-101", name: "Feed Pump P-101" }, inspection_date: "2023-11-20T00:00:00Z", require_action: { name: "RUTIN" }, inspector: "Rudi Hartono", status: "Mendatang", notes: "" },
    { id: 7, equipment: { equipment_code: "E-302", name: "Cooler E-302" }, inspection_date: "2023-10-15T00:00:00Z", require_action: { name: "RUTIN" }, inspector: "Siti Aminah", status: "Selesai", notes: "" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/inspections");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setData(json.data);
            setLoading(false);
            return;
          }
        }
        setData(fallbackData);
        setLoading(false);
      } catch (err) {
        setData(fallbackData);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return alert("Tidak ada data untuk diexport");
    
    const headers = ["Kode Aset", "Nama Peralatan", "Tanggal Jadwal", "Tipe Inspeksi", "Inspektor", "Status"];
    const csvRows = data.map(row => {
      const dateStr = new Date(row.inspection_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' });
      return [
        row.equipment.equipment_code,
        `"${row.equipment.name}"`, 
        `"${dateStr}"`,
        row.require_action.name,
        `"${row.inspector}"`,
        row.status
      ].join(",");
    });
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Export_Inspeksi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 flex flex-col h-[calc(100vh-72px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-0.5">
            <span>Manajemen Inspeksi</span>
            <span className="text-gray-400">&rsaquo;</span>
            <span className="font-semibold text-[#0A356A] uppercase tracking-wide">Daftar Inspeksi Teknik</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Daftar Inspeksi Teknik</h1>
        </div>
        <button className="bg-[#0A356A] hover:bg-[#062854] text-white px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Buat Jadwal
        </button>
      </div>

      {/* Full Width Layout */}
      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          
          {/* KPI Cards (Shrink-0 agar tetap tingginya) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#0A356A]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Total</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">124</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#0A356A]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Mendatang</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">18</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Terlambat</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">5</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Selesai</p>
                <p className="text-lg font-extrabold text-gray-900 leading-none">42</p>
              </div>
            </div>
          </div>

          {/* Tabel Data Inspeksi - Menggunakan flex-1 dan min-h-0 agar mengisi sisa ruang */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Toolbar Tabel */}
            <div className="p-2 border-b border-gray-200 bg-white flex flex-col sm:flex-row gap-2 justify-between items-center shrink-0">
              <div className="relative w-full sm:max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Cari aset..." className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-[#0A356A] outline-none transition-all placeholder:text-gray-400" />
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <select className="px-2 py-1.5 text-[12px] border border-gray-200 rounded-md bg-white outline-none cursor-pointer focus:border-[#0A356A]">
                  <option>Status</option>
                  <option>Terlambat</option>
                  <option>Mendatang</option>
                </select>
                <button className="flex items-center gap-1 px-2 py-1.5 text-[12px] font-semibold text-[#0A356A] hover:bg-gray-50 border border-gray-200 rounded-md transition-colors">
                  <Filter className="w-3 h-3" /> Filter
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5 hidden sm:block"></div>
                <button 
                  onClick={handleExportCSV}
                  title="Export to CSV"
                  className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors bg-white shadow-sm flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => window.print()}
                  title="Print Halaman"
                  className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors bg-white shadow-sm flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Isi Tabel dengan scroll Y otomatis (flex-1 min-h-0 memaksanya scroll jika berlebih) */}
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 bg-white">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200 shadow-sm">
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="px-4 py-2.5">Kode Aset</th>
                    <th className="px-4 py-2.5">Peralatan</th>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Tipe</th>
                    <th className="px-4 py-2.5">Inspektor</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-[12px]">Memuat data...</td>
                    </tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-2 whitespace-nowrap text-[12px] font-bold text-[#0A356A]">{row.equipment.equipment_code}</td>
                        <td className="px-4 py-2 text-[12px] text-gray-800 font-medium truncate max-w-[150px]" title={row.equipment.name}>{row.equipment.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-[12px] text-gray-600">
                          {new Date(row.inspection_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                            {row.require_action.name}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-[12px] text-gray-600">{row.inspector}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.status === "Terlambat" && (
                            <span className="bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Terlambat</span>
                          )}
                          {row.status === "Mendatang" && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Mendatang</span>
                          )}
                          {row.status === "Selesai" && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Selesai</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          {row.status !== "Selesai" ? (
                            <Link href="/inspeksi/inspeksi-berkala/formInspeksi" className="inline-block bg-blue-50 text-[#0A356A] hover:bg-[#0A356A] hover:text-white border border-blue-200 px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm">
                              Mulai
                            </Link>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:text-[#0A356A] hover:bg-gray-100 rounded transition-colors" title="Lihat"><Eye className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Tabel Paginasi (Shrink-0) */}
            <div className="px-4 py-1.5 border-t border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-500 flex justify-between items-center shrink-0">
              <span>Menampilkan {data.length} data</span>
              <div className="flex items-center gap-1">
                <button className="p-0.5 text-gray-400 hover:text-[#0A356A] disabled:opacity-50 transition-colors">&lsaquo;</button>
                <button className="w-5 h-5 rounded bg-[#0A356A] text-white font-bold shadow-sm">1</button>
                <button className="p-0.5 text-gray-400 hover:text-[#0A356A] transition-colors">&rsaquo;</button>
              </div>
            </div>

          </div>

      </div>

    </div>
  );
}
