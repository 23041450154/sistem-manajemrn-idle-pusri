"use client";

import React, { useState, useEffect } from "react";
import { Eye, X, Shield, FileText, CheckCircle2, RefreshCw, XCircle, Download } from "lucide-react";
import { getApprovals, reviewApproval, getEquipments, startReviewApproval } from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";

interface RequestAsset {
  id: string;
  nomorRequest: string;
  kodeAset: string;
  namaAset: string;
  plant: string;
  tanggalPengajuan: string;
  statusAset: string;
  statusPersetujuan: string;
  inspekturNPP: string;
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
        const [approvalsData, equipmentsData, user] = await Promise.all([
          getApprovals(),
          getEquipments(),
          getCurrentUserAction()
        ]);
        const currentUserNPP = user?.user?.npp || "NPP2304145";
        
        // Buat kamus (map) equipment berdasarkan ID untuk pencarian cepat
        const equipmentMap = new Map();
        if (Array.isArray(equipmentsData)) {
          equipmentsData.forEach((eq: any) => {
            equipmentMap.set(Number(eq.id), eq);
          });
        }

        const mappedData = approvalsData.map((item: any) => {
          const equipmentId = item.equipment_id || item.equipment?.id;
          const eq = equipmentMap.get(Number(equipmentId)) || item.equipment;
          let statusPersetujuan = item.status_label || item.approval_status;
          
          if (item.approval_status === "PENDING") statusPersetujuan = "Menunggu Review (pending)";
          else if (item.approval_status === "IN_REVIEW") statusPersetujuan = "Sedang Direview (in_review)";
          else if (item.approval_status === "APPROVED") statusPersetujuan = "Disetujui";
          else if (item.approval_status === "REVISION_REQUIRED") statusPersetujuan = "Perlu Revisi";
          
          let statusAset = (item.equipment_status || eq?.status?.name || "VALIDATED").toUpperCase();
          if (item.approval_status === "APPROVED") {
            statusAset = "IDLE";
          }

          return {
            id: item.id.toString(),
            nomorRequest: item.request_number,
            kodeAset: item.equipment_code || eq?.equipment_code || "-",
            namaAset: item.equipment_name || eq?.name || "-",
            plant: item.plant || eq?.plant || "-",
            tanggalPengajuan: item.request_date ? new Date(item.request_date).toISOString().split('T')[0] : "-",
            statusAset: statusAset,
            statusPersetujuan: statusPersetujuan,
            inspekturNPP: (() => {
              const p = eq?.updated_by_npp || eq?.created_by_npp || currentUserNPP;
              return /^\d/.test(p) ? `NPP${p}` : p;
            })()
          };
        });

