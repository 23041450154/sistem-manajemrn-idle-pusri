"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments, completeEquipmentRepair } from "@/action/api";
import {
	repairFlowStatus,
	REPAIR_STATUS_LABEL,
	type RepairFlowStatus,
} from "@/lib/equipment-status";
import {
	Wrench,
	Search,
	RefreshCw,
	CheckCircle2,
	XCircle,
	X,
	Loader2,
	ChevronRight,
	AlertCircle,
	ImageOff,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface MaintenanceEquipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisi: string;
	terakhirDiperbarui: string;
	status: RepairFlowStatus;
	// Detail aset — sudah ikut di payload GET /api/equipment (Preload lengkap di backend).
	funcLoc: string;
	vendor: string;
	tahun: number;
	nilaiPerolehan: number;
	nilaiBuku: number;
	estimasiNilaiGunaUlang: number;
	idleSejak: string;
	alasanIdle: string;
	catatan: string;
	foto: string[];
}

const rupiah = (value: number) =>
	value > 0 ? `Rp ${new Intl.NumberFormat("id-ID").format(value)}` : "—";

/** Lampiran equipment bisa berupa dokumen; galeri hanya menampilkan berkas gambar. */
const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif)$/i;

const TABS: RepairFlowStatus[] = [
	"REPAIR",
	"REPAIR_COMPLETED",
	"REVALIDATION",
	"READY_TO_USE",
];

const EMPTY_HINT: Record<RepairFlowStatus, string> = {
	REPAIR: "Belum ada peralatan yang membutuhkan perbaikan.",
	REPAIR_COMPLETED: "Belum ada hasil perbaikan yang menunggu validasi ulang.",
	REVALIDATION: "Belum ada aset yang menunggu persetujuan Rendal.",
	READY_TO_USE: "Belum ada aset yang selesai sampai tahap siap digunakan.",
	SCRAP: "Belum ada aset yang direkomendasikan scrap.",
};

/** DESIGN.md status hues — five workflow states, no sixth. */
const STATUS_HUE: Record<RepairFlowStatus, string> = {
	REPAIR: "#B45309",
	REPAIR_COMPLETED: "#0556B3",
	REVALIDATION: "#475569",
	READY_TO_USE: "#059669",
	SCRAP: "#DC2626",
};

/** DESIGN.md status badge: 2px radius, transparent fill, 1px border + text in state hue. */
function StatusBadge({ status }: { status: RepairFlowStatus }) {
	return (
		<span
			className="inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
			style={{ color: STATUS_HUE[status], borderColor: STATUS_HUE[status] }}
		>
			{REPAIR_STATUS_LABEL[status]}
		</span>
	);
}

/**
 * DESIGN.md pagination: windowed — first, last, current ±1, with gaps.
 * Rendering every page button emitted 40 buttons at 400 rows.
 */
export function pageWindow(current: number, total: number): (number | "gap")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const wanted = [1, total, current - 1, current, current + 1]
		.filter((p) => p >= 1 && p <= total)
		.sort((a, b) => a - b);
	const out: (number | "gap")[] = [];
	for (const page of wanted) {
		const prev = out.at(-1);
		if (typeof prev === "number") {
			if (prev === page) continue;
			if (page - prev > 1) out.push("gap");
		}
		out.push(page);
	}
	return out;
}

