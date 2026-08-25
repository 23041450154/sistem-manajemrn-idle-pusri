"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  X,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  DollarSign,
  Tag,
  Search,
} from "lucide-react";
import { approveDisposal, type DisposalItemDTO } from "@/action/api";
import { formatDate } from "@/lib/utils";

type DisposalItem = DisposalItemDTO;

/** Client Component: interaksi (tab/search/paginasi/review approve-reject) — data di-fetch Server Component. */
export default function ManajerDisposalClient({
  disposals,
}: {
  disposals: DisposalItem[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");

  // Filter states
  const [search, setSearch] = useState("");

  // Modal detail states
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalItem | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Action confirmation states
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter berubah -> balik ke halaman 1. Dilakukan di setter, bukan di effect,
  // supaya tidak memicu render bertingkat.
  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };
  const changeTab = (tab: "inbox" | "history") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Pending inbox items
  const pendingDisposals = disposals.filter(
    (item) => item.status === "PENDING",
  );
  // Processed history items
  const historyDisposals = disposals.filter(
    (item) => item.status !== "PENDING",
  );

  const currentList =
    activeTab === "inbox" ? pendingDisposals : historyDisposals;

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
    currentPage * ITEMS_PER_PAGE,
  );

  const handleOpenDetail = (item: DisposalItem) => {
    setSelectedDisposal(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedDisposal(null);
    setPreviewImage(null);
  };

  // Submit Approval (Green Button)
  const handleConfirmApprove = async () => {
    if (!selectedDisposal || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await approveDisposal(selectedDisposal.approval_id, {
        status: "DISPOSED",
      });

      if (res.success) {
        showToast(
          "success",
          res.message ||
            "Permintaan scrap berhasil disetujui, status aset berubah menjadi SCRAP.",
        );
        setIsApproveConfirmOpen(false);
        handleCloseDetail();
        // Server action sudah revalidateApp(); tarik payload RSC terbaru.
        router.refresh();
      } else {
        showToast(
          "error",
          res.message || "Gagal menyetujui pengajuan disposal.",
        );
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan server saat menyetujui disposal.";
      showToast("error", errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection (Red Button)
  const handleConfirmReject = async () => {
    if (!selectedDisposal || isSubmitting || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await approveDisposal(selectedDisposal.id, {
        status: "REJECTED",
        rejection_reason: rejectionReason.trim(),
      });

      if (res.success) {
        showToast(
          "success",
          res.message || "Pengajuan disposal berhasil ditolak.",
        );
        setIsRejectModalOpen(false);
        setRejectionReason("");
        handleCloseDetail();
        // Server action sudah revalidateApp(); tarik payload RSC terbaru.
        router.refresh();
      } else {
        showToast("error", res.message || "Gagal menolak pengajuan disposal.");
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan server saat menolak disposal.";
      showToast("error", errMsg);
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

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] max-w-md bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-gray-700">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-[13px] font-medium leading-snug">
            {toast.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-[#0A356A]" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Persetujuan Scrap Aset
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Peninjauan dan persetujuan usulan scrap aset.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar / Filters (Identik dengan halaman Inspeksi Validasi) */}
        <div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => changeTab("inbox")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "inbox"
                  ? "bg-[#0A356A] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Antrean Pending
            </button>
            <button
              onClick={() => changeTab("history")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-[#0A356A] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Riwayat Keputusan
            </button>
          </div>

          {/* Search & Refresh */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#0A356A] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-12 whitespace-nowrap">
                  No
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Nomor Pengajuan
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Kode & Nama Alat
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Taksiran Nilai Scrap
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Tanggal Pengusulan
                </th>
                {activeTab === "history" && (
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                    Status
                  </th>
                )}
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredDisposals.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "history" ? 7 : 6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-sm font-semibold text-gray-600">
                      Tidak ada pengajuan disposal dalam antrean
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === "inbox"
                        ? "Semua berkas usulan pembuangan aset telah selesai ditinjau."
                        : "Belum ada riwayat persetujuan disposal."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDisposals.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/20 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-[13px] text-gray-500 font-medium text-center whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-bold text-[#0A356A] whitespace-nowrap text-center">
                      {item.disposal_number}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <p className="text-[13px] font-bold text-gray-900">
                        {item.equipment_code}
                      </p>
                      <p className="text-[12px] text-gray-500 font-medium line-clamp-1">
                        {item.equipment_name}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[13px] font-bold text-emerald-700 text-center">
                      {formatCurrency(item.scrap_value)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-600 font-medium text-center">
                      {formatDate(item.created_at)}
                    </td>
                    {activeTab === "history" && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {item.status === "DISPOSED" ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-3.5 py-1.5 rounded-lg text-[12px] font-bold hover:bg-[#0556B3] transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {activeTab === "history"
                          ? "Detail"
                          : "Tinjau Pengajuan"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredDisposals.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[12px] font-medium text-gray-500">
              Menampilkan{" "}
              {filteredDisposals.length === 0
                ? 0
                : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
              -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredDisposals.length)}{" "}
              dari {filteredDisposals.length} data (10 baris/halaman)
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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
                  <h2 className="text-lg font-bold text-gray-900">
                    Detail Peninjauan Disposal Aset
                  </h2>
                  <p className="text-[12px] text-gray-500 font-medium">
                    No. Pengajuan:{" "}
                    <span className="font-bold text-[#0A356A]">
                      {selectedDisposal.disposal_number}
                    </span>
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold">
                    Usulan Penghapusan Buku Aset (Disposal)
                  </p>
                  <p className="text-[12px] text-amber-800 mt-0.5 leading-relaxed">
                    Aset ini telah dinyatakan{" "}
                    <strong>&quot;Rusak Berat&quot;</strong> oleh tim teknik dan
                    diusulkan untuk dihapus dari inventaris oleh Staf Rendal.
                    Penandatanganan digital Manajer Rendal diperlukan untuk
                    legalitas.
                  </p>
                </div>
              </div>

              {/* Ringkasan Aset */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <Tag className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Ringkasan Spesifikasi Aset
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Kode Alat
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedDisposal.equipment_code}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Nama Alat
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedDisposal.equipment_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Plant Asal
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedDisposal.plant || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Nilai Perolehan Awal
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {formatCurrency(selectedDisposal.original_value)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Usulan Pembuangan */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <DollarSign className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Rincian Usulan Pembuangan
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase">
                      Taksiran Nilai Scrap (Besi Tua)
                    </p>
                    <p className="text-[15px] font-extrabold text-emerald-700 mt-1">
                      {formatCurrency(selectedDisposal.scrap_value)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-700 mb-1.5">
                    Justifikasi / Alasan Pembuangan:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[13px] text-gray-800 leading-relaxed italic">
                    &quot;
                    {selectedDisposal.justification ||
                      "Tidak ada rincian justifikasi."}
                    &quot;
                  </div>
                </div>
              </div>

              {/* Lampiran Bukti Fisik */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                  Lampiran Bukti Fisik (Nameplate & Kerusakan)
                </h3>
                <div className="flex flex-wrap gap-4">
                  {selectedDisposal.attachments &&
                  selectedDisposal.attachments.length > 0 ? (
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
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Usulan
                  </button>

                  <button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Disposal
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
            onClick={() => !isSubmitting && setIsApproveConfirmOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Konfirmasi Persetujuan Disposal
            </h3>

            <p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menyetujui permohonan scrap aset ini?
              Status aset di inventaris akan diubah menjadi{" "}
              <strong className="text-emerald-700 font-bold font-mono">
                SCRAP
              </strong>
              .
            </p>

            <div className="flex items-center gap-3 w-full justify-center">
              <button
                disabled={isSubmitting}
                onClick={() => setIsApproveConfirmOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors w-[120px] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-colors w-[140px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Ya, Setujui"
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
            onClick={() => !isSubmitting && setIsRejectModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Tolak Usuran Disposal
                </h3>
                <p className="text-[12px] text-gray-500 font-medium">
                  {selectedDisposal.equipment_code}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              Silakan tuliskan alasan penolakan secara jelas. Catatan ini akan
              dikirimkan kepada tim Rendal.
            </p>

            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-800 mb-1.5">
                Alasan Penolakan{" "}
                <span className="text-red-500">* (Wajib diisi)</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tulis alasan penolakan usulan disposal di sini..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl text-[13px] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors resize-none placeholder:text-gray-400 text-gray-800"
              />
              {!rejectionReason.trim() && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  * Kolom alasan wajib diisi sebelum tombol Kirim diaktifkan.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 w-full">
              <button
                disabled={isSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              <button
                disabled={!rejectionReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Penolakan"
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
