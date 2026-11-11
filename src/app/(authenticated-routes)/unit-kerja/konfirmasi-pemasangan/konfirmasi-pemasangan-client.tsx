"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { normalizeRole } from "@/lib/roles";
import { confirmEquipmentInstallation } from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronRight,
	Eye,
	Inbox,
	RefreshCw,
	Search,
	X,
	XCircle,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
	Upload,
	Download,
	FileText,
	Loader2,
} from "lucide-react";
import {
	getSavedSupportingDocument,
	formatFileSize,
	type SupportingDocumentMeta,
} from "@/lib/reuse-documents";
import { getFileCategoryIcon } from "@/components/SupportingDocumentUpload";

export interface ReuseRequestItem {
	id: string;
	request_number: string;
	equipment_id: string;
	equipment_code: string;
	equipment_name: string;
	requesting_unit: string;
	installation_location: string;
	storage_location?: string;
	target_plant: string;
	start_date: string;
	end_date?: string;
	justification: string;
	estimated_cost_avoidance?: number;
	contact_person: string;
	contact_npp?: string;
	contact_phone?: string;
	status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "INSTALLED";
	created_at: string;
	updated_at?: string;
	installed_at?: string;
	physical_notes?: string;
	installation_photo?: string;
	installation_confirmed_by?: string;
	installation_confirmed_at?: string;
	supporting_document?: SupportingDocumentMeta | null;
}

const STATUS_META: Record<
	ReuseRequestItem["status"],
	{ label: string; bg: string; text: string }
