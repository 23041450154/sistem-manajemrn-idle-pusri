"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Eye, Edit, AlertCircle, X, Check, Save, Clock,
  UploadCloud, Paperclip, RefreshCw, XCircle, CheckCircle2, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Download
} from "lucide-react";

import { getEquipments, validateEquipment } from "@/action/api";

// Tipe Data
type AssetState = "REGISTERED" | "VALIDATED" | "REJECTED" | "IDLE";
type ApprovalState = "NONE" | "PENDING_REVIEW" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NEED_REVISION";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getEquipments();
        const mappedData = data.map((item: any) => ({
          id: item.id.toString(),
          kodeAlat: item.equipment_code,
          namaAlat: item.name,
          plant: item.plant,
          jenisAlat: item.object_type?.name || "Belum Ditentukan",
          tanggalRegistrasi: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : "-",
          statusAset: item.status?.name || "REGISTERED",
          statusPersetujuan: "NONE", // Default, will override below
          spesifikasi: item.notes || "Belum ada spesifikasi",
          lampiran: []
        }));
        
        // Correcting status mapping based on API
        const mappedWithApproval = mappedData.map((item: any) => {
          let statusAset = item.statusAset?.toUpperCase() || "REGISTERED";
          let statusPersetujuan: ApprovalState = "NONE";

          if (statusAset === "REGISTERED") {
            statusPersetujuan = "NONE";
          } else if (statusAset === "VALIDATED") {
            statusPersetujuan = "PENDING_REVIEW"; 
          } else if (statusAset === "IDLE") {
            statusPersetujuan = "APPROVED";
          } else if (statusAset === "REJECTED") {
            statusPersetujuan = "REJECTED";
          }

          // Simulate some states for testing
          if (item.kodeAlat.toLowerCase() === "e-302") {
            statusAset = "IDLE";
            statusPersetujuan = "APPROVED";
          }

          return { ...item, statusAset, statusPersetujuan };
        });

        const approved = JSON.parse(localStorage.getItem('approvedAssets') || '[]');
        if (approved.length > 0) {
          setAssets(mappedWithApproval.map((asset: any) => 
            approved.includes(asset.kodeAlat) ? { ...asset, statusAset: "IDLE", statusPersetujuan: "APPROVED" } : asset
          ));
        } else {
          setAssets(mappedWithApproval);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [dateFilter, setDateFilter] = useState("");

  // Modal & Form States
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"VALIDASI" | "DETAIL">("VALIDASI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  // Form Validasi States
  const [hasilPemeriksaan, setHasilPemeriksaan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [tglPemeriksaan, setTglPemeriksaan] = useState(new Date().toISOString().split('T')[0]);
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");

  const handleTimeInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length > 4) return;
    let formatted = numbers;
    if (numbers.length >= 3) {
      formatted = `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    
    // Validasi jam (max 23)
    if (formatted.length >= 2) {
      const h = parseInt(formatted.slice(0, 2), 10);
      if (h > 23) formatted = `23${formatted.slice(2)}`;
    }
    // Validasi menit (max 59)
    if (formatted.length === 5) {
      const m = parseInt(formatted.slice(3, 5), 10);
      if (m > 59) formatted = `${formatted.slice(0, 3)}59`;
    }
    
    setter(formatted);
  };
  const [lokasi, setLokasi] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Upload States
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{key: keyof Asset, direction: 'asc' | 'desc'} | null>({ key: 'tanggalRegistrasi', direction: 'desc' });

  // Handler Buka Modal
  const openModal = (asset: Asset, mode: "VALIDASI" | "DETAIL" = "VALIDASI") => {
    setSelectedAsset(asset);
    setModalMode(mode);
    setUploadedFiles([]); // Reset files
    setShowValidationErrors(false);
    
    // Reset Form jika status belum divalidasi
    if (asset.statusPersetujuan === "NONE" || asset.statusPersetujuan === "PENDING_REVIEW") {
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
    setIsSubmitting(true);
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
        setNotification({ type: "error", message: `Gagal memvalidasi: ${res.message || "Kesalahan sistem"}` });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: `Terjadi kesalahan: ${err.message}` });
    } finally {
      setIsSubmitting(false);
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
      else if (statusFilter === "ACTION_NEEDED") matchStatus = (a.statusPersetujuan === "NONE" || a.statusPersetujuan === "PENDING_REVIEW" || a.statusPersetujuan === "NEED_REVISION");
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
    setSearchInput("");
    setSearch("");
    setPlantFilter("Semua");
    setStatusFilter("Semua");
    setDateFilter("");
    setCurrentPage(1);
    setSortConfig({ key: 'tanggalRegistrasi', direction: 'desc' });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, plantFilter, statusFilter, dateFilter]);

  // UI Helpers
  const getStatusAsetBadge = (status: AssetState) => {
    const styles = {
      REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
      VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
      IDLE: "bg-[#E0E7FF] text-[#4F46E5]"
    };
    return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
  };

  const getApprovalBadge = (status: ApprovalState) => {
    const styles = {
      NONE: "bg-gray-100 text-gray-500",
      PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
      IN_REVIEW: "bg-[#E0F2FE] text-[#0284C7]",
      APPROVED: "bg-[#DCFCE7] text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
      NEED_REVISION: "bg-[#F3E8FF] text-[#9333EA]"
    };
    const labels = {
      NONE: "-",
      PENDING_REVIEW: "Menunggu Review",
      IN_REVIEW: "Review",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      NEED_REVISION: "Perlu Revisi"
    };
    return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${styles[status]}`}>{labels[status]}</span>;
  };

  const getActionButton = (asset: Asset) => {
    return (
      <div className="flex flex-wrap items-center gap-1 justify-center w-full max-w-[100px] mx-auto">
        {asset.statusAset === "REGISTERED" && asset.statusPersetujuan === "NONE" && (
          <button title="Validasi" onClick={() => openModal(asset, "VALIDASI")} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded transition-colors flex flex-col items-center">
            <Check className="w-3 h-3 mb-0.5" />
            <span className="text-[8px] font-bold">Validasi</span>
          </button>
        )}
        {asset.statusAset === "VALIDATED" && asset.statusPersetujuan === "PENDING_REVIEW" && (
          <button title="Ubah Validasi" onClick={() => openModal(asset, "VALIDASI")} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-0.5 rounded transition-colors flex flex-col items-center">
            <Edit className="w-3 h-3 mb-0.5" />
            <span className="text-[8px] font-bold">Ubah Validasi</span>
          </button>
        )}
        {asset.statusAset === "VALIDATED" && asset.statusPersetujuan === "NEED_REVISION" && (
          <button title="Revisi Validasi" onClick={() => openModal(asset, "VALIDASI")} className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-0.5 rounded transition-colors flex flex-col items-center">
            <Edit className="w-3 h-3 mb-0.5" />
            <span className="text-[8px] font-bold">Revisi Validasi</span>
          </button>
        )}
        {(asset.statusPersetujuan === "IN_REVIEW" || asset.statusAset === "IDLE" || asset.statusAset === "REJECTED") && (
          <button title="Detail Info" onClick={() => openModal(asset, "DETAIL")} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-0.5 rounded transition-colors flex flex-col items-center">
            <Eye className="w-3 h-3 mb-0.5" />
            <span className="text-[8px] font-bold">Detail Info</span>
          </button>
        )}
      </div>
    );
  };

  const validateForm = () => {
    if (!hasilPemeriksaan || !lokasi || !tglPemeriksaan || !jamMulai || !jamSelesai) return false;
    if (hasilPemeriksaan === "Tidak Layak" && !catatan.trim()) return false;
    if (uploadedFiles.length < 2) return false;
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) {
      setShowValidationErrors(true);
      return;
    }
    handleSave();
  };
  
  const isReadOnly = selectedAsset?.statusPersetujuan === "IN_REVIEW" || selectedAsset?.statusPersetujuan === "APPROVED";

  const pendingCount = assets.filter(a => a.statusPersetujuan === "NONE" || a.statusPersetujuan === "PENDING_REVIEW" || a.statusPersetujuan === "NEED_REVISION").length;

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
        <div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          
          {/* Search */}
          <div className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari Kode atau Nama Alat..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400" 
              />
            </div>
            <button 
              onClick={() => setSearch(searchInput)}
              className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
            >
              Cari
            </button>
          </div>
          
          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
              <option value="IDLE">Idle</option>
              <option value="REJECTED">Ditolak</option>
            </select>
            
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer" />
            
            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
            
            {/* Reset Button */}
            <button 
              onClick={resetFilter} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              title="Reset semua filter"
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
              <tr className="border-b-2 border-gray-300">
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors whitespace-nowrap" title="Klik untuk mengurutkan" onClick={() => handleSort('kodeAlat')}>
                  <div className="flex items-center">Kode {getSortIcon('kodeAlat')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('namaAlat')}>
                  <div className="flex items-center">Nama Alat {getSortIcon('namaAlat')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('plant')}>
                  <div className="flex items-center">Plant {getSortIcon('plant')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('jenisAlat')}>
                  <div className="flex items-center">Jenis {getSortIcon('jenisAlat')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('tanggalRegistrasi')}>
                  <div className="flex items-center">Tanggal {getSortIcon('tanggalRegistrasi')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  SLA Target
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  Pemohon
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('statusAset')}>
                  <div className="flex items-center">Aset {getSortIcon('statusAset')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors" title="Klik untuk mengurutkan" onClick={() => handleSort('statusPersetujuan')}>
                  <div className="flex items-center">Persetujuan {getSortIcon('statusPersetujuan')}</div>
                </th>
                <th className="px-1.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Tindakan</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-[13px] font-medium text-gray-900">Data Tidak Ditemukan</p>
                      <p className="text-[11px] text-gray-500 mt-1">Coba sesuaikan filter pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                    <td className="px-1.5 py-1 whitespace-nowrap text-[10px] font-bold text-[#0A356A] relative">
                      {(asset.statusPersetujuan === "NONE" || asset.statusPersetujuan === "PENDING_REVIEW" || asset.statusPersetujuan === "NEED_REVISION") && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 flex h-1.5 w-1.5" title={asset.statusPersetujuan === "NEED_REVISION" ? "Perlu Revisi" : "Perlu Validasi"}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${(asset.statusPersetujuan === "NONE" || asset.statusPersetujuan === "PENDING_REVIEW") ? "bg-red-400" : "bg-orange-400"}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${(asset.statusPersetujuan === "NONE" || asset.statusPersetujuan === "PENDING_REVIEW") ? "bg-red-500" : "bg-orange-500"}`}></span>
                        </span>
                      )}
                      <span className="ml-1.5">{asset.kodeAlat}</span>
                    </td>
                    <td className="px-1.5 py-1">
                      <div className="text-[10px] font-medium text-gray-700 leading-tight line-clamp-2" title={asset.namaAlat}>{asset.namaAlat}</div>
                    </td>
                    <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                      {asset.plant}
                    </td>
                    <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                      {asset.jenisAlat}
                    </td>
                    <td className="px-1.5 py-1 text-[10px] text-gray-600">
                      {asset.tanggalRegistrasi}
                    </td>
                    <td className="px-1.5 py-1 text-[10px]">
                      {(asset.statusPersetujuan === 'NONE' || asset.statusPersetujuan === 'PENDING_REVIEW') ? (
                        <span className="bg-[#DCFCE7] text-[#16A34A] px-1.5 py-0.5 rounded-full flex items-center gap-1 w-fit font-semibold text-[8px]"><div className="w-1.5 h-1.5 bg-[#16A34A] rounded-full"></div> 1 Hari</span>
                      ) : (
                        <span className="text-gray-400 font-medium text-[9px]">Selesai</span>
                      )}
                    </td>
                    <td className="px-1.5 py-1 text-[10px] text-gray-600 font-medium">
                      NPP2304145
                    </td>
                    <td className="px-1.5 py-1">
                      {getStatusAsetBadge(asset.statusAset)}
                    </td>
                    <td className="px-1.5 py-1">
                      {getApprovalBadge(asset.statusPersetujuan)}
                    </td>
                    <td className="px-1.5 py-1 text-center">
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
      {isModalOpen && modalMode === "VALIDASI" && selectedAsset && (
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
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">No. Pemeriksaan</label>
                    <input type="text" value={`INSP-${selectedAsset.kodeAlat}`} disabled className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500" />
                  </div>
                  <div className="col-span-3">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Tanggal</label>
                      <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                    </div>
                    <input type="date" value={tglPemeriksaan} onChange={e => setTglPemeriksaan(e.target.value)} disabled={isReadOnly} className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none disabled:bg-gray-50 ${showValidationErrors && !tglPemeriksaan ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`} />
                    {showValidationErrors && !tglPemeriksaan && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Tanggal wajib diisi.</p>}
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Mulai</label>
                      <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="00:00" maxLength={5} value={jamMulai} onChange={e => handleTimeInput(e.target.value, setJamMulai)} disabled={isReadOnly} className={`w-full bg-white border rounded-md px-3 py-1.5 pr-10 text-[13px] text-center font-mono outline-none disabled:bg-gray-50 ${showValidationErrors && jamMulai.length < 5 ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`} />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">WIB</span>
                    </div>
                    {showValidationErrors && jamMulai.length < 5 && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Format HH:MM wajib diisi.</p>}
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Selesai</label>
                      <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                    </div>
                    <div className="relative">
                      <input type="text" placeholder="00:00" maxLength={5} value={jamSelesai} onChange={e => handleTimeInput(e.target.value, setJamSelesai)} disabled={isReadOnly} className={`w-full bg-white border rounded-md px-3 py-1.5 pr-10 text-[13px] text-center font-mono outline-none disabled:bg-gray-50 ${showValidationErrors && jamSelesai.length < 5 ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`} />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">WIB</span>
                    </div>
                    {showValidationErrors && jamSelesai.length < 5 && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Format HH:MM wajib diisi.</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Durasi</label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-600 truncate flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {hitungDurasi()}
                    </div>
                  </div>
                </div>

                {/* Row 2: Lokasi & Hasil (Compact) */}
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-5">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Lokasi Pengecekan</label>
                      <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                    </div>
                    <select 
                      value={lokasi} 
                      onChange={e => setLokasi(e.target.value)} 
                      disabled={isReadOnly} 
                      className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none disabled:bg-gray-50 ${showValidationErrors && !lokasi ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`}
                    >
                      <option value="" disabled>Pilih Lokasi...</option>
                      <option value="Area Unit 1B">Area Unit 1B</option>
                      <option value="Area Unit P-IB">Area Unit P-IB</option>
                      <option value="Area Ammonia">Area Ammonia</option>
                      <option value="Area Urea">Area Urea</option>
                      <option value="Area Utilitas">Area Utilitas</option>
                      <option value="Gudang Utama">Gudang Utama</option>
                      <option value="Bengkel Mekanik">Bengkel Mekanik</option>
                    </select>
                    {showValidationErrors && !lokasi && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Lokasi wajib dipilih.</p>}
                  </div>
                  
                  <div className="col-span-7">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-semibold text-gray-700">Hasil Evaluasi Kelayakan</label>
                      <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                    </div>
                    <div className="flex gap-2.5">
                      <label className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        hasilPemeriksaan === "Layak" ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${isReadOnly && hasilPemeriksaan !== "Layak" ? "opacity-50 cursor-not-allowed" : ""} ${showValidationErrors && !hasilPemeriksaan ? "border-red-400" : ""}`}>
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Layak" ? "border-emerald-500" : (showValidationErrors && !hasilPemeriksaan ? "border-red-400" : "border-gray-300")}`}>
                          {hasilPemeriksaan === "Layak" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                        </div>
                        <span className={`text-[13px] font-semibold ${hasilPemeriksaan === "Layak" ? "text-emerald-700" : "text-gray-700"}`}>Layak Utilisasi</span>
                        <input type="radio" name="hasil" value="Layak" checked={hasilPemeriksaan === "Layak"} onChange={e => setHasilPemeriksaan(e.target.value)} disabled={isReadOnly} className="hidden" />
                      </label>
                      
                      <label className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        hasilPemeriksaan === "Tidak Layak" ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${isReadOnly && hasilPemeriksaan !== "Tidak Layak" ? "opacity-50 cursor-not-allowed" : ""} ${showValidationErrors && !hasilPemeriksaan ? "border-red-400" : ""}`}>
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Tidak Layak" ? "border-red-500" : (showValidationErrors && !hasilPemeriksaan ? "border-red-400" : "border-gray-300")}`}>
                          {hasilPemeriksaan === "Tidak Layak" && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                        </div>
                        <span className={`text-[13px] font-semibold ${hasilPemeriksaan === "Tidak Layak" ? "text-red-700" : "text-gray-700"}`}>Tidak Layak</span>
                        <input type="radio" name="hasil" value="Tidak Layak" checked={hasilPemeriksaan === "Tidak Layak"} onChange={e => setHasilPemeriksaan(e.target.value)} disabled={isReadOnly} className="hidden" />
                      </label>
                    </div>
                    {showValidationErrors && !hasilPemeriksaan && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Hasil Evaluasi wajib dipilih.</p>}
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
                      className={`border-2 border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDragging ? "border-[#0A356A] bg-blue-50/80" : "border-gray-300 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300"
                      }`}
                    >
                      <UploadCloud className={`w-7 h-7 mb-1 ${isDragging ? "text-[#0A356A] animate-bounce" : "text-gray-400"}`} />
                      <div className="text-[13px] text-center">
                        <span className="font-bold text-[#0A356A]">Klik untuk memilih</span>
                        <span className="text-gray-600 font-medium"> atau drag & drop ke sini</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium text-center">Format: JPG, PNG, PDF (Max 5MB)</span>
                      
                      {uploadedFiles.length === 0 && (
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded mt-1">Wajib Minimal 2 Foto/File</span>
                      )}

                      {/* Preview Selected Files (Inside Dropzone) */}
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 w-full flex flex-wrap justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                          {uploadedFiles.map((file, i) => {
                            const isImage = file.type.startsWith('image/');
                            const previewUrl = isImage ? URL.createObjectURL(file) : null;
                            return (
                              <div key={i} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white w-[150px] shadow-sm hover:shadow-md transition-all hover:border-[#0A356A]">
                                {isImage ? (
                                  <div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <img src={previewUrl!} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  </div>
                                ) : (
                                  <div className="h-28 w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                    <Paperclip className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-bold">PDF / DOC</span>
                                  </div>
                                )}
                                <div className="px-2 py-1.5 border-t border-gray-100 bg-white">
                                  <span className="block text-[10px] font-medium text-gray-700 truncate text-center" title={file.name}>{file.name}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(i);
                                  }} 
                                  className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-md transition-colors opacity-0 group-hover:opacity-100"
                                  title="Hapus"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {showValidationErrors && uploadedFiles.length < 2 && (
                      <p className="text-[10px] text-red-500 mt-1.5 font-medium">* Wajib mengunggah minimal 2 foto dokumentasi/file referensi.</p>
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
                disabled={isSubmitting}
                className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              
              {!isReadOnly && (
                <button 
                  onClick={handleSaveClick}
                  disabled={isSubmitting}
                  className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#062854] rounded-md transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
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
      {/* CENTERED MODAL FOR DETAIL ASET */}
      {isModalOpen && modalMode === "DETAIL" && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Detail Informasi Aset</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">{selectedAsset.kodeAlat}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="text-[#0A356A] font-bold text-[13px] mb-2.5 uppercase tracking-wide">Spesifikasi Alat</h3>
              
              <div className="grid grid-cols-4 gap-y-3 gap-x-4 mb-4">
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Kode Alat:</p>
                  <p className="text-[12px] font-bold text-gray-900">{selectedAsset.kodeAlat}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-500 mb-0.5">Nama Alat:</p>
                  <p className="text-[12px] font-bold text-gray-900">{selectedAsset.namaAlat}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Kategori / Jenis:</p>
                  <p className="text-[12px] font-bold text-gray-900">{selectedAsset.jenisAlat}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Plant Asal:</p>
                  <p className="text-[12px] font-bold text-gray-900">{selectedAsset.plant}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Lokasi Gudang:</p>
                  <p className="text-[12px] font-bold text-gray-900">Storage Area B</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Pabrikan / Vendor:</p>
                  <p className="text-[12px] font-bold text-gray-900">Atlas Copco</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Tahun Pembuatan:</p>
                  <p className="text-[12px] font-bold text-gray-900">2015</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Nilai Perolehan (IDR):</p>
                  <p className="text-[12px] font-bold text-gray-900">Rp 300,000,000</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Kondisi Fisik:</p>
                  <p className="text-[12px] font-bold text-gray-900">BAGUS</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Didaftarkan Oleh:</p>
                  <p className="text-[12px] font-bold text-gray-900">NPP2304145</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Tanggal Registrasi:</p>
                  <p className="text-[12px] font-bold text-gray-900">{selectedAsset.tanggalRegistrasi}</p>
                </div>
                <div className="col-span-4">
                  <p className="text-[11px] text-gray-500 mb-1">Catatan Pendaftaran:</p>
                  <div className="bg-gray-50 p-2 rounded text-[12px] italic text-gray-700 border border-gray-100">
                    &quot;Kompresor cadangan dari decommission utilitas lama.&quot;
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 my-4" />

              <h3 className="text-[#0A356A] font-bold text-[13px] mb-2.5 uppercase tracking-wide">Lampiran Gambar & Dokumen</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Images */}
                <div 
                  onClick={() => window.open("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&q=80", "_blank")}
                  className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white cursor-pointer hover:border-[#0A356A] transition-colors group"
                >
                  <div className="h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&q=80" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" alt="Foto Pompa" />
                  </div>
                  <div className="p-2 text-center border-t border-gray-200 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-900 mb-0.5">Foto Utama</p>
                  </div>
                </div>
                <div 
                  onClick={() => window.open("https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&q=80", "_blank")}
                  className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white cursor-pointer hover:border-[#0A356A] transition-colors group"
                >
                  <div className="h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&q=80" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" alt="Label Tag" />
                  </div>
                  <div className="p-2 text-center border-t border-gray-200 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-900 mb-0.5">Label Tag Plat Aset</p>
                  </div>
                </div>
                {/* PDF Files in same row if width permits */}
                <div 
                  onClick={() => window.open("/laporan_inspeksi_P101.pdf", "_blank")}
                  className="border border-gray-200 rounded p-2.5 flex flex-col justify-between bg-white shadow-sm cursor-pointer hover:border-[#0A356A] transition-colors group"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shrink-0 group-hover:bg-[#0A356A]/10 group-hover:text-[#0A356A] group-hover:border-[#0A356A]/20 transition-colors">
                      <span className="font-bold text-[9px]">PDF</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-gray-900 truncate" title="laporan_inspeksi_P101.pdf">laporan_inspeksi_P101.pdf</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">3.4 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement("a");
                        link.href = "/laporan_inspeksi_P101.pdf";
                        link.download = "laporan_inspeksi_P101.pdf";
                        link.click();
                      }} 
                      className="text-[11px] font-semibold text-[#0A356A] hover:bg-blue-50 p-1.5 rounded transition-colors"
                      title="Download Laporan"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-5 py-2.5 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 rounded-b-xl">
              <button onClick={closeModal} className="px-4 py-1.5 border border-gray-300 bg-white rounded-md text-[13px] font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
