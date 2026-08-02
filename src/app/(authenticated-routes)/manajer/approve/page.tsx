"use client";

import React, { useState, useEffect } from "react";
import { Eye, X, Shield, FileText, CheckCircle2, RefreshCw, XCircle, Download } from "lucide-react";
import { getApprovals, reviewApproval, getEquipments, startReviewApproval, getApprovalById, getInspections, getAttachmentsByEquipmentId } from "@/action/api";
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
  equipmentId: string;
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<any[]>([]);
  const [inspeksiDetail, setInspeksiDetail] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [allInspections, setAllInspections] = useState<any[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [approvalsData, equipmentsData, user, insData] = await Promise.all([
          getApprovals(),
          getEquipments(),
          getCurrentUserAction(),
          getInspections()
        ]);
        const currentUserNPP = user?.user?.npp || "NPP2304145";
        if (insData && Array.isArray(insData)) {
          setAllInspections(insData);
        }
        
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
          
          if (item.approval_status === "PENDING") statusPersetujuan = "Menunggu Review";
          else if (item.approval_status === "IN_REVIEW") statusPersetujuan = "Sedang Direview";
          else if (item.approval_status === "APPROVED") statusPersetujuan = "Disetujui";
          else if (item.approval_status === "REVISION_REQUIRED") statusPersetujuan = "Perlu Revisi";
          
          let statusAset = (item.equipment_status || eq?.status?.name || "VALIDATED").toUpperCase();
          if (item.approval_status === "APPROVED") {
            statusAset = "IDLE";
          }

          return {
            id: item.id.toString(),
            equipmentId: equipmentId?.toString() || "",
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

  const openModal = async (asset: RequestAsset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
    setInspeksiDetail(null);
    setAttachments([]);
    try {
      const [data, attsData] = await Promise.all([
        getApprovalById(asset.id),
        getAttachmentsByEquipmentId(asset.equipmentId)
      ]);
      
      if (data && data.steps) {
        setApprovalSteps(data.steps);
      } else {
        setApprovalSteps([]);
      }

      if (allInspections && Array.isArray(allInspections)) {
        const eqInspections = allInspections.filter((i: any) => String(i.equipment_id) === String(asset.equipmentId) || String(i.equipment?.id) === String(asset.equipmentId));
        eqInspections.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        if (eqInspections.length > 0) {
          setInspeksiDetail(eqInspections[0]);
        }
      }

      if (attsData && Array.isArray(attsData)) {
        setAttachments(attsData);
      }
    } catch (err) {
      console.error(err);
      setApprovalSteps([]);
    }
  };

  const handleMulaiReview = async () => {
    if (selectedAsset && selectedAsset.statusPersetujuan === "Menunggu Review") {
      try {
        const res = await startReviewApproval(selectedAsset.id);
        if (!res.success) {
          console.error("Failed to start review on backend:", res.message);
        }
      } catch (err) {
        console.error(err);
      }

      const updatedReqs = requests.map(req => 
        req.kodeAset === selectedAsset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview" } : req
      );
      setRequests(updatedReqs);
      setFilteredRequests(filteredRequests.map(req => 
        req.kodeAset === selectedAsset.kodeAset ? { ...req, statusPersetujuan: "Sedang Direview" } : req
      ));
      
      // Update selected asset state so UI re-renders immediately
      setSelectedAsset({ ...selectedAsset, statusPersetujuan: "Sedang Direview" });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    setApprovalSteps([]);
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
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setPlant("Semua Plant");
    setStatus("Semua Status");
    setStartDate("");
    setEndDate("");
    setFilteredRequests(requests);
    setCurrentPage(1);
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
              {paginatedRequests.map((req) => (
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

        {filteredRequests.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[12px] font-medium text-gray-500">
              Menampilkan {filteredRequests.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} dari {filteredRequests.length} data (10 baris/halaman)
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md text-[12px] font-bold flex items-center justify-center transition-colors ${
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
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
                selectedAsset.statusPersetujuan === 'Menunggu Review' ? 'bg-[#FEF9C3] border-yellow-200 text-yellow-800' :
                selectedAsset.statusPersetujuan === 'Sedang Direview' ? 'bg-[#E0F2FE] border-blue-200 text-blue-800' :
                selectedAsset.statusPersetujuan === 'Perlu Revisi' ? 'bg-[#F3E8FF] border-purple-200 text-purple-800' :
                'bg-gray-100 border-gray-200 text-gray-800'
              }`}>
                <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium leading-relaxed">
                  Status: <strong>{selectedAsset.statusPersetujuan}</strong>. 
                  {selectedAsset.statusPersetujuan === 'Menunggu Review' && " Silakan mulai review untuk melihat detail lebih lanjut."}
                  {selectedAsset.statusPersetujuan === 'Sedang Direview' && " Anda sedang mereview pengajuan ini. Berikan keputusan setujui atau minta revisi."}
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
                {selectedAsset.statusPersetujuan === "Menunggu Review" && (
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
                    <p className="text-[13px] font-bold text-gray-900">{inspeksiDetail?.inspector_name || inspeksiDetail?.inspector?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">NPP / Role:</p>
                    <p className="text-[13px] font-bold text-gray-900">{inspeksiDetail?.inspector_npp || inspeksiDetail?.inspector || "-"} / {inspeksiDetail?.inspector_role || "-"}</p>
                  </div>
                  
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Waktu Pemeriksaan:</p>
                    <p className="text-[13px] font-bold text-gray-900">
                      {inspeksiDetail?.inspection_date || inspeksiDetail?.created_at 
                        ? new Date(inspeksiDetail.inspection_date || inspeksiDetail.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-1">Durasi / Lokasi:</p>
                    <p className="text-[13px] font-bold text-gray-900">{inspeksiDetail ? `2 Jam 30 Menit / ${selectedAsset.plant}` : "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Kondisi Mekanik</p>
                    <p className="text-[13px] text-gray-800">{inspeksiDetail?.mechanical_condition || <span className="text-gray-400 italic">Belum ada data (menunggu inspeksi)</span>}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Kondisi Elektrik</p>
                    <p className="text-[13px] text-gray-800">{inspeksiDetail?.electrical_condition || <span className="text-gray-400 italic">Belum ada data (menunggu inspeksi)</span>}</p>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 mb-5 ${inspeksiDetail ? (inspeksiDetail.status === 'REJECTED' || ['2', '3', '4', 2, 3, 4].includes(inspeksiDetail.require_action_id) ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${inspeksiDetail ? (inspeksiDetail.status === 'REJECTED' || ['2', '3', '4', 2, 3, 4].includes(inspeksiDetail.require_action_id) ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-400'}`}></div>
                    <p className={`text-[13px] font-bold uppercase tracking-wide ${inspeksiDetail ? (inspeksiDetail.status === 'REJECTED' || ['2', '3', '4', 2, 3, 4].includes(inspeksiDetail.require_action_id) ? 'text-red-800' : 'text-green-800') : 'text-gray-500'}`}>
                      Hasil: {inspeksiDetail ? (
                        inspeksiDetail.result || (
                          String(inspeksiDetail.require_action_id) === '1' ? 'Ready to Reuse' :
                          String(inspeksiDetail.require_action_id) === '2' ? 'Perbaikan Ringan' :
                          String(inspeksiDetail.require_action_id) === '3' ? 'Overhaul / Perbaikan Besar' :
                          String(inspeksiDetail.require_action_id) === '4' ? 'Disposal (Rusak Berat)' :
                          'Tidak Layak (Butuh Perbaikan)'
                        )
                      ) : 'Belum Ada Hasil Validasi'}
                    </p>
                  </div>
                  <div className="pl-4">
                    <p className="text-[12px] text-gray-500 font-medium mt-2">Catatan Pemeriksaan:</p>
                    <p className="text-[13px] text-gray-800 italic">{inspeksiDetail?.notes ? `"${inspeksiDetail.notes}"` : <span className="text-gray-400">Belum ada catatan</span>}</p>
                    
                    <p className="text-[12px] text-gray-500 font-medium mt-3">Rekomendasi Tindakan:</p>
                    <p className="text-[13px] font-bold text-gray-900">{inspeksiDetail?.recommendation || (inspeksiDetail ? (
                      String(inspeksiDetail.require_action_id) === '1' ? 'Tidak ada tindakan khusus, siap diutilisasi.' :
                      String(inspeksiDetail.require_action_id) === '4' ? 'Aset disarankan untuk disposal (afkir).' :
                      'Perbaikan diperlukan sebelum utilisasi.'
                    ) : <span className="text-gray-400 font-normal italic">Belum ada rekomendasi</span>)}</p>
                  </div>
                </div>

                {/* Dokumentasi */}
                <p className="text-[12px] text-gray-500 font-medium mb-2">Dokumentasi Foto & Riwayat Audit:</p>
                <div className="flex gap-3">
                  {attachments.length > 0 ? (
                    attachments.slice(0, 2).map((att: any, idx: number) => (
                      <div 
                        key={idx}
                        className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                        onClick={() => setPreviewImage(att.file_url || att.url)}
                      >
                        <img src={att.file_url || att.url} className="object-cover w-full h-full" alt={`Foto ${idx+1}`} />
                      </div>
                    ))
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                      <span className="text-[10px] font-medium text-center px-2">Tidak ada foto</span>
                    </div>
                  )}
                  <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 overflow-y-auto h-24">
                    <p className="font-bold text-gray-700 mb-1">Riwayat Audit (Log):</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {approvalSteps.length > 0 ? (
                        approvalSteps.map((step) => (
                          <li key={step.id}>
                            {step.approval_date
                              ? new Date(step.approval_date).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"} - {step.status_label || step.approval_status} {step.approval_name ? `(${step.approval_name})` : (step.approval_role ? `(${step.approval_role})` : '')}
                          </li>
                        ))
                      ) : (
                        <li>Belum ada riwayat audit</li>
                      )}
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
              
              {selectedAsset.statusPersetujuan === "Menunggu Review" && (
                <button 
                  onClick={handleMulaiReview}
                  className="px-6 py-2.5 bg-[#0f4a8a] text-white rounded-md text-[13px] font-semibold hover:bg-[#0b386b] transition-colors shadow-sm"
                >
                  Mulai Review
                </button>
              )}
              
              {selectedAsset.statusPersetujuan === "Sedang Direview" && (
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button 
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}