export default function PerbaikanAlatPage() {
	const [equipments, setEquipments] = useState<MaintenanceEquipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<RepairFlowStatus>("REPAIR");
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const [selectedAsset, setSelectedAsset] =
		useState<MaintenanceEquipment | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	const today = () => new Date().toISOString().split("T")[0];

	const [actualCost, setActualCost] = useState("0");
	const [displayCost, setDisplayCost] = useState("Rp 0");
	const [startAt, setStartAt] = useState(today);
	const [endAt, setEndAt] = useState(today);
	const [workDescription, setWorkDescription] = useState("");
	const [notes, setNotes] = useState("");
	const [preservationStatus, setPreservationStatus] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const loadEquipments = async () => {
		setIsLoading(true);
		try {
			const data = await getEquipments();
			let filteredData: MaintenanceEquipment[] = [];

			if (Array.isArray(data)) {
				filteredData = data.flatMap((item: any) => {
					const status = repairFlowStatus(item);
					if (!status) return [];

					const pick = (val: any, fallback = "-") =>
						typeof val === "string" ? val : val?.name || val?.description || fallback;

					const stamp = item.updated_at || item.created_at;
					const money = (val: any) => Number(val) || 0;
					const dateOnly = (val: any) =>
						val ? new Date(val).toISOString().split("T")[0] : "—";

					return [
						{
							id: String(item.id),
							kodeAlat: item.equipment_code || "-",
							namaAlat: pick(item.name),
							tipeObjek: pick(item.object_type),
							plant: pick(item.plant),
							lokasiPenyimpanan: pick(item.storage_location),
							kondisi: pick(item.condition),
							terakhirDiperbarui: (stamp ? new Date(stamp) : new Date())
								.toISOString()
								.split("T")[0],
							status,
							funcLoc: pick(item.func_loc),
							vendor: pick(item.vendor),
							tahun: Number(item.year) || 0,
							nilaiPerolehan: money(item.original_value),
							nilaiBuku: money(item.book_value),
							estimasiNilaiGunaUlang: money(item.estimated_reuse_value),
							idleSejak: dateOnly(item.idle_since),
							alasanIdle: pick(item.idle_reason),
							catatan: pick(item.notes, ""),
							foto: (Array.isArray(item.attachments) ? item.attachments : [])
								.map((a: any) => a?.file_url || a?.fileUrl || a?.url || "")
								.filter((url: string) => IMAGE_FILE.test(url)),
						},
					];
				});
			}

			setEquipments(filteredData);
		} catch (err) {
			console.error("Error loading equipment maintenance data:", err);
			setEquipments([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
		loadEquipments();
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paginasi saat filter berubah
		setCurrentPage(1);
	}, [activeTab, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(equipments.map((e) => e.plant).filter((v) => v && v !== "-")),
			].sort(),
		[equipments],
	);
	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(
					equipments.map((e) => e.tipeObjek).filter((v) => v && v !== "-"),
				),
			].sort(),
		[equipments],
	);
	const kondisiOptions = useMemo(
		() =>
			[
				...new Set(equipments.map((e) => e.kondisi).filter((v) => v && v !== "-")),
			].sort(),
		[equipments],
	);

	const countByStatus = useMemo(() => {
		const counts = {} as Record<RepairFlowStatus, number>;
		for (const item of equipments) {
			counts[item.status] = (counts[item.status] ?? 0) + 1;
		}
		return counts;
	}, [equipments]);

	const hasActiveFilter = Boolean(
		searchQuery || filterPlant || filterTipeObjek || filterKondisi,
	);

	const handleSearch = () => {
		setSearchQuery(searchInput);
	};

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setFilterKondisi("");
	};

	const filteredEquipments = useMemo(() => {
		let result = equipments;

		result = result.filter((item) => item.status === activeTab);

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.kodeAlat.toLowerCase().includes(q) ||
					item.namaAlat.toLowerCase().includes(q) ||
					item.tipeObjek.toLowerCase().includes(q) ||
					item.plant.toLowerCase().includes(q) ||
					item.lokasiPenyimpanan.toLowerCase().includes(q) ||
					item.kondisi.toLowerCase().includes(q),
			);
		}

		if (filterPlant) {
			result = result.filter((item) => item.plant === filterPlant);
		}
		if (filterTipeObjek) {
			result = result.filter((item) => item.tipeObjek === filterTipeObjek);
		}
		if (filterKondisi) {
			result = result.filter((item) => item.kondisi === filterKondisi);
		}

		return result;
	}, [
		equipments,
		activeTab,
		searchQuery,
		filterPlant,
		filterTipeObjek,
		filterKondisi,
	]);

	const ITEMS_PER_PAGE = 10;

	const paginatedEquipments = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredEquipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredEquipments, currentPage]);

	const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE) || 1;

	const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawVal = e.target.value.replace(/\D/g, "");

		if (!rawVal) {
			setActualCost("0");
			setDisplayCost("Rp 0");
			return;
		}

		const numericVal = parseInt(rawVal, 10);
		setActualCost(numericVal.toString());
		const formatted = new Intl.NumberFormat("id-ID").format(numericVal);
		setDisplayCost(`Rp ${formatted}`);
	};

	const handleOpenModal = async (asset: MaintenanceEquipment) => {
		setSelectedAsset(asset);
		setActualCost("0");
		setDisplayCost("Rp 0");
		setStartAt(today());
		setEndAt(today());
		setWorkDescription("");
		setNotes("");
		setPreservationStatus("");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		if (isSubmitting) return;
		setIsModalOpen(false);
		setSelectedAsset(null);
	};

	// Backend: actual_cost validate:"required,gt=0" — nol ditolak.
	const isCostValid = useMemo(() => {
		return /^\d+$/.test(actualCost) && parseInt(actualCost, 10) > 0;
	}, [actualCost]);

	const isDateRangeValid = useMemo(() => {
		return Boolean(startAt && endAt) && endAt >= startAt;
	}, [startAt, endAt]);

	const isPreservationValid = useMemo(() => {
		return (
			preservationStatus === "Preserved" || preservationStatus === "Not Preserved"
		);
	}, [preservationStatus]);

	const isFormInvalid =
		!isCostValid || !isDateRangeValid || !isPreservationValid;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isFormInvalid || !selectedAsset || isSubmitting) return;

		setIsSubmitting(true);
		setNotification(null);

		try {
			const result = await completeEquipmentRepair(selectedAsset.id, {
				start_at: startAt,
				end_at: endAt,
				actual_cost: parseInt(actualCost, 10),
				preservation_status: preservationStatus,
				work_description: workDescription.trim(),
				notes: notes.trim(),
			});

			if (result.success) {
				setEquipments((prev) =>
					prev.map((item) =>
						item.id === selectedAsset.id
							? {
									...item,
									status: "REPAIR_COMPLETED" as RepairFlowStatus,
									terakhirDiperbarui: new Date().toISOString().split("T")[0],
								}
							: item,
					),
				);

				setNotification({
					type: "success",
					message:
						"Perbaikan peralatan berhasil disimpan! Status aset kini REPAIR COMPLETED dan diteruskan ke Inspeksi Teknik di menu Validasi Ulang (/inspeksi/validasi-ulang).",
				});

				setIsModalOpen(false);
				setSelectedAsset(null);
				await loadEquipments();

				setTimeout(() => {
					setNotification(null);
				}, 3000);
			} else {
				setNotification({
					type: "error",
					message: `Gagal menyelesaikan perbaikan: ${result.message || "Terjadi kesalahan pada server"}`,
				});
			}
		} catch (err: any) {
			setNotification({
				type: "error",
				message: `Terjadi kesalahan koneksi: ${err.message || "Gagal terhubung ke server"}`,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="page-container">
			{/* Toast */}
			{notification && (
				<div
					role="status"
					className={`fixed top-6 right-6 z-[70] px-5 py-3 rounded-[4px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 max-w-md text-white shadow-[0_8px_24px_-4px_rgb(15_23_42_/_0.12)] ${
						notification.type === "success" ? "bg-[#0F172A]" : "bg-[#DC2626]"
					}`}
				>
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
					) : (
						<XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
					)}
					<span className="text-[13px]">{notification.message}</span>
					<button
						onClick={() => setNotification(null)}
						aria-label="Tutup notifikasi"
						className="ml-2 p-1 text-white/70 hover:text-white transition-colors duration-[140ms] ease-out"
					>
						<X className="w-3.5 h-3.5" aria-hidden="true" />
					</button>
				</div>
			)}

			{/* Header */}
			<div className="page-header">
				<div>
					<nav
						aria-label="Breadcrumb"
						className="flex items-center gap-1.5 text-[12px] text-[#64748B] mb-1"
					>
						<span>Pemeliharaan Lapangan</span>
						<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
						<span className="text-[#0F172A] font-medium">Perbaikan Alat</span>
					</nav>
					<h1 className="page-title">Daftar Perbaikan Aset</h1>
					<p className="page-subtitle">
						Catat hasil perbaikan agar aset lanjut ke validasi ulang Inspeksi Teknik.
					</p>
				</div>
				<div className="header-actions">
					<button
						type="button"
						onClick={loadEquipments}
						disabled={isLoading}
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<RefreshCw
							className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
							aria-hidden="true"
						/>
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Main panel */}
			<div className="bg-white border border-[#E6E8EA] rounded-[4px] overflow-hidden scroll-mt-4">
				{/* Tab per tahap alur perbaikan */}
				<div
					role="tablist"
					aria-label="Tahap alur perbaikan"
					className="flex items-center border-b border-[#E6E8EA] px-5 gap-5 overflow-x-auto"
				>
					{TABS.map((stage) => {
						const isActive = activeTab === stage;
						return (
							<button
								key={stage}
								role="tab"
								aria-selected={isActive}
								onClick={() => {
									setActiveTab(stage);
									setCurrentPage(1);
								}}
								className={`min-h-[44px] flex items-center gap-2 whitespace-nowrap text-[13px] transition-colors duration-[140ms] ease-out border-b-2 -mb-px ${
									isActive
										? "text-[#0A356A] font-semibold border-[#0A356A]"
										: "text-[#64748B] font-medium border-transparent hover:text-[#0F172A]"
								}`}
							>
								<span>{REPAIR_STATUS_LABEL[stage]}</span>
								<span className="text-[12px] tabular-nums text-[#64748B]">
									{countByStatus[stage] ?? 0}
								</span>
							</button>
						);
					})}
				</div>

				{/* Toolbar */}
				<div className="p-3 border-b border-[#E6E8EA] flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Search */}
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
								aria-hidden="true"
							/>
							<input
								type="text"
								aria-label="Cari kode atau nama alat"
								placeholder="Cari kode atau nama alat..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="w-full h-9 pl-9 pr-4 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out placeholder:text-[#64748B]"
							/>
						</div>
						<button
							onClick={handleSearch}
							className="px-3.5 h-9 bg-[#0A356A] text-white text-[13px] font-medium rounded-[4px] hover:bg-[#0556B3] transition-colors duration-[140ms] ease-out whitespace-nowrap"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={filterPlant}
							onChange={(e) => setFilterPlant(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-[4px] focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="">Semua Plant</option>
							{plantOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>

						<select
							value={filterTipeObjek}
							onChange={(e) => setFilterTipeObjek(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-[4px] focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="">Semua Tipe</option>
							{tipeObjekOptions.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>

						<select
							value={filterKondisi}
							onChange={(e) => setFilterKondisi(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-[4px] focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="">Semua Kondisi</option>
							{kondisiOptions.map((k) => (
								<option key={k} value={k}>
									{k}
								</option>
							))}
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						<button
							onClick={handleReset}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-[4px] transition-colors whitespace-nowrap"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto lg:overflow-x-hidden">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">
									No
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Kode Alat
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left">
									Nama Peralatan
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Plant
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left">
									Lokasi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Kondisi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Tgl Diperbarui
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="bg-white">
							{isLoading ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
											<p className="text-[13px] font-medium">Memuat data...</p>
										</div>
									</td>
								</tr>
							) : paginatedEquipments.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												{hasActiveFilter
													? "Hasil Pencarian Tidak Ditemukan"
													: `Tidak Ada Data — ${REPAIR_STATUS_LABEL[activeTab]}`}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{hasActiveFilter
													? "Coba sesuaikan kata kunci atau filter pencarian Anda."
													: EMPTY_HINT[activeTab]}
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedEquipments.map((asset, index) => (
									<tr
										key={asset.id}
										className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
									>
										<td className="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">
											{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td className="px-3 py-3 text-[15px] font-semibold text-[#0A356A] text-left whitespace-nowrap">
											{asset.kodeAlat}
										</td>
										<td
											className="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left"
											title={asset.namaAlat}
										>
											<span className="leading-tight line-clamp-2 block text-left">
												{asset.namaAlat}
											</span>
										</td>
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
											{asset.tipeObjek}
										</td>
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
											{asset.plant}
										</td>
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
											{asset.lokasiPenyimpanan}
										</td>
										<td className="px-3 py-3 text-center">
											<span
												className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
													asset.kondisi === "Baik" || asset.kondisi === "BAIK"
														? "bg-emerald-50 text-emerald-700 border border-emerald-200"
														: asset.kondisi === "-"
															? "bg-gray-50 text-gray-400 border border-gray-200"
															: "bg-amber-50 text-amber-700 border border-amber-200"
												}`}
											>
												{asset.kondisi}
											</span>
										</td>
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-center whitespace-nowrap">
											{asset.terakhirDiperbarui}
										</td>
										<td className="px-3 py-3 text-center">
											<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
												{asset.status === "REPAIR" ? (
													<button
														onClick={() => handleOpenModal(asset)}
														className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-[4px] text-[13px] font-bold transition-all shadow-sm"
														title="Catat hasil perbaikan"
													>
														<Wrench className="w-3.5 h-3.5" />
														Selesaikan
													</button>
												) : (
													<StatusBadge status={asset.status} />
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
					<span className="text-[11px] font-medium text-gray-500">
						Menampilkan{" "}
						{filteredEquipments.length === 0
							? 0
							: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)} dari{" "}
						{filteredEquipments.length} data ({ITEMS_PER_PAGE} baris/halaman)
					</span>
					<div className="flex items-center gap-1.5">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-[4px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
						>
							Prev
						</button>
						<div className="flex items-center gap-1">
							{Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(
								(page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-6 h-6 rounded-[4px] text-[11px] font-bold flex items-center justify-center transition-colors ${
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
								setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))
							}
							disabled={currentPage === Math.max(1, totalPages)}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-[4px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* Modal */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/50 animate-in fade-in duration-200">
					<div
						role="dialog"
						aria-modal="true"
						aria-label={`Pencatatan hasil perbaikan ${selectedAsset.kodeAlat}`}
						className="bg-white rounded-[4px] shadow-[0_8px_24px_-4px_rgb(15_23_42_/_0.12)] w-full max-w-4xl overflow-hidden border border-[#E6E8EA] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E8EA] bg-[#0A356A]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-[4px] bg-white/10 flex items-center justify-center">
									<Wrench className="w-4 h-4 text-white" aria-hidden="true" />
								</div>
								<div>
									<h2 className="text-[14px] font-semibold text-white">
										Pencatatan Hasil Perbaikan
									</h2>
									<p className="text-[12px] text-white/70">
										{selectedAsset.kodeAlat} · {selectedAsset.namaAlat}
									</p>
								</div>
							</div>
							<button
								onClick={handleCloseModal}
								disabled={isSubmitting}
								aria-label="Tutup dialog"
								className="text-white/70 hover:text-white p-1.5 rounded-[4px] hover:bg-white/10 transition-colors duration-[140ms] ease-out disabled:opacity-50"
							>
								<X className="w-4 h-4" aria-hidden="true" />
							</button>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#E6E8EA]">
							{/* Detail Equipment */}
							<aside className="p-5 space-y-4 bg-[#F8FAFC]">
								<h3 className="text-[13px] font-semibold text-[#0F172A]">
									Detail Peralatan
								</h3>

								{/* Foto */}
								{selectedAsset.foto.length > 0 ? (
									<div className="space-y-2">
										<button
											type="button"
											onClick={() => setPreviewImage(selectedAsset.foto[0])}
											className="block w-full aspect-[4/3] overflow-hidden rounded-[4px] border border-[#E6E8EA] bg-white focus:outline-none focus:ring-2 focus:ring-[#334155] focus:ring-offset-1"
											aria-label="Perbesar foto utama peralatan"
										>
											{/* eslint-disable-next-line @next/next/no-img-element -- file_url berasal dari host backend dinamis, tidak terdaftar di images.remotePatterns */}
											<img
												src={selectedAsset.foto[0]}
												alt={`Foto peralatan ${selectedAsset.namaAlat}`}
												className="w-full h-full object-cover"
											/>
										</button>
										{selectedAsset.foto.length > 1 && (
											<div className="grid grid-cols-4 gap-2">
												{selectedAsset.foto.slice(1, 5).map((url, i) => (
													<button
														key={url}
														type="button"
														onClick={() => setPreviewImage(url)}
														className="aspect-square overflow-hidden rounded-[4px] border border-[#E6E8EA] bg-white focus:outline-none focus:ring-2 focus:ring-[#334155] focus:ring-offset-1"
														aria-label={`Perbesar foto peralatan ${i + 2}`}
													>
														{/* eslint-disable-next-line @next/next/no-img-element -- lihat catatan foto utama */}
														<img src={url} alt="" className="w-full h-full object-cover" />
													</button>
												))}
											</div>
										)}
									</div>
								) : (
									<div className="aspect-[4/3] rounded-[4px] border border-[#E6E8EA] bg-white flex flex-col items-center justify-center gap-1.5 text-[#64748B]">
										<ImageOff className="w-5 h-5" aria-hidden="true" />
										<p className="text-[12px]">Belum ada foto peralatan.</p>
									</div>
								)}

								<dl className="divide-y divide-[#E6E8EA] border-t border-[#E6E8EA]">
									{[
										["Kode Alat", selectedAsset.kodeAlat],
										["Tipe Objek", selectedAsset.tipeObjek],
										["Plant", selectedAsset.plant],
										["Lokasi Simpan", selectedAsset.lokasiPenyimpanan],
										["Functional Location", selectedAsset.funcLoc],
										["Vendor", selectedAsset.vendor],
										["Tahun", selectedAsset.tahun > 0 ? selectedAsset.tahun : "—"],
										["Kondisi", selectedAsset.kondisi],
										["Idle Sejak", selectedAsset.idleSejak],
										["Alasan Idle", selectedAsset.alasanIdle],
										["Nilai Perolehan", rupiah(selectedAsset.nilaiPerolehan)],
										["Nilai Buku", rupiah(selectedAsset.nilaiBuku)],
										[
											"Estimasi Nilai Guna Ulang",
											rupiah(selectedAsset.estimasiNilaiGunaUlang),
										],
										["Terakhir Diperbarui", selectedAsset.terakhirDiperbarui],
									].map(([label, value]) => (
										<div
											key={label}
											className="flex items-baseline justify-between gap-3 py-2"
										>
											<dt className="text-[12px] font-medium text-[#64748B] shrink-0">
												{label}
											</dt>
											<dd className="text-[13px] text-[#0F172A] text-right tabular-nums">
												{value}
											</dd>
										</div>
									))}
								</dl>

								{selectedAsset.catatan && (
									<div className="border-t border-[#E6E8EA] pt-3">
										<p className="text-[12px] font-medium text-[#64748B] mb-1">
											Catatan Aset
										</p>
										<p className="text-[13px] text-[#0F172A] leading-relaxed">
											{selectedAsset.catatan}
										</p>
									</div>
								)}
							</aside>

							{/* Form */}
							<form onSubmit={handleSubmit} className="flex flex-col">
								<div className="px-5 py-5 space-y-4 flex-1">
									<h3 className="text-[13px] font-semibold text-[#0F172A]">
										Realisasi Perbaikan
									</h3>

									{/* Periode Perbaikan */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="repair-start"
												className="text-[12px] font-medium text-[#64748B] block mb-1.5"
											>
												Tanggal Mulai <span className="text-[#DC2626]">*</span>
											</label>
											<input
												id="repair-start"
												type="date"
												value={startAt}
												max={endAt || undefined}
												onChange={(e) => setStartAt(e.target.value)}
												className="w-full h-10 px-3 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out"
											/>
										</div>
										<div>
											<label
												htmlFor="repair-end"
												className="text-[12px] font-medium text-[#64748B] block mb-1.5"
											>
												Tanggal Selesai <span className="text-[#DC2626]">*</span>
											</label>
											<input
												id="repair-end"
												type="date"
												value={endAt}
												min={startAt || undefined}
												aria-invalid={!isDateRangeValid}
												onChange={(e) => setEndAt(e.target.value)}
												className="w-full h-10 px-3 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out"
											/>
											{!isDateRangeValid && (
												<p className="text-[12px] text-[#DC2626] mt-1">
													Tanggal selesai tidak boleh sebelum tanggal mulai.
												</p>
											)}
										</div>
									</div>

									{/* Biaya Aktual */}
									<div>
										<label
											htmlFor="repair-cost"
											className="text-[12px] font-medium text-[#64748B] block mb-1.5"
										>
											Biaya Aktual Perbaikan <span className="text-[#DC2626]">*</span>
										</label>
										<input
											id="repair-cost"
											type="text"
											inputMode="numeric"
											value={displayCost}
											aria-invalid={!isCostValid}
											onChange={handleCostChange}
											className="w-full h-10 px-3 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out tabular-nums"
										/>
										<p className="text-[12px] text-[#64748B] mt-1">
											Wajib lebih dari Rp 0. Estimasi awal:{" "}
											{rupiah(selectedAsset.estimasiNilaiGunaUlang)}.
										</p>
									</div>

									{/* Status Preservasi */}
									<div>
										<label
											htmlFor="repair-preservation"
											className="text-[12px] font-medium text-[#64748B] block mb-1.5"
										>
											Status Preservasi Terbaru <span className="text-[#DC2626]">*</span>
										</label>
										<select
											id="repair-preservation"
											value={preservationStatus}
											onChange={(e) => setPreservationStatus(e.target.value)}
											className="w-full h-10 px-3 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out cursor-pointer"
										>
											<option value="">Pilih status preservasi</option>
											<option value="Preserved">Preserved</option>
											<option value="Not Preserved">Not Preserved</option>
										</select>
										<p className="text-[12px] text-[#64748B] mt-1.5">
											Pilih apakah aset masih memerlukan preservasi setelah perbaikan.
										</p>
									</div>

									{/* Deskripsi Pekerjaan & Catatan */}
									<div>
										<label
											htmlFor="repair-work"
											className="text-[12px] font-medium text-[#64748B] block mb-1.5"
										>
											Deskripsi Pekerjaan
										</label>
										<textarea
											id="repair-work"
											value={workDescription}
											rows={3}
											onChange={(e) => setWorkDescription(e.target.value)}
											placeholder="Pekerjaan perbaikan yang dilakukan..."
											className="w-full px-3 py-2 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out resize-none"
										/>
									</div>

									<div>
										<label
											htmlFor="repair-notes"
											className="text-[12px] font-medium text-[#64748B] block mb-1.5"
										>
											Catatan
										</label>
										<textarea
											id="repair-notes"
											value={notes}
											rows={3}
											onChange={(e) => setNotes(e.target.value)}
											placeholder="Catatan tambahan (opsional)..."
											className="w-full px-3 py-2 text-[13px] text-[#0F172A] bg-white border border-[#E6E8EA] rounded-[4px] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 outline-none transition-colors duration-[140ms] ease-out resize-none"
										/>
									</div>
								</div>

								{/* Footer */}
								<div className="px-5 py-4 border-t border-[#E6E8EA] bg-[#F8FAFC] flex justify-end gap-3">
									<button
										type="button"
										disabled={isSubmitting}
										onClick={handleCloseModal}
										className="min-h-[44px] px-4 text-[13px] font-medium text-[#334155] bg-white border border-[#E6E8EA] rounded-[4px] hover:bg-[#F2F3F4] transition-colors duration-[140ms] ease-out disabled:opacity-50"
									>
										Batal
									</button>
									<button
										type="submit"
										disabled={isFormInvalid || isSubmitting}
										className="min-h-[44px] flex items-center gap-2 px-5 text-[13px] font-semibold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-[4px] transition-colors duration-[140ms] ease-out disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? (
											<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
										) : (
											<CheckCircle2 className="w-4 h-4" aria-hidden="true" />
										)}
										{isSubmitting ? "Menyimpan..." : "Selesai Perbaikan"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Lightbox foto peralatan */}
			{previewImage && (
				<button
					type="button"
					aria-label="Tutup pratinjau foto"
					onClick={() => setPreviewImage(null)}
					className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0F172A]/80 animate-in fade-in duration-200"
				>
					{/* eslint-disable-next-line @next/next/no-img-element -- file_url berasal dari host backend dinamis */}
					<img
						src={previewImage}
						alt="Pratinjau foto peralatan"
						className="max-w-full max-h-full object-contain rounded-[4px] border border-white/20"
					/>
					<X
						className="absolute top-5 right-5 w-5 h-5 text-white/80"
						aria-hidden="true"
					/>
				</button>
			)}
		</div>
	);
}
