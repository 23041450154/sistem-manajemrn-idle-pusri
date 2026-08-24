"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, X, CheckCircle2, RefreshCw, XCircle, AlertCircle,
  Trash2, AlertTriangle, Loader2, Check, DollarSign, Tag, Search,
  FileText, Clock
} from "lucide-react";
import { getDisposals, approveDisposal, type DisposalItemDTO } from "@/action/api";

type DisposalItem = DisposalItemDTO;

export default function ManajerScrapPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");
  const [disposals, setDisposals] = useState<DisposalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");

  // Modal detail states
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Action confirmation states
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ type: "success" | "error" | "reject"; message: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter berubah -> balik ke halaman 1, dilakukan di setter agar effect tidak
  // memanggil setState secara sinkron.
  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };
  const changeTab = (tab: "inbox" | "history") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // isLoading sudah true saat mount, jadi tidak perlu di-set lagi di sini.
  const fetchDisposalsData = useCallback(async () => {
    try {
      const data = await getDisposals();
      if (Array.isArray(data)) {
        data.sort((a: any, b: any) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
        setDisposals(data);
      }
    } catch (err) {
      console.error("Error fetching disposals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
    void fetchDisposalsData();
  }, [fetchDisposalsData]);

  const showToast = (type: "success" | "error" | "reject", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Pending inbox items
  const pendingDisposals = disposals.filter((item) => item.status === "PENDING");
  // Processed history items
  const historyDisposals = disposals.filter((item) => item.status !== "PENDING");

  const currentList = activeTab === "inbox" ? pendingDisposals : historyDisposals;

  const filteredDisposals = currentList.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.disposal_number.toLowerCase().includes(q) ||
      item.equipment_code.toLowerCase().includes(q) ||
      item.equipment_name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredDisposals.length / ITEMS_PER_PAGE);
  const paginatedDisposals = filteredDisposals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenDetail = (item: DisposalItem) => {
    setSelectedDisposal(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedDisposal(null);
    setPreviewImage(null);
    setModalError(null);
  };

  // Submit Approval (Green Button)
  const handleConfirmApprove = async () => {
    if (!selectedDisposal || isSubmitting) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      // Delay for smooth loading state animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await approveDisposal(selectedDisposal.approval_id, { status: "DISPOSED" });

      if (res.success) {
        showToast(
          "success",
          "Scrap sukses disetujui."
        );
        setIsApproveConfirmOpen(false);
        setModalError(null);
        handleCloseDetail();
        await fetchDisposalsData();
      } else {
        setModalError(res.message || "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.");
      }
    } catch (err: unknown) {
      console.error("Approve scrap error:", err);
      setModalError("Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection (Red Button)
  const handleConfirmReject = async () => {
    if (!selectedDisposal || isSubmitting || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      // Delay for smooth loading state animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await approveDisposal(selectedDisposal.approval_id, {
        status: "REJECTED",
        rejection_reason: rejectionReason.trim(),
      });

      if (res.success) {
        showToast("reject", `Pengajuan ${selectedDisposal.disposal_number} untuk ${selectedDisposal.equipment_code} berhasil ditolak.`);
        setIsRejectModalOpen(false);
        setRejectionReason("");
        setModalError(null);
        handleCloseDetail();
        await fetchDisposalsData();
      } else {
        setModalError(res.message || "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.");
      }
    } catch (err: unknown) {
      console.error("Reject scrap error:", err);
      setModalError("Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-[13px] font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Persetujuan Scrap Aset
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Peninjauan dan persetujuan usulan scrap peralatan idle.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 bg-white px-5 pt-3">
          <button
            type="button"
            onClick={() => changeTab("inbox")}
            className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === "inbox"
                ? "border-b-2 border-[#0A356A] text-[#0A356A]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>Antrean Pending</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === "inbox"
                  ? "bg-[#0A356A] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {pendingDisposals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("history")}
            className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-[#0A356A] text-[#0A356A]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>Riwayat Keputusan</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                activeTab === "history"
                  ? "bg-[#0A356A] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {historyDisposals.length}
            </span>
          </button>
        </div>

        {/* Toolbar / Filters */}
        <div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari no. pengajuan, kode, atau nama..."
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            <button
              type="button"
              onClick={fetchDisposalsData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#0A356A] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr className="border-b border-gray-300">
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center w-12 whitespace-nowrap">
                  No
                </th>
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
                  No. Pengajuan
                </th>
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
                  Kode Alat
                </th>
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">
                  Nama Peralatan
                </th>
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
                  Taksiran Nilai Scrap
                </th>
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
                  Tanggal Pengusulan
                </th>
                {activeTab === "history" && (
                  <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
                    Status
                  </th>
                )}
                <th className="px-3 py-3 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === "history" ? 8 : 7} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A356A]" />
                    <span className="text-xs font-medium">Memuat antrean usulan scrap...</span>
                  </td>
                </tr>
              ) : filteredDisposals.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "history" ? 8 : 7} className="px-6 py-12 text-center text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-sm font-semibold text-gray-600">Tidak ada permintaan scrap dalam antrean</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === "inbox"
                        ? "Semua berkas usulan scrap telah selesai ditinjau."
                        : "Belum ada riwayat persetujuan scrap."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDisposals.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                    <td className="px-3 py-3 text-[13px] text-gray-500 font-medium text-center whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#0A356A] whitespace-nowrap text-center">
                      {item.disposal_number || "-"}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#0A356A] whitespace-nowrap text-left">
                      {item.equipment_code || "-"}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-gray-800 text-left" title={item.equipment_name}>
                      <span className="leading-tight line-clamp-2 block text-left">
                        {item.equipment_name || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[13px] font-bold text-emerald-700 text-center">
                      {formatCurrency(item.scrap_value)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[13px] text-gray-600 font-medium text-center">
                      {formatDate(item.created_at)}
                    </td>
                    {activeTab === "history" && (
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {item.status === "DISPOSED" ? (
                          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
                            Disetujui
                          </span>
                        ) : item.status === "REJECTED" ? (
                          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEE2E2] text-[#DC2626]">
                            Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEF3C7] text-[#B45309]">
                            Menunggu Persetujuan
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        {activeTab === "history" ? (
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1 text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-md text-[13px] font-bold transition-all shadow-sm cursor-pointer"
                            title="Tinjau usulan scrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Tinjau Permintaan</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredDisposals.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[11px] font-medium text-gray-500">
              Menampilkan {filteredDisposals.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDisposals.length)} dari {filteredDisposals.length} data ({ITEMS_PER_PAGE} baris/halaman)
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
        )}
      </div>

      {/* Modal Detail Review & Persetujuan */}
      {isDetailOpen && selectedDisposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDetail}
          />

          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Detail Peninjauan Permintaan Scrap Aset</h2>
                  <p className="text-[12px] text-gray-500 font-medium">
                    No. Pengajuan: <span className="font-bold text-[#0A356A]">{selectedDisposal.disposal_number}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-colors font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50/50 space-y-6">
              {/* Alert Status */}
              {selectedDisposal.status === "PENDING" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">Usulan Permintaan Scrap Aset</p>
                    <p className="text-[12px] text-amber-800 mt-0.5 leading-relaxed">
                      Aset ini telah dinyatakan <strong>&quot;Rusak Berat&quot;</strong> berdasarkan hasil inspeksi teknik dan telah diajukan oleh Rendal Pemeliharaan untuk proses scrap. Persetujuan Manajer Rendal diperlukan sebelum usulan dapat diproses lebih lanjut.
                    </p>
                  </div>
                </div>
              )}

              {selectedDisposal.status === "DISPOSED" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">Pengajuan Scrap Disetujui</p>
                    <p className="text-[12px] text-emerald-800 mt-0.5 leading-relaxed">
                      Pengajuan scrap ini telah disetujui oleh Manajer Rendal. Status aset di inventaris telah diperbarui menjadi <strong>DISPOSAL_VERIFIED</strong> (Scrap).
                    </p>
                  </div>
                </div>
              )}

              {selectedDisposal.status === "REJECTED" && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">Pengajuan Scrap Ditolak</p>
                    <p className="text-[12px] text-rose-800 mt-0.5 leading-relaxed">
                      Pengajuan scrap ini telah ditolak oleh Manajer Rendal. Status aset dikembalikan menjadi <strong>READY_TO_REUSE</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Catatan Keputusan Manajer (jika ditolak) */}
              {selectedDisposal.status === "REJECTED" && selectedDisposal.notes && (
                <div className="border rounded-xl p-4 flex flex-col gap-1.5 bg-rose-50/50 border-rose-200 text-rose-900">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                    Catatan Penolakan Manajer
                  </h4>
                  <p className="text-[13px] font-medium italic text-gray-800">
                    &quot;{selectedDisposal.notes}&quot;
                  </p>
                </div>
              )}

              {/* Informasi Pengajuan */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <FileText className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">Informasi Pengajuan</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">No. Pengajuan</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{selectedDisposal.disposal_number}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Tanggal Pengajuan</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{formatDate(selectedDisposal.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Diajukan Oleh</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{selectedDisposal.created_by_name || "Budi Santoso"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Jabatan</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">Rendal Pemeliharaan</p>
                  </div>
                </div>
              </div>

              {/* Ringkasan Aset */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <Tag className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">Ringkasan Spesifikasi Aset</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Kode Alat</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{selectedDisposal.equipment_code}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Nama Alat</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{selectedDisposal.equipment_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Plant Asal</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{selectedDisposal.plant || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Nilai Perolehan Awal</p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">{formatCurrency(selectedDisposal.original_value)}</p>
                  </div>
                </div>
              </div>

              {/* Rincian Usulan Pembuangan */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <DollarSign className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">Rincian Permintaan Scrap</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase">Taksiran Nilai Scrap (Besi Tua)</p>
                    <p className="text-[15px] font-extrabold text-emerald-700 mt-1">{formatCurrency(selectedDisposal.scrap_value)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-700 mb-1.5">Alasan/Justifikasi Usulan Scrap:</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[13px] text-gray-800 leading-relaxed italic">
                    &quot;{selectedDisposal.justification || "Tidak ada rincian justifikasi."}&quot;
                  </div>
                </div>
              </div>

              {/* Dasar Rekomendasi / History */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <Clock className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">Dasar Rekomendasi & Riwayat Proses</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="pb-2">Tahapan</th>
                        <th className="pb-2">Oleh</th>
                        <th className="pb-2">Hasil / Tindakan</th>
                        <th className="pb-2">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="py-2.5 font-bold">Inspeksi Teknik</td>
                        <td className="py-2.5">Tim Inspeksi Teknik</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                            Rusak Berat
                          </span>
                        </td>
                        <td className="py-2.5">{formatDate(selectedDisposal.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">Pengajuan Scrap</td>
                        <td className="py-2.5">{selectedDisposal.created_by_name || "Budi Santoso"} (Rendal Pemeliharaan)</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Diajukan
                          </span>
                        </td>
                        <td className="py-2.5">{formatDate(selectedDisposal.created_at)}</td>
                      </tr>
                      {selectedDisposal.status !== "PENDING" && (
                        <tr>
                          <td className="py-2.5 font-bold">Keputusan Manajer</td>
                          <td className="py-2.5">Ahmad Fauzi (Manajer Rendal)</td>
                          <td className="py-2.5">
                            {selectedDisposal.status === "DISPOSED" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                                Disetujui
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                Ditolak
                              </span>
                            )}
                          </td>
                          <td className="py-2.5">{formatDate(selectedDisposal.created_at)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lampiran Bukti Fisik */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                  Lampiran Bukti Fisik (Nameplate & Kerusakan)
                </h3>
                <div className="flex flex-wrap gap-4">
                  {selectedDisposal.attachments && selectedDisposal.attachments.length > 0 ? (
                    selectedDisposal.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="group relative w-36 h-36 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setPreviewImage(att.file_url)}
                      >
                        <img
                          src={att.file_url}
                          alt={att.caption || `Bukti ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] font-semibold truncate">
                          {att.caption || `Bukti ${idx + 1}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400 text-xs italic">
                      Tidak ada lampiran foto bukti fisik
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white shrink-0">
              <button
                onClick={handleCloseDetail}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>

              {selectedDisposal.status === "PENDING" && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setRejectionReason("");
                      setIsRejectModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Pengajuan
                  </button>

                  <button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Scrap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Persetujuan (Approve) */}
      {isApproveConfirmOpen && selectedDisposal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isSubmitting) {
                setIsApproveConfirmOpen(false);
                setModalError(null);
              }
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Setujui Pengajuan Scrap?</h3>

            <div className="text-[13px] text-gray-600 mb-6 leading-relaxed text-left w-full bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
              <p>Anda akan menyetujui pengajuan scrap untuk aset berikut:</p>
              
              <div>
                <p className="text-[11px] uppercase text-gray-400 font-semibold mb-0.5">No. Pengajuan</p>
                <p className="font-bold text-[#0A356A]">{selectedDisposal.disposal_number}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase text-gray-400 font-semibold mb-0.5">Kode & Nama Aset</p>
                <p className="font-bold text-gray-900">{selectedDisposal.equipment_code}</p>
                <p className="font-semibold text-gray-700">{selectedDisposal.equipment_name}</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-[11px] uppercase text-gray-400 font-semibold mb-0.5">Estimasi Nilai Scrap</p>
                <p className="text-[16px] font-extrabold text-emerald-700">{formatCurrency(selectedDisposal.scrap_value)}</p>
              </div>

              <p className="text-[11px] text-gray-400 italic pt-1">Setelah disetujui, pengajuan akan diteruskan ke proses berikutnya.</p>
            </div>

            {modalError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[12px] flex items-start gap-2.5 text-left w-full">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-[12px] text-rose-900 leading-normal">
                    Pengajuan belum dapat diproses
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    {modalError}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 w-full justify-center">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setIsApproveConfirmOpen(false);
                  setModalError(null);
                }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors w-[120px] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-colors w-[140px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : modalError ? (
                  "Coba Lagi"
                ) : (
                  "Setujui Scrap"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Penolakan (Reject) dengan Textarea Wajib Alasan */}
      {isRejectModalOpen && selectedDisposal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isSubmitting) {
                setIsRejectModalOpen(false);
                setModalError(null);
              }
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Tolak Pengajuan Scrap?</h3>
                <p className="text-[12px] text-gray-500 font-medium">{selectedDisposal.equipment_code}</p>
              </div>
            </div>

            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              Pengajuan scrap untuk aset <strong className="text-gray-900">{selectedDisposal.equipment_code} – {selectedDisposal.equipment_name}</strong> akan ditolak.
            </p>

            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-800 mb-1.5">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan pengajuan scrap..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl text-[13px] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors resize-none placeholder:text-gray-400 text-gray-800"
              />
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-normal">
                Contoh: Aset masih dapat diperbaiki dan digunakan kembali.
              </p>
              {!rejectionReason.trim() && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">
                  * Alasan wajib diisi untuk menolak pengajuan.
                </p>
              )}
            </div>

            {modalError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[12px] flex items-start gap-2.5 text-left w-full">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-[12px] text-rose-900 leading-normal">
                    Pengajuan belum dapat diproses
                  </p>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    {modalError}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 w-full">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setModalError(null);
                }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              <button
                disabled={!rejectionReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : modalError ? (
                  "Coba Lagi"
                ) : (
                  "Tolak Pengajuan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview Physical Evidence"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
