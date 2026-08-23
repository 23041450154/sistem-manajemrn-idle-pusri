"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getReuseRequests } from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import {
	CheckCircle2,
	ChevronRight,
	Clock,
	Eye,
	FileText,
	Inbox,
	RefreshCw,
	Search,
	X,
	XCircle,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
} from "lucide-react";

interface ReuseRequestItem {
	id: string;
	request_number: string;
	equipment_id: string;
	equipment_code: string;
	equipment_name: string;
	requesting_unit: string;
	installation_location: string;
	target_plant: string;
	start_date: string;
	end_date?: string;
	justification: string;
	estimated_cost_avoidance?: number;
	contact_person: string;
	contact_npp?: string;
	contact_phone?: string;
	status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
	created_at: string;
}

/* DESIGN.md status hues: four workflow states mapped onto the locked five-hue
   system. Colour is carried by border + text, never a filled pastel chip. */
const STATUS_META: Record<
	ReuseRequestItem["status"],
	{ label: string; color: string }
> = {
	PENDING: { label: "Menunggu Validasi", color: "#0556B3" },
	IN_REVIEW: { label: "Dalam Peninjauan", color: "#B45309" },
	APPROVED: { label: "Disetujui", color: "#059669" },
	REJECTED: { label: "Ditolak", color: "#DC2626" },
};

