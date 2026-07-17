"use client";

import React from "react";
import { 
  Calendar, Clock, AlertCircle, CheckCircle2, Search, Filter, 
  Download, Printer, Eye, Plus, Info, BarChart2 
} from "lucide-react";
import Link from "next/link";

export default function InspeksiDashboard() {
  // Mock Data dari gambar desain
  const tableData = [
    { id: "PSR-P1-1024", name: "Centrifugal Pump C-102", date: "24 Okt 2023", type: "KHUSUS", inspector: "Budi Santoso", status: "Terlambat" },
    { id: "PSR-U3-2051", name: "Heat Exchanger HE-205", date: "15 Nov 2023", type: "RUTIN", inspector: "Anita Wijaya", status: "Mendatang" },
    { id: "PSR-P2-4099", name: "Pressure Vessel V-409", date: "02 Nov 2023", type: "RUTIN", inspector: "Dedi Kurniawan", status: "Selesai" },
    { id: "PSR-U3-5521", name: "Steam Turbine T-552", date: "18 Nov 2023", type: "KHUSUS", inspector: "Budi Santoso", status: "Mendatang" },
    { id: "PSR-P1-9012", name: "Compressor K-901", date: "29 Okt 2023", type: "RUTIN", inspector: "Hadi Siswoyo", status: "Selesai" },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10 pt-2">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Manajemen Inspeksi &rsaquo; <span className="font-bold text-[#0A356A]">Daftar Inspeksi</span></div>
          <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Daftar Inspeksi Teknik</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jadwal inspeksi rutin maupun khusus untuk seluruh aset idle.</p>
        </div>
        <button className="bg-[#0A356A] hover:bg-[#0556B3] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md">
          <Plus className="w-4 h-4" />
          Jadwalkan Inspeksi Baru
        </button>
      </div>

      {/* KPI Cards (4 Kotak Ringkasan Atas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        
        {/* Card 1: Total Jadwal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-[#0556B3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Total Jadwal</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">124</p>
          </div>
        </div>
        
        {/* Card 2: Mendatang */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#0556B3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Mendatang</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">18</p>
          </div>
        </div>
        
        {/* Card 3: Terlambat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Terlambat</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">5</p>
          </div>
        </div>
        
        {/* Card 4: Selesai */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#0556B3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Selesai (Bulan ini)</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">42</p>
          </div>
        </div>
      </div>

      {/* Tabel Data Inspeksi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        
        {/* Toolbar Tabel */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari kode aset atau peralatan..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
          </div>
          <div className="flex items-center gap-2.5">
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none cursor-pointer">
              <option>Status: Semua</option>
              <option>Terlambat</option>
              <option>Mendatang</option>
              <option>Selesai</option>
            </select>
            <select className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none cursor-pointer">
              <option>Plant: Semua</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#0A356A] hover:bg-blue-50 rounded-lg transition-colors border border-transparent">
              <Filter className="w-4 h-4" /> Filter Lanjut
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors bg-white">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors bg-white">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Isi Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4 pl-6">Kode Aset</th>
                <th className="p-4">Nama Peralatan</th>
                <th className="p-4">Tanggal Jadwal</th>
                <th className="p-4">Tipe Inspeksi</th>
                <th className="p-4">Inspektor</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 pl-6 font-bold text-[#0556B3]">{row.id}</td>
                  <td className="p-4 text-gray-900 font-semibold">{row.name}</td>
                  <td className="p-4 text-gray-600 font-medium">{row.date}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                      {row.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{row.inspector}</td>
                  <td className="p-4">
                    {row.status === "Terlambat" && (
                      <span className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-red-100">Terlambat</span>
                    )}
                    {row.status === "Mendatang" && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-blue-100">Mendatang</span>
                    )}
                    {row.status === "Selesai" && (
                      <span className="bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-green-100">Selesai</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {row.status !== "Selesai" ? (
                      <Link href="/dashboard/inspeksi/form" className="inline-block bg-[#0A356A] hover:bg-[#0556B3] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                        Mulai Inspeksi
                      </Link>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-gray-400">
                        <button className="p-1.5 hover:text-[#0556B3] hover:bg-blue-50 rounded-md transition-colors" title="Lihat Laporan"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:text-[#0556B3] hover:bg-blue-50 rounded-md transition-colors" title="Cetak"><Printer className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginasi Bawah */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
          <div className="font-medium">Menampilkan 1-5 dari 124 inspeksi</div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-400 hover:text-[#0A356A] disabled:opacity-50 transition-colors">&lsaquo;</button>
            <button className="w-8 h-8 rounded-lg bg-[#0A356A] text-white font-bold shadow-sm">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 font-semibold text-gray-600 transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 font-semibold text-gray-600 transition-colors">3</button>
            <span className="px-1 text-gray-400">...</span>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 font-semibold text-gray-600 transition-colors">25</button>
            <button className="p-1.5 text-gray-400 hover:text-[#0A356A] transition-colors">&rsaquo;</button>
          </div>
        </div>

      </div>

      {/* KARTU INFORMASI BAWAH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panduan Inspeksi */}
        <div className="bg-[#F0F7FF] rounded-xl border border-blue-100 p-6 flex gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#0A356A] flex items-center justify-center shrink-0 shadow-sm">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0A356A] mb-1.5">Panduan Inspeksi</h3>
            <p className="text-sm text-[#0A356A]/80 leading-relaxed mb-4">
              Setiap aset idle wajib diinspeksi minimal satu kali setiap 3 bulan untuk memastikan integritas mekanis dan kesiapan mobilisasi ulang. Gunakan aplikasi mobile untuk pemindaian barcode di lapangan.
            </p>
            <a href="#" className="text-[11px] font-extrabold text-[#0556B3] uppercase tracking-wider hover:underline flex items-center gap-1">
              UNDUH SOP LENGKAP <span className="text-base leading-none">&nearr;</span>
            </a>
          </div>
        </div>

        {/* Status Kesehatan Aset */}
        <div className="bg-[#85AEE6] rounded-xl border border-transparent p-6 flex gap-5 shadow-sm text-white overflow-hidden relative">
          <div className="w-12 h-12 rounded-full bg-[#0A356A]/30 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="text-base font-bold mb-1.5">Status Kesehatan Aset</h3>
            <p className="text-sm text-white/90 leading-relaxed mb-5 font-medium">
              Berdasarkan data inspeksi minggu ini, 92% aset idle berada dalam status "Siap Pakai". Sisa 8% memerlukan perbaikan minor segera.
            </p>
            {/* Progress Bar (Visualisasi 92%) */}
            <div className="w-full bg-white/30 h-2.5 rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-[#0A356A] h-full rounded-full" style={{ width: "92%" }}></div>
            </div>
          </div>
          {/* Efek dekorasi cahaya di background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        </div>

      </div>

    </div>
  );
}
