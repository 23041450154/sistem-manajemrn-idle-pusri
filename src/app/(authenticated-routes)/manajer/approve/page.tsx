"use client";

import React, { useState, useEffect } from "react";
import { Eye, X, Shield, FileText, CheckCircle2, RefreshCw, XCircle, Download } from "lucide-react";
import { getApprovals, reviewApproval, getEquipments } from "@/action/api";

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

// MOCK_REQUESTS removed

export default function ManajerApprovePage() {
  const [search, setSearch] = useState("");
  const [plant, setPlant] = useState("Semua Plant");
  const [status, setStatus] = useState("Semua Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [requests, setRequests] = useState<RequestAsset[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<RequestAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRevisiOpen, setIsRevisiOpen] = useState(false);
  const [revisiCatatan, setRevisiCatatan] = useState("");
  const [revisiError, setRevisiError] = useState(false);
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [approvalsData, equipmentsData] = await Promise.all([
          getApprovals(),
          getEquipments()
        ]);
        
        // Buat kamus (map) equipment berdasarkan ID untuk pencarian cepat
        const equipmentMap = new Map();
        if (Array.isArray(equipmentsData)) {
          equipmentsData.forEach((eq: any) => {
            equipmentMap.set(eq.id, eq);
          });
        }

        const mappedData = approvalsData.map((item: any) => {
          const eq = equipmentMap.get(item.equipment_id);
          return {
            id: item.id.toString(),
            nomorRequest: item.request_number,
            kodeAset: item.equipment_code || (eq?.equipment_code || "-"),
            namaAset: item.equipment_name || (eq?.name || "-"),
            plant: item.plant || (eq?.plant || "-"),
            tanggalPengajuan: item.request_date ? new Date(item.request_date).toISOString().split('T')[0] : "-",
            statusAset: (item.equipment_status || eq?.status?.name || "REGISTERED").toUpperCase(),
            statusPersetujuan: item.approval_status === "PENDING" ? "Menunggu Review" : (item.approval_status === "IN_REVIEW" ? "Sedang Direview" : (item.approval_status === "APPROVED" ? "Disetujui" : (item.approval_status === "REVISION_REQUIRED" ? "Perlu Revisi" : item.approval_status)))
          };
        });

        const approved = JSON.parse(localStorage.getItem('approvedAssets') || '[]');
        const revised = JSON.parse(localStorage.getItem('revisedAssets') || '[]');
        const inReview = JSON.parse(localStorage.getItem('inReviewAssets') || '[]');
        
        if (approved.length > 0 || revised.length > 0 || inReview.length > 0) {
          const updated = mappedData.map((req: any) => {
            if (approved.includes(req.kodeAset)) {
              return { ...req, statusAset: "IDLE", statusPersetujuan: "Disetujui" };
            }
            if (revised.includes(req.kodeAset)) {
              return { ...req, statusPersetujuan: "Perlu Revisi" };
            }
            if (inReview.includes(req.kodeAset) && req.statusPersetujuan === "Menunggu Review") {
              return { ...req, statusPersetujuan: "Sedang Direview" };
            }
            return req;
          });
          setRequests(updated);
          setFilteredRequests(updated);
        } else {
          setRequests(mappedData);
          setFilteredRequests(mappedData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (asset: RequestAsset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
    
    // Change to IN_REVIEW automatically when opened
    if (asset.statusPersetujuan === "Menunggu Review") {
      const inReview = JSON.parse(localStorage.getItem('inReviewAssets') || '[]');
      if (!inReview.includes(asset.kodeAset)) {
        inReview.push(asset.kodeAset);
        localStorage.setItem('inReviewAssets', JSON.stringify(inReview));
      }
      
      const updatedReqs = requests.map(req => 
        req.kodeAset === asset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview" } : req
      );
      setRequests(updatedReqs);
      setFilteredRequests(filteredRequests.map(req => 
        req.kodeAset === asset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview" } : req
      ));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAsset(null), 300);
  };

  const handleApprove = async () => {
    if (selectedAsset) {
      const res = await reviewApproval(selectedAsset.id, "APPROVE", "Disetujui oleh manajer");
      
      if (res.success) {
        const approved = JSON.parse(localStorage.getItem('approvedAssets') || '[]');
        if (!approved.includes(selectedAsset.kodeAset)) {
          approved.push(selectedAsset.kodeAset);
          localStorage.setItem('approvedAssets', JSON.stringify(approved));
        }
        
        const inReview = JSON.parse(localStorage.getItem('inReviewAssets') || '[]');
        localStorage.setItem('inReviewAssets', JSON.stringify(inReview.filter((code: string) => code !== selectedAsset.kodeAset)));
        
        const revised = JSON.parse(localStorage.getItem('revisedAssets') || '[]');
        localStorage.setItem('revisedAssets', JSON.stringify(revised.filter((code: string) => code !== selectedAsset.kodeAset)));

        setNotification({ type: "success", message: "Berhasil menyetujui aset!" });
        const updated = requests.map(req => 
          req.kodeAset === selectedAsset.kodeAset 
            ? { ...req, statusAset: "IDLE", statusPersetujuan: "Disetujui" }
            : req
        );
        setRequests(updated);
        setFilteredRequests(filteredRequests.map(req => 
          req.kodeAset === selectedAsset.kodeAset 
            ? { ...req, statusAset: "IDLE", statusPersetujuan: "Disetujui" }
            : req
        ));
        setIsConfirmOpen(false);
        closeModal();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: "error", message: "Gagal menyetujui aset: " + (res.message || "Silakan coba lagi.") });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleKirimRevisi = async () => {
    if (!revisiCatatan.trim()) {
      setRevisiError(true);
      return;
    }
    
    if (selectedAsset) {
      const res = await reviewApproval(selectedAsset.id, "REVISION", revisiCatatan);
      
      if (res.success) {
        const revised = JSON.parse(localStorage.getItem('revisedAssets') || '[]');
        if (!revised.includes(selectedAsset.kodeAset)) {
          revised.push(selectedAsset.kodeAset);
          localStorage.setItem('revisedAssets', JSON.stringify(revised));
        }
        
        const inReview = JSON.parse(localStorage.getItem('inReviewAssets') || '[]');
        localStorage.setItem('inReviewAssets', JSON.stringify(inReview.filter((code: string) => code !== selectedAsset.kodeAset)));

        setNotification({ type: "success", message: "Berhasil mengirim permintaan revisi!" });
        const updated = requests.map(req => 
          req.kodeAset === selectedAsset.kodeAset 
            ? { ...req, statusPersetujuan: "Perlu Revisi" }
            : req
        );
        setRequests(updated);
        setFilteredRequests(filteredRequests.map(req => 
          req.kodeAset === selectedAsset.kodeAset 
            ? { ...req, statusPersetujuan: "Perlu Revisi" }
            : req
        ));
        setIsRevisiOpen(false);
        closeModal();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: "error", message: "Gagal mengirim permintaan revisi: " + (res.message || "Silakan coba lagi.") });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleCari = () => {
    const result = requests.filter(req => {
      const matchSearch = search 
        ? req.nomorRequest.toLowerCase().includes(search.toLowerCase()) || 
          req.kodeAset.toLowerCase().includes(search.toLowerCase()) || 
          req.namaAset.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchPlant = plant !== "Semua Plant" ? req.plant === plant : true;
      const matchStatus = status !== "Semua Status" ? req.statusPersetujuan === status : true;
      
      let matchDate = true;
      if (startDate && endDate) {
        const reqDate = new Date(req.tanggalPengajuan);
        matchDate = reqDate >= new Date(startDate) && reqDate <= new Date(endDate);
      }
      return matchSearch && matchPlant && matchStatus && matchDate;
    });
    setFilteredRequests(result);
  };

  const handleReset = () => {
    setSearch("");
    setPlant("Semua Plant");
    setStatus("Semua Status");
    setStartDate("");
    setEndDate("");
    setFilteredRequests(requests);
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
      
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span className="text-[13px] font-medium">{notification.message}</span>
        </div>
      )}

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
            <button onClick={handleCari} className="bg-[#0A356A] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#0556B3] transition-colors whitespace-nowrap h-[38px]">
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
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nomor Request</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kode Aset</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">Nama Aset</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Plant</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tanggal Pengajuan</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Aset</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status Persetujuan</th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-2 py-2 text-[12px] font-bold text-[#0A356A] leading-snug">{req.nomorRequest}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-[12px] font-bold text-gray-900">{req.kodeAset}</td>
                  <td className="px-2 py-2 text-[12px] text-gray-600 font-medium leading-snug">{req.namaAset}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-[12px] text-gray-600 font-medium">{req.plant}</td>
                  <td className="px-2 py-2 text-[12px] text-gray-600 font-medium leading-snug">{req.tanggalPengajuan}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {getStatusAsetBadge(req.statusAset)}
                  </td>
                  <td className="px-2 py-2">
                    {getApprovalBadge(req.statusPersetujuan)}
                  </td>
                  <td className="px-2 py-2 text-center w-[80px]">
                    <button 
                      onClick={() => openModal(req)}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors w-full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Informasi Aset */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#1e293b]">Detail Informasi Aset</h2>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">{selectedAsset.kodeAset}</p>
              </div>
              <button onClick={closeModal} className="text-gray-900 hover:bg-gray-100 p-1 rounded-md transition-colors font-bold mt-1">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
              
              {/* Alert Banner */}
              <div className="bg-[#eff6ff] border border-blue-200 rounded-lg p-3.5 flex items-start gap-3 mb-6">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-blue-700 font-medium leading-relaxed">
                  Status: {selectedAsset.statusPersetujuan}. Anda dapat memberikan persetujuan atau meminta revisi teknis.
                </p>
              </div>

              {/* Section 1: Detail Spesifikasi Alat */}
              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">Detail Spesifikasi Alat</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Kode Alat:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.kodeAset}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Nama Alat:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.namaAset}</p>
                  </div>
                  
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Kategori / Jenis:</p>
                    <p className="text-[13px] font-bold text-gray-900">Valve</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Plant Asal:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.plant}</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Lokasi Gudang:</p>
                    <p className="text-[13px] font-bold text-gray-900">Gudang Utama</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Pabrikan / Vendor:</p>
                    <p className="text-[13px] font-bold text-gray-900">Fisher Controls</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Tahun Pembuatan:</p>
                    <p className="text-[13px] font-bold text-gray-900">2020</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Nilai Perolehan (IDR):</p>
                    <p className="text-[13px] font-bold text-gray-900">Rp 80,000,000</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Kondisi Fisik:</p>
                    <p className="text-[13px] font-bold text-gray-900 uppercase">Bagus</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Didaftarkan Oleh:</p>
                    <p className="text-[13px] font-bold text-gray-900">NPP2304145</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Tanggal Registrasi:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.tanggalPengajuan}</p>
                  </div>
                  <div className="hidden"></div>

                  <div className="col-span-2">
                    <p className="text-[12px] text-gray-500 font-medium mb-1.5">Catatan Pendaftaran:</p>
                    <div className="bg-[#f8fafc] p-3 rounded-md">
                      <p className="text-[13px] text-gray-700 italic font-medium">"Katup kontrol dilepas karena redundansi kapasitas."</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Lampiran Gambar & Dokumen */}
              <div>
                <h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">Lampiran Gambar & Dokumen</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div 
                    onClick={() => window.open("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&q=80", "_blank")}
                    className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm cursor-pointer hover:border-[#0f4a8a] transition-colors group"
                  >
                    <div className="h-40 bg-gray-100 w-full relative overflow-hidden flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&q=80" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" alt="Foto Pompa" />
                    </div>
                    <div className="p-3 text-center flex flex-col justify-center border-t border-gray-100">
                      <p className="text-[12px] font-bold text-gray-800">Foto Pompa Utama</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => window.open("https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&q=80", "_blank")}
                    className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm cursor-pointer hover:border-[#0f4a8a] transition-colors group"
                  >
                    <div className="h-40 bg-gray-100 w-full relative overflow-hidden flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&q=80" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" alt="Label Tag" />
                    </div>
                    <div className="p-3 text-center flex flex-col justify-center border-t border-gray-100">
                      <p className="text-[12px] font-bold text-gray-800">Label Tag Plat Aset</p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => window.open("/laporan_inspeksi_P101.pdf", "_blank")}
                  className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-white shadow-sm hover:border-[#0f4a8a] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500 group-hover:text-[#0f4a8a] transition-colors" />
                    <div>
                      <p className="text-[13px] font-bold text-gray-800">laporan_inspeksi_P101.pdf</p>
                      <p className="text-[11px] text-gray-500">3.4 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-[#0f4a8a]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement("a");
                        link.href = "/laporan_inspeksi_P101.pdf";
                        link.download = "laporan_inspeksi_P101.pdf";
                        link.click();
                      }} 
                      className="p-1.5 hover:bg-blue-50 rounded-md transition-colors text-[#0f4a8a]" 
                      title="Download Laporan"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer (Sembunyikan jika sudah Disetujui / Revisi) */}
            {selectedAsset.statusPersetujuan !== "Disetujui" && selectedAsset.statusPersetujuan !== "Perlu Revisi" && (
              <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
                <button onClick={closeModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setRevisiCatatan("");
                    setRevisiError(false);
                    setIsRevisiOpen(true);
                  }}
                  className="px-6 py-2.5 bg-[#f60000] text-white rounded-md text-[13px] font-semibold hover:bg-[#990404] transition-colors"
                >
                  Minta Revisi
                </button>
                <button 
                  onClick={() => setIsConfirmOpen(true)}
                  className="px-6 py-2.5 bg-[#166534] text-white rounded-md text-[13px] font-semibold hover:bg-[#14532d] transition-colors"
                >
                  Setujui (Approve)
                </button>
              </div>
            )}
            
            {/* Tampilkan pesan jika sudah diproses */}
            {(selectedAsset.statusPersetujuan === "Disetujui" || selectedAsset.statusPersetujuan === "Perlu Revisi") && (
              <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                <p className="text-[13px] text-gray-500 font-medium italic">
                  Pengajuan ini sudah diproses ({selectedAsset.statusPersetujuan}) dan tidak dapat direview ulang.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal Konfirmasi */}
      {isConfirmOpen && selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsConfirmOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Persetujuan Aset</h3>
            
            <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menyetujui hasil validasi ini? Setelah disetujui, <span className="font-bold">{selectedAsset.kodeAset}</span> aset akan berubah menjadi <span className="font-bold text-green-700">IDLE</span>, proses persetujuan selesai, dan pengajuan tidak lagi muncul pada Inbox Approval.
            </p>
            
            <div className="flex items-center gap-3 w-full justify-center">
              <button 
                onClick={() => setIsConfirmOpen(false)} 
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors w-[120px]"
              >
                Batal
              </button>
              <button 
                onClick={handleApprove}
                className="px-5 py-2.5 bg-[#166534] text-white rounded-md text-[13px] font-semibold hover:bg-[#14532d] transition-colors w-[120px]"
              >
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Minta Revisi */}
      {isRevisiOpen && selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsRevisiOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-start animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-purple-600" strokeWidth={3} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Minta Revisi Validasi</h3>
            </div>
            
            <p className="text-[13px] text-gray-600 mb-5 leading-relaxed text-left">
              Apakah Anda yakin ingin meminta revisi? Tim Inspeksi Teknik akan dapat memperbarui hasil validasi berdasarkan catatan revisi yang Anda berikan di bawah ini.
            </p>
            
            <div className="text-left w-full mb-6">
              <label className="block text-[12px] font-bold text-gray-800 mb-1.5">Catatan Revisi Manajer (Wajib) *</label>
              <textarea 
                value={revisiCatatan}
                onChange={(e) => {
                  setRevisiCatatan(e.target.value);
                  if (e.target.value.trim()) setRevisiError(false);
                }}
                placeholder="Tulis instruksi revisi secara spesifik (misal: 'Perbaiki foto plat nama yang buram')..."
                className={`w-full p-3 border rounded-lg text-[13px] outline-none transition-colors resize-none h-24 ${revisiError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'}`}
              />
              {revisiError && <p className="text-red-500 text-[11px] mt-1.5 font-medium">Catatan revisi tidak boleh kosong.</p>}
            </div>
            
            <div className="flex items-center justify-end gap-3 w-full">
              <button 
                onClick={() => setIsRevisiOpen(false)} 
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleKirimRevisi}
                className="px-5 py-2 bg-[#ff0000] text-white rounded-md text-[13px] font-semibold hover:bg-[#8c0000] transition-colors"
              >
                Kirim Permintaan Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}