function StatusBadge({ status }: { status: ReuseRequestItem["status"] }) {
	const meta = STATUS_META[status] ?? STATUS_META.PENDING;
	return (
		<span
			className="inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-semibold"
			style={{ borderColor: meta.color, color: meta.color }}
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

function formatDate(iso: string) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return new Intl.DateTimeFormat("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(d);
}

function RiwayatPermintaanContent() {
	const searchParams = useSearchParams();
	const isJustSubmitted = searchParams.get("submitted") === "true";

	const [items, setItems] = useState<ReuseRequestItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
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
		loadData();
	}, []);

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

	async function loadData() {
		setIsLoading(true);
		try {
			const rawData = await getReuseRequests().catch(() => []);
			const list: ReuseRequestItem[] = (rawData || []).map((r: any) => {
				let targetPlantStr = "Plant PUSRI IB";
				if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
				else if (r.target_plant && typeof r.target_plant === "object")
					targetPlantStr =
						r.target_plant.name || r.target_plant.plant || "Plant PUSRI IB";
				else if (typeof r.targetPlant === "string") targetPlantStr = r.targetPlant;

				let installLocStr = "Area Pabrik Utama";
				if (typeof r.installation_location === "string")
					installLocStr = r.installation_location;
				else if (
					r.installation_location &&
					typeof r.installation_location === "object"
				)
					installLocStr = r.installation_location.name || "Area Pabrik Utama";

				const statusUpper = String(
					r.status || r.approval_status || r.approvalStatus || "PENDING",
				).toUpperCase();

				let finalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" =
					"PENDING";
				if (statusUpper.includes("APPROVED") || statusUpper.includes("DISETUJUI")) {
					finalStatus = "APPROVED";
				} else if (
					statusUpper.includes("REJECT") ||
					statusUpper.includes("DITOLAK")
				) {
					finalStatus = "REJECTED";
				} else if (statusUpper.includes("REVIEW")) {
					finalStatus = "IN_REVIEW";
				}

				const rawDate =
					r.start_date ||
					r.startDate ||
					r.reuse_date ||
					r.reuseDate ||
					r.created_at ||
					r.createdAt;

				let cleanDate = new Date().toISOString().split("T")[0];
				if (rawDate) {
					const s = String(rawDate);
					cleanDate = s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
				}

				return {
					id: String(r.id),
					request_number: String(
						r.request_number || r.requestNumber || `REQ-REUSE-${r.id}`,
					),
					equipment_id: String(r.equipment_id || r.equipmentId || ""),
					equipment_code: String(
						r.equipment_code || r.equipmentCode || r.equipment?.equipment_code || "-",
					),
					equipment_name: String(
						r.equipment_name || r.equipmentName || r.equipment?.name || "-",
					),
					installation_location: installLocStr,
					requesting_unit: installLocStr,
					target_plant: targetPlantStr,
					start_date: cleanDate,
					end_date:
						r.end_date || r.endDate
							? String(r.end_date || r.endDate).split("T")[0]
							: undefined,
					justification:
						typeof r.justification === "string"
							? r.justification
							: "Kebutuhan operasional unit kerja.",
					estimated_cost_avoidance:
						Number(r.estimated_cost_avoidance || r.estimatedCostAvoidance) ||
						undefined,
					contact_person:
						typeof r.contact_person === "string" ? r.contact_person : "-",
					contact_npp: String(r.contact_npp || r.contactNpp || "-"),
					contact_phone: String(r.contact_phone || r.contactPhone || "-"),
					status: finalStatus,
					created_at: cleanDate,
				};
			});

			setItems(list);
		} catch (err) {
			console.error("Error loading reuse requests:", err);
			setItems([]);
			setNotification({
				type: "error",
				message: "Gagal memuat riwayat permintaan.",
			});
		} finally {
			setIsLoading(false);
		}
	}

	// Statistics
	const stats = useMemo(() => {
		const total = items.length;
		const pending = items.filter((i) => i.status === "PENDING").length;
		const inReview = items.filter((i) => i.status === "IN_REVIEW").length;
		const approved = items.filter((i) => i.status === "APPROVED").length;
		const rejected = items.filter((i) => i.status === "REJECTED").length;
		return { total, pending, inReview, approved, rejected };
	}, [items]);

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
				item.installation_location.toLowerCase().includes(q);

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
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
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

	// DESIGN.md KPI card: one style, value-dominant, state carried by a 2px left rule.
	const kpis = [
		{
			label: "Total Pengajuan",
			value: stats.total,
			caption: "Seluruh riwayat",
			rule: "#334155",
			icon: FileText,
		},
		{
			label: "Menunggu Validasi",
			value: stats.pending,
			caption: "Belum ditinjau",
			rule: "#0556B3",
			icon: Clock,
		},
		{
			label: "Dalam Peninjauan",
			value: stats.inReview,
			caption: "Sedang diperiksa",
			rule: "#B45309",
			icon: Eye,
		},
		{
			label: "Disetujui",
			value: stats.approved,
			caption: "Siap dipakai",
			rule: "#059669",
			icon: CheckCircle2,
		},
		{
			label: "Ditolak",
			value: stats.rejected,
			caption: "Tidak disetujui",
			rule: "#DC2626",
			icon: XCircle,
		},
	];

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
						<span className="font-medium text-[#0A356A]">Riwayat Permintaan</span>
					</nav>
					<h1 className="page-title">Riwayat Permintaan Pemakaian Aset</h1>
					<p className="page-subtitle">
						Status persetujuan pengajuan penggunaan kembali peralatan idle.
					</p>
				</div>
				<div className="header-actions">
					<button
						type="button"
						onClick={loadData}
						disabled={isLoading}
						className={buttonVariants({ variant: "brandOutline" })}
					>
						<RefreshCw
							data-icon="inline-start"
							className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						Muat Ulang
					</button>
				</div>
			</header>

			{/* KPI Strip */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						className="flex items-start justify-between gap-3 rounded border border-[#E6E8EA] border-l-2 bg-white p-4"
						style={{ borderLeftColor: kpi.rule }}
					>
						<div className="min-w-0">
							<p className="truncate text-[12px] font-medium text-[#64748B]">
								{kpi.label}
							</p>
							<p className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.02em] text-[#0F172A] tabular-nums">
								{kpi.value}
							</p>
							<p className="mt-1.5 text-[12px] text-[#64748B]">{kpi.caption}</p>
						</div>
						<kpi.icon
							className="mt-0.5 h-4 w-4 shrink-0"
							style={{ color: kpi.rule }}
							aria-hidden="true"
						/>
					</div>
				))}
			</div>

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
							<option value="APPROVED">Disetujui</option>
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
					<table className="w-full min-w-[900px] table-fixed border-collapse text-left">
						<thead>
							<tr className="border-b border-[#E6E8EA] bg-[#F2F3F4]">
								<th
									scope="col"
									className="w-12 px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									No
								</th>
								{sortableTh("request_number", "No. Pengajuan", "left", "w-[160px]")}
								{sortableTh("equipment_name", "Nama Alat", "left")}
								{sortableTh("target_plant", "Plant", "left", "w-[150px]")}
								{sortableTh("start_date", "Tgl Permintaan", "center", "w-[130px]")}
								<th
									scope="col"
									className="w-[145px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Status
								</th>
								<th
									scope="col"
									className="w-[100px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#E6E8EA]">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-4 py-3">
										<div className="space-y-3" aria-hidden="true">
											{Array.from({ length: 6 }).map((_, i) => (
												<div
													key={i}
													className="h-9 animate-pulse rounded-sm bg-[#F2F3F4]"
													style={{ animationDelay: `${i * 60}ms` }}
												/>
											))}
										</div>
										<span className="sr-only">Memuat riwayat permintaan...</span>
									</td>
								</tr>
							) : paginatedItems.length === 0 ? (
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
											<td className="px-4 py-2.5">
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
												<button
													type="button"
													title="Lihat detail"
													aria-label={`Lihat detail ${item.request_number}`}
													onClick={() => {
														setSelectedRequest(item);
														setIsDetailOpen(true);
													}}
													className="inline-flex h-11 items-center gap-1.5 rounded px-2 text-[13px] font-medium text-[#334155] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0A356A]"
												>
													<Eye className="h-4 w-4" aria-hidden="true" />
													Detail
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{!isLoading && filteredItems.length > 0 && (
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

							{/* Contact Person */}
							<section>
								<h3 className="text-[13px] font-semibold text-[#0F172A]">
									Penanggung Jawab
								</h3>
								<dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
									<div>
										<dt className="text-[12px] text-[#64748B]">Nama</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A]">
											{selectedRequest.contact_person}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">NPP</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A] tabular-nums">
											{selectedRequest.contact_npp}
										</dd>
									</div>
									<div>
										<dt className="text-[12px] text-[#64748B]">Telepon</dt>
										<dd className="mt-0.5 text-[13px] font-medium text-[#0F172A] tabular-nums">
											{selectedRequest.contact_phone}
										</dd>
									</div>
								</dl>
							</section>
						</div>

						{/* Footer */}
						<div className="flex justify-end border-t border-[#E6E8EA] px-5 py-3">
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
		</div>
	);
}

export default function RiwayatPermintaanPage() {
	return (
		<Suspense
			fallback={
				<div className="p-6 text-[13px] text-[#64748B]">Memuat data...</div>
			}
		>
			<RiwayatPermintaanContent />
		</Suspense>
	);
}
