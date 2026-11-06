"use client";

import React, { useState, useMemo } from "react";
import {
	Search,
	RefreshCw,
	Wrench,
	Eye,
	X,
	Building2,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	CheckCircle2,
	XCircle,
	AlertCircle,
	FileText,
	Receipt,
} from "lucide-react";
import { assignEquipmentRepair } from "@/action/api";
import {
	formatRupiah,
	formatRupiahInput,
	parseRupiahInput,
	COMMON_REPAIR_VENDORS,
	type RepairAuditLogEntry,
} from "@/lib/repair-assignment";
import { useAuth } from "@/components/AuthProvider";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PerbaikanItem {
	id: string;
	repairId?: number;
	equipmentId: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	lokasiSimpan: string;
	statusAset: string;
	biayaRiil: number;
	estimasiBiaya: number;
	selisihBiaya: number;
	persenSelisih: number;
	statusAnggaran: "HEMAT" | "SESUAI" | "OVER_BUDGET" | "BELUM_DIANGGARKAN";
	pelaksana: "INTERNAL" | "VENDOR";
	namaVendor: string;
	nomorKontrak?: string;
	rekomendasi?: string;
	workDescription: string;
	notes: string;
	startAt?: string;
	endAt?: string;
	repairAssignedAt?: string;
	repairAssignedBy?: string;
	history?: RepairAuditLogEntry[];
	bookValue?: number;
	originalValue?: number;
	estimatedReuseValue?: number;
	hasAssignment: boolean;
}

interface RendalPerbaikanClientProps {
	antreanItems: PerbaikanItem[];
	riwayatItems: PerbaikanItem[];
	plants?: any[];
	loading?: boolean;
	onRefresh: () => Promise<void> | void;
}

const ITEMS_PER_PAGE = 10;

function formatDate(dateStr?: string | null): string {
	if (!dateStr) return "-";
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return new Intl.DateTimeFormat("id-ID", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(d);
	} catch {
		return dateStr || "-";
	}
}