        setRequests(mappedData);
        setFilteredRequests(mappedData);
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
  };

  const handleMulaiReview = async () => {
    if (selectedAsset && selectedAsset.statusPersetujuan === "Menunggu Review (pending)") {
      try {
        const res = await startReviewApproval(selectedAsset.id);
        if (!res.success) {
          console.error("Failed to start review on backend:", res.message);
        }
      } catch (err) {
        console.error(err);
      }

      const updatedReqs = requests.map(req => 
        req.kodeAset === selectedAsset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview (in_review)" } : req
      );
      setRequests(updatedReqs);
      setFilteredRequests(filteredRequests.map(req => 
        req.kodeAset === selectedAsset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview (in_review)" } : req
      ));
      
      // Update selected asset state so UI re-renders immediately
      setSelectedAsset({ ...selectedAsset, statusPersetujuan: "Sedang Direview (in_review)" });
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
    if (status === "Menunggu Review (pending)" || status === "Menunggu Review") {
      return <span className="bg-[#FEF9C3] text-[#CA8A04] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    if (status === "Sedang Direview (in_review)" || status === "Sedang Direview") {
      return <span className="bg-[#E0F2FE] text-[#0284C7] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    if (status === "Perlu Revisi") {
      return <span className="bg-[#F3E8FF] text-[#9333EA] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
    }
    if (status === "Disetujui") {
      return <span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[11px] font-semibold">{status}</span>;
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
              <option value="P-IIB">Pusri IIB (P-IIB)</option>
              <option value="P-III">Pusri III (P-III)</option>
              <option value="P-IV">Pusri IV (P-IV)</option>
              <option value="UTILITY">Utility</option>
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
              <option value="Menunggu Review (pending)">Menunggu Review (pending)</option>
              <option value="Sedang Direview (in_review)">Sedang Direview (in_review)</option>
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
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#1e293b]">Detail Review Persetujuan</h2>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">{selectedAsset.kodeAset}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-md transition-colors font-bold mt-1">
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
              
              {/* Alert Banner Dinamis */}
              <div className={`border rounded-lg p-3.5 flex items-start gap-3 mb-6 ${
                selectedAsset.statusPersetujuan === 'Menunggu Review (pending)' ? 'bg-[#FEF9C3] border-yellow-200 text-yellow-800' :
                selectedAsset.statusPersetujuan === 'Sedang Direview (in_review)' ? 'bg-[#E0F2FE] border-blue-200 text-blue-800' :
                selectedAsset.statusPersetujuan === 'Perlu Revisi' ? 'bg-[#F3E8FF] border-purple-200 text-purple-800' :
                'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium leading-relaxed">
                  Status: <strong>{selectedAsset.statusPersetujuan}</strong>. 
                  {selectedAsset.statusPersetujuan === 'Menunggu Review (pending)' && " Silakan mulai review untuk melihat detail lebih lanjut."}
                  {selectedAsset.statusPersetujuan === 'Sedang Direview (in_review)' && " Anda sedang mereview pengajuan ini. Berikan keputusan setujui atau minta revisi."}
                  {selectedAsset.statusPersetujuan === 'Perlu Revisi' && " Menunggu perbaikan dari Tim Inspeksi Teknik."}
                </p>
              </div>

              {/* Section 1: Detail Spesifikasi Alat */}
              <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">1. Detail Spesifikasi Aset</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Nomor Request:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.nomorRequest}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Kode Aset:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.kodeAset}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Nama Aset:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.namaAset}</p>
                  </div>
                  
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Jenis Aset:</p>
                    <p className="text-[13px] font-bold text-gray-900">Peralatan Rotating</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Plant:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.plant}</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Functional Location:</p>
                    <p className="text-[13px] font-bold text-gray-900">FL-P1-0023</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Storage Location:</p>
                    <p className="text-[13px] font-bold text-gray-900">Gudang Utama B</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Tanggal Registrasi:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.tanggalPengajuan}</p>
                  </div>
                  <div className="hidden"></div>
                  
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Status Aset:</p>
                    {getStatusAsetBadge(selectedAsset.statusAset)}
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Status Persetujuan:</p>
                    {getApprovalBadge(selectedAsset.statusPersetujuan)}
                  </div>
                </div>
              </div>

              {/* Section 2: Informasi Finansial */}
              <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">2. Informasi Finansial</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[11px] text-gray-500 font-medium mb-1">Original Value</p>
                    <p className="text-[14px] font-bold text-gray-900">Rp 120,500,000</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[11px] text-gray-500 font-medium mb-1">Book Value</p>
                    <p className="text-[14px] font-bold text-gray-900">Rp 45,200,000</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-[11px] text-blue-700 font-medium mb-1">Estimated Reuse Value</p>
                    <p className="text-[14px] font-bold text-[#0f4a8a]">Rp 60,000,000</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Hasil Validasi Inspeksi Teknik */}
              <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                {selectedAsset.statusPersetujuan === "Menunggu Review (pending)" && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="bg-white px-4 py-2 border border-gray-200 rounded-full shadow-md text-[12px] font-bold text-gray-600 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Mulai review untuk melihat detail inspeksi
                    </div>
                  </div>
                )}
                
                <h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">3. Hasil Validasi Inspeksi Teknik</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Nama Inspektur:</p>
                    <p className="text-[13px] font-bold text-gray-900">Budi Santoso</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">NPP / Role:</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedAsset.inspekturNPP} / Inspektur Mekanik</p>
                  </div>
                  
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Waktu Pemeriksaan:</p>
                    <p className="text-[13px] font-bold text-gray-900">12 Sep 2023 (09:00 - 11:30)</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Durasi / Lokasi:</p>
                    <p className="text-[13px] font-bold text-gray-900">2 Jam 30 Menit / Workshop Area 2</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Kondisi Mekanik</p>
                    <p className="text-[13px] text-gray-800">Seal pompa aus, impeller korosi ringan. Casing luar masih utuh tanpa keretakan.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Kondisi Elektrik</p>
                    <p className="text-[13px] text-gray-800">Motor insulasi normal (resistance &gt; 10MΩ). Kabel koneksi aman.</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-[13px] font-bold text-green-800 uppercase tracking-wide">Hasil: Layak Digunakan (Utilizable)</p>
                  </div>
                  <div className="pl-4">
                    <p className="text-[12px] text-gray-500 font-medium mt-2">Catatan Pemeriksaan:</p>
                    <p className="text-[13px] text-gray-800 italic">"Peralatan masih sangat layak digunakan secara fungsional meskipun ada keausan ringan pada seal."</p>
                    
                    <p className="text-[12px] text-gray-500 font-medium mt-3">Rekomendasi Tindakan:</p>
                    <p className="text-[13px] font-bold text-gray-900">Penggantian seal mekanik sebelum diutilisasi kembali ke plant aktif.</p>
                  </div>
                </div>

                {/* Dokumentasi */}
                <p className="text-[12px] text-gray-500 font-medium mb-2">Dokumentasi Foto & Riwayat Audit:</p>
                <div className="flex gap-3">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&q=80" className="object-cover w-full h-full" alt="Foto Inspeksi 1" />
                  </div>
                  <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                    <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&q=80" className="object-cover w-full h-full" alt="Foto Inspeksi 2" />
                  </div>
                  <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 overflow-y-auto h-24">
                    <p className="font-bold text-gray-700 mb-1">Riwayat Audit (Log):</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>12 Sep 2023 11:35 - Validasi disimpan (NPP2304145)</li>
                      <li>11 Sep 2023 15:20 - Aset diterima di gudang inspeksi</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer dengan Tombol Aksi Sesuai Status */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button onClick={closeModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                Tutup
              </button>
              
              {selectedAsset.statusPersetujuan === "Menunggu Review (pending)" && (
                <button 
                  onClick={handleMulaiReview}
                  className="px-6 py-2.5 bg-[#0f4a8a] text-white rounded-md text-[13px] font-semibold hover:bg-[#0b386b] transition-colors shadow-sm"
                >
                  Mulai Review
                </button>
              )}
              
              {selectedAsset.statusPersetujuan === "Sedang Direview (in_review)" && (
                <>
                  <button 
                    onClick={() => {
                      setRevisiCatatan("");
                      setRevisiError(false);
                      setIsRevisiOpen(true);
                    }}
                    className="px-6 py-2.5 bg-white border border-[#f60000] text-[#f60000] rounded-md text-[13px] font-semibold hover:bg-red-50 transition-colors"
                  >
                    Minta Revisi
                  </button>
                  <button 
                    onClick={() => setIsConfirmOpen(true)}
                    className="px-6 py-2.5 bg-[#166534] text-white rounded-md text-[13px] font-semibold hover:bg-[#14532d] transition-colors shadow-sm"
                  >
                    Setujui (Approve)
                  </button>
                </>
              )}
            </div>

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