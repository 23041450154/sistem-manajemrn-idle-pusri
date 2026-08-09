"use client";

import React, { useState, useEffect } from "react";
import {
  Eye, X, FileText, CheckCircle2, RefreshCw, XCircle, AlertTriangle,
  Clock, Boxes, Search, Calendar, ChevronRight, Pencil, Trash2
} from "lucide-react";
import { getReuseRequests, updateReuseRequestStatus, deleteEquipment } from "@/action/api";
import { ActionMenu } from "@/components/ActionMenu";
import { useUser } from "@/components/UserProvider";
import { EditEquipmentDialog } from "@/components/EditEquipmentDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface ReuseRequest {
  id: string;
  request_number: string;
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  requesting_unit: string;
  target_plant: string;
  start_date: string;
  end_date?: string;
  justification: string;
  estimated_cost_avoidance?: number;
  contact_person: string;
  contact_npp?: string;
  contact_phone?: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  created_at?: string;
  review_notes?: string;
  history?: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function ManajerPeminjamanPage() {
  const { isAdmin } = useUser();
  const [search, setSearch] = useState("");
  const [plant, setPlant] = useState("Semua Plant");
  const [status, setStatus] = useState("Semua Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [requests, setRequests] = useState<ReuseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ReuseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit & Delete Dialog State
  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEquipment = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const targetId = deleteItem.equipment_id || deleteItem.id;
      const res = await deleteEquipment(targetId);
      if (res.success) {
        setRequests(prev => prev.filter(r => r.id !== deleteItem.id));
        setFilteredRequests(prev => prev.filter(r => r.id !== deleteItem.id));
        setIsDeleteOpen(false);
        setDeleteItem(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Centered Modal State
  const [selectedRequest, setSelectedRequest] = useState<ReuseRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"detail" | "history">("detail");
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getReuseRequests();
      setRequests(data || []);
      setFilteredRequests(data || []);
    } catch (e) {
      console.error("Error fetching reuse requests:", e);
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCari = () => {
    const result = requests.filter((req) => {
      const matchSearch = search
        ? req.request_number.toLowerCase().includes(search.toLowerCase()) ||
          req.equipment_code.toLowerCase().includes(search.toLowerCase()) ||
          req.equipment_name.toLowerCase().includes(search.toLowerCase()) ||
          req.requesting_unit.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchPlant = plant !== "Semua Plant" ? req.target_plant === plant : true;
      const matchStatus =
        status !== "Semua Status"
          ? (status === "Disetujui" && req.status === "APPROVED") ||
            (status === "Ditolak" && req.status === "REJECTED") ||
            (status === "Perlu Revisi" && req.status === "REVISION_REQUESTED") ||
            (status === "Menunggu Review" && (req.status === "PENDING" || req.status === "IN_REVIEW"))
          : true;

      let matchDate = true;
      if (startDate && endDate) {
        const reqDate = new Date(req.start_date);
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

  const openDrawer = (req: ReuseRequest) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
    setActiveTab("detail");
    setActionNotes("");
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRequest(null);
    setActionNotes("");
  };

  const handleAction = async (newStatus: "APPROVED" | "REJECTED" | "REVISION_REQUESTED") => {
    if (!selectedRequest) return;

    if ((newStatus === "REJECTED" || newStatus === "REVISION_REQUESTED") && !actionNotes.trim()) {
      alert("Harap berikan catatan/alasan penolakan atau revisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateReuseRequestStatus(selectedRequest.id, newStatus, actionNotes);
      if (result.success) {
        const updated = requests.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: newStatus,
                review_notes: actionNotes,
                history: [
                  ...(r.history || []),
                  {
                    id: `h-${Date.now()}`,
                    title:
                      newStatus === "APPROVED"
                        ? "Pengajuan Disetujui"
                        : newStatus === "REJECTED"
                        ? "Pengajuan Ditolak"
                        : "Minta Revisi Dokumen",
                    description: actionNotes || `Status diperbarui menjadi ${newStatus}`,
                    timestamp: new Date().toISOString(),
                    user: "Manajer Rendal Pemeliharaan",
                  },
                ],
              }
            : r
        );
        setRequests(updated);
        setFilteredRequests(updated);

        setNotification({
          type: "success",
          message: `Berhasil memperbarui pengajuan ${selectedRequest.request_number} menjadi ${newStatus}!`,
        });

        setTimeout(() => setNotification(null), 3000);
        closeDrawer();
      } else {
        alert(result.message || "Gagal memperbarui status.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (statusName?: string) => {
    const s = (statusName || "PENDING").toUpperCase();
    if (s.includes("APPROV") || s.includes("VALIDAT")) {
      return <span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[11px] font-semibold">Disetujui</span>;
    }
    if (s.includes("REJECT") || s.includes("DISPOS")) {
      return <span className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[11px] font-semibold">Ditolak</span>;
    }
    if (s.includes("REVISI")) {
      return <span className="bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-[11px] font-semibold">Perlu Revisi</span>;
    }
    return <span className="bg-[#F3E8FF] text-[#9333EA] px-3 py-1 rounded-full text-[11px] font-semibold">Menunggu Review</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Persetujuan Peminjaman Aset</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Cari Pengajuan</label>
            <input
              type="text"
              placeholder="No. Request / Kode / Nama / Unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-900"
            />
          </div>

          <div className="w-[150px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Target Plant</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            >
              <option value="Semua Plant">Semua Plant</option>
              <option value="PUSRI-IB">PUSRI-IB</option>
              <option value="PUSRI-IIB">PUSRI-IIB</option>
              <option value="PUSRI-III">PUSRI-III</option>
              <option value="PUSRI-IV">PUSRI-IV</option>
              <option value="STG-1">STG-1</option>
            </select>
          </div>

          <div className="w-[160px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Status Persetujuan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Menunggu Review">Menunggu Review</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div className="w-[150px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            />
          </div>

          <div className="w-[150px]">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCari}
              className="bg-[#0A356A] text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#0556B3] transition-colors whitespace-nowrap h-[38px]"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap h-[38px]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Section (Zero horizontal scroll with table-fixed) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[40px]">No</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[130px]">No. Request</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[130px]">Kode Aset</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left">Nama Aset</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[180px]">Lokasi Instalasi</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[90px]">Plant</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[110px]">Tanggal</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[130px]">Status</th>
              <th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[90px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0A356A]" />
                  Memuat data pengajuan peminjaman...
                </td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                  Tidak ada data pengajuan peminjaman.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((req, index) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors h-[48px]">
                  <td className="px-2 py-2 text-sm text-gray-500 font-medium text-center">
                    {index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
                  </td>
                  <td className="px-2 py-2 text-sm font-bold text-[#0A356A] text-center truncate" title={req.request_number}>
                    {req.request_number}
                  </td>
                  <td className="px-2 py-2 text-sm font-bold text-gray-900 text-center truncate" title={req.equipment_code}>
                    {req.equipment_code}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 font-medium truncate" title={req.equipment_name}>
                    {req.equipment_name}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 font-medium truncate" title={req.requesting_unit}>
                    {req.requesting_unit}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 font-medium text-center truncate">
                    {req.target_plant}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-600 font-medium text-center whitespace-nowrap font-mono text-[11px]">
                    {req.start_date}
                  </td>
                  <td className="px-2 py-2 text-sm text-center whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-2 py-2 text-center w-[120px]">
                    <ActionMenu
                      onView={() => openDrawer(req)}
                      onEdit={() => {
                        setEditItem({
                          id: req.equipment_id || req.id,
                          equipment_code: req.equipment_code,
                          name: req.equipment_name,
                          plant: req.target_plant
                        });
                        setIsEditOpen(true);
                      }}
                      onDelete={() => {
                        setDeleteItem(req);
                        setIsDeleteOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table Pagination */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredRequests.length)} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} dari {filteredRequests.length} data
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
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
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centered Modal Dialog Component (Popup di Tengah Layar) */}
      {isDrawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeDrawer}
          />

          {/* Centered Dialog Window */}
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-[#0A356A] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">Detail Pengajuan Peminjaman</span>
                <h2 className="text-base font-bold tracking-tight font-mono mt-0.5">{selectedRequest.request_number}</h2>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeDrawer(); }}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Tab Navigation Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div>{getStatusBadge(selectedRequest.status)}</div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("detail")}
                  className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "detail" ? "bg-[#0A356A] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "history" ? "bg-[#0A356A] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Riwayat
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeTab === "detail" && (
                <>
                  {/* Equipment Header Info */}
                  <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 space-y-1">
                    <span className="text-[10px] font-bold text-[#0A356A] uppercase tracking-wider">Peralatan Yang Dimohon</span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedRequest.equipment_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedRequest.equipment_code}</p>
                  </div>

                  {/* Justification Box */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Justifikasi Kebutuhan Operasional
                    </label>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedRequest.justification}
                    </div>
                  </div>

                  {/* Operational Detail Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unit Pemohon</span>
                      <span className="font-bold text-slate-900 block">{selectedRequest.requesting_unit}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Plant</span>
                      <span className="font-bold text-slate-900 block">{selectedRequest.target_plant}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Person</span>
                      <span className="font-bold text-slate-900 block">{selectedRequest.contact_person}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">{selectedRequest.contact_phone || "-"}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cost Avoidance</span>
                      <span className="font-bold text-blue-700 text-sm block">
                        {selectedRequest.estimated_cost_avoidance
                          ? `Rp ${selectedRequest.estimated_cost_avoidance.toLocaleString("id-ID")}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Action Review Form / Catatan */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                      Catatan / Instruksi Manajer (Opsional / Wajib jika Menolak)
                    </label>
                    <textarea
                      rows={3}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Masukkan alasan penolakan, catatan perbaikan, atau syarat persetujuan..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-all resize-none font-medium text-slate-900"
                    />
                  </div>
                </>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline & Riwayat Pengajuan</h4>
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {(selectedRequest.history || []).map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-2 border-[#0A356A]" />
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-900">{h.title}</h5>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(h.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{h.description}</p>
                          <span className="text-[10px] text-slate-400 font-semibold block pt-1">Oleh: {h.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => { e.preventDefault(); handleAction("REJECTED"); }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => { e.preventDefault(); handleAction("REVISION_REQUESTED"); }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-amber-700 border border-amber-300 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                Minta Revisi
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => { e.preventDefault(); handleAction("APPROVED"); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A356A] text-white hover:bg-[#0556B3] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Setujui Peminjaman
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit & Delete Dialogs for Admin */}
      <EditEquipmentDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={fetchRequests}
        equipment={editItem}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteItem(null); }}
        onConfirm={handleDeleteEquipment}
        title="Hapus Peralatan"
        description={`Apakah Anda yakin ingin menghapus peralatan ${deleteItem?.equipment_code || ''}?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