> = {
	PENDING: {
		label: "Menunggu Persetujuan",
		bg: "bg-[#FEF3C7]",
		text: "text-[#B45309]",
	},
	IN_REVIEW: {
		label: "Dalam Peninjauan",
		bg: "bg-[#FEF3C7]",
		text: "text-[#B45309]",
	},
	APPROVED: { label: "Approved for Reuse", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
	REJECTED: { label: "Ditolak", bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
	INSTALLED: { label: "Terpasang (Selesai)", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
};

function StatusBadge({ status }: { status: ReuseRequestItem["status"] }) {
	const meta = STATUS_META[status] ?? STATUS_META.PENDING;
	return (
		<span
			className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}
		>
			{meta.label}
		</span>
	);
}

/* DESIGN.md pagination: windowed. First, last, current ±1, "…" for the gaps.
   Never one button per page. */
function getPageWindow(current: number, total: number): (number | "gap")[] {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}
	const wanted = [1, 2, current - 1, current, current + 1, total - 1, total];
	const pages = [...new Set(wanted.filter((p) => p >= 1 && p <= total))].sort(
		(a, b) => a - b,
	);
	const out: (number | "gap")[] = [];
	let prev = 0;
	for (const p of pages) {
		if (prev && p - prev > 1) out.push("gap");
		out.push(p);
		prev = p;
	}
	return out;
}

/** Client Component: interaksi (search/filter/sort/paginasi/modal) — data di-fetch Server Component. */
function KonfirmasiPemasanganContent({
	items,
	isJustSubmitted,
	onRefresh,
}: {
	items: ReuseRequestItem[];
	isJustSubmitted: boolean;
	onRefresh?: () => Promise<void> | void;
}) {
	const router = useRouter();

	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("SEMUA");
	const [currentPage, setCurrentPage] = useState(1);

	// Sorting
	const [sortConfig, setSortConfig] = useState<{
		key: keyof ReuseRequestItem;
		direction: "asc" | "desc";
	} | null>({ key: "created_at", direction: "desc" });

	// Detail Modal
	const [selectedRequest, setSelectedRequest] =
		useState<ReuseRequestItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const { user } = useAuth();
	const isUnitKerja = normalizeRole(user?.role) === "UNIT_KERJA_OPERASI";

	// Installation Confirmation Modal (US-10-FE)
	const [selectedForInstall, setSelectedForInstall] =
		useState<ReuseRequestItem | null>(null);
	const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
	const [installationDate, setInstallationDate] = useState("");
	const [physicalNotes, setPhysicalNotes] = useState("");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [isSubmittingInstall, setIsSubmittingInstall] = useState(false);
	const [installError, setInstallError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleOpenInstallModal = (item: ReuseRequestItem) => {
		setSelectedForInstall(item);
		setInstallationDate(new Date().toISOString().split("T")[0]);
		setPhysicalNotes("");
		setPhotoFile(null);
		setPhotoPreview(null);
		setInstallError("");
		setIsInstallModalOpen(true);
	};

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 25 * 1024 * 1024) {
			setInstallError("Ukuran file foto melebihi batas 25MB.");
			return;
		}

		setPhotoFile(file);
		setInstallError("");

		const reader = new FileReader();
		reader.onload = () => {
			setPhotoPreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleRemovePhoto = () => {
		setPhotoFile(null);
		setPhotoPreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmitInstall = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isUnitKerja) {
			setNotification({
				type: "error",
				message:
					"Aksi konfirmasi hanya dapat dieksekusi oleh akun ber-role Unit Kerja Operasi.",
			});
			return;
		}

		if (!selectedForInstall) return;

		if (!installationDate) {
			setInstallError("Tanggal mulai dioperasikan / terpasang wajib diisi.");
			return;
		}

		setIsSubmittingInstall(true);
		setInstallError("");

		try {
			const res = await confirmEquipmentInstallation({
				requestId: selectedForInstall.id,
				equipmentId: selectedForInstall.equipment_id,
				requestNumber: selectedForInstall.request_number,
				equipmentCode: selectedForInstall.equipment_code,
				equipmentName: selectedForInstall.equipment_name,
				installationLocation: selectedForInstall.installation_location,
				targetPlant: selectedForInstall.target_plant,
				installedAt: installationDate,
				physicalNotes: physicalNotes.trim(),
				photoFile: photoFile,
				photoUrl: photoPreview || undefined,
				confirmedBy: user?.name || user?.npp || "Unit Kerja Operasi",
			});

			if (res.success) {
				setNotification({
					type: "success",
					message:
						res.message ||
						"Konfirmasi berhasil. Peralatan kini resmi tercatat REUSED di sistem.",
				});
				setIsInstallModalOpen(false);
				setSelectedForInstall(null);
				if (onRefresh) {
					await onRefresh();
				} else {
					router.refresh();
				}
			} else {
				setInstallError(res.message || "Gagal mengonfirmasi pemasangan.");
			}
		} catch (err) {
			console.error("Submit installation error:", err);
			setInstallError(
				err instanceof Error ? err.message : "Terjadi kesalahan koneksi.",
			);
		} finally {
			setIsSubmittingInstall(false);
		}
	};

	// Modal: close on Escape, lock background scroll while open.
	useEffect(() => {
		if (!isInstallModalOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isSubmittingInstall) setIsInstallModalOpen(false);
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [isInstallModalOpen, isSubmittingInstall]);

	// Notification Toast
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(
		isJustSubmitted
			? {
					type: "success",
					message: "Pengajuan pemakaian peralatan idle berhasil dikirim.",
				}
			: null,
	);

	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => setNotification(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	// Modal: close on Escape, lock background scroll while open.
	useEffect(() => {
		if (!isDetailOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsDetailOpen(false);
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [isDetailOpen]);

	// Sorting Handler
	const handleSort = (key: keyof ReuseRequestItem) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: keyof ReuseRequestItem) => {
		if (!sortConfig || sortConfig.key !== key) {
			return (
				<ArrowUpDown
					className="h-3 w-3 text-[#64748B]/50 transition-colors duration-150 group-hover:text-[#0A356A]"
					aria-hidden="true"
				/>
			);
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="h-3.5 w-3.5 text-[#0A356A]" aria-hidden="true" />
		) : (
			<ArrowDown className="h-3.5 w-3.5 text-[#0A356A]" aria-hidden="true" />
		);
	};

	// Filtering & Sorting
	const filteredItems = useMemo(() => {
		const result = items.filter((item) => {
			const q = searchQuery.toLowerCase();
			const matchSearch =
				!q ||
				item.request_number.toLowerCase().includes(q) ||
				item.equipment_code.toLowerCase().includes(q) ||
				item.equipment_name.toLowerCase().includes(q) ||
				item.target_plant.toLowerCase().includes(q) ||
				item.installation_location.toLowerCase().includes(q) ||
				(item.storage_location || "").toLowerCase().includes(q);

			let matchStatus = true;
			if (statusFilter === "PENDING") {
				matchStatus = item.status === "PENDING" || item.status === "IN_REVIEW";
			} else if (statusFilter !== "SEMUA") {
				matchStatus = item.status === statusFilter;
			}

			return matchSearch && matchStatus;
		});

		if (sortConfig !== null) {
			result.sort((a, b) => {
				if (sortConfig.key === "created_at") {
					const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
					const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
					if (timeB !== timeA) return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
					return (Number(b.id) || 0) - (Number(a.id) || 0);
				}
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		} else {
			result.sort((a, b) => {
				const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
				const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
				if (timeB !== timeA) return timeB - timeA;
				return (Number(b.id) || 0) - (Number(a.id) || 0);
			});
		}

		return result;
	}, [items, searchQuery, statusFilter, sortConfig]);

	// Pagination
	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setStatusFilter("SEMUA");
		setCurrentPage(1);
		setSortConfig({ key: "created_at", direction: "desc" });
	};

	const formatRupiah = (val?: number) => {
		if (!val) return "Rp 0";
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	const hasActiveFilters = searchQuery !== "" || statusFilter !== "SEMUA";

	const sortableTh = (
		key: keyof ReuseRequestItem,
		label: string,
		align: "left" | "center",
		width?: string,
	) => {
		const isActive = sortConfig?.key === key;
		return (
			<th
				scope="col"
				aria-sort={
					isActive
						? sortConfig!.direction === "asc"
							? "ascending"
							: "descending"
						: undefined
				}
				className={`group px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#334155] ${
					align === "center" ? "text-center" : "text-left"
				} ${width ?? ""}`}
			>
				<button
					type="button"
					onClick={() => handleSort(key)}
					className={`inline-flex items-center gap-1 uppercase tracking-[0.04em] transition-colors duration-150 hover:text-[#0A356A] ${
						align === "center" ? "justify-center" : ""
					} ${isActive ? "text-[#0A356A]" : ""}`}
				>
					{label} {getSortIcon(key)}
				</button>
			</th>
		);
	};

	return (
		<div className="page-container">
			{/* Toast */}
			{notification && (
				<div
					role="status"
					aria-live="polite"
					className="fixed right-6 top-6 z-[70] flex items-start gap-3 overflow-hidden rounded border border-[#E6E8EA] bg-white py-3 pl-4 pr-5 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-2 duration-200"
				>
					<span
						aria-hidden="true"
						className="absolute inset-y-0 left-0 w-0.5"
						style={{
							background: notification.type === "success" ? "#059669" : "#DC2626",
						}}
					/>
					{notification.type === "success" ? (
						<CheckCircle2
							className="h-4 w-4 shrink-0 text-[#059669]"
							aria-hidden="true"
						/>
					) : (
						<XCircle className="h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
					)}
					<p className="text-[13px] font-medium text-[#0F172A]">
						{notification.message}
					</p>
				</div>
			)}

			{/* Page Header */}
			<header className="page-header">
				<div>
					<nav
						aria-label="Breadcrumb"
						className="mb-1 flex items-center gap-1.5 text-[13px] text-[#64748B]"
					>
						<span>Unit Kerja Operasi</span>
						<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
						<span className="font-medium text-[#0A356A]">Konfirmasi Pemasangan</span>
					</nav>
					<h1 className="page-title">Konfirmasi Pemasangan Aset</h1>
					<p className="page-subtitle">
						Status persetujuan pengajuan dan konfirmasi pemasangan fisik peralatan idle.
					</p>
				</div>
				<div className="header-actions">
					<button
						type="button"
						onClick={async () => {
							if (onRefresh) {
								await onRefresh();
							} else {
								router.refresh();
							}
						}}
						className={buttonVariants({ variant: "brandOutline" })}
					>
						<RefreshCw data-icon="inline-start" className="h-4 w-4" />
						Muat Ulang
					</button>
				</div>
			</header>

			{/* Table Panel */}
			<section
				id="riwayat-table-container"
				className="overflow-hidden rounded border border-[#E6E8EA] bg-white scroll-mt-4"
				aria-label="Daftar riwayat permintaan"
			>
				{/* Toolbar */}
				<div className="flex flex-col gap-3 border-b border-[#E6E8EA] p-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="relative w-full lg:w-80">
						<Search
							className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
							aria-hidden="true"
						/>
						<input
							type="search"
							aria-label="Cari pengajuan"
							placeholder="Cari no. pengajuan, kode, atau nama alat..."
							value={searchInput}
							onChange={(e) => {
								setSearchInput(e.target.value);
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="h-8 w-full rounded border border-[#E6E8EA] bg-white pr-3 pl-8 text-[13px] text-[#0F172A] placeholder:text-[#64748B]"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<select
							aria-label="Filter status"
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="h-8 cursor-pointer rounded border border-[#E6E8EA] bg-white px-2.5 text-[13px] text-[#0F172A]"
						>
							<option value="SEMUA">Semua Status</option>
							<option value="PENDING">Menunggu Persetujuan</option>
							<option value="APPROVED">Approved for Reuse</option>
							<option value="INSTALLED">Terpasang (Selesai)</option>
							<option value="REJECTED">Ditolak</option>
						</select>

						<button
							type="button"
							onClick={handleReset}
							title="Reset semua filter"
							className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#334155] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0A356A]"
						>
							<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
							Reset
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full table-fixed border-collapse text-left">
						<thead>
							<tr className="border-b border-[#E6E8EA] bg-[#F2F3F4]">
								<th
									scope="col"
									className="w-12 px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									No
								</th>
								{sortableTh("request_number", "No. Pengajuan", "left", "w-[160px]")}
								{sortableTh(
									"equipment_name",
									"Nama Alat",
									"left",
									"w-[240px] max-w-[260px]",
								)}
								{sortableTh("target_plant", "Plant", "left", "w-[120px]")}
								{sortableTh("start_date", "Tgl Permintaan", "center", "w-[140px]")}
								<th
									scope="col"
									className="w-[160px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Status
								</th>
								<th
									scope="col"
									className="w-[180px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#E6E8EA]">
							{paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-4 py-14 text-center">
										<Inbox
											className="mx-auto h-8 w-8 text-[#64748B]"
											aria-hidden="true"
										/>
										<p className="mt-3 text-[14px] font-semibold text-[#0F172A]">
											Belum Ada Riwayat Permintaan
										</p>
										<p className="mt-1 text-[13px] text-[#64748B]">
											{hasActiveFilters
												? "Tidak ada pengajuan yang cocok dengan filter ini."
												: "Pengajuan pemakaian peralatan idle yang dibuat akan muncul di sini."}
										</p>
										{hasActiveFilters && (
											<button
												type="button"
												onClick={handleReset}
												className={`${buttonVariants({ variant: "brandOutline" })} mt-4`}
											>
												Hapus Filter
											</button>
										)}
									</td>
								</tr>
							) : (
								paginatedItems.map((item, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									return (
										<tr
											key={item.id}
											className="transition-colors duration-150 hover:bg-[#F2F3F4]"
										>
											<td className="px-4 py-2.5 text-center text-[13px] text-[#64748B] tabular-nums">
												{rowNum}
											</td>
											<td
												className="px-4 py-2.5 text-[13px] font-medium text-[#0F172A]"
												title={item.request_number}
											>
												<span className="block truncate leading-tight">
													{item.request_number}
												</span>
											</td>
											<td className="px-4 py-2.5 w-[240px] max-w-[260px]">
												<span
													className="block truncate text-[13px] leading-tight font-medium text-[#0F172A]"
													title={item.equipment_name}
												>
													{item.equipment_name}
												</span>
												<span className="mt-0.5 block font-mono text-[12px] leading-tight text-[#64748B]">
													{item.equipment_code}
												</span>
											</td>
											<td
												className="px-4 py-2.5 text-[13px] text-[#475569]"
												title={item.target_plant}
											>
												<span className="block truncate leading-tight">
													{item.target_plant}
												</span>
											</td>
											<td className="px-4 py-2.5 text-center text-[13px] whitespace-nowrap text-[#475569] tabular-nums">
												{formatDate(item.start_date)}
											</td>
											<td className="px-4 py-2.5 text-center">
												<StatusBadge status={item.status} />
											</td>
											<td className="px-4 py-2.5 text-center whitespace-nowrap">
												<div className="flex items-center justify-center gap-1.5">
													{/* AC-01 & AC-02 & AC-06: Tombol Konfirmasi Pasang bergaya validasi inspeksi, detail tidak ditampilkan bila ada aksi */}
													{isUnitKerja && item.status === "APPROVED" ? (
														<button
															type="button"
															title="Konfirmasi Pasang"
															aria-label={`Konfirmasi pemasangan ${item.request_number}`}
															onClick={() => handleOpenInstallModal(item)}
															className="text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] p-1 px-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
														>
															<Check className="w-3.5 h-3.5" aria-hidden="true" />
															<span className="text-[11px] font-bold">Konfirmasi Pasang</span>
														</button>
													) : (
														<button
															type="button"
															title="Lihat detail"
															aria-label={`Lihat detail ${item.request_number}`}
															onClick={() => {
																setSelectedRequest(item);
																setIsDetailOpen(true);
															}}
															className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 px-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
														>
															<Eye className="w-3.5 h-3.5" aria-hidden="true" />
															<span className="text-[11px] font-bold">Detail</span>
														</button>
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

				{/* Pagination Footer */}
				{filteredItems.length > 0 && (
					<div className="flex items-center justify-between gap-4 border-t border-[#E6E8EA] px-4 py-3">
						<span className="text-[12px] text-[#64748B] tabular-nums">
							Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;
							{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari{" "}
							{filteredItems.length} pengajuan
						</span>
						{totalPages > 1 && (
							<nav aria-label="Navigasi halaman" className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
									disabled={currentPage === 1}
									className="inline-flex h-8 items-center rounded border border-[#E6E8EA] bg-white px-2.5 text-[13px] font-medium text-[#334155] transition-colors duration-150 hover:bg-[#F2F3F4] disabled:pointer-events-none disabled:opacity-40"
								>
									Sebelumnya
								</button>
								{getPageWindow(currentPage, totalPages).map((page, i) =>
									page === "gap" ? (
										<span
											key={`gap-${i}`}
											aria-hidden="true"
											className="px-1 text-[13px] text-[#64748B]"
										>
											&hellip;
										</span>
									) : (
										<button
											key={page}
											type="button"
											aria-current={page === currentPage ? "page" : undefined}
											onClick={() => setCurrentPage(page)}
											className={`inline-flex h-8 min-w-8 items-center justify-center rounded border px-1.5 text-[13px] font-medium tabular-nums transition-colors duration-150 ${
												page === currentPage
													? "border-[#0A356A] bg-[#0A356A] text-white hover:border-[#0556B3] hover:bg-[#0556B3]"
													: "border-[#E6E8EA] bg-white text-[#334155] hover:bg-[#F2F3F4]"
											}`}
										>
											{page}
										</button>
									),
								)}
								<button
									type="button"
									onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
									disabled={currentPage === totalPages}
									className="inline-flex h-8 items-center rounded border border-[#E6E8EA] bg-white px-2.5 text-[13px] font-medium text-[#334155] transition-colors duration-150 hover:bg-[#F2F3F4] disabled:pointer-events-none disabled:opacity-40"
								>
									Selanjutnya
								</button>
							</nav>
						)}
					</div>
				)}
			</section>

			{/* Modal Detail Pengajuan */}
			{isDetailOpen && selectedRequest && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/50 p-4 animate-in fade-in duration-200"
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsDetailOpen(false);
					}}
				>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="detail-title"
						className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded border border-[#E6E8EA] bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] animate-in zoom-in-95 fade-in duration-200"
					>
						{/* Header */}
						<div className="flex items-start justify-between gap-3 border-b border-[#E6E8EA] px-5 py-4">
							<div className="min-w-0">
								<h2
									id="detail-title"
									className="text-[14px] font-semibold leading-tight text-[#0F172A]"
								>
									Detail Permintaan Pemakaian
								</h2>
								<p className="mt-0.5 truncate font-mono text-[12px] text-[#64748B]">
									{selectedRequest.request_number}
								</p>
							</div>
							<button
								type="button"
								aria-label="Tutup dialog"
								onClick={() => setIsDetailOpen(false)}
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#64748B] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0F172A]"
							>
								<X className="h-4 w-4" aria-hidden="true" />
							</button>
						</div>

						{/* Body */}
						<div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
							{/* Status */}
							<div className="flex items-center justify-between gap-3">
								<span className="text-[12px] font-medium text-[#64748B]">
									Status Permintaan
								</span>
								<StatusBadge status={selectedRequest.status} />
							</div>

							{/* Equipment Detail */}
							<section>
								<h3 className="text-[13px] font-semibold text-[#0F172A]">
									Informasi Peralatan
								</h3>
								<dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
									<div>
										<dt className="text-[12px] text-[#64748B]">Kode Alat</dt>
										<dd className="mt-0.5 font-mono text-[13px] font-semibold text-[#0A356A]">
											{selectedRequest.equipment_code}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">Nama Alat</dt>
										<dd
											className="mt-0.5 truncate text-[13px] font-semibold text-[#0F172A]"
											title={selectedRequest.equipment_name}
										>
											{selectedRequest.equipment_name}
										</dd>
									</div>
									{selectedRequest.storage_location && (
										<div>
											<dt className="text-[12px] text-[#64748B]">Lokasi Penyimpanan</dt>
											<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A]">
												{selectedRequest.storage_location}
											</dd>
										</div>
									)}
								</dl>
							</section>

							{/* Usage Detail */}
							<section>
								<h3 className="text-[13px] font-semibold text-[#0F172A]">
									Rencana Pemakaian
								</h3>
								<dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
									<div>
										<dt className="text-[12px] text-[#64748B]">Plant Tujuan</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A]">
											{selectedRequest.target_plant}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">Lokasi Pemasangan</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A]">
											{selectedRequest.installation_location}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">Tanggal Mulai</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A] tabular-nums">
											{formatDate(selectedRequest.start_date)}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">
											Perkiraan Cost Avoidance
										</dt>
										<dd className="mt-0.5 text-sm font-semibold text-[#059669] tabular-nums">
											{formatRupiah(selectedRequest.estimated_cost_avoidance)}
										</dd>
									</div>
								</dl>
							</section>

							{/* Justification */}
							<section>
								<h3 className="text-[13px] font-semibold text-[#0F172A]">
									Justifikasi Kebutuhan
								</h3>
								<p className="mt-1.5 text-[13px] leading-relaxed text-[#334155]">
									{selectedRequest.justification}
								</p>
							</section>

							{/* Dokumen Pendukung / Justifikasi Kebutuhan (US-13-FE) */}
							{(() => {
								const supportingDoc =
									selectedRequest.supporting_document ||
									getSavedSupportingDocument(
										selectedRequest.id,
										selectedRequest.request_number,
										selectedRequest.equipment_id,
									);
								if (!supportingDoc) return null;
								const category = getFileCategoryIcon(supportingDoc.fileName);

								return (
									<section>
										<h3 className="text-[13px] font-semibold text-[#0F172A] flex items-center gap-1.5">
											<FileText className="h-4 w-4 text-[#0A356A]" aria-hidden="true" />
											Dokumen Pendukung / Justifikasi Kebutuhan
										</h3>
										<div className="mt-2 flex items-center justify-between rounded-lg border border-[#E6E8EA] bg-[#F8FAFC] p-3 shadow-2xs">
											<div className="flex items-center gap-3 min-w-0 pr-3">
												<div
													className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
														category?.bg || "bg-white border-[#E6E8EA]"
													}`}
												>
													{category?.icon}
												</div>
												<div className="min-w-0">
													<p
														className="text-[13px] font-semibold text-[#0F172A] truncate"
														title={`${supportingDoc.fileName} (${formatFileSize(supportingDoc.fileSize)})`}
													>
														{supportingDoc.fileName}
													</p>
													<p className="text-[11px] text-[#64748B]">
														{formatFileSize(supportingDoc.fileSize)} • Dokumen Justifikasi Kebutuhan
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<a
													href={supportingDoc.fileUrl}
													download={supportingDoc.fileName}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A356A] bg-white border border-[#0A356A]/30 rounded-md hover:bg-[#0A356A]/5 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
												>
													<Download className="w-3.5 h-3.5" />
													Unduh Berkas
												</a>
											</div>
										</div>
									</section>
								);
							})()}

							{/* Informasi Pemasangan di Plant jika sudah INSTALLED atau ada data pemasangan */}
							{(selectedRequest.status === "INSTALLED" || selectedRequest.installed_at) && (
								<section className="rounded border border-[#BAE6FD] bg-[#F0F9FF] p-3.5">
									<h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0369A1]">
										<CheckCircle className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
										Informasi Pemasangan & Operasional
									</h3>
									<dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
										<div>
											<dt className="text-[12px] text-[#64748B]">Tanggal Mulai Operasi</dt>
											<dd className="mt-0.5 text-[13px] font-semibold text-[#0F172A] tabular-nums">
												{formatDate(selectedRequest.installed_at || selectedRequest.start_date)}
											</dd>
										</div>
										<div>
											<dt className="text-[12px] text-[#64748B]">Status Inventaris Alat</dt>
											<dd className="mt-0.5 font-mono text-[12px] font-bold text-[#0284C7]">
												REUSED
											</dd>
										</div>
										{selectedRequest.physical_notes && (
											<div className="sm:col-span-2">
												<dt className="text-[12px] text-[#64748B]">Catatan Kondisi Fisik</dt>
												<dd className="mt-0.5 text-[13px] leading-relaxed text-[#334155]">
													{selectedRequest.physical_notes}
												</dd>
											</div>
										)}
										{selectedRequest.installation_photo && (
											<div className="sm:col-span-2">
												<dt className="text-[12px] text-[#64748B]">Foto Fisik Alat Terpasang</dt>
												<dd className="mt-1.5">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={selectedRequest.installation_photo}
														alt="Foto fisik alat terpasang"
														className="h-36 w-auto max-w-full rounded border border-[#E6E8EA] object-cover shadow-sm"
													/>
												</dd>
											</div>
										)}
									</dl>
								</section>
							)}

							{/* Contact Person */}
							{(Boolean(
								selectedRequest.contact_person &&
									selectedRequest.contact_person !== "-",
							) ||
								Boolean(
									selectedRequest.contact_npp &&
										selectedRequest.contact_npp !== "-",
								) ||
								Boolean(
									selectedRequest.contact_phone &&
										selectedRequest.contact_phone !== "-",
								)) && (
								<section>
									<h3 className="text-[13px] font-semibold text-[#0F172A]">
										Penanggung Jawab
									</h3>
									<dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
										{selectedRequest.contact_person &&
											selectedRequest.contact_person !== "-" && (
												<div>
													<dt className="text-[12px] text-[#64748B]">Nama</dt>
													<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A]">
														{selectedRequest.contact_person}
													</dd>
												</div>
											)}
										{selectedRequest.contact_npp &&
											selectedRequest.contact_npp !== "-" && (
												<div>
													<dt className="text-[12px] text-[#64748B]">NPP</dt>
													<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A] tabular-nums">
														{selectedRequest.contact_npp}
													</dd>
												</div>
											)}
										{selectedRequest.contact_phone &&
											selectedRequest.contact_phone !== "-" && (
												<div>
													<dt className="text-[12px] text-[#64748B]">Kontak / Telepon</dt>
													<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A] tabular-nums">
														{selectedRequest.contact_phone}
													</dd>
												</div>
											)}
									</dl>
								</section>
							)}
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-2 border-t border-[#E6E8EA] px-5 py-3">
							{isUnitKerja && selectedRequest.status === "APPROVED" && (
								<button
									type="button"
									onClick={() => {
										const target = selectedRequest;
										setIsDetailOpen(false);
										handleOpenInstallModal(target);
									}}
									className="inline-flex h-8 items-center gap-1.5 rounded bg-[#059669] px-3 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-[#047857] shadow-sm"
								>
									<CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
									Konfirmasi Pasang
								</button>
							)}
							<button
								type="button"
								onClick={() => setIsDetailOpen(false)}
								className={buttonVariants({ variant: "brandOutline" })}
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi Pemasangan Alat (US-10-FE) */}
			{isInstallModalOpen && selectedForInstall && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/50 p-4 animate-in fade-in duration-200"
					onClick={(e) => {
						if (e.target === e.currentTarget && !isSubmittingInstall) {
							setIsInstallModalOpen(false);
						}
					}}
				>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="install-modal-title"
						className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded border border-[#E6E8EA] bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] animate-in zoom-in-95 fade-in duration-200"
					>
						{/* Header */}
						<div className="flex items-start justify-between gap-3 border-b border-[#E6E8EA] px-5 py-4">
							<div className="min-w-0">
								<h2
									id="install-modal-title"
									className="text-[14px] font-semibold leading-tight text-[#0F172A]"
								>
									Konfirmasi Pemasangan Alat
								</h2>
								<p className="mt-0.5 truncate text-[12px] text-[#64748B]">
									Konfirmasi fisik alat telah diterima dan dioperasikan di plant
								</p>
							</div>
							<button
								type="button"
								aria-label="Tutup dialog"
								disabled={isSubmittingInstall}
								onClick={() => setIsInstallModalOpen(false)}
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#64748B] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0F172A] disabled:opacity-50"
							>
								<X className="h-4 w-4" aria-hidden="true" />
							</button>
						</div>

						{/* Form Content */}
						<form
							onSubmit={handleSubmitInstall}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
								{/* Error Notification */}
								{installError && (
									<div
										role="alert"
										className="rounded border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#DC2626]"
									>
										{installError}
									</div>
								)}

								{/* Ringkasan Aset */}
								<div className="rounded border border-[#E6E8EA] bg-[#F8FAFC] p-3.5">
									<h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
										Ringkasan Aset
									</h3>
									<dl className="mt-2 space-y-2 text-[13px]">
										<div className="flex justify-between">
											<dt className="text-[#64748B]">Nomor Permohonan:</dt>
											<dd className="font-mono font-medium text-[#0F172A]">
												{selectedForInstall.request_number}
											</dd>
										</div>
										<div className="flex justify-between">
											<dt className="text-[#64748B]">Kode & Nama Alat:</dt>
											<dd className="text-right font-semibold text-[#0A356A]">
												{selectedForInstall.equipment_code} -{" "}
												{selectedForInstall.equipment_name}
											</dd>
										</div>
										<div className="flex justify-between">
											<dt className="text-[#64748B]">Lokasi Pemasangan:</dt>
											<dd className="text-right font-medium text-[#0F172A]">
												{selectedForInstall.installation_location} (
												{selectedForInstall.target_plant})
											</dd>
										</div>
									</dl>
								</div>

								{/* Tanggal Mulai Dioperasikan / Terpasang */}
								<div>
									<label
										htmlFor="input-installed-date"
										className="block text-[13px] font-semibold text-[#0F172A]"
									>
										Tanggal Mulai Dioperasikan / Terpasang{" "}
										<span className="text-[#DC2626]">*</span>
									</label>
									<p className="mt-0.5 text-[12px] text-[#64748B]">
										Tanggal fisik peralatan mulai dioperasikan di lokasi plant.
									</p>
									<input
										id="input-installed-date"
										type="date"
										required
										value={installationDate}
										onChange={(e) => setInstallationDate(e.target.value)}
										className="mt-1.5 h-9 w-full rounded border border-[#E6E8EA] bg-white px-3 text-[13px] text-[#0F172A] focus:border-[#0A356A] focus:outline-none focus:ring-1 focus:ring-[#0A356A]"
									/>
								</div>

								{/* Catatan Kondisi Fisik Saat Diterima (Opsional) */}
								<div>
									<label
										htmlFor="input-physical-notes"
										className="block text-[13px] font-semibold text-[#0F172A]"
									>
										Catatan Kondisi Fisik Saat Diterima{" "}
										<span className="text-[12px] font-normal text-[#64748B]">
											(Opsional)
										</span>
									</label>
									<p className="mt-0.5 text-[12px] text-[#64748B]">
										Keterangan kondisi saat serah terima barang dari gudang / Rendal.
									</p>
									<textarea
										id="input-physical-notes"
										rows={3}
										value={physicalNotes}
										onChange={(e) => setPhysicalNotes(e.target.value)}
										placeholder="misal: Alat diterima lengkap dari gudang utama dan sudah running test normal"
										className="mt-1.5 w-full rounded border border-[#E6E8EA] bg-white p-2.5 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0A356A] focus:outline-none focus:ring-1 focus:ring-[#0A356A]"
									/>
								</div>

								{/* Unggah Foto Alat Terpasang (Opsional) */}
								<div>
									<label className="block text-[13px] font-semibold text-[#0F172A]">
										Unggah Foto Alat Terpasang{" "}
										<span className="text-[12px] font-normal text-[#64748B]">
											(Opsional)
										</span>
									</label>
									<p className="mt-0.5 text-[12px] text-[#64748B]">
										Dokumentasi foto fisik alat yang sudah terpasang di lokasi plant.
									</p>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/png,image/jpeg,image/jpg,image/webp"
										onChange={handlePhotoSelect}
										className="hidden"
									/>
									{photoPreview ? (
										<div className="mt-2 flex items-center gap-3 rounded border border-[#E6E8EA] p-2.5">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={photoPreview}
												alt="Pratinjau foto alat terpasang"
												className="h-16 w-16 rounded border border-[#E6E8EA] object-cover"
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate text-[12px] font-medium text-[#0F172A]">
													{photoFile?.name || "Foto Alat Terpasang"}
												</p>
												<p className="text-[11px] text-[#64748B]">
													{photoFile
														? `${(photoFile.size / 1024).toFixed(0)} KB`
														: "Tersedia"}
												</p>
											</div>
											<button
												type="button"
												onClick={handleRemovePhoto}
												className="text-[12px] font-medium text-[#DC2626] hover:underline"
											>
												Hapus
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="mt-1.5 flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-4 text-[13px] font-medium text-[#475569] transition-colors duration-150 hover:bg-[#F1F5F9] hover:text-[#0A356A]"
										>
											<Upload className="h-4 w-4" aria-hidden="true" />
											Pilih Foto Fisik Alat (PNG / JPG, maks. 25MB)
										</button>
									)}
								</div>
							</div>

							{/* Footer */}
							<div className="flex items-center justify-end gap-2.5 border-t border-[#E6E8EA] bg-[#F8FAFC] px-5 py-3">
								<button
									type="button"
									disabled={isSubmittingInstall}
									onClick={() => setIsInstallModalOpen(false)}
									className={buttonVariants({ variant: "brandOutline" })}
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmittingInstall}
									className="inline-flex h-9 items-center gap-2 rounded bg-[#0A356A] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#0556B3] disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSubmittingInstall ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
											Menyimpan...
										</>
									) : (
										<>
											<CheckCircle className="h-4 w-4" aria-hidden="true" />
											Konfirmasi & Aktifkan Aset (REUSED)
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default KonfirmasiPemasanganContent;
