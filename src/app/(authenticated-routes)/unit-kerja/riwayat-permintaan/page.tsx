"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getReuseRequests } from "@/action/api";
import {
	CheckCircle2,
	Search,
	RefreshCw,
	X,
	Loader2,
	ChevronRight,
	AlertCircle,
	XCircle,
	Clock,
	FileText,
	Building,
	MapPin,
	Eye,
	Inbox,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
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
	const [selectedRequest, setSelectedRequest] = useState<ReuseRequestItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	// Notification Toast
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(
		isJustSubmitted
			? {
					type: "success",
					message: "Pengajuan pemakaian peralatan idle berhasil dikirim dan tersimpan di database!",
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

	const loadData = async () => {
		setIsLoading(true);
		try {
			const rawData = await getReuseRequests().catch(() => []);
			const list: ReuseRequestItem[] = (rawData || []).map((r: any) => {
				let targetPlantStr = "Plant PUSRI IB";
				if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
				else if (r.target_plant && typeof r.target_plant === "object")
					targetPlantStr = r.target_plant.name || r.target_plant.plant || "Plant PUSRI IB";
				else if (typeof r.targetPlant === "string") targetPlantStr = r.targetPlant;

				let installLocStr = "Area Pabrik Utama";
				if (typeof r.installation_location === "string") installLocStr = r.installation_location;
				else if (r.installation_location && typeof r.installation_location === "object")
					installLocStr = r.installation_location.name || "Area Pabrik Utama";

				const statusUpper = String(
					r.status || r.approval_status || r.approvalStatus || "PENDING",
				).toUpperCase();

				let finalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" = "PENDING";
				if (statusUpper.includes("APPROVED") || statusUpper.includes("DISETUJUI")) {
					finalStatus = "APPROVED";
				} else if (statusUpper.includes("REJECT") || statusUpper.includes("DITOLAK")) {
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
					request_number: String(r.request_number || r.requestNumber || `REQ-REUSE-${r.id}`),
					equipment_id: String(r.equipment_id || r.equipmentId || ""),
					equipment_code: String(
						r.equipment_code || r.equipmentCode || r.equipment?.equipment_code || "P-III-MOT-010",
					),
					equipment_name: String(
						r.equipment_name || r.equipmentName || r.equipment?.name || "Electric Motor 200kW",
					),
					installation_location: installLocStr,
					requesting_unit: installLocStr,
					target_plant: targetPlantStr,
					start_date: cleanDate,
					end_date: r.end_date || r.endDate ? String(r.end_date || r.endDate).split("T")[0] : undefined,
					justification: typeof r.justification === "string" ? r.justification : "Kebutuhan operasional unit kerja.",
					estimated_cost_avoidance: Number(r.estimated_cost_avoidance || r.estimatedCostAvoidance) || 150000000,
					contact_person: typeof r.contact_person === "string" ? r.contact_person : "Budi Santoso",
					contact_npp: String(r.contact_npp || r.contactNpp || "100002"),
					contact_phone: String(r.contact_phone || r.contactPhone || "0812-7890-1122"),
					status: finalStatus,
					created_at: cleanDate,
				};
			});

			setItems(list);
		} catch (err) {
			console.error("Error loading reuse requests:", err);
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	};

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
				<ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />
			);
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		) : (
			<ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		);
	};

	// Filtering & Sorting
	const filteredItems = useMemo(() => {
		let result = items.filter((item) => {
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

	const handleSearch = () => setSearchQuery(searchInput);

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setStatusFilter("SEMUA");
		setCurrentPage(1);
		setSortConfig({ key: "created_at", direction: "desc" });
	};

	const formatRupiah = (val?: number) => {
		if (!val) return "Rp 0";
		return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
	};

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			APPROVED: "bg-[#DCFCE7] text-[#16A34A]",
			REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
			IN_REVIEW: "bg-[#FEF3C7] text-[#B45309]",
			PENDING: "bg-[#FEF3C7] text-[#B45309]",
		};
		const labels: Record<string, string> = {
			APPROVED: "Disetujui",
			REJECTED: "Ditolak",
			IN_REVIEW: "Menunggu Persetujuan",
			PENDING: "Menunggu Persetujuan",
		};
		return (
			<span
				className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${styles[status] || styles.PENDING}`}
			>
				{labels[status] || "Menunggu Persetujuan"}
			</span>
		);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					) : (
						<XCircle className="w-4 h-4 text-red-400" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Unit Kerja Operasi</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Riwayat Permintaan</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Riwayat Permintaan Pemakaian Aset
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar riwayat dan status persetujuan pengajuan penggunaan kembali peralatan idle oleh Unit Kerja Operasi.
						</p>
					</div>
					<button
						onClick={loadData}
						disabled={isLoading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Stat Cards Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
				<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between text-gray-500 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider">Total</span>
						<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0A356A]">
							<FileText className="w-4 h-4" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-bold text-gray-900">{stats.total}</span>
						<span className="text-[11px] text-gray-500 block mt-0.5">Pengajuan</span>
					</div>
				</div>

				<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between text-amber-600 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider">Menunggu</span>
						<div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
							<Clock className="w-4 h-4" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-bold text-amber-700">{stats.pending + stats.inReview}</span>
						<span className="text-[11px] text-gray-500 block mt-0.5">Menunggu Persetujuan</span>
					</div>
				</div>

				<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between text-emerald-600 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider">Disetujui</span>
						<div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
							<CheckCircle2 className="w-4 h-4" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-bold text-emerald-700">{stats.approved}</span>
						<span className="text-[11px] text-gray-500 block mt-0.5">Siap Dipakai</span>
					</div>
				</div>

				<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between text-red-600 mb-2">
						<span className="text-xs font-semibold uppercase tracking-wider">Ditolak</span>
						<div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
							<XCircle className="w-4 h-4" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-bold text-red-700">{stats.rejected}</span>
						<span className="text-[11px] text-gray-500 block mt-0.5">Ditolak</span>
					</div>
				</div>
			</div>

			{/* Main Content Area (Tabel) */}
			<div
				id="riwayat-table-container"
				className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4"
			>
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
									setSearchQuery(e.target.value);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={handleSearch}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[150px] cursor-pointer"
						>
							<option value="SEMUA">Semua Status</option>
							<option value="PENDING">Menunggu Persetujuan</option>
							<option value="APPROVED">Disetujui</option>
							<option value="REJECTED">Ditolak</option>
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						{/* Reset Button */}
						<button
							onClick={handleReset}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				{/* Table */}
			<div className="overflow-x-hidden">
				<table className="w-full text-left border-collapse table-fixed">
					<thead className="bg-gray-50/95 backdrop-blur-sm">
						<tr className="border-b border-gray-300">
							<th className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">
								No
							</th>
							<th
								className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left w-[140px]"
								onClick={() => handleSort("request_number")}
							>
								<div className="flex items-center justify-start">
									No. Pengajuan {getSortIcon("request_number")}
								</div>
							</th>
							<th
								className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
								onClick={() => handleSort("equipment_name")}
							>
								<div className="flex items-center justify-start">
									Nama Alat {getSortIcon("equipment_name")}
								</div>
							</th>
							<th
								className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left w-[100px]"
								onClick={() => handleSort("target_plant")}
							>
								<div className="flex items-center justify-start">
									Plant {getSortIcon("target_plant")}
								</div>
							</th>
							<th
								className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-center w-[100px]"
								onClick={() => handleSort("start_date")}
							>
								<div className="flex items-center justify-center">
									Tgl Permintaan {getSortIcon("start_date")}
								</div>
							</th>
							<th className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center w-[140px]">
								Status
							</th>
							<th className="px-2.5 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center w-[90px]">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{isLoading ? (
							<tr>
								<td colSpan={7} className="px-5 py-12 text-center text-gray-500">
									<div className="flex flex-col items-center gap-2">
										<Loader2 className="w-6 h-6 animate-spin text-[#0A356A]" />
										<p className="text-[13px] font-medium">Memuat data riwayat pengajuan...</p>
									</div>
								</td>
							</tr>
						) : paginatedItems.length === 0 ? (
							<tr>
								<td colSpan={7} className="px-5 py-12 text-center text-gray-500">
									<div className="flex flex-col items-center">
										<Inbox className="w-8 h-8 text-gray-300 mb-2" />
										<p className="text-[13px] font-medium text-gray-900">Belum Ada Riwayat Permintaan</p>
										<p className="text-[11px] text-gray-500 mt-1">
											Pengajuan peminjaman peralatan idle yang dibuat akan muncul di sini.
										</p>
									</div>
								</td>
							</tr>
						) : (
							paginatedItems.map((item, index) => {
								const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
								return (
									<tr
										key={item.id}
										className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
									>
										<td className="px-2.5 py-2 text-[12px] text-gray-500 font-medium text-center">
											{rowNum}
										</td>
										<td className="px-2.5 py-2 text-[12px] font-semibold text-[#0A356A] text-left break-all">
											{item.request_number}
										</td>
										<td className="px-2.5 py-2 text-[12px] font-semibold text-gray-800 text-left" title={item.equipment_name}>
											<span className="leading-tight line-clamp-2 block">
												{item.equipment_name}
											</span>
										</td>
										<td className="px-2.5 py-2 text-[12px] text-gray-600 font-medium text-left">
											<span className="line-clamp-2 block">{item.target_plant}</span>
										</td>
										<td className="px-2.5 py-2 text-[12px] text-gray-600 font-medium text-center whitespace-nowrap">
											{item.start_date}
										</td>
										<td className="px-2.5 py-2 text-center">
											{getStatusBadge(item.status)}
										</td>
										<td className="px-2.5 py-2 text-center whitespace-nowrap">
											<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
												<button
													title="Detail Info"
													onClick={() => {
														setSelectedRequest(item);
														setIsDetailOpen(true);
													}}
													className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 px-2 rounded-md transition-colors flex items-center gap-1"
												>
													<Eye className="w-3.5 h-3.5" />
													<span className="text-[11px] font-bold">Detail</span>
												</button>
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
				{!isLoading && filteredItems.length > 0 && (
					<div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
						<span className="text-gray-500 font-medium">
							Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} data
						</span>
						<div className="flex items-center gap-1">
							<button
								onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								disabled={currentPage === 1}
								className="px-2.5 py-1 border border-gray-200 rounded hover:bg-white disabled:opacity-40"
							>
								Sebelumnya
							</button>
							<span className="px-3 py-1 font-bold text-[#0A356A]">
								{currentPage} / {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-2.5 py-1 border border-gray-200 rounded hover:bg-white disabled:opacity-40"
							>
								Selanjutnya
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Detail Pengajuan */}
			{isDetailOpen && selectedRequest && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<FileText className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white">Detail Permintaan Pemakaian</h2>
									<p className="text-xs text-blue-100">{selectedRequest.request_number}</p>
								</div>
							</div>
							<button
								onClick={() => setIsDetailOpen(false)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Body */}
						<div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 text-xs">
							{/* Status Badge Info */}
							<div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
								<span className="font-bold text-gray-700">Status Permintaan:</span>
								{getStatusBadge(selectedRequest.status)}
							</div>

							{/* Equipment Detail */}
							<div className="space-y-2">
								<h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Informasi Peralatan</h3>
								<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 grid grid-cols-2 gap-2">
									<div>
										<p className="text-gray-500">Kode Alat:</p>
										<p className="font-bold text-[#0A356A]">{selectedRequest.equipment_code}</p>
									</div>
									<div>
										<p className="text-gray-500">Nama Alat:</p>
										<p className="font-bold text-gray-800 truncate">{selectedRequest.equipment_name}</p>
									</div>
								</div>
							</div>

							{/* Usage Detail */}
							<div className="space-y-2">
								<h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Rencana Pemakaian</h3>
								<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
									<div className="grid grid-cols-2 gap-2">
										<div>
											<p className="text-gray-500">Plant Tujuan:</p>
											<p className="font-semibold text-gray-800">{selectedRequest.target_plant}</p>
										</div>
										<div>
											<p className="text-gray-500">Lokasi Pemasangan:</p>
											<p className="font-semibold text-gray-800">{selectedRequest.installation_location}</p>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-2">
										<div>
											<p className="text-gray-500">Tanggal Mulai:</p>
											<p className="font-semibold text-gray-800">{selectedRequest.start_date}</p>
										</div>
										<div>
											<p className="text-gray-500">Cost Avoidance:</p>
											<p className="font-bold text-emerald-700">{formatRupiah(selectedRequest.estimated_cost_avoidance)}</p>
										</div>
									</div>
								</div>
							</div>

							{/* Justification */}
							<div className="space-y-1">
								<h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Justifikasi Kebutuhan</h3>
								<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-gray-700 leading-normal">
									{selectedRequest.justification}
								</div>
							</div>

							{/* Contact Person */}
							<div className="space-y-1">
								<h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Penanggung Jawab</h3>
								<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 grid grid-cols-3 gap-2">
									<div>
										<p className="text-gray-500">Nama:</p>
										<p className="font-semibold text-gray-800">{selectedRequest.contact_person}</p>
									</div>
									<div>
										<p className="text-gray-500">NPP:</p>
										<p className="font-semibold text-gray-800">{selectedRequest.contact_npp}</p>
									</div>
									<div>
										<p className="text-gray-500">Telepon:</p>
										<p className="font-semibold text-gray-800">{selectedRequest.contact_phone}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
							<button
								onClick={() => setIsDetailOpen(false)}
								className="px-4 py-1.5 bg-gray-800 text-white font-medium text-xs rounded-lg hover:bg-gray-900 transition-colors"
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
		<Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Memuat data...</div>}>
			<RiwayatPermintaanContent />
		</Suspense>
	);
}
