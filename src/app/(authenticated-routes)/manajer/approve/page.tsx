"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";

interface RequestAsset {
  id: string;
  nomorRequest: string;
  kodeAset: string;
  namaAset: string;
  plant: string;
  tanggalPengajuan: string;
  statusAset: string;
  statusPersetujuan: string;
}

const MOCK_REQUESTS: RequestAsset[] = [
  {
    id: "1",
    nomorRequest: "REQ-2026-002",
    kodeAset: "VLV-202-UR3",
    namaAset: "Control Valve V-202 Urea",
    plant: "Urea III",
    tanggalPengajuan: "2026-07-14",
    statusAset: "VALIDATED",
    statusPersetujuan: "Menunggu Review"
  },
  {
    id: "2",
    nomorRequest: "REQ-2026-005",
    kodeAset: "MCH-505-AM2B",
    namaAset: "Heat Exchanger E-505 Ammonia",
    plant: "Ammonia IIB",
    tanggalPengajuan: "2026-07-12",
    statusAset: "VALIDATED",
    statusPersetujuan: "Sedang Direview"
  },
  {
    id: "3",
    nomorRequest: "REQ-2026-006",
    kodeAset: "VLV-606-UR3",
    namaAset: "Safety Valve SV-606 Urea",
    plant: "Urea III",
    tanggalPengajuan: "2026-07-13",
    statusAset: "VALIDATED",
    statusPersetujuan: "Perlu Revisi"
  }
];

export default function ManajerApprovePage() {
  const [search, setSearch] = useState("");
  const [plant, setPlant] = useState("Semua Plant");
  const [status, setStatus] = useState("Semua Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleReset = () => {
    setSearch("");
    setPlant("Semua Plant");
    setStatus("Semua Status");
    setStartDate("");
    setEndDate("");
  };

  const getStatusAsetBadge = (status: string) => {
    if (status === "VALIDATED") {
      return <span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
  };

  const getApprovalBadge = (status: string) => {
    if (status === "Menunggu Review") {
      return <span className="bg-[#FEF9C3] text-[#CA8A04] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    if (status === "Sedang Direview") {
      return <span className="bg-[#E0F2FE] text-[#0284C7] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    if (status === "Perlu Revisi") {
      return <span className="bg-[#F3E8FF] text-[#9333EA] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-8 px-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pusat Data Aset</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Cari Pengajuan</label>
            <input 
              type="text" 
              placeholder="No. Request / Kode / Nama..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          
          <div className="w-[150px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Pabrik (Plant)</label>
            <select 
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer"
            >
              <option value="Semua Plant">Semua Plant</option>
              <option value="Urea III">Urea III</option>
              <option value="Ammonia IIB">Ammonia IIB</option>
            </select>
          </div>
          
          <div className="w-[170px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Status Persetujuan</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Menunggu Review">Menunggu Review</option>
              <option value="Sedang Direview">Sedang Direview</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
            </select>
          </div>
          
          <div className="w-[160px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tanggal Mulai</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            />
          </div>
          
          <div className="w-[160px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tanggal Akhir</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="bg-[#0A356A] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#0556B3] transition-colors whitespace-nowrap h-[38px]">
              Cari
            </button>
            <button onClick={handleReset} className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap h-[38px]">
              Reset
            </button>
          </div>
          
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nomor Request</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kode Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Plant</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal Pengajuan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Persetujuan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {MOCK_REQUESTS.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-[#0A356A]">{req.nomorRequest}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-gray-900">{req.kodeAset}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600 font-medium">{req.namaAset}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600 font-medium">{req.plant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600 font-medium">{req.tanggalPengajuan}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusAsetBadge(req.statusAset)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getApprovalBadge(req.statusPersetujuan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-4 py-2 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors w-full max-w-[120px]">
                      <Eye className="w-3.5 h-3.5" />
                      Review Aset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}