"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Eye, Edit, AlertCircle, FileText, X, Check, Save, Clock,
  UploadCloud, Paperclip, RefreshCw, XCircle, CheckCircle2, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { getEquipments, validateEquipment, getObjectTypes } from "@/action/api";

// Tipe Data
type AssetState = "REGISTERED" | "VALIDATED" | "REJECTED" | "IDLE";
type ApprovalState = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NEED_REVISION";

interface Asset {
  id: string;
  kodeAlat: string;
  namaAlat: string;
  plant: string;
  jenisAlat: string;
  tanggalRegistrasi: string;
  statusAset: AssetState;
  statusPersetujuan: ApprovalState;
  spesifikasi: string;
  lampiran: string[];
}



export default function ManajemenInspeksi() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        const [data, objTypes] = await Promise.all([
          getEquipments(),
          getObjectTypes()
        ]);
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
            statusAset: item.status?.name || "REGISTERED",
            statusPersetujuan: "PENDING",
            spesifikasi: item.notes || "Belum ada spesifikasi",
            lampiran: []
          };
        });
        
        const approved = JSON.parse(localStorage.getItem('approvedAssets') || '[]');
        if (approved.length > 0) {
          setAssets(mappedData.map((asset: any) => 
            approved.includes(asset.kodeAlat) ? { ...asset, statusAset: "IDLE", statusPersetujuan: "APPROVED" } : asset
          ));
        } else {
          setAssets(mappedData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [dateFilter, setDateFilter] = useState("");

  // Modal & Form States
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  // Form Validasi States
  const [hasilPemeriksaan, setHasilPemeriksaan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [tglPemeriksaan, setTglPemeriksaan] = useState(new Date().toISOString().split('T')[0]);
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("10:00");
  const [lokasi, setLokasi] = useState("");

  // Upload States
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{key: keyof Asset, direction: 'asc' | 'desc'} | null>({ key: 'tanggalRegistrasi', direction: 'desc' });

  // Handler Buka Modal
  const openModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setUploadedFiles([]); // Reset files
    
    // Reset Form jika status belum divalidasi
    if (asset.statusPersetujuan === "PENDING") {
      setHasilPemeriksaan("");
      setCatatan("");
      setRekomendasi("");
      setLokasi("");
    } else {
      setHasilPemeriksaan(asset.statusAset === "REJECTED" ? "Tidak Layak" : "Layak");
      setCatatan(asset.statusPersetujuan === "NEED_REVISION" ? "Revisi: Harap lengkapi catatan kondisi pompa..." : "Visual fisik aman, tidak ada kebocoran.");
      setRekomendasi("Dapat dimobilisasi segera");
      setLokasi(asset.plant);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAsset(null), 300);
  };

  // Simpan Validasi
  const handleSave = async () => {
    setIsLoading(true);
    if (!selectedAsset) return;

    try {
      const isUtilizable = hasilPemeriksaan === "Layak";
      const notes = catatan || rekomendasi;
      const res = await validateEquipment(selectedAsset.id, isUtilizable, notes);

      if (res.success) {
        setNotification({ type: "success", message: "Data inspeksi berhasil disubmit ke sistem." });
        
        const fileNames = uploadedFiles.map(f => f.name);
        setAssets(assets.map(a => a.id === selectedAsset.id ? {
          ...a, 
          statusAset: isUtilizable ? "VALIDATED" : "REJECTED",
          statusPersetujuan: "IN_REVIEW",
          lampiran: [...a.lampiran, ...fileNames]
        } : a));
      } else {
        setNotification({ type: "error", message: "Gagal memvalidasi data." });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Terjadi kesalahan." });
    } finally {
      setIsLoading(false);
      closeModal();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Hitung durasi
  const hitungDurasi = () => {
    if (!jamMulai || !jamSelesai) return "-";
    const [hMulai, mMulai] = jamMulai.split(":").map(Number);
    const [hSelesai, mSelesai] = jamSelesai.split(":").map(Number);
    
    const startMins = hMulai * 60 + mMulai;
    const endMins = hSelesai * 60 + mSelesai;
    const diff = endMins - startMins;
    
    if (diff <= 0) return "Invalid";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + ' Jam ' : ''}${m > 0 ? m + ' Menit' : ''}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
       const files = Array.from(e.target.files);
       setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Filter & Sort Data
  const filteredAssets = useMemo(() => {
    const filtered = assets.filter(a => {
      const matchSearch = a.kodeAlat.toLowerCase().includes(search.toLowerCase()) || 
                          a.namaAlat.toLowerCase().includes(search.toLowerCase());
      const matchPlant = plantFilter === "Semua" || a.plant === plantFilter;
      
      let matchStatus = false;
      if (statusFilter === "Semua") matchStatus = true;
      else if (statusFilter === "ACTION_NEEDED") matchStatus = (a.statusPersetujuan === "PENDING" || a.statusPersetujuan === "NEED_REVISION");
      else if (statusFilter === "NEED_REVISION") matchStatus = (a.statusPersetujuan === "NEED_REVISION");
      else matchStatus = (a.statusAset === statusFilter);

      const matchDate = !dateFilter || a.tanggalRegistrasi === dateFilter;
      
      return matchSearch && matchPlant && matchStatus && matchDate;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = String(a[sortConfig!.key]).toLowerCase();
        const valB = String(b[sortConfig!.key]).toLowerCase();
        if (valA < valB) {
          return sortConfig!.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig!.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [assets, search, plantFilter, statusFilter, dateFilter, sortConfig]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);

  const resetFilter = () => {
    setSearch("");
    setPlantFilter("Semua");
    setStatusFilter("Semua");
    setDateFilter("");
    setCurrentPage(1);
    setSortConfig({ key: 'tanggalRegistrasi', direction: 'desc' });
  };


  // UI Helpers
  const getStatusAsetBadge = (status: AssetState) => {
    const styles = {
      REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
      VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
      IDLE: "bg-[#E0E7FF] text-[#4F46E5]"
    };
    return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>{status}</span>;
  };

  const getApprovalBadge = (status: ApprovalState) => {
    const styles = {
      PENDING: "bg-gray-100 text-gray-500",
      IN_REVIEW: "bg-[#E0F2FE] text-[#0284C7]",
      APPROVED: "bg-[#DCFCE7] text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
      NEED_REVISION: "bg-[#F3E8FF] text-[#9333EA]"
    };
    const labels = {
      PENDING: "Menunggu",
      IN_REVIEW: "Review",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      NEED_REVISION: "Perlu Revisi"
    };
    return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>{labels[status]}</span>;
  };

  const getActionButton = (asset: Asset) => {
    if (asset.statusPersetujuan === "PENDING") {
      return (
        <button onClick={() => openModal(asset)} className="bg-[#0A356A] text-white px-4 py-1.5 rounded-md text-[11px] font-semibold hover:bg-[#0556B3] transition-colors whitespace-nowrap">
          Validasi
        </button>
      );
    }
    if (asset.statusPersetujuan === "IN_REVIEW" && asset.statusAset === "VALIDATED") {
      return (
        <button onClick={() => openModal(asset)} className="bg-[#F97316] text-white px-4 py-1.5 rounded-md text-[11px] font-semibold hover:bg-[#EA580C] transition-colors whitespace-nowrap">
          Ubah Validasi
        </button>
      );
    }
    if (asset.statusPersetujuan === "NEED_REVISION") {
      return (
        <button onClick={() => openModal(asset)} className="bg-[#8B5CF6] text-white px-4 py-1.5 rounded-md text-[11px] font-semibold hover:bg-[#7C3AED] transition-colors whitespace-nowrap">
          Revisi Validasi
        </button>
      );
    }
    return (
      <button onClick={() => openModal(asset)} className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-md text-[11px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
        Detail Info
      </button>
    );
  };

  const isFormValid = () => {
    if (!hasilPemeriksaan || !lokasi || !tglPemeriksaan || !jamMulai || !jamSelesai) return false;
    if (hasilPemeriksaan === "Tidak Layak" && !catatan.trim()) return false;
    return true;
  };
  
  const isReadOnly = selectedAsset?.statusPersetujuan === "IN_REVIEW" || selectedAsset?.statusPersetujuan === "APPROVED";

  const pendingCount = assets.filter(a => a.statusPersetujuan === "PENDING" || a.statusPersetujuan === "NEED_REVISION").length;

  const handleSort = (key: keyof Asset) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Asset) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" /> : 
      <ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />;
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span className="text-[13px] font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
          <span>Idle Equipment</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A356A] font-semibold">Validasi Inspeksi (FC1)</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Manajemen Inspeksi</h1>
        <p className="text-[13px] text-gray-500 mt-1">Daftar peralatan idle yang membutuhkan verifikasi teknis sebelum di-utilisasi.</p>
      </div>

      {/* Action Notification Banner */}
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-3">
             <span className="flex h-2.5 w-2.5 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
             </span>
             <span className="text-[13px] text-blue-800 font-medium">Terdapat <strong className="font-bold">{pendingCount} aset</strong> yang membutuhkan tindakan Validasi atau Revisi dari Anda.</span>
           </div>
           <button onClick={() => setStatusFilter("ACTION_NEEDED")} className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-sm transition-colors uppercase tracking-wide">
             Lihat Semua
           </button>
        </div>
      )}

      {/* Main Content Area (Tabel) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar / Filters */}
        <div className="p-3 border-b border-gray-200 bg-white flex flex-col md:flex-row gap-3 justify-between items-center">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari Kode atau Nama Alat..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400" 
            />
          </div>
          
          {/* Filter Group */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer">
              <option value="Semua">Semua Plant</option>
              <option value="P-1">Plant 1</option>
              <option value="P-2">Plant 2</option>
              <option value="P-3">Plant 3</option>
              <option value="P-4">Plant 4</option>
            </select>
            
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[140px] cursor-pointer">
              <option value="Semua">Semua Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="VALIDATED">Validated</option>
              <option value="NEED_REVISION">Perlu Revisi</option>
            </select>
            
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer" />
            
            {/* Reset Button */}
            {(search || plantFilter !== "Semua" || statusFilter !== "Semua" || dateFilter) && (
              <button onClick={resetFilter} className="px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/95 backdrop-blur-sm">
              <tr className="border-b-2 border-gray-300">
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('kodeAlat')}>
                  <div className="flex items-center">Kode Alat {getSortIcon('kodeAlat')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[18%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('namaAlat')}>
                  <div className="flex items-center">Nama Alat {getSortIcon('namaAlat')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[8%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('plant')}>
                  <div className="flex items-center">Plant {getSortIcon('plant')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[10%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('jenisAlat')}>
                  <div className="flex items-center">Jenis Alat {getSortIcon('jenisAlat')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[12%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('tanggalRegistrasi')}>
                  <div className="flex items-center">Tanggal Registrasi {getSortIcon('tanggalRegistrasi')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">
                  SLA Target (3 Hari)
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">
                  Didaftarkan Oleh
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[10%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('statusAset')}>
                  <div className="flex items-center">Status Aset {getSortIcon('statusAset')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[10%] cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('statusPersetujuan')}>
                  <div className="flex items-center">Status Persetujuan {getSortIcon('statusPersetujuan')}</div>
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[8%] text-center whitespace-nowrap">Tindakan</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isDataLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-[13px] font-medium text-gray-900">Data Tidak Ditemukan</p>
                      <p className="text-[11px] text-gray-500 mt-1">Coba sesuaikan filter pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="border-b-2 border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-3 whitespace-nowrap text-[13px] font-bold text-[#0A356A] relative">
                      {(asset.statusPersetujuan === "PENDING" || asset.statusPersetujuan === "NEED_REVISION") && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-1.5 w-1.5" title={asset.statusPersetujuan === "PENDING" ? "Perlu Validasi" : "Perlu Revisi"}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${asset.statusPersetujuan === "PENDING" ? "bg-red-400" : "bg-orange-400"}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${asset.statusPersetujuan === "PENDING" ? "bg-red-500" : "bg-orange-500"}`}></span>
                        </span>
                      )}
                      {asset.kodeAlat}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-medium text-gray-700">{asset.namaAlat}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600 font-medium">
                      {asset.plant}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600 font-medium">
                      {asset.jenisAlat}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600">
                      {asset.tanggalRegistrasi}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[13px]">
                      {asset.statusPersetujuan === 'PENDING' ? (
                        <span className="bg-[#DCFCE7] text-[#16A34A] px-2 py-1 rounded-full flex items-center gap-1.5 w-fit font-semibold text-[11px]"><div className="w-1.5 h-1.5 bg-[#16A34A] rounded-full"></div> 1 Hari Tersisa</span>
                      ) : (
                        <span className="text-gray-400 font-medium text-[12px]">Selesai</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600 font-medium">
                      NPP2304145
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {getStatusAsetBadge(asset.statusAset)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {getApprovalBadge(asset.statusPersetujuan)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        {getActionButton(asset)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-500">
            Menampilkan {paginatedAssets.length} dari {filteredAssets.length} data
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <span className="text-[11px] font-medium text-gray-700 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>

      {/* CENTERED MODAL FOR INSPECTION VALIDATION (NO SCROLL DESIGN) */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          {/* Modal Dialog */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">Validasi Inspeksi Teknik</h2>
                <span className="text-gray-300">|</span>
                <span className="text-[13px] font-semibold text-[#0A356A]">{selectedAsset.kodeAlat}</span>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (Compact UI) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
              
              {/* Thin Asset Info Ribbon */}
              <div className="bg-[#f0f7ff] border border-blue-100 rounded-lg p-2.5 mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-5 overflow-hidden">
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Nama Peralatan</span>
                    <span className="font-bold text-[13px] text-blue-900 truncate">{selectedAsset.namaAlat}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div>
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Plant</span>
                    <span className="font-bold text-[13px] text-blue-900">{selectedAsset.plant}</span>
                  </div>
                  <div className="w-px h-5 bg-blue-200"></div>
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Spesifikasi Singkat</span>
                    <span className="text-blue-800 text-[12px] truncate block" title={selectedAsset.spesifikasi}>{selectedAsset.spesifikasi}</span>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  {getStatusAsetBadge(selectedAsset.statusAset)}
                  {getApprovalBadge(selectedAsset.statusPersetujuan)}
                </div>
              </div>

              {/* Form Grid (Optimized for minimal scrolling) */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                
                {/* Row 1: Identifikasi & Waktu */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">No. Pemeriksaan</label>
                    <input type="text" value={`INSP-${selectedAsset.kodeAlat}`} disabled className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tanggal *</label>
                    <input type="date" value={tglPemeriksaan} onChange={e => setTglPemeriksaan(e.target.value)} disabled={isReadOnly} className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none disabled:bg-gray-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mulai *</label>
                    <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} disabled={isReadOnly} className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none disabled:bg-gray-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Selesai *</label>
                    <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} disabled={isReadOnly} className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none disabled:bg-gray-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Durasi</label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-600 truncate flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {hitungDurasi()}
                    </div>
                  </div>
                </div>

                {/* Row 2: Lokasi & Hasil (Compact) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Lokasi Pengecekan *</label>
                    <input type="text" placeholder="Contoh: Area Unit 1B" value={lokasi} onChange={e => setLokasi(e.target.value)} disabled={isReadOnly} className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none disabled:bg-gray-50" />
                  </div>
                  
                  <div className="md:col-span-7">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Hasil Evaluasi Kelayakan *</label>
                    <div className="flex gap-2.5">
                      <label className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        hasilPemeriksaan === "Layak" ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${isReadOnly && hasilPemeriksaan !== "Layak" ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Layak" ? "border-emerald-500" : "border-gray-300"}`}>
                          {hasilPemeriksaan === "Layak" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                        </div>
                        <span className={`text-[13px] font-semibold ${hasilPemeriksaan === "Layak" ? "text-emerald-700" : "text-gray-700"}`}>Layak Utilisasi</span>
                        <input type="radio" name="hasil" value="Layak" checked={hasilPemeriksaan === "Layak"} onChange={e => setHasilPemeriksaan(e.target.value)} disabled={isReadOnly} className="hidden" />
                      </label>
                      
                      <label className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        hasilPemeriksaan === "Tidak Layak" ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${isReadOnly && hasilPemeriksaan !== "Tidak Layak" ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Tidak Layak" ? "border-red-500" : "border-gray-300"}`}>
                          {hasilPemeriksaan === "Tidak Layak" && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                        </div>
                        <span className={`text-[13px] font-semibold ${hasilPemeriksaan === "Tidak Layak" ? "text-red-700" : "text-gray-700"}`}>Tidak Layak</span>
                        <input type="radio" name="hasil" value="Tidak Layak" checked={hasilPemeriksaan === "Tidak Layak"} onChange={e => setHasilPemeriksaan(e.target.value)} disabled={isReadOnly} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 3: Catatan & Rekomendasi (Side by side) */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Catatan Pemeriksaan <span className={hasilPemeriksaan === "Tidak Layak" ? "text-red-500" : ""}>{hasilPemeriksaan === "Tidak Layak" ? "*" : ""}</span></label>
                      {hasilPemeriksaan === "Tidak Layak" && <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>}
                    </div>
                    <textarea 
                      rows={2} 
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      disabled={isReadOnly}
                      placeholder={hasilPemeriksaan === "Tidak Layak" ? "Tuliskan alasan (wajib)..." : "Detail temuan..."}
                      className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none disabled:bg-gray-50 resize-none transition-all ${
                        hasilPemeriksaan === "Tidak Layak" && !catatan.trim() 
                        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" 
                        : "border-gray-300 focus:border-[#0A356A]"
                      }`} 
                    />
                    {hasilPemeriksaan === "Tidak Layak" && !catatan.trim() && (
                      <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Harus diisi agar bisa disimpan.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Rekomendasi Tindak Lanjut <span className="text-gray-400 font-normal">(Ops)</span></label>
                    <textarea 
                      rows={2} 
                      value={rekomendasi} 
                      onChange={e => setRekomendasi(e.target.value)} 
                      disabled={isReadOnly} 
                      placeholder="Rekomendasi tindakan..."
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none disabled:bg-gray-50 resize-none" 
                    />
                  </div>
                </div>

                {/* Row 4: Upload */}
                {!isReadOnly && (
                  <div className="mt-1">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isDragging ? "border-[#0A356A] bg-blue-50/80" : "border-gray-300 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300"
                      }`}
                    >
                      <UploadCloud className={`w-7 h-7 mb-1 ${isDragging ? "text-[#0A356A] animate-bounce" : "text-gray-400"}`} />
                      <div className="text-[13px]">
                        <span className="font-bold text-[#0A356A]">Klik untuk memilih</span>
                        <span className="text-gray-600 font-medium"> atau drag & drop ke sini</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">Format: JPG, PNG, PDF (Max 5MB)</span>
                    </div>

                    {/* Preview Selected Files */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {uploadedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded text-[11px] font-medium text-blue-800">
                            <Paperclip className="w-3 h-3 text-blue-500" />
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <button onClick={() => removeFile(i)} className="ml-1 text-blue-400 hover:text-red-500 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dokumen Referensi (Jika ada lampiran bawaan) */}
                {selectedAsset.lampiran.length > 0 && (
                   <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                     <span className="text-[11px] font-semibold text-gray-500 mr-1 mt-0.5">Ref:</span>
                     {selectedAsset.lampiran.map((file, i) => (
                       <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-600">
                         <Paperclip className="w-2.5 h-2.5" /> {file}
                       </div>
                     ))}
                   </div>
                )}

              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2.5 shrink-0">
              <button 
                onClick={closeModal} 
                disabled={isLoading}
                className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              
              {!isReadOnly && (
                <button 
                  onClick={handleSave}
                  disabled={!isFormValid() || isLoading}
                  className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#062854] rounded-md transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Proses...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Simpan Hasil</>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
