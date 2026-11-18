"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  X,
  CheckCircle2,
  RefreshCw,
  XCircle,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Loader2,
  DollarSign,
  Tag,
  Search,
  FileText,
  Clock,
} from "lucide-react";
import {
  approveScrap,
  getValidations,
  getApprovalById,
  getInspections,
  type ScrapItemDTO,
} from "@/action/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { scrapStatusBadge, mapScrapMethodName } from "@/lib/approvals";
import { extractSapNotification } from "@/lib/sap-notification";

type ScrapItem = ScrapItemDTO;

/** Client Component: interaksi (tab/search/paginasi/review approve-reject) — data di-fetch Server Component. */
function ManajerScrapContent({
  scraps,
  onRefresh,
}: {
  scraps: ScrapItem[];
  onRefresh?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = (searchParams?.get("tab") || "").toLowerCase();
  const resolvedUrlTab: "inbox" | "history" =
    rawTab === "history" || rawTab === "riwayat" ? "history" : "inbox";

  const [prevUrlTab, setPrevUrlTab] = useState<"inbox" | "history">(resolvedUrlTab);
  const [activeTab, setActiveTab] = useState<"inbox" | "history">(resolvedUrlTab);
  if (prevUrlTab !== resolvedUrlTab) {
    setPrevUrlTab(resolvedUrlTab);
    setActiveTab(resolvedUrlTab);
  }

  // Filter states
  const [search, setSearch] = useState("");

  // Modal detail states
  const [selectedScrap, setSelectedScrap] = useState<ScrapItem | null>(
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
    type: "success" | "error" | "reject";
    message: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  // Validasi & approval detail untuk riwayat proses dinamis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [validationDetail, setValidationDetail] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [approvalDetail, setApprovalDetail] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inspectionDetail, setInspectionDetail] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter berubah -> balik ke halaman 1, dilakukan di setter agar effect tidak
  // memanggil setState secara sinkron.
  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };
  const changeTab = useCallback((tab: "inbox" | "history") => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const showToast = (type: "success" | "error" | "reject", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Pending inbox items
  const pendingScraps = scraps.filter(
    (item) => item.status === "PENDING",
  );
  // Processed history items — diurutkan berdasarkan timestamp aksi/update terbaru (updated_at)
  const historyScraps = scraps
    .filter((item) => item.status !== "PENDING")
    .sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

  const currentList =
    activeTab === "inbox" ? pendingScraps : historyScraps;

  const filteredScraps = currentList.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.scrap_number.toLowerCase().includes(q) ||
      item.equipment_code.toLowerCase().includes(q) ||
      item.equipment_name.toLowerCase().includes(q) ||
      (item.storage_location || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredScraps.length / ITEMS_PER_PAGE);
  const paginatedScraps = filteredScraps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleOpenDetail = async (item: ScrapItem) => {
    setSelectedScrap(item);
    setIsDetailOpen(true);
    setValidationDetail(null);
    setApprovalDetail(null);
    setInspectionDetail(null);
    try {
      const [valids, appData, inspList] = await Promise.all([
        item.equipment_id
          ? getValidations(item.equipment_id)
          : Promise.resolve([]),
        item.approval_id
          ? getApprovalById(item.approval_id, "scrap")
          : Promise.resolve(null),
        getInspections().catch(() => []),
      ]);
      if (Array.isArray(valids) && valids.length > 0) {
        setValidationDetail(valids[0]);
      }
      if (appData) {
        setApprovalDetail(appData);
      }
      if (Array.isArray(inspList) && item.equipment_id) {
        const eqInspections = inspList
          .filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ins: any) => String(ins.equipment_id) === String(item.equipment_id),
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => Number(b.id) - Number(a.id));
        if (eqInspections.length > 0) {
          setInspectionDetail(eqInspections[0]);
        }
      }
    } catch (err) {
      console.error("Gagal memuat riwayat validasi/approval scrap:", err);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedScrap(null);
    setPreviewImage(null);
    setModalError(null);
    setValidationDetail(null);
    setApprovalDetail(null);
    setInspectionDetail(null);
  };

  const selectedScrapSapNum = selectedScrap
    ? extractSapNotification(validationDetail) ||
      extractSapNotification(inspectionDetail) ||
      selectedScrap.sap_notification_number ||
      extractSapNotification(selectedScrap)
    : null;

  // Submit Approval (Green Button)
  const handleConfirmApprove = async () => {
    if (!selectedScrap || isSubmitting) return;

    const approvedCode = selectedScrap.equipment_code;
    setIsSubmitting(true);
    setModalError(null);
    try {
      // Delay for smooth loading state animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await approveScrap(selectedScrap.approval_id, {
        status: "DISPOSED",
      });

      if (res.success) {
        showToast(
          "success",
          `Berhasil! Usulan scrap untuk peralatan ${approvedCode} telah disetujui.`,
        );
        setIsApproveConfirmOpen(false);
        setModalError(null);
        handleCloseDetail();
        changeTab("history");
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
        }
      } else {
        setModalError(
          res.message ||
            "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.",
        );
      }
    } catch (err: unknown) {
      console.error("Approve scrap error:", err);
      setModalError(
        "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection (Red Button)
  const handleConfirmReject = async () => {
    if (!selectedScrap || isSubmitting || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      // Delay for smooth loading state animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await approveScrap(selectedScrap.approval_id, {
        status: "REJECTED",
        rejection_reason: rejectionReason.trim(),
      });

      if (res.success) {
        showToast(
          "reject",
          `Pengajuan ${selectedScrap.scrap_number} untuk ${selectedScrap.equipment_code} berhasil ditolak.`,
        );
        setIsRejectModalOpen(false);
        setRejectionReason("");
        setModalError(null);
        handleCloseDetail();
        changeTab("history");
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
        }
      } else {
        setModalError(
          res.message ||
            "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.",
        );
      }
    } catch (err: unknown) {
      console.error("Reject scrap error:", err);
      setModalError(
        "Terjadi kendala saat memproses pengajuan. Silakan coba kembali beberapa saat lagi.",
      );
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
              {pendingScraps.length}
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
              {historyScraps.length}
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
              onClick={async () => {
                if (onRefresh) {
                  await onRefresh();
                } else {
                  router.refresh();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#0A356A] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
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
              {filteredScraps.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "history" ? 8 : 7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-sm font-semibold text-gray-600">
                      Tidak ada permintaan scrap dalam antrean
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === "inbox"
                        ? "Semua berkas usulan scrap telah selesai ditinjau."
                        : "Belum ada riwayat persetujuan scrap."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedScraps.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-3 py-3 text-[13px] text-gray-500 font-medium text-center whitespace-nowrap">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#0A356A] whitespace-nowrap text-center">
                      {item.scrap_number || "-"}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#0A356A] whitespace-nowrap text-left">
                      <div>{item.equipment_code || "-"}</div>
                      {item.sap_notification_number && (
                        <div className="mt-0.5">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                            title={`SAP Notification: ${item.sap_notification_number}`}
                          >
                            SAP: {item.sap_notification_number}
                          </span>
                        </div>
                      )}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold text-gray-800 text-left"
                      title={item.equipment_name}
                    >
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
                        {(() => {
                          const badge = scrapStatusBadge(item.status);
                          return (
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${badge.style}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
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

        {filteredScraps.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
            <span className="text-[11px] font-medium text-gray-500">
              Menampilkan{" "}
              {filteredScraps.length === 0
                ? 0
                : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
              -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredScraps.length)}{" "}
              dari {filteredScraps.length} data ({ITEMS_PER_PAGE}{" "}
              baris/halaman)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.max(1, totalPages) },
                  (_, i) => i + 1,
                ).map((page) => (
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
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.max(1, totalPages), p + 1),
                  )
                }
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
      {isDetailOpen && selectedScrap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0F172A]/50 transition-opacity"
            onClick={handleCloseDetail}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail Peninjauan Usulan Scrap Aset ${selectedScrap.scrap_number}`}
            className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Detail Peninjauan Usulan Scrap Aset
                  </h2>
                  <p className="text-[12px] text-gray-500 font-medium">
                    No. Pengajuan:{" "}
                    <span className="font-bold text-[#0A356A]">
                      {selectedScrap.scrap_number}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup detail usulan scrap"
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors font-bold"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-6 py-5 bg-gray-50/50 space-y-6">
              {/* Alert Status */}
              {(selectedScrap.status === "PENDING" ||
                selectedScrap.status === "IN_REVIEW") && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">
                      Usulan Permintaan Scrap Aset
                    </p>
                    <p className="text-[12px] text-amber-800 mt-0.5 leading-relaxed">
                      Aset ini telah dinyatakan{" "}
                      <strong>&quot;Rusak Berat&quot;</strong> berdasarkan hasil
                      inspeksi teknik dan telah diajukan oleh Rendal
                      Pemeliharaan untuk proses scrap.
                      {selectedScrapSapNum && (
                        <>
                          {" "}Nomor Notifikasi SAP PM resmi:{" "}
                          <strong className="underline text-amber-950 font-bold">{selectedScrapSapNum}</strong>.
                        </>
                      )}
                      {" "}Persetujuan Manajer Rendal diperlukan sebelum usulan dapat diproses lebih
                      lanjut.
                    </p>
                  </div>
                </div>
              )}

              {(selectedScrap.status === "DISPOSED" ||
                selectedScrap.status === "APPROVED") && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">
                      Pengajuan Scrap Disetujui
                    </p>
                    <p className="text-[12px] text-emerald-800 mt-0.5 leading-relaxed">
                      Pengajuan scrap ini telah disetujui oleh Manajer Rendal.
                      Status aset di inventaris telah diperbarui menjadi{" "}
                      <strong>SCRAP_VERIFIED</strong> (Scrap).
                    </p>
                  </div>
                </div>
              )}

              {selectedScrap.status === "REJECTED" && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">
                      Pengajuan Scrap Ditolak
                    </p>
                    <p className="text-[12px] text-rose-800 mt-0.5 leading-relaxed">
                      Pengajuan scrap ini telah ditolak oleh Manajer Rendal.
                      Status aset dikembalikan menjadi{" "}
                      <strong>READY_TO_REUSE</strong>.
                    </p>
                  </div>
                </div>
              )}

              {selectedScrap.status === "REVISION_REQUIRED" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-purple-900">
                  <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold">
                      Pengajuan Perlu Revisi
                    </p>
                    <p className="text-[12px] text-purple-800 mt-0.5 leading-relaxed">
                      Pengajuan scrap ini memerlukan revisi data/dokumen dari
                      Rendal Pemeliharaan.
                    </p>
                  </div>
                </div>
              )}

              {/* Catatan Keputusan Manajer (jika ditolak) */}
              {selectedScrap.status === "REJECTED" &&
                selectedScrap.notes && (
                  <div className="border rounded-xl p-4 flex flex-col gap-1.5 bg-rose-50/50 border-rose-200 text-rose-900">
                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                      Catatan Penolakan Manajer
                    </h4>
                    <p className="text-[13px] font-medium italic text-gray-800">
                      &quot;{selectedScrap.notes}&quot;
                    </p>
                  </div>
                )}

              {/* Informasi Pengajuan */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <FileText className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Informasi Pengajuan
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      No. Pengajuan
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedScrap.scrap_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Tanggal Pengajuan
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {formatDate(selectedScrap.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Diajukan Oleh
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedScrap.created_by_name || "Budi Santoso"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Jabatan
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      Rendal Pemeliharaan
                    </p>
                  </div>
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
                      {selectedScrap.equipment_code}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Nama Alat
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedScrap.equipment_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Plant Asal
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {selectedScrap.plant || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      Nilai Perolehan Awal
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 mt-0.5">
                      {formatCurrency(selectedScrap.original_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">
                      No. Notifikasi SAP (SAP PM)
                    </p>
                    <div className="mt-0.5">
                      {selectedScrapSapNum ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-[#0A356A] border border-blue-200">
                          {selectedScrapSapNum}
                        </span>
                      ) : (
                        <span className="text-[13px] font-medium text-gray-500">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Usulan Pembuangan */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <DollarSign className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Rincian Permintaan Scrap
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-[#0A356A] uppercase">
                      Metode Scrap
                    </p>
                    <p className="text-[14px] font-bold text-gray-900 mt-1">
                      {mapScrapMethodName(
                        selectedScrap.scrap_method,
                        selectedScrap.scrap_method_id,
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase">
                      Taksiran Nilai Scrap (Besi Tua)
                    </p>
                    <p className="text-[15px] font-extrabold text-emerald-700 mt-1">
                      {formatCurrency(selectedScrap.scrap_value)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-700 mb-1.5">
                    Alasan/Justifikasi Usulan Scrap:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[13px] text-gray-800 leading-relaxed italic">
                    &quot;
                    {selectedScrap.justification ||
                      "Tidak ada rincian justifikasi."}
                    &quot;
                  </div>
                </div>
              </div>

              {/* Dasar Rekomendasi / History */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                  <Clock className="w-4 h-4 text-[#0A356A]" />
                  <h3 className="text-[14px] font-bold text-gray-900">
                    Dasar Rekomendasi & Riwayat Proses
                  </h3>
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
                        <td className="py-2.5 font-bold">
                          <div>Inspeksi Teknik</div>
                          {selectedScrapSapNum && (
                            <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0A356A] border border-blue-200">
                              SAP: {selectedScrapSapNum}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {validationDetail?.inspector_user?.name ||
                            inspectionDetail?.inspector_name ||
                            "Tim Inspeksi Teknik"}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                              {validationDetail?.condition?.name
                                ? validationDetail.condition.name.replace(/_/g, " ")
                                : "Rusak Berat"}
                            </span>
                            {selectedScrapSapNum && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                Ref SAP PM: <strong className="text-gray-800">{selectedScrapSapNum}</strong>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5">
                          {formatDate(
                            validationDetail?.start_at ||
                              validationDetail?.created_at ||
                              inspectionDetail?.inspection_date ||
                              selectedScrap.created_at,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">Pengajuan Scrap</td>
                        <td className="py-2.5">
                          {selectedScrap.created_by_name
                            ? `${selectedScrap.created_by_name} (Rendal Pemeliharaan)`
                            : "Budi Santoso (Rendal Pemeliharaan)"}
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Diajukan
                          </span>
                        </td>
                        <td className="py-2.5">
                          {formatDate(
                            selectedScrap.scrap_date ||
                              selectedScrap.created_at,
                          )}
                        </td>
                      </tr>
                      {selectedScrap.status !== "PENDING" &&
                        selectedScrap.status !== "IN_REVIEW" && (
                          <tr>
                            <td className="py-2.5 font-bold">
                              Keputusan Manajer
                            </td>
                            <td className="py-2.5">
                              {approvalDetail?.steps?.find(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (s: any) =>
                                  s.approval_status === "APPROVED" ||
                                  s.approval_status === "REJECTED" ||
                                  s.approval_status === "REVISION_REQUIRED",
                              )?.approval_name
                                ? `${
                                    approvalDetail.steps.find(
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      (s: any) =>
                                        s.approval_status === "APPROVED" ||
                                        s.approval_status === "REJECTED" ||
                                        s.approval_status === "REVISION_REQUIRED",
                                    ).approval_name
                                  } (Manajer Rendal)`
                                : "Ahmad Fauzi (Manajer Rendal)"}
                            </td>
                            <td className="py-2.5">
                              {(() => {
                                const badge = scrapStatusBadge(
                                  selectedScrap.status,
                                );
                                return (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.style}`}
                                  >
                                    {badge.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5">
                              {formatDate(
                                approvalDetail?.updated_at ||
                                  selectedScrap.created_at,
                              )}
                            </td>
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
                  {selectedScrap.attachments &&
                  selectedScrap.attachments.length > 0 ? (
                    selectedScrap.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="group relative w-36 h-36 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setPreviewImage(att.file_url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
                        <img
                          src={att.file_url}
                          alt={att.caption || `Bukti ${idx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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
                type="button"
                onClick={handleCloseDetail}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded text-[13px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>

              {(selectedScrap.status === "PENDING" ||
                selectedScrap.status === "IN_REVIEW") && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectionReason("");
                      setModalError(null);
                      setIsRejectModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    Tolak Pengajuan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setIsApproveConfirmOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#059669] hover:bg-[#15803D] text-white rounded text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Setujui Usulan Scrap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog Peringatan Audit Persetujuan Usulan Scrap (DEV-16737) */}
      <ConfirmDialog
        open={Boolean(isApproveConfirmOpen && selectedScrap)}
        onClose={() => {
          if (!isSubmitting) {
            setIsApproveConfirmOpen(false);
            setModalError(null);
          }
        }}
        onConfirm={handleConfirmApprove}
        title="Konfirmasi Persetujuan Usulan Scrap"
        description={
          selectedScrap
            ? `Apakah Anda yakin menyetujui dokumen usulan scrap untuk peralatan ${selectedScrap.equipment_code} - ${selectedScrap.equipment_name}? Tindakan ini akan meneruskan berkas usulan ke tahap administrasi penghapusan aset resmi perusahaan.`
            : ""
        }
        cancelLabel="Kembali / Periksa Ulang"
        confirmLabel={modalError ? "Coba Lagi" : "Ya, Setujui Usulan"}
        pendingLabel="Memproses..."
        isPending={isSubmitting}
        tone="success"
        errorMessage={modalError}
      />

      {/* Modal Penolakan (Reject) dengan Textarea Wajib Alasan */}
      {isRejectModalOpen && selectedScrap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0F172A]/50 transition-opacity"
            onClick={() => {
              if (!isSubmitting) {
                setIsRejectModalOpen(false);
                setModalError(null);
              }
            }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Modal Konfirmasi Penolakan Scrap"
            className="relative w-full max-w-md max-h-[85vh] bg-white rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 shrink-0 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-600 shrink-0">
                  <XCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">
                    Modal Konfirmasi Penolakan Scrap
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium truncate">
                    {selectedScrap.equipment_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup dialog penolakan scrap"
                disabled={isSubmitting}
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setModalError(null);
                }}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto scroll-smooth">
              <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
                Pengajuan scrap untuk aset{" "}
                <strong className="text-gray-900">
                  {selectedScrap.equipment_code} -{" "}
                  {selectedScrap.equipment_name}
                </strong>{" "}
                akan ditolak.
              </p>

              <div>
                <label
                  htmlFor="scrap-rejection-reason"
                  className="block text-[12px] font-bold text-gray-800 mb-1.5"
                >
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="scrap-rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan pengajuan scrap..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded text-[13px] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors resize-none placeholder:text-gray-400 text-gray-800"
                />
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium leading-normal">
                  Contoh: Aset masih dapat diperbaiki dan digunakan kembali.
                </p>
                {!rejectionReason.trim() && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">
                    * Alasan wajib diisi untuk menolak pengajuan.
                  </p>
                )}
              </div>

              {modalError && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[12px] flex items-start gap-2.5 text-left w-full">
                  <AlertCircle
                    className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
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
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setModalError(null);
                }}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!rejectionReason.trim() || isSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : modalError ? (
                  "Coba Lagi"
                ) : (
                  "Tolak Pengajuan Scrap"
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
          <div className="relative w-[92vw] max-w-5xl h-[85vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
            <img
              src={previewImage}
              alt="Preview Physical Evidence"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManajerScrapClient(
  props: React.ComponentProps<typeof ManajerScrapContent>,
) {
  return (
    <Suspense fallback={null}>
      <ManajerScrapContent {...props} />
    </Suspense>
  );
}
