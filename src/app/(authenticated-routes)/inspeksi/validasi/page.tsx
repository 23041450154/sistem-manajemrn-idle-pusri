"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, Eye, Edit, AlertCircle, X, Check, Save, Clock,
  UploadCloud, Paperclip, RefreshCw, XCircle, CheckCircle2,
  ArrowUpDown, ArrowUp, ArrowDown, Download, Info, Pencil, Trash2, FileText, Shield
} from "lucide-react";

import AnalogTimePicker from "@/components/AnalogTimePicker";

import { 
  getEquipments, validateEquipment, getObjectTypes, getApprovals, getAttachmentsByEquipmentId,
  getInspections, getRequireActions, getApprovalById, getConditions, resubmitApproval, deleteEquipment
} from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";
import { useUser } from "@/components/UserProvider";
import { EditEquipmentDialog } from "@/components/EditEquipmentDialog";
import { DetailEquipmentDialog } from "@/components/DetailEquipmentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Tipe Data
type AssetState = "REGISTERED" | "VALIDATED" | "REJECTED" | "READY TO USE" | "IDLE";
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
  lokasiPenyimpanan: string;
  area: string;
  vendor: string;
  tahunDibuat: string;
  nilaiPerolehan: string;
  pemohon: string;
}



export default function ManajemenInspeksi() {
  const { isAdmin } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [conditions, setConditions] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEquipment = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await deleteEquipment(deleteItem.id);
      if (res.success) {
        setAssets(prev => prev.filter(a => a.id !== deleteItem.id));
        setIsDeleteOpen(false);
        setDeleteItem(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [data, objTypes, approvalsRes, user, conditionsData] = await Promise.all([
        getEquipments(),
        getObjectTypes(),
        getApprovals(),
        getCurrentUserAction(),
        getConditions()
      ]);
      setConditions(conditionsData);
      const approvalsData = Array.isArray(approvalsRes) ? approvalsRes : (approvalsRes?.data || []);
      const currentUserNPP = user?.user?.npp || "NPP2304145";
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
          statusAset: (item.status?.name || (item.status_id === 2 ? "VALIDATED" : item.status_id === 3 ? "REJECTED" : item.status_id === 4 ? "READY TO USE" : "REGISTERED")).toUpperCase(),
          statusPersetujuan: "NONE", // Default, will override below
          spesifikasi: item.notes || "Belum ada spesifikasi",
          lampiran: [],
          lokasiPenyimpanan: item.storage_location?.name || item.storageLocation?.name || "Belum ditentukan",
          area: item.func_loc || item.funcloc || "-",
          vendor: item.vendor || "-",
          tahunDibuat: item.year?.toString() || "-",
          nilaiPerolehan: item.original_value ? `Rp ${Number(item.original_value).toLocaleString('id-ID')}` : "Rp 0",
          pemohon: (() => {
            const p = item.created_by_npp || currentUserNPP;
            return /^\d/.test(p) ? `NPP${p}` : p;
          })()
        };
      });
      
      // Correcting status mapping based on API
      const mappedWithApproval = mappedData.map((item: any) => {
        let statusAset = item.statusAset?.toUpperCase() || "REGISTERED";
        let statusPersetujuan: ApprovalState = "NONE";

        if (statusAset === "REGISTERED") {
          statusPersetujuan = "NONE";
        } else if (statusAset === "VALIDATED") {
          // Cek status dari API approvals jika ada
          const app = approvalsData.find((a: any) => a.equipment_id === Number(item.id) || a.equipment?.id === Number(item.id));
          if (app) {
            if (app.approval_status === "REVISION_REQUIRED") {
              statusPersetujuan = "NEED_REVISION";
            } else if (app.approval_status === "IN_REVIEW") {
              statusPersetujuan = "IN_REVIEW";
            } else if (app.approval_status === "APPROVED") {
              statusPersetujuan = "APPROVED";
              statusAset = "READY TO USE";
            } else if (app.approval_status === "REJECTED") {
              statusPersetujuan = "REJECTED";
              statusAset = "REJECTED";
            } else {
              statusPersetujuan = "PENDING_REVIEW"; 
            }
          } else {
            statusPersetujuan = "PENDING_REVIEW"; 
          }
        } else if (statusAset === "IDLE" || statusAset === "READY TO USE" || statusAset === "READY_TO_USE") {
          statusPersetujuan = "APPROVED";
        } else if (statusAset === "REJECTED") {
          statusPersetujuan = "REJECTED";
        }

        return { ...item, statusAset, statusPersetujuan };
      });

      // Sort data by ID descending (newest first)
      mappedWithApproval.sort((a: any, b: any) => Number(b.id) - Number(a.id));

      const excludedStatuses = ["READY_TO_USE", "READY TO USE", "MAINTENANCE", "DISPOSAL_RECOMMENDED", "DISPOSAL"];
      const finalAssets = mappedWithApproval.filter((a: any) => !excludedStatuses.includes(a.statusAset) && a.statusPersetujuan !== "NEED_REVISION");

      setAssets(finalAssets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
  const [attachments, setAttachments] = useState<any[]>([]);

  // Revision Form States
  const [managerNotes, setManagerNotes] = useState("");
  const [approvalId, setApprovalId] = useState("");
  const [requiredActionId, setRequiredActionId] = useState("");
  const [requireActions, setRequireActions] = useState<any[]>([]);

  useEffect(() => {
    const loadActions = async () => {
      try {
        const acts = await getRequireActions();
        setRequireActions(acts || []);
      } catch (err) {
        console.error("Gagal memuat require actions:", err);
      }
    };
    loadActions();
  }, []);

  useEffect(() => {
    // Jalankan scroll setelah render DOM selasai
    const timer = setTimeout(() => {
      const mainElem = document.querySelector("main");
      const tableElem = document.getElementById("validasi-table-container");
      
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      } else if (mainElem) {
        mainElem.scrollTop = 220;
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form Validasi States
  const [hasilPemeriksaan, setHasilPemeriksaan] = useState("");
  const [conditionId, setConditionId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [tglPemeriksaan, setTglPemeriksaan] = useState(new Date().toISOString().split('T')[0]);
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("09:00");

  const [lokasi, setLokasi] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Upload States
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{key: keyof Asset, direction: 'asc' | 'desc'} | null>(null);

  // Handler Buka Modal
  const openModal = async (asset: Asset, mode: "VALIDASI" | "DETAIL" = "VALIDASI") => {
    setSelectedAsset(asset);
    setModalMode(mode);
    setIsModalOpen(true);
    setUploadedFiles([]); // Reset files
    setShowValidationErrors(false);
    setFileError(null);
    setAttachments([]);
    setPreviewImage(null);
    setManagerNotes("");
    setApprovalId("");
    setRequiredActionId("");
    
    try {
      const attsData = await getAttachmentsByEquipmentId(asset.id);
      if (attsData && Array.isArray(attsData)) {
        setAttachments(attsData);
      }
    } catch (err) {
      console.error(err);
    }
    
    // Reset Form jika status belum divalidasi (baru pertama kali)
    if (asset.statusAset === "REGISTERED" && asset.statusPersetujuan === "NONE") {
      setHasilPemeriksaan("");
      setConditionId("");
      setCatatan("");
      setRekomendasi("");
      setLokasi("");
      setJamMulai("08:00");
      setJamSelesai("09:00");
      setTglPemeriksaan(new Date().toISOString().split('T')[0]);
    } else {
      // Jika statusnya Ubah Validasi atau Perlu Revisi, muat data yang sudah pernah diisi
      setHasilPemeriksaan(asset.statusAset === "REJECTED" ? "Tidak Layak" : "Layak");
      setConditionId("");
      setCatatan("");
      setRekomendasi("");
      setLokasi("Area Unit P-IB"); // Default mock data yang sesuai opsi dropdown
      setJamMulai("09:00");
      setJamSelesai("10:30");
      setTglPemeriksaan(new Date().toISOString().split('T')[0]);

      try {
        // Ambil data inspeksi sebelumnya secara dinamis dari database
        const allInsps = await getInspections();
        const myInsps = (allInsps || []).filter((i: any) => i.equipment_id === Number(asset.id));
        if (myInsps.length > 0) {
          myInsps.sort((a: any, b: any) => b.id - a.id);
          const latest = myInsps[0];
          setHasilPemeriksaan(latest.is_utilizable ? "Layak" : "Tidak Layak");
          setConditionId(latest.condition_id?.toString() || "");
          setCatatan(latest.notes || "");
          setRekomendasi(latest.mechanical_condition || "");
          setRequiredActionId(latest.require_action_id ? latest.require_action_id.toString() : "");
          if (latest.inspection_date) {
            setTglPemeriksaan(new Date(latest.inspection_date).toISOString().split('T')[0]);
          }
        }

        // Ambil catatan penolakan manajer secara dinamis
        const approvalsRes = await getApprovals();
        const approvalsData = Array.isArray(approvalsRes) ? approvalsRes : (approvalsRes?.data || []);
        const app = approvalsData.find((a: any) => a.equipment_id === Number(asset.id));
        if (app) {
          setApprovalId(app.id.toString());
          if (app.approval_status === "REVISION_REQUIRED") {
            const detail = await getApprovalById(app.id);
            if (detail && detail.steps) {
              const revisionStep = detail.steps.find((s: any) => s.approval_status === "REVISION_REQUIRED");
              if (revisionStep && revisionStep.approval_notes) {
                setManagerNotes(revisionStep.approval_notes);
              }
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data riwayat revisi:", err);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    setTimeout(() => setSelectedAsset(null), 300);
  };

  // Simpan Validasi
  const handleSave = async () => {
    setIsSubmitting(true);
    if (!selectedAsset) return;

    try {
      const isUtilizable = hasilPemeriksaan === "Layak";
      const notes = catatan || rekomendasi;
      
      const isRevision = selectedAsset.statusPersetujuan === "NEED_REVISION";
      let res;

      if (isRevision) {
        const formData = new FormData();
        formData.append("is_utilizable", isUtilizable ? "true" : "false");
        formData.append("notes", catatan.trim());
        if (isUtilizable && requiredActionId) {
          formData.append("required_action", requiredActionId);
        }
        if (uploadedFiles.length > 0) {
          uploadedFiles.forEach(file => {
            formData.append("photos", file);
          });
        }
        res = await resubmitApproval(approvalId, formData);
      } else {
        res = await validateEquipment(selectedAsset.id, isUtilizable, Number(conditionId), notes);
      }

      if (res.success) {
        
        // --- MULTIPLE ATTACHMENTS UPLOAD ---
        if (!isRevision && uploadedFiles && uploadedFiles.length > 0) {
          try {
            // Get token from cookies for client-side fetch
            const tokenMatch = document.cookie.match(/(^|;)\s*token\s*=\s*([^;]+)/);
            const token = tokenMatch ? tokenMatch[2] : "";
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

            for (const file of uploadedFiles) {
              const fd = new FormData();
              fd.append("equipment_id", selectedAsset.id);
              fd.append("file", file);
              fd.append("category", "inspection_photo"); // Kategori sesuai backend

              const resUpload = await fetch(`${API_URL}/api/attachments/upload`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`
                },
                body: fd
              });
              if (!resUpload.ok) {
                console.error("Gagal upload file:", file.name, await resUpload.text());
              } else {
                console.log("Upload berhasil:", await resUpload.json());
              }
            }
          } catch (err) {
            console.error("Error during file upload:", err);
          }
        }
        // -----------------------------------

        const successMessage = isRevision 
          ? "Hasil revisi validasi berhasil dikirim ulang ke Manajer."
          : "Data inspeksi berhasil disubmit ke sistem.";

        setNotification({ type: "success", message: successMessage });
        
        const revised = JSON.parse(localStorage.getItem('revisedAssets') || '[]');
        const inReview = JSON.parse(localStorage.getItem('inReviewAssets') || '[]');
        const approved = JSON.parse(localStorage.getItem('approvedAssets') || '[]');
        
        const reValidated = JSON.parse(localStorage.getItem('reValidatedAssets') || '[]');
        
        if (revised.includes(selectedAsset.kodeAlat)) {
          if (!reValidated.includes(selectedAsset.kodeAlat)) {
             reValidated.push(selectedAsset.kodeAlat);
             localStorage.setItem('reValidatedAssets', JSON.stringify(reValidated));
          }
        }

        localStorage.setItem('revisedAssets', JSON.stringify(revised.filter((code: string) => code !== selectedAsset.kodeAlat)));
        localStorage.setItem('inReviewAssets', JSON.stringify(inReview.filter((code: string) => code !== selectedAsset.kodeAlat)));
        localStorage.setItem('approvedAssets', JSON.stringify(approved.filter((code: string) => code !== selectedAsset.kodeAlat)));
        
        const validated = JSON.parse(localStorage.getItem('validatedAssets') || '[]');
        if (isUtilizable && !validated.includes(selectedAsset.kodeAlat)) {
          validated.push(selectedAsset.kodeAlat);
          localStorage.setItem('validatedAssets', JSON.stringify(validated));
        }

        const fileNames = uploadedFiles.map(f => f.name);
        setAssets(assets.map(a => a.id === selectedAsset.id ? {
          ...a, 
          statusAset: isUtilizable ? "VALIDATED" : "REJECTED",
          statusPersetujuan: isUtilizable ? "PENDING_REVIEW" : "REJECTED",
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
    
    if (diff <= 0) return "-";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + ' Jam ' : ''}${m > 0 ? m + ' Menit' : ''}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
       setFileError(null);
       const files = Array.from(e.target.files);
       let hasError = false;
       const validFiles = files.filter(f => {
         if (f.size > 5 * 1024 * 1024) {
           hasError = true;
           return false;
         }
         return true;
       });
       if (hasError) {
         setFileError("file anda lebih dari 5mb");
       }
       setUploadedFiles(prev => [...prev, ...validFiles]);
       e.target.value = ''; // Reset input to allow selecting the same file again
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
      setFileError(null);
      const files = Array.from(e.dataTransfer.files);
      let hasError = false;
      const validFiles = files.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          hasError = true;
          return false;
        }
        return true;
      });
      if (hasError) {
        setFileError("file anda lebih dari 5mb");
      }
      setUploadedFiles(prev => [...prev, ...validFiles]);
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
  const getStatusAsetBadge = (status: AssetState | string) => {
    const styles: Record<string, string> = {
      REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
      VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
      IDLE: "bg-[#E0E7FF] text-[#4F46E5]",
      "READY TO USE": "bg-[#E0E7FF] text-[#4F46E5]",
      "READY_TO_USE": "bg-[#E0E7FF] text-[#4F46E5]"
    };
    const displayStatus = status === "IDLE" ? "READY TO USE" : status;
    return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[status] || styles["READY TO USE"]}`}>{displayStatus}</span>;
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
      IN_REVIEW: "Sedang Direview",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      NEED_REVISION: "Perlu Revisi"
    };
    return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[status]}`}>{labels[status]}</span>;
  };

  const getActionButton = (asset: Asset) => {
    return (
      <div className="flex items-center gap-1.5 justify-center">
        {asset.statusAset === "REGISTERED" && asset.statusPersetujuan === "NONE" && (
          <button title="Inspeksi" onClick={() => openModal(asset, "VALIDASI")} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 px-2 rounded-md transition-colors flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Inspeksi</span>
          </button>
        )}
        {asset.statusAset === "VALIDATED" && asset.statusPersetujuan === "PENDING_REVIEW" && (
          <button title="Ubah Inspeksi" onClick={() => openModal(asset, "VALIDASI")} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1 px-2 rounded-md transition-colors flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Ubah Inspeksi</span>
          </button>
        )}
        {asset.statusPersetujuan === "NEED_REVISION" && (
          <button title="Revisi Inspeksi" onClick={() => openModal(asset, "VALIDASI")} className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1 px-2 rounded-md transition-colors flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Revisi Inspeksi</span>
          </button>
        )}
        {(asset.statusPersetujuan === "IN_REVIEW" || asset.statusAset === "IDLE" || asset.statusAset === "REJECTED") && (
          <button title="Detail Info" onClick={() => openModal(asset, "DETAIL")} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 px-2 rounded-md transition-colors flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Detail Info</span>
          </button>
        )}
      </div>
    );
  };

  const validateForm = () => {
    if (!hasilPemeriksaan || !conditionId || !lokasi || !tglPemeriksaan || !jamMulai || !jamSelesai) return false;
    if (hasilPemeriksaan === "Tidak Layak" && !catatan.trim()) return false;
    
    const isRevision = selectedAsset?.statusPersetujuan === "NEED_REVISION";
    // Foto tidak lagi wajib diisi (selalu lolos validasi)
    const totalPhotosOk = true;
      
    const actionOk = isRevision 
      ? (hasilPemeriksaan !== "Layak" || !!requiredActionId)
      : true;

    return totalPhotosOk && actionOk;
  };

  const handleSaveClick = () => {
    if (!validateForm()) {
      setShowValidationErrors(true);
      return;
    }
    handleSave();
  };
  
  const isReadOnly = !isAdmin && (selectedAsset?.statusPersetujuan === "IN_REVIEW" || selectedAsset?.statusPersetujuan === "APPROVED");

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

      {/* Page Header (Dicomment/disembunyikan dulu sementara) */}
      {/* 
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
          <span>Idle Equipment</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0A356A] font-semibold">Validasi Inspeksi (FC1)</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Manajemen Inspeksi</h1>
        <p className="text-[13px] text-gray-500 mt-1">Daftar peralatan idle yang membutuhkan verifikasi teknis sebelum di-utilisasi.</p>
      </div>
      */}

      {/* Action Notification Banner */}
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-3">
             <span className="flex h-2.5 w-2.5 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
             </span>
             <span className="text-[13px] text-blue-800 font-medium">Terdapat <strong className="font-bold">{pendingCount} aset</strong> yang membutuhkan tindakan Inspeksi atau Revisi dari Anda.</span>
           </div>
           <button onClick={() => setStatusFilter("ACTION_NEEDED")} className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-sm transition-colors uppercase tracking-wide">
             Lihat Semua
           </button>
        </div>
      )}

      {/* Main Content Area (Tabel) */}
      <div id="validasi-table-container" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
        
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
                  setSearch(e.target.value); // Realtime search!
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
              <option value="IDLE">Ready to Use</option>
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
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50/95 backdrop-blur-sm">
              <tr className="border-b border-gray-300">
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[40px]">No</th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-center w-[130px]" title="Klik untuk mengurutkan" onClick={() => handleSort('kodeAlat')}>
                  <div className="flex items-center justify-center">Kode Aset {getSortIcon('kodeAlat')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left" title="Klik untuk mengurutkan" onClick={() => handleSort('namaAlat')}>
                  <div className="flex items-center justify-start">Nama Alat {getSortIcon('namaAlat')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-center w-[90px]" title="Klik untuk mengurutkan" onClick={() => handleSort('plant')}>
                  <div className="flex items-center justify-center">Plant {getSortIcon('plant')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left w-[130px]" title="Klik untuk mengurutkan" onClick={() => handleSort('jenisAlat')}>
                  <div className="flex items-center justify-start">Jenis {getSortIcon('jenisAlat')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left w-[130px]" title="Klik untuk mengurutkan" onClick={() => handleSort('statusAset')}>
                  <div className="flex items-center justify-start">Aset {getSortIcon('statusAset')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left w-[140px]" title="Klik untuk mengurutkan" onClick={() => handleSort('statusPersetujuan')}>
                  <div className="flex items-center justify-start">Persetujuan {getSortIcon('statusPersetujuan')}</div>
                </th>
                <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-[13px] font-medium text-gray-900">Data Tidak Ditemukan</p>
                      <p className="text-[11px] text-gray-500 mt-1">Coba sesuaikan filter pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset, index) => {
                  const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors h-[48px]">
                      <td className="px-3 py-2 text-sm text-gray-500 font-medium text-center">{rowNum}</td>
                      <td className="px-3 py-2 text-sm font-bold text-[#0A356A] text-center truncate" title={asset.kodeAlat}>
                        {asset.kodeAlat}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-800 text-left truncate" title={asset.namaAlat}>
                        <span className="truncate block text-left">{asset.namaAlat}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 font-medium text-center truncate">
                        {asset.plant}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 font-medium text-left truncate">
                        {asset.jenisAlat}
                      </td>
                      <td className="px-3 py-2 text-sm text-left whitespace-nowrap">
                        <div className="flex justify-start">{getStatusAsetBadge(asset.statusAset)}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-left whitespace-nowrap">
                        <div className="flex justify-start">{getApprovalBadge(asset.statusPersetujuan)}</div>
                      </td>
                      <td className="px-3 py-2 text-center w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip content="Detail Inspeksi">
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={(e) => { e.preventDefault(); setDetailItem(asset); setIsDetailOpen(true); }}
                              className="h-8 w-8 text-[#0A356A] hover:text-[#0556B3] hover:bg-blue-50"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          {isAdmin && (
                            <>
                              <Tooltip content="Edit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setEditItem(asset); setIsEditOpen(true); }}
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Hapus">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setDeleteItem(asset); setIsDeleteOpen(true); }}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                            </>
                          )}
                          {!isAdmin && (
                            <div className="flex justify-start">
                              {getActionButton(asset)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-500">
            Menampilkan {filteredAssets.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} dari {filteredAssets.length} data (10 baris/halaman)
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
                <h2 className="text-base font-bold text-gray-900">
                  {selectedAsset.statusPersetujuan === "NEED_REVISION" ? "Revisi Inspeksi Equipment" : 
                   (selectedAsset.statusPersetujuan === "PENDING_REVIEW" ? "Ubah Inspeksi Equipment" : "Inspeksi Equipment")}
                </h2>
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
                  <div className="flex-1 min-w-52">
                    <span className="text-blue-700/60 text-[10px] font-semibold uppercase block leading-none mb-1">Spesifikasi Singkat</span>
                    <span className="text-blue-800 text-[12px] truncate block" title={selectedAsset.spesifikasi}>{selectedAsset.spesifikasi}</span>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  {getStatusAsetBadge(selectedAsset.statusAset)}
                  {getApprovalBadge(selectedAsset.statusPersetujuan)}
                </div>
              </div>

              {/* Banners untuk Status Khusus */}
              {selectedAsset.statusPersetujuan === "NEED_REVISION" && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4 rounded-r-lg flex gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[12px] font-bold text-purple-800">Menunggu Revisi Anda</h4>
                    <p className="text-[11px] text-purple-700 mt-0.5">Manager meminta revisi: &quot;{managerNotes || 'Mohon lengkapi/perbaiki data temuan validasi.'}&quot;</p>
                  </div>
                </div>
              )}
              {selectedAsset.statusPersetujuan === "PENDING_REVIEW" && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-lg flex gap-3 shadow-sm">
                  <Info className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-[12px] font-bold text-blue-800">Mode Ubah Data</h4>
                    <p className="text-[11px] text-blue-700 mt-0.5">Anda sedang mengubah data validasi yang sebelumnya telah dikirimkan, namun belum di-review oleh Manager.</p>
                  </div>
                </div>
              )}

              {/* Informasi Registrasi (Rendal) */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h3 className="text-[12px] font-bold text-gray-800">Informasi Registrasi (Rendal)</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Kode Aset / Tag</span>
                      <span className="text-[12px] font-bold text-[#0A356A]">{selectedAsset.kodeAlat}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Nama Peralatan</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.namaAlat}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Kategori (Tipe)</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.jenisAlat}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Lokasi Penyimpanan</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.lokasiPenyimpanan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Pabrik / Plant</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.plant}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Area (FuncLoc)</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.area}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Vendor / Merk</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.vendor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Tahun Dibuat</span>
                      <span className="text-[12px] font-medium text-gray-900">{selectedAsset.tahunDibuat}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Nilai Perolehan (Rp)</span>
                      <span className="text-[12px] font-medium text-green-700">{selectedAsset.nilaiPerolehan}</span>
                    </div>
                  </div>
                  
                  {/* Foto Registrasi */}
                  <div className="w-full md:w-56 shrink-0 flex flex-col gap-2 md:border-l md:border-gray-100 md:pl-4">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase block">Foto Registrasi</span>
                    <div className="flex gap-2">
                      {attachments.length > 0 ? (
                        attachments.slice(0, 2).map((att: any, idx: number) => (
                          <div 
                            key={idx}
                            className="h-16 flex-1 bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                            onClick={() => setPreviewImage(att.file_url || att.url)}
                            title={`Foto ${idx+1}`}
                          >
                            <img src={att.file_url || att.url} alt={`Foto Aset ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <div className="h-16 flex-1 bg-gray-100 rounded border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                          <span className="text-[10px] font-medium text-center px-2">Tidak ada foto</span>
                        </div>
                      )}
                    </div>
                    {attachments.length > 0 && <span className="text-[9px] text-gray-400 italic text-center md:text-left mt-0.5">Klik foto untuk memperbesar</span>}
                  </div>
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
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tanggal *</label>
                    <input type="date" value={tglPemeriksaan} onChange={e => setTglPemeriksaan(e.target.value)} disabled={isReadOnly} className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none disabled:bg-gray-50 ${showValidationErrors && !tglPemeriksaan ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`} />
                    {showValidationErrors && !tglPemeriksaan && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Tanggal wajib diisi.</p>}
                  </div>
                  <div className="col-span-2">
                    <AnalogTimePicker 
                      value={jamMulai} 
                      onChange={setJamMulai} 
                      label="Jam Mulai *" 
                      disabled={isReadOnly} 
                    />
                    {showValidationErrors && !jamMulai && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Jam Mulai wajib diisi.</p>}
                  </div>
                  <div className="col-span-2">
                    <AnalogTimePicker 
                      value={jamSelesai} 
                      onChange={setJamSelesai} 
                      label="Jam Selesai *" 
                      disabled={isReadOnly} 
                    />
                    {showValidationErrors && !jamSelesai && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Jam Selesai wajib diisi.</p>}
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
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Lokasi Pengecekan *</label>
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
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Hasil Evaluasi Kelayakan *</label>
                    <div className="flex gap-2.5">
                      <label className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        hasilPemeriksaan === "Layak" ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                      } ${isReadOnly && hasilPemeriksaan !== "Layak" ? "opacity-50 cursor-not-allowed" : ""} ${showValidationErrors && !hasilPemeriksaan ? "border-red-400" : ""}`}>
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Layak" ? "border-emerald-500" : (showValidationErrors && !hasilPemeriksaan ? "border-red-400" : "border-gray-300")}`}>
                          {hasilPemeriksaan === "Layak" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                        </div>
                        <span className={`text-[13px] font-semibold ${hasilPemeriksaan === "Layak" ? "text-emerald-700" : "text-gray-700"}`}>Layak Digunakan</span>
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

                  <div className="col-span-12">
                    <label htmlFor="condition" className="block text-[11px] font-semibold text-gray-700 mb-1">Kondisi Aset *</label>
                    <select
                      id="condition"
                      value={conditionId}
                      onChange={e => setConditionId(e.target.value)}
                      disabled={isReadOnly}
                      required
                      className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none disabled:bg-gray-50 ${showValidationErrors && !conditionId ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"}`}
                    >
                      <option value="" disabled>Pilih Kondisi...</option>
                      {conditions.map(condition => <option key={condition.id} value={condition.id}>{condition.name}</option>)}
                    </select>
                    {showValidationErrors && !conditionId && <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Kondisi aset wajib dipilih.</p>}
                  </div>
                  
                  {/* Dropdown Required Action Khusus Mode Revisi & Layak */}
                  {selectedAsset.statusPersetujuan === "NEED_REVISION" && hasilPemeriksaan === "Layak" && (
                    <div className="col-span-12 mt-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[11px] font-semibold text-gray-700">Perbaikan Khusus <span className="text-red-500">*</span></label>
                        <span className="text-[9px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Wajib</span>
                      </div>
                      <select
                        value={requiredActionId}
                        onChange={e => setRequiredActionId(e.target.value)}
                        className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none ${
                          showValidationErrors && !requiredActionId ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-[#0A356A]"
                        }`}
                      >
                        <option value="" disabled>Pilih Tindakan Perbaikan...</option>
                        {requireActions.map((action: any) => (
                          <option key={action.id} value={action.id.toString()}>{action.name}</option>
                        ))}
                      </select>
                      {showValidationErrors && !requiredActionId && (
                        <p className="text-[10px] text-red-500 mt-0.5 font-medium">* Tindakan Perbaikan wajib dipilih saat layak.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Catatan & Rekomendasi (Side by side) */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Catatan Pemeriksaan <span className={hasilPemeriksaan === "Tidak Layak" ? "text-red-500" : ""}>{hasilPemeriksaan === "Tidak Layak" ? "*" : ""}</span></label>
                    <textarea 
                      rows={2} 
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      disabled={isReadOnly}
                      placeholder={hasilPemeriksaan === "Tidak Layak" ? "Tuliskan alasan (wajib)..." : "Tuliskan hasil pemeriksaan..."}
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
                        <span className="font-bold text-[#0A356A]">📎 Upload Foto Pemeriksaan</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium text-center">Format: JPG, PNG, PDF (Max 5MB)</span>
                      
                      {uploadedFiles.length === 0 && (
                        <span className="text-[9px] font-bold text-gray-500 uppercase bg-gray-50 px-1.5 py-0.5 rounded mt-1">Opsional</span>
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
                    
                    {fileError && (
                      <p className="text-[10px] text-red-500 mt-1.5 font-medium">* {fileError}</p>
                    )}
                    
                    {/* Tampilkan Foto Validasi Lama (Milik User) agar Tidak Hilang / Tak Terlihat */}
                    {selectedAsset.statusPersetujuan === "NEED_REVISION" && attachments.filter((att: any) => {
                      const url = att.file_url || att.url || "";
                      return url.match(/\.(jpeg|jpg|gif|png)$/) || url.startsWith('data:image');
                    }).length > 0 && (
                      <div className="mt-4 border-t border-gray-100 pt-3 text-left">
                        <span className="text-[11px] font-bold text-gray-500 block mb-2 uppercase tracking-wide">Foto Lama yang Tersimpan (Tidak Akan Diganti kecuali Anda Mengunggah Foto Baru):</span>
                        <div className="grid grid-cols-3 gap-3">
                          {attachments.filter((att: any) => {
                            const url = att.file_url || att.url || "";
                            return url.match(/\.(jpeg|jpg|gif|png)$/) || url.startsWith('data:image');
                          }).map((att: any, idx: number) => (
                            <div key={idx} className="relative border border-gray-200 rounded overflow-hidden aspect-video bg-gray-50">
                              <img src={att.file_url.startsWith("http") ? att.file_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/${att.file_url}`} className="w-full h-full object-cover" alt="Foto Lama" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-white font-medium truncate p-1">{att.file_name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {uploadedFiles.length > 0 && selectedAsset.statusPersetujuan === "NEED_REVISION" && (
                      <p className="text-[10px] text-amber-600 mt-2 font-medium">* Catatan: Mengunggah foto baru akan mengganti seluruh foto lama di atas.</p>
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
                    <><Save className="w-3.5 h-3.5" /> Simpan Hasil Inspeksi</>
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
                  <p className="text-[11px] font-medium text-gray-900">{selectedAsset.tanggalRegistrasi}</p>
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
                {attachments.filter((att: any) => {
                  const url = att.file_url || att.url || "";
                  return url.match(/\.(jpeg|jpg|gif|png)$/) || url.startsWith('data:image');
                }).slice(0, 2).map((att: any, idx: number) => (
                  <div 
                    key={idx}
                    onClick={() => setPreviewImage(att.file_url || att.url)}
                    className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white cursor-pointer hover:border-[#0A356A] transition-colors group"
                  >
                    <div className="h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img src={att.file_url || att.url} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" alt={`Foto ${idx+1}`} />
                    </div>
                    <div className="p-2 text-center border-t border-gray-200 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-900 mb-0.5">Foto {idx+1}</p>
                    </div>
                  </div>
                ))}
                
                {attachments.filter((att: any) => {
                  const url = att.file_url || att.url || "";
                  return url.match(/\.(jpeg|jpg|gif|png)$/) || url.startsWith('data:image');
                }).length === 0 && (
                  <div className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white p-4">
                    <div className="text-center text-gray-500 text-sm">Tidak ada foto</div>
                  </div>
                )}
                {/* Documents / PDFs */}
                {attachments.filter((att: any) => {
                  const url = att.file_url || att.url || "";
                  return !url.match(/\.(jpeg|jpg|gif|png)$/) && !url.startsWith('data:image');
                }).map((att: any, idx: number) => (
                  <div 
                    key={`doc-${idx}`}
                    onClick={() => window.open(att.file_url || att.url, "_blank")}
                    className="border border-gray-200 rounded p-2.5 flex flex-col justify-between bg-white shadow-sm cursor-pointer hover:border-[#0A356A] transition-colors group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-7 h-7 rounded bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shrink-0 group-hover:bg-[#0A356A]/10 group-hover:text-[#0A356A] group-hover:border-[#0A356A]/20 transition-colors">
                        <span className="font-bold text-[9px]">DOC</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-gray-900 truncate" title={att.file_name || `Dokumen ${idx+1}`}>{att.file_name || `Dokumen ${idx+1}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-auto">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement("a");
                          link.href = att.file_url || att.url;
                          link.download = att.file_name || `document_${idx+1}`;
                          link.target = "_blank";
                          link.click();
                        }} 
                        className="text-[11px] font-semibold text-[#0A356A] hover:bg-blue-50 p-1.5 rounded transition-colors"
                        title="Download Dokumen"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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

      {/* Dialog Detail Aset */}
      <DetailEquipmentDialog
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        onEdit={() => {
          const itemToEdit = detailItem;
          setIsDetailOpen(false);
          setDetailItem(null);
          setEditItem(itemToEdit);
          setIsEditOpen(true);
        }}
        equipment={detailItem}
      />

      {/* Dialog Edit Aset */}
      <EditEquipmentDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={() => {
          setIsEditOpen(false);
          setEditItem(null);
          fetchData();
        }}
        equipment={editItem}
      />

      {/* Dialog Hapus Aset */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteItem(null); }}
        onConfirm={handleDeleteEquipment}
        title="Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini?"
        isDeleting={isDeleting}
      />
    </div>
  );
}