export default function RendalPerbaikanClient({
	antreanItems,
	riwayatItems,
	plants = [],
	loading = false,
	onRefresh,
}: RendalPerbaikanClientProps) {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");

	// Search & Filter States
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [plantFilter, setPlantFilter] = useState("Semua");
	const [pelaksanaFilter, setPelaksanaFilter] = useState("Semua");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof PerbaikanItem;
		direction: "asc" | "desc";
	} | null>(null);

	// Notification State
	const [notification, setNotification] = useState<{
		type: "success" | "error" | "warning";
		message: string;
	} | null>(null);

	// Modal Penugasan Perbaikan (Formulir Aksi POST)
	const [assignModalItem, setAssignModalItem] = useState<PerbaikanItem | null>(null);
	const [refurbishmentCostInput, setRefurbishmentCostInput] = useState("");
	const [repairExecutor, setRepairExecutor] = useState<"INTERNAL" | "VENDOR" | null>(null);
	const [vendorName, setVendorName] = useState("");
	const [contractNumber, setContractNumber] = useState("");
	const [workNotes, setWorkNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formErrors, setFormErrors] = useState<{
		cost?: string;
		executor?: string;
		vendor?: string;
	}>({});

	// Modal Detail Info
	const [selectedDetail, setSelectedDetail] = useState<PerbaikanItem | null>(null);

	// Toast auto-dismiss
	const showToast = (type: "success" | "error" | "warning", message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 4500);
	};

	// Open Assign Repair Modal
	const handleOpenAssignModal = (item: PerbaikanItem) => {
		setAssignModalItem(item);
		// Default Rp 0 / kosong agar di-input fresh oleh Staf Rendal
		setRefurbishmentCostInput("");
		// Pelaksana tidak langsung tercentang otomatis
		setRepairExecutor(null);
		setVendorName("");
		setContractNumber("");
		// Catatan tidak langsung terisi otomatis
		setWorkNotes("");
		setFormErrors({});
	};

	const handleCloseAssignModal = () => {
		setAssignModalItem(null);
		setFormErrors({});
	};

	// Validate Assign Form
	const validateAssignForm = (): boolean => {
		const errors: { cost?: string; executor?: string; vendor?: string } = {};
		const costNum = parseRupiahInput(refurbishmentCostInput);

		if (!costNum || costNum <= 0) {
			errors.cost = "Biaya perbaikan riil wajib diisi dengan nilai lebih dari 0.";
		}

		if (!repairExecutor) {
			errors.executor = "Pilihan pelaksana perbaikan wajib dipilih (Internal Pusri atau Pihak Ketiga).";
		} else if (repairExecutor === "VENDOR") {
			if (!vendorName || !vendorName.trim()) {
				errors.vendor = "Nama rekanan / vendor pihak ketiga wajib diisi.";
			}
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Submit Penugasan Perbaikan (POST action)
	const handleSubmitAssign = async () => {
		if (!assignModalItem) return;
		if (!validateAssignForm()) return;
		if (!repairExecutor) return;

		setIsSubmitting(true);
		try {
			const costNum = parseRupiahInput(refurbishmentCostInput);
			const executorLabel =
				repairExecutor === "INTERNAL"
					? "Internal Pemeliharaan Lapangan"
					: `Vendor (${vendorName.trim()})`;

			const payload = {
				equipmentId: assignModalItem.equipmentId,
				refurbishmentCost: costNum,
				executor: repairExecutor,
				vendorName: repairExecutor === "VENDOR" ? vendorName.trim() : undefined,
				contractNumber: repairExecutor === "VENDOR" ? contractNumber.trim() : undefined,
				workNotes: workNotes.trim() || undefined,
				existingNotes: assignModalItem.notes || undefined,
				assignedBy: user?.name || "Staf Rendal Pemeliharaan",
			};

			const result = await assignEquipmentRepair(assignModalItem.equipmentId, payload);

			if (result.success) {
				showToast(
					"success",
					`Perintah perbaikan berhasil diterbitkan kepada ${executorLabel}.`,
				);
				handleCloseAssignModal();
				await onRefresh();
				setActiveTab("riwayat");
				setCurrentPage(1);
			} else {
				showToast("error", result.message || "Gagal menerbitkan penugasan perbaikan.");
			}
		} catch (error) {
			console.error("Submit repair assignment error:", error);
			showToast("error", "Terjadi kesalahan saat memproses penugasan perbaikan.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Plant options from master plants & items
	const plantOptions = useMemo(() => {
		const list = new Set<string>();
		[...antreanItems, ...riwayatItems].forEach((it) => {
			if (it.plant && it.plant !== "-") list.add(it.plant);
		});
		plants.forEach((p: any) => {
			const name = p.name || p.plant_name || p.description;
			if (name) list.add(name);
		});
		return Array.from(list).sort();
	}, [antreanItems, riwayatItems, plants]);

	// Current list based on active tab
	const currentList = activeTab === "antrean" ? antreanItems : riwayatItems;

	// Filtered items
	const filteredItems = useMemo(() => {
		let list = currentList.filter((item) => {
			const matchPlant = plantFilter === "Semua" || item.plant === plantFilter;
			const matchPelaksana =
				pelaksanaFilter === "Semua" || item.pelaksana === pelaksanaFilter;

			const q = search.toLowerCase().trim();
			const matchSearch =
				!q ||
				item.kodeAlat.toLowerCase().includes(q) ||
				item.namaAlat.toLowerCase().includes(q) ||
				item.lokasiSimpan.toLowerCase().includes(q) ||
				item.namaVendor.toLowerCase().includes(q);

			return matchPlant && matchPelaksana && matchSearch;
		});

		if (sortConfig !== null) {
			list = [...list].sort((a, b) => {
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return list;
	}, [currentList, plantFilter, pelaksanaFilter, search, sortConfig]);

	// Pagination
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	// Sorting helpers
	const handleSort = (key: keyof PerbaikanItem) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: keyof PerbaikanItem) => {
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

	// Reset Filters
	const resetFilter = () => {
		setSearchInput("");
		setSearch("");
		setPlantFilter("Semua");
		setPelaksanaFilter("Semua");
		setCurrentPage(1);
		setSortConfig(null);
	};

	// Status Badge helper (matching validasi inspeksi rounded-full style)
	const getStatusBadge = (status: string) => {
		const upper = (status || "").toUpperCase();
		if (upper.includes("COMPLETED")) {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#CCFBF1] text-[#0F766E]">
					REPAIR COMPLETED
				</span>
			);
		}
		if (upper.includes("VENDOR")) {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEF3C7] text-[#B45309]">
					PERBAIKAN VENDOR
				</span>
			);
		}
		if (upper.includes("REPAIR") || upper.includes("PERBAIKAN")) {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEF3C7] text-[#B45309]">
					REPAIR
				</span>
			);
		}
		if (upper.includes("VALIDATED") || upper.includes("READY")) {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
					{status}
				</span>
			);
		}
		return (
			<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#E0F2FE] text-[#0284C7]">
				{status}
			</span>
		);
	};

	const getRecommendationBadge = (rekomendasi?: string) => {
		const raw = rekomendasi || "Perbaikan Ringan";
		const isReady = raw.toLowerCase().includes("siap") || raw.toLowerCase().includes("layak");
		const isHeavy = raw.toLowerCase().includes("berat");
		const isMedium = raw.toLowerCase().includes("sedang");

		// Sederhanakan "Perbaikan Ringan / Overhaul" -> "Perbaikan Ringan" agar pas di badge tabel tanpa terpotong
		const label = raw.replace(/\s*\/\s*overhaul/i, "");

		if (isReady) {
			return (
				<span
					className="inline-flex items-center justify-center text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap"
					title={raw}
				>
					{label}
				</span>
			);
		}

		return (
			<span
				className={`inline-flex items-center justify-center text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
					isHeavy
						? "text-rose-800 bg-rose-50 border-rose-200"
						: isMedium
							? "text-amber-800 bg-amber-50 border-amber-200"
							: "text-amber-800 bg-amber-50 border-amber-200"
				}`}
				title={raw}
			>
				{label}
			</span>
		);
	};

	return (
		<div className="w-full space-y-4">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-white text-[#0F172A] px-5 py-3 rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-[#059669]" />
					) : notification.type === "warning" ? (
						<AlertCircle className="w-4 h-4 text-[#D97706]" />
					) : (
						<XCircle className="w-4 h-4 text-[#DC2626]" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
				</div>
			)}

			{/* Main Content Area (Tabel persis seperti di Validasi Inspeksi) */}
			<div className="bg-white border border-gray-200 rounded overflow-hidden">
				{/* Tab Navigation */}
				<div className="flex items-center border-b border-gray-200 px-5 pt-3 bg-white gap-6">
					<button
						type="button"
						onClick={() => {
							setActiveTab("antrean");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 ${
							activeTab === "antrean"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Antrean Perbaikan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "antrean"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{antreanItems.length}
						</span>
					</button>

					<button
						type="button"
						onClick={() => {
							setActiveTab("riwayat");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 ${
							activeTab === "riwayat"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Riwayat Perbaikan & Biaya</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "riwayat"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{riwayatItems.length}
						</span>
					</button>
				</div>

				{/* Toolbar / Filters (Sama dengan Validasi Inspeksi) */}
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
									setSearch(e.target.value);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							type="button"
							onClick={() => setSearch(searchInput)}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded hover:bg-[#0556B3] transition-colors whitespace-nowrap"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={plantFilter}
							onChange={(e) => {
								setPlantFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="Semua">Semua Plant</option>
							{plantOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>

						<select
							value={pelaksanaFilter}
							onChange={(e) => {
								setPelaksanaFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[140px] cursor-pointer"
						>
							<option value="Semua">Semua Pelaksana</option>
							<option value="INTERNAL">Internal Pusri</option>
							<option value="VENDOR">Vendor Pihak Ketiga</option>
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

						{/* Reset Button */}
						<button
							type="button"
							onClick={resetFilter}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				{/* Table (Desain terkalibrasi agar tidak horizontal scroll & tidak terpotong) */}
				<div className="w-full overflow-x-auto">
					<table className="w-full table-fixed text-center border-collapse">
						<colgroup>
							{activeTab === "antrean" ? (
								<>
									<col className="w-[4%]" />
									<col className="w-[20%]" />
									<col className="w-[11%]" />
									<col className="w-[6%]" />
									<col className="w-[11%]" />
									<col className="w-[13%]" />
									<col className="w-[12%]" />
									<col className="w-[9%]" />
									<col className="w-[14%]" />
								</>
							) : (
								<>
									<col className="w-[3.5%]" />
									<col className="w-[18%]" />
									<col className="w-[10%]" />
									<col className="w-[5.5%]" />
									<col className="w-[10%]" />
									<col className="w-[13%]" />
									<col className="w-[11%]" />
									<col className="w-[11%]" />
									<col className="w-[8%]" />
									<col className="w-[10%]" />
								</>
							)}
						</colgroup>
						<thead className="bg-[#F2F3F4]">
							<tr className="border-b border-gray-300">
								<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center">
									No
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("namaAlat")}
								>
									<div className="flex items-center justify-start gap-1">
										<span>Nama Alat</span>
										{getSortIcon("namaAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-center"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("kodeAlat")}
								>
									<div className="flex items-center justify-center gap-1">
										<span>Kode Alat</span>
										{getSortIcon("kodeAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-center"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-center gap-1">
										<span>Plant</span>
										{getSortIcon("plant")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-center"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("lokasiSimpan")}
								>
									<div className="flex items-center justify-center gap-1">
										<span>Lokasi</span>
										{getSortIcon("lokasiSimpan")}
									</div>
								</th>
								{activeTab === "antrean" ? (
									<>
										<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center" title="Rekomendasi Tindak Lanjut Inspeksi">
											<span>Rekomendasi</span>
										</th>
										<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-right" title="Estimasi Biaya">
											<span>Estimasi Biaya</span>
										</th>
									</>
								) : (
									<>
										<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center" title="Pelaksana Perbaikan">
											<span>Pelaksana</span>
										</th>
										<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-right" title="Estimasi Biaya">
											<span>Estimasi Biaya</span>
										</th>
										<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-right" title="Biaya Riil (Refurbish)">
											<span>Biaya Riil (Refurbish)</span>
										</th>
									</>
								)}
								<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center">
									Status
								</th>
								<th className="px-2 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td colSpan={activeTab === "antrean" ? 9 : 10} className="px-4 py-12 text-center text-gray-500">
										<RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#0A356A] mb-2" />
										<span>Memuat data perbaikan peralatan...</span>
									</td>
								</tr>
							) : paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={activeTab === "antrean" ? 9 : 10} className="px-4 py-12 text-center text-gray-500">
										<p className="font-medium text-gray-800">
											Tidak ada data peralatan dalam {activeTab === "antrean" ? "Antrean Perbaikan" : "Riwayat Perbaikan"}
										</p>
										<p className="text-xs text-gray-500 mt-1">
											{searchInput || plantFilter !== "Semua" || pelaksanaFilter !== "Semua"
												? "Coba ubah filter pencarian di atas."
												: activeTab === "antrean"
													? "Semua peralatan yang memerlukan perbaikan telah memiliki penugasan."
													: "Belum ada riwayat perbaikan yang tercatat."}
										</p>
									</td>
								</tr>
							) : (
								paginatedItems.map((item, index) => {
									const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

									return (
										<tr
											key={item.id}
											className="hover:bg-gray-50 transition-colors text-[12px]"
										>
											{/* 1. No */}
											<td className="px-2 py-2.5 text-center text-gray-500">
												{itemIndex}
											</td>

											{/* 2. Nama Alat */}
											<td className="px-2 py-2.5 text-left font-medium text-gray-900">
												<span className="line-clamp-2 block leading-snug">
													{item.namaAlat}
												</span>
											</td>

											{/* 3. Kode Alat */}
											<td className="px-2 py-2.5 text-center">
												<span
													className="font-semibold text-[#0A356A] block truncate"
													title={item.kodeAlat}
												>
													{item.kodeAlat}
												</span>
											</td>

											{/* 4. Plant */}
											<td className="px-2 py-2.5 text-center text-gray-600 truncate" title={item.plant}>
												{item.plant}
											</td>

											{/* 5. Lokasi Simpan */}
											<td className="px-2 py-2.5 text-center text-gray-600 truncate" title={item.lokasiSimpan}>
												<span className="truncate block">{item.lokasiSimpan}</span>
											</td>

											{/* Conditional Columns based on Tab */}
											{activeTab === "antrean" ? (
												<>
													{/* 6. Rekomendasi Inspeksi */}
													<td className="px-2 py-2.5 text-center">
														{getRecommendationBadge(item.rekomendasi)}
													</td>

													{/* 7. Estimasi Biaya */}
													<td className="px-2 py-2.5 text-right tabular-nums text-gray-600 whitespace-nowrap" title="Estimasi Biaya">
														{formatRupiah(item.estimasiBiaya)}
													</td>
												</>
											) : (
												<>
													{/* 6. Pelaksana */}
													<td className="px-2 py-2.5 text-center">
														{item.pelaksana === "VENDOR" ? (
															<span
																className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full max-w-full truncate"
																title={`Vendor: ${item.namaVendor || "Pihak Ketiga"}${item.nomorKontrak ? ` (${item.nomorKontrak})` : ""}`}
															>
																<Building2 className="w-3 h-3 shrink-0" />
																<span className="truncate">{item.namaVendor || "Pihak Ketiga"}</span>
															</span>
														) : (
															<span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#0A356A] bg-blue-50 px-2 py-0.5 rounded-full">
																<Wrench className="w-3 h-3 shrink-0" />
																<span>Internal Pusri</span>
															</span>
														)}
													</td>

													{/* 7. Estimasi Biaya */}
													<td className="px-2 py-2.5 text-right tabular-nums text-gray-600 whitespace-nowrap" title="Estimasi Biaya">
														{formatRupiah(item.estimasiBiaya)}
													</td>

													{/* 8. Biaya Riil (Refurbish) - Hanya tampil di Riwayat */}
													<td className="px-2 py-2.5 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap" title="Biaya Riil (Refurbish)">
														{item.biayaRiil > 0 ? (
															formatRupiah(item.biayaRiil)
														) : (
															<span className="text-gray-400 font-normal italic">-</span>
														)}
													</td>
												</>
											)}

											{/* Status */}
											<td className="px-2 py-2.5 text-center">
												{getStatusBadge(item.statusAset)}
											</td>

											{/* Aksi */}
											<td className="px-2 py-2.5 text-center">
												{activeTab === "antrean" ? (
													<button
														type="button"
														onClick={() => handleOpenAssignModal(item)}
														className="text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] p-1 px-2.5 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 mx-auto font-bold text-[11px]"
														title="Tugaskan Perbaikan"
													>
														<Wrench className="w-3.5 h-3.5 text-[#0A356A] shrink-0" />
														<span className="whitespace-nowrap">Tugaskan</span>
													</button>
												) : (
													<button
														type="button"
														onClick={() => setSelectedDetail(item)}
														className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 px-2.5 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 text-[11px] font-bold mx-auto"
														title="Detail Info & Biaya"
													>
														<Eye className="w-3.5 h-3.5 text-gray-500 shrink-0" />
														<span className="whitespace-nowrap">Detail</span>
													</button>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Table Footer & Pagination */}
				<div className="p-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
					<span>
						Menampilkan{" "}
						<strong className="text-gray-800">
							{filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
						</strong>{" "}
						-{" "}
						<strong className="text-gray-800">
							{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
						</strong>{" "}
						dari <strong className="text-gray-800">{filteredItems.length}</strong> aset
					</span>

					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage <= 1}
							className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Prev
						</button>
						<span className="px-2 font-medium text-gray-700">
							{currentPage} / {totalPages}
						</span>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage >= totalPages}
							className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* MODAL FORMULIR PENUGASAN PERBAIKAN (US-06) — Clean Design Identik Validasi Inspeksi */}
			{assignModalItem && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
				>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-gray-900/50 transition-opacity"
						onClick={handleCloseAssignModal}
					/>

					{/* Modal Dialog */}
					<div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Header (Clean White Header persis Validasi Inspeksi) */}
						<div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
							<div className="flex items-center gap-3">
								<h2 className="text-base font-bold text-gray-900">
									Formulir Penugasan Perbaikan
								</h2>
								<span className="text-gray-300">|</span>
								<span className="text-[13px] font-semibold text-[#0A356A]">
									{assignModalItem.kodeAlat}
								</span>
							</div>
							<button
								type="button"
								onClick={handleCloseAssignModal}
								className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
								aria-label="Tutup"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Body */}
						<div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50 space-y-4">
							{/* Thin Asset Info Ribbon (Identik Validasi Inspeksi) */}
							<div className="bg-[#F2F3F4] border border-[#E6E8EA] rounded p-2.5 flex items-center justify-between gap-4">
								<div className="flex items-center gap-5 overflow-hidden">
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Nama Peralatan
										</span>
										<span className="font-bold text-[13px] text-[#0F172A] truncate">
											{assignModalItem.namaAlat}
										</span>
									</div>
									<div className="w-px h-5 bg-[#E6E8EA]"></div>
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Plant / Lokasi
										</span>
										<span className="font-bold text-[13px] text-[#0F172A]">
											{assignModalItem.plant}
											{assignModalItem.lokasiSimpan && assignModalItem.lokasiSimpan !== "-"
												? ` • ${assignModalItem.lokasiSimpan}`
												: ""}
										</span>
									</div>
									<div className="w-px h-5 bg-[#E6E8EA]"></div>
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Rekomendasi Inspeksi
										</span>
										<span className="font-semibold text-[12px] text-amber-800">
											{assignModalItem.rekomendasi || "Perbaikan Ringan"}
										</span>
									</div>
								</div>
								<div className="shrink-0 text-right">
									<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
										Estimasi Inspeksi
									</span>
									<span className="font-bold text-[13px] text-[#0A356A]">
										{formatRupiah(assignModalItem.estimasiBiaya)}
									</span>
								</div>
							</div>

							{/* Form Card */}
							<div className="bg-white border border-gray-200 rounded p-4 space-y-4">
								{/* 1. Biaya Perbaikan Riil (Refurbishment Cost) — Wajib */}
								<div>
									<label className="block text-[11px] font-semibold text-gray-700 mb-1">
										Biaya Perbaikan Riil (Refurbishment Cost) <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-500">
											Rp
										</span>
										<input
											type="text"
											value={refurbishmentCostInput}
											onChange={(e) => {
												const masked = formatRupiahInput(e.target.value);
												setRefurbishmentCostInput(masked);
												if (formErrors.cost) {
													setFormErrors((prev) => ({ ...prev, cost: undefined }));
												}
											}}
											placeholder="0"
											className={`w-full bg-white border rounded-md pl-10 pr-3 py-1.5 text-[13px] font-semibold text-gray-900 tabular-nums outline-none ${
												formErrors.cost
													? "border-[#DC2626] focus:border-[#DC2626]"
													: "border-gray-300 focus:border-[#0A356A]"
											}`}
										/>
									</div>
									<div className="flex items-center justify-between mt-1 text-[11px]">
										<span className="text-gray-500">
											Estimasi inspeksi pembanding:{" "}
											<strong className="text-gray-700">
												{formatRupiah(assignModalItem.estimasiBiaya)}
											</strong>
										</span>
										{formErrors.cost && (
											<span className="text-[#DC2626] font-medium">{formErrors.cost}</span>
										)}
									</div>
								</div>

								{/* 2. Pilihan Pelaksana Perbaikan (Repair Executor) — Wajib */}
								<div>
									<label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
										Pelaksana Perbaikan (Repair Executor) <span className="text-red-500">*</span>
									</label>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
										{/* Pilihan Internal */}
										<label
											className={`relative border rounded-md p-3 cursor-pointer flex items-start gap-2.5 transition-all ${
												repairExecutor === "INTERNAL"
													? "border-[#0A356A] bg-blue-50/40 ring-1 ring-[#0A356A]"
													: "border-gray-200 bg-white hover:bg-gray-50"
											} ${formErrors.executor ? "border-[#DC2626]" : ""}`}
										>
											<input
												type="radio"
												name="repairExecutor"
												value="INTERNAL"
												checked={repairExecutor === "INTERNAL"}
												onChange={() => {
													setRepairExecutor("INTERNAL");
													setFormErrors((prev) => ({
														...prev,
														executor: undefined,
														vendor: undefined,
													}));
												}}
												className="hidden"
											/>
											<div
												className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
													repairExecutor === "INTERNAL"
														? "border-[#0A356A]"
														: "border-gray-300"
												}`}
											>
												{repairExecutor === "INTERNAL" && (
													<div className="w-2 h-2 bg-[#0A356A] rounded-full" />
												)}
											</div>
											<div>
												<span className="text-[13px] font-bold text-gray-900 block leading-tight">
													Internal Pusri
												</span>
												<span className="text-[11px] text-gray-500 block mt-0.5">
													Pemeliharaan Lapangan / Bengkel Pabrik
												</span>
											</div>
										</label>

										{/* Pilihan Pihak Ketiga */}
										<label
											className={`relative border rounded-md p-3 cursor-pointer flex items-start gap-2.5 transition-all ${
												repairExecutor === "VENDOR"
													? "border-[#0A356A] bg-blue-50/40 ring-1 ring-[#0A356A]"
													: "border-gray-200 bg-white hover:bg-gray-50"
											} ${formErrors.executor ? "border-[#DC2626]" : ""}`}
										>
											<input
												type="radio"
												name="repairExecutor"
												value="VENDOR"
												checked={repairExecutor === "VENDOR"}
												onChange={() => {
													setRepairExecutor("VENDOR");
													setFormErrors((prev) => ({ ...prev, executor: undefined }));
												}}
												className="hidden"
											/>
											<div
												className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
													repairExecutor === "VENDOR"
														? "border-[#0A356A]"
														: "border-gray-300"
												}`}
											>
												{repairExecutor === "VENDOR" && (
													<div className="w-2 h-2 bg-[#0A356A] rounded-full" />
												)}
											</div>
											<div>
												<span className="text-[13px] font-bold text-gray-900 block leading-tight">
													Pihak Ketiga
												</span>
												<span className="text-[11px] text-gray-500 block mt-0.5">
													Vendor / Kontraktor Rekanan Luar
												</span>
											</div>
										</label>
									</div>
									{formErrors.executor && (
										<p className="text-[10px] text-[#DC2626] mt-1 font-medium">
											{formErrors.executor}
										</p>
									)}
								</div>

								{/* 3. Form Kondisional (Jika Memilih "Pihak Ketiga / Vendor") */}
								{repairExecutor === "VENDOR" && (
									<div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-md space-y-3 animate-in fade-in duration-200">
										<div className="flex items-center gap-2 pb-1.5 border-b border-amber-200/60">
											<Building2 className="w-4 h-4 text-amber-700" />
											<span className="text-[12px] font-bold text-amber-900">
												Informasi Vendor & Kontrak Rekanan
											</span>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div>
												<label className="block text-[11px] font-semibold text-gray-700 mb-1">
													Nama Vendor / Rekanan <span className="text-red-500">*</span>
												</label>
												<input
													type="text"
													list="common-vendors-list"
													value={vendorName}
													onChange={(e) => {
														setVendorName(e.target.value);
														if (formErrors.vendor) {
															setFormErrors((prev) => ({ ...prev, vendor: undefined }));
														}
													}}
													placeholder="Pilih atau ketik nama vendor (mis. PT ABB Indonesia)"
													className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none ${
														formErrors.vendor
															? "border-[#DC2626] focus:border-[#DC2626]"
															: "border-gray-300 focus:border-[#0A356A]"
													}`}
												/>
												<datalist id="common-vendors-list">
													{COMMON_REPAIR_VENDORS.map((v) => (
														<option key={v} value={v} />
													))}
												</datalist>
												{formErrors.vendor && (
													<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
														{formErrors.vendor}
													</p>
												)}
											</div>

											<div>
												<label className="block text-[11px] font-semibold text-gray-700 mb-1">
													Nomor PO / Kontrak Servis (Opsional)
												</label>
												<input
													type="text"
													value={contractNumber}
													onChange={(e) => setContractNumber(e.target.value)}
													placeholder="Contoh: PO-2026-MNT-089"
													className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] text-gray-800 outline-none focus:border-[#0A356A]"
												/>
											</div>
										</div>
									</div>
								)}

								{/* 4. Catatan / Instruksi Kerja (Scope of Work) — Opsional */}
								<div>
									<label className="block text-[11px] font-semibold text-gray-700 mb-1">
										Catatan / Instruksi Kerja (Scope of Work){" "}
										<span className="text-gray-400 font-normal">(Opsional)</span>
									</label>
									<textarea
										rows={3}
										value={workNotes}
										onChange={(e) => setWorkNotes(e.target.value)}
										placeholder="Instruksi khusus pengerjaan, lingkup perbaikan (scope of work), atau nomor SPK..."
										className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#0A356A] placeholder:text-gray-400 resize-none"
									/>
								</div>
							</div>
						</div>

						{/* Modal Footer (Identik Validasi Inspeksi) */}
						<div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2.5 shrink-0">
							<button
								type="button"
								onClick={handleCloseAssignModal}
								disabled={isSubmitting}
								className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-[#E6E8EA] transition-colors disabled:opacity-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleSubmitAssign}
								disabled={isSubmitting}
								className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-md transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
							>
								{isSubmitting ? (
									<>
										<RefreshCw className="w-3.5 h-3.5 animate-spin" />
										<span>Memproses...</span>
									</>
								) : (
									<>
										<Wrench className="w-3.5 h-3.5" />
										<span>Terbitkan Perintah Perbaikan</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL DETAIL INFO & RINCIAN BIAYA — Clean Design Identik Validasi Inspeksi */}
			{selectedDetail && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
				>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-gray-900/50 transition-opacity"
						onClick={() => setSelectedDetail(null)}
					/>

					{/* Modal Dialog */}
					<div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Detail Header */}
						<div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
							<div className="flex items-center gap-3">
								<h2 className="text-base font-bold text-gray-900">
									Detail & Rekap Biaya Perbaikan
								</h2>
								<span className="text-gray-300">|</span>
								<span className="text-[13px] font-semibold text-[#0A356A]">
									{selectedDetail.kodeAlat}
								</span>
							</div>
							<button
								type="button"
								onClick={() => setSelectedDetail(null)}
								className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
								aria-label="Tutup"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Detail Body */}
						<div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50 space-y-3.5">
							{/* Thin Asset Info Ribbon */}
							<div className="bg-[#F2F3F4] border border-[#E6E8EA] rounded p-2.5 flex items-center justify-between gap-4">
								<div className="flex items-center gap-5 overflow-hidden">
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Nama Peralatan
										</span>
										<span className="font-bold text-[13px] text-[#0F172A] truncate">
											{selectedDetail.namaAlat}
										</span>
									</div>
									<div className="w-px h-5 bg-[#E6E8EA]"></div>
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Plant / Lokasi
										</span>
										<span className="font-bold text-[13px] text-[#0F172A]">
											{selectedDetail.plant}
											{selectedDetail.lokasiSimpan && selectedDetail.lokasiSimpan !== "-"
												? ` • ${selectedDetail.lokasiSimpan}`
												: ""}
										</span>
									</div>
								</div>
								<div className="shrink-0 flex items-center gap-2">
									{getStatusBadge(selectedDetail.statusAset)}
								</div>
							</div>

							{/* Financial Breakdown */}
							<div className="bg-white border border-gray-200 rounded p-4 space-y-3">
								<div className="flex items-center gap-2 pb-2 border-b border-gray-100">
									<Receipt className="w-4 h-4 text-gray-500" />
									<h3 className="text-[12px] font-bold text-gray-800">
										Komparasi Nilai & Anggaran
									</h3>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="bg-gray-50 p-2.5 rounded border border-gray-200">
										<p className="text-[10px] text-gray-500 font-bold uppercase">
											Estimasi Inspeksi
										</p>
										<p className="text-sm font-bold text-gray-800 tabular-nums mt-0.5">
											{formatRupiah(selectedDetail.estimasiBiaya)}
										</p>
									</div>
									<div className="bg-gray-50 p-2.5 rounded border border-gray-200">
										<p className="text-[10px] text-gray-500 font-bold uppercase">
											Biaya Riil (Refurbish)
										</p>
										<p className="text-sm font-bold text-[#0A356A] tabular-nums mt-0.5">
											{formatRupiah(selectedDetail.biayaRiil)}
										</p>
									</div>
								</div>

								{/* Variance */}
								<div className="bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center justify-between">
									<div>
										<p className="text-[10px] text-gray-500 font-bold uppercase">
											Selisih / Efisiensi Biaya
										</p>
										<p
											className={`text-sm font-bold tabular-nums mt-0.5 ${
												selectedDetail.selisihBiaya >= 0
													? "text-emerald-700"
													: "text-amber-700"
											}`}
										>
											{selectedDetail.selisihBiaya >= 0 ? "+" : ""}
											{formatRupiah(selectedDetail.selisihBiaya)}
										</p>
									</div>
									<span
										className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
											selectedDetail.selisihBiaya >= 0
												? "bg-emerald-50 text-emerald-700 border border-emerald-200"
												: "bg-amber-50 text-amber-700 border border-amber-200"
										}`}
									>
										{selectedDetail.selisihBiaya >= 0
											? `Hemat ${selectedDetail.persenSelisih}%`
											: `Over ${Math.abs(selectedDetail.persenSelisih)}%`}
									</span>
								</div>
							</div>

							{/* Pelaksana Info */}
							<div className="bg-white border border-gray-200 rounded p-4 space-y-3">
								<div className="flex items-center gap-2 pb-2 border-b border-gray-100">
									<Building2 className="w-4 h-4 text-gray-500" />
									<h3 className="text-[12px] font-bold text-gray-800">
										Informasi Pelaksana
									</h3>
								</div>

								<div className="grid grid-cols-2 gap-3 text-xs">
									<div>
										<span className="text-[10px] font-semibold text-gray-500 block mb-0.5">
											Jalur Pengerjaan
										</span>
										<span className="text-[13px] font-bold text-gray-900">
											{selectedDetail.pelaksana === "VENDOR"
												? "Pihak Ketiga (Vendor)"
												: "Internal Pemeliharaan Lapangan"}
										</span>
									</div>
									{selectedDetail.pelaksana === "VENDOR" && (
										<>
											<div>
												<span className="text-[10px] font-semibold text-gray-500 block mb-0.5">
													Nama Rekanan / Vendor
												</span>
												<span className="text-[13px] font-bold text-amber-800">
													{selectedDetail.namaVendor || "-"}
												</span>
											</div>
											<div>
												<span className="text-[10px] font-semibold text-gray-500 block mb-0.5">
													No. PO / Kontrak
												</span>
												<span className="text-[12px] font-medium text-gray-800">
													{selectedDetail.nomorKontrak || "-"}
												</span>
											</div>
										</>
									)}
									<div>
										<span className="text-[10px] font-semibold text-gray-500 block mb-0.5">
											Lokasi Pabrik
										</span>
										<span className="text-[12px] font-medium text-gray-800">
											{selectedDetail.plant} — {selectedDetail.lokasiSimpan}
										</span>
									</div>
									{selectedDetail.startAt && (
										<div className="col-span-2">
											<span className="text-[10px] font-semibold text-gray-500 block mb-0.5">
												Jadwal Pelaksanaan
											</span>
											<span className="text-[12px] font-medium text-gray-800">
												{formatDate(selectedDetail.startAt)} s/d{" "}
												{formatDate(selectedDetail.endAt)}
											</span>
										</div>
									)}
								</div>
							</div>

							{/* Scope of Work */}
							<div className="bg-white border border-gray-200 rounded p-4 space-y-2">
								<div className="flex items-center gap-2 pb-2 border-b border-gray-100">
									<FileText className="w-4 h-4 text-gray-500" />
									<h3 className="text-[12px] font-bold text-gray-800">
										Lingkup Pekerjaan / Scope of Work
									</h3>
								</div>
								<p className="text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
									{selectedDetail.workDescription || "Tidak ada deskripsi pekerjaan."}
								</p>
								{selectedDetail.notes && (
									<p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
										<strong>Catatan:</strong> {selectedDetail.notes}
									</p>
								)}
							</div>
						</div>

						{/* Detail Footer */}
						<div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end shrink-0">
							<button
								type="button"
								onClick={() => setSelectedDetail(null)}
								className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-[#E6E8EA] transition-colors"
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
