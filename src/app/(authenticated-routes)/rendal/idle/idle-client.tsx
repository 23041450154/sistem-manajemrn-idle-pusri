"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	type EquipmentStatus,
	EQUIPMENT_STATUS,
	statusText,
	statusName,
} from "@/lib/equipment-status";
import {
	Search,
	AlertCircle,
	RefreshCw,
	Plus,
	ChevronRight,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Eye,
	X,
} from "lucide-react";

export type AssetState = EquipmentStatus | "REJECTED";

export interface Equipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: AssetState;
	storageLocation?: string;
	funcLoc?: string;
	vendor?: string;
	year?: string | number;
	originalValue?: number;
	bookValue?: number;
	estimatedReuseValue?: number;
	notes?: string;
	idleReason?: string;
	photos?: string[];
	createdAt?: string;
}

/** Client Component: interaksi (search/filter/sort/paginasi/modal) — data di-fetch Server Component. */

/** path file_url dari backend bisa "uploads/.." tanpa leading slash. */
const toPhotoUrl = (photo: string) =>
	photo.startsWith("http") || photo.startsWith("/") ? photo : `/${photo}`;
export default function RendalIdleClient({
	equipments,
}: {
	equipments: Equipment[];
}) {
	const router = useRouter();

	// States untuk Filter & Pagination
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [plantFilter, setPlantFilter] = useState("Semua");
	const [statusFilter, setStatusFilter] = useState("Semua");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Equipment;
		direction: "asc" | "desc";
	} | null>(null);

	// State untuk Modal Detail
	const [detailModal, setDetailModal] = useState<Equipment | null>(null);
	// Foto utama di modal detail — default 0 = fallback ke Foto 1.
	const [activePhotoIdx, setActivePhotoIdx] = useState(0);
	const detailPhotos = detailModal?.photos ?? [];
	const safePhotoIdx = Math.min(
		activePhotoIdx,
		Math.max(detailPhotos.length - 1, 0),
	);

	const ITEMS_PER_PAGE = 10;

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paginasi saat filter berubah
		setCurrentPage(1);
	}, [search, plantFilter, statusFilter]);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(equipments.map((e) => e.plant).filter((v) => v && v !== "-")),
			].sort(),
		[equipments],
	);

	const handleReset = () => {
		setSearch("");
		setSearchInput("");
		setPlantFilter("Semua");
		setStatusFilter("Semua");
		setCurrentPage(1);
		setSortConfig(null);
	};

	// Filter & Sort Logic
	const filteredData = useMemo(() => {
		const result = equipments.filter((item) => {
			const query = search.toLowerCase().trim();
			const matchSearch =
				!query ||
				item.kodeAlat?.toLowerCase().includes(query) ||
				item.namaAlat?.toLowerCase().includes(query);
			const matchPlant = plantFilter === "Semua" || item.plant === plantFilter;
			const matchStatus =
				statusFilter === "Semua" ||
				item.statusAset === statusFilter ||
				statusName(item.statusAset) === statusName(statusFilter);
			return matchSearch && matchPlant && matchStatus;
		});

		if (sortConfig) {
			result.sort((a, b) => {
				if (sortConfig.key === "tanggalRegistrasi") {
					const timeA = a.createdAt
						? new Date(a.createdAt).getTime()
						: a.tanggalRegistrasi && a.tanggalRegistrasi !== "-"
							? new Date(a.tanggalRegistrasi).getTime()
							: 0;
					const timeB = b.createdAt
						? new Date(b.createdAt).getTime()
						: b.tanggalRegistrasi && b.tanggalRegistrasi !== "-"
							? new Date(b.tanggalRegistrasi).getTime()
							: 0;
					if (timeA !== timeB)
						return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
				}
				if (sortConfig.key === "originalValue") {
					const valA = Number(a.originalValue) || 0;
					const valB = Number(b.originalValue) || 0;
					return sortConfig.direction === "asc" ? valA - valB : valB - valA;
				}
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		} else {
			// Default sort: data yang baru masuk / didaftarkan berada di paling atas
			result.sort((a, b) => {
				const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				if (timeB !== timeA) return timeB - timeA;
				const idA = Number(a.id) || 0;
				const idB = Number(b.id) || 0;
				return idB - idA;
			});
		}
		return result;
	}, [equipments, search, plantFilter, statusFilter, sortConfig]);

	const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
	const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

	const paginatedData = useMemo(() => {
		const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
		return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredData, safeCurrentPage]);

	const handleSort = (key: keyof Equipment) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: keyof Equipment) => {
		if (!sortConfig || sortConfig.key !== key)
			return (
				<ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />
			);
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		) : (
			<ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		);
	};

	const getStatusBadge = (status: AssetState | string) => {
		const styles: Record<string, string> = {
			REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
			VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
			REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
			SCRAP: "bg-[#FEE2E2] text-[#DC2626]",
			DISPOSAL_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
			"DISPOSAL RECOMMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"DISPOSAL RECOMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"SCRAP RECOMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"SCRAP RECOMMENDED": "bg-[#FEF3C7] text-[#B45309]",
			SCRAP_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
			SCRAP_RECOMENDED: "bg-[#FEF3C7] text-[#B45309]",
			REPAIR: "bg-[#FEF3C7] text-[#B45309]",
			"REPAIR COMPLETED": "bg-[#CCFBF1] text-[#0F766E]",
			REPAIR_COMPLETED: "bg-[#CCFBF1] text-[#0F766E]",
			REVALIDATION: "bg-[#FEF3C7] text-[#B45309]",
			REUSED: "bg-[#E0E7FF] text-[#4F46E5]",
			"READY TO USE": "bg-[#E0E7FF] text-[#4F46E5]",
			READY_TO_USE: "bg-[#E0E7FF] text-[#4F46E5]",
		};

		let displayStatus = (status || "").replace(/_/g, " ");
		if (
			status === "DISPOSAL_RECOMMENDED" ||
			displayStatus === "DISPOSAL RECOMMENDED" ||
			displayStatus === "DISPOSAL RECOMENDED" ||
			displayStatus === "SCRAP RECOMMENDED"
		) {
			displayStatus = "SCRAP RECOMENDED";
		}

		const style = styles[displayStatus] || styles[status] || styles.SCRAP;
		return (
			<span
				className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style}`}
			>
				{displayStatus}
			</span>
		);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Idle Equipment</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Data Registrasi Aset Idle
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar seluruh aset idle yang telah diregistrasi beserta status proses
							validasinya.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => router.refresh()}
							className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Muat Ulang
						</button>
						<Link
							href="/rendal/register-equipment"
							className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A356A] hover:bg-[#062854] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
						>
							<Plus className="w-4 h-4" />
							Daftarkan Peralatan
						</Link>
					</div>
				</div>
			</div>

			{/* Notification Banner */}
			{filteredData.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat{" "}
							<strong className="font-bold">{filteredData.length} aset</strong>{" "}
							terdaftar di sistem.
						</span>
					</div>
				</div>
			)}

			{/* Card Tabel Terpadu */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
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
									setSearch(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") setSearch(searchInput);
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
						<select
							value={plantFilter}
							onChange={(e) => setPlantFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="Semua">Semua Plant</option>
							{plantOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>

						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[130px] cursor-pointer"
						>
							<option value="Semua">Semua Status</option>
							{EQUIPMENT_STATUS.map((s) => (
								<option key={s} value={s}>
									{s === "DISPOSAL_RECOMMENDED"
										? "SCRAP RECOMENDED"
										: statusText(s)}
								</option>
							))}
							<option value="REJECTED">REJECTED</option>
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

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
				<div className="w-full overflow-x-auto">
					<table className="w-full table-fixed text-left border-collapse">
						<colgroup>
							<col className="w-[4%]" />
							<col className="w-[14%]" />
							<col className="w-[24%]" />
							<col className="w-[11%]" />
							<col className="w-[14%]" />
							<col className="w-[12%]" />
							<col className="w-[12%]" />
							<col className="w-[9%]" />
						</colgroup>
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
									No
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("kodeAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Kode Alat {getSortIcon("kodeAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("namaAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Nama Peralatan {getSortIcon("namaAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Plant {getSortIcon("plant")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("jenisAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Tipe Objek {getSortIcon("jenisAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("tanggalRegistrasi")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Tgl Registrasi {getSortIcon("tanggalRegistrasi")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-center"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("statusAset")}
								>
									<div className="flex items-center justify-center gap-0.5 truncate">
										Status {getSortIcon("statusAset")}
									</div>
								</th>
								<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="bg-white text-[12px]">
							{paginatedData.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Data Tidak Ditemukan
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Tidak ada peralatan yang sesuai dengan filter pencarian.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedData.map((item, index) => (
									<tr
										key={item.id || index}
										className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
									>
										<td className="px-2 py-2 text-gray-500 font-medium text-center truncate">
											{(safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td
											className="px-2 py-2 font-semibold text-[#0A356A] text-left truncate"
											title={item.kodeAlat}
										>
											{item.kodeAlat}
										</td>
										<td
											className="px-2 py-2 font-semibold text-gray-800 text-left"
											title={item.namaAlat}
										>
											<span className="leading-tight line-clamp-2 block text-left">
												{item.namaAlat}
											</span>
										</td>
										<td
											className="px-2 py-2 text-gray-600 font-medium text-left truncate"
											title={item.plant}
										>
											{item.plant}
										</td>
										<td
											className="px-2 py-2 text-gray-600 font-medium text-left truncate"
											title={item.jenisAlat}
										>
											{item.jenisAlat}
										</td>
										<td className="px-2 py-2 text-gray-600 font-medium text-left truncate">
											{item.tanggalRegistrasi}
										</td>
										<td className="px-2 py-2 text-center truncate">
											{getStatusBadge(item.statusAset)}
										</td>
										<td className="px-2 py-2 text-center">
											<div className="flex justify-center items-center opacity-90 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => {
														setDetailModal(item);
														setActivePhotoIdx(0);
													}}
													className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-[#0A356A] hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
													title="Lihat Detail"
												>
													<Eye className="w-3 h-3" />
													<span>Detail</span>
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{filteredData.length > 0 && (
					<div className="px-5 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
						<span className="text-[11px] font-medium text-gray-500">
							Menampilkan{" "}
							{filteredData.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
							- {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
							{filteredData.length} data ({ITEMS_PER_PAGE} baris/halaman)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={safeCurrentPage === 1}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Sebelumnya
							</button>
							<div className="flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`min-w-[24px] h-6 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
												safeCurrentPage === page
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
								disabled={safeCurrentPage === totalPages}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Selanjutnya
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Detail Informasi Aset */}
			{detailModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Eye className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Detail Aset Idle
									</h2>
									<p className="text-xs text-blue-100 font-medium mt-0.5">
										{detailModal.kodeAlat}
									</p>
								</div>
							</div>
							<button
								onClick={() => setDetailModal(null)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
							{/* Section 1: Informasi Dasar */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Informasi & Spesifikasi Aset
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Nama Alat
										</p>
										<p className="text-sm font-bold text-gray-900">
											{detailModal.namaAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Kode Alat
										</p>
										<p className="text-sm font-bold text-gray-900">
											{detailModal.kodeAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Plant
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.plant}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Jenis Alat
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.jenisAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Vendor / Merk
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.vendor || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Tahun Perolehan
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.year || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Section 2: Lokasi & Nilai Aset */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Lokasi & Nilai Aset
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Lokasi Penyimpanan
										</p>
										<p className="text-sm font-semibold text-gray-800">
											{detailModal.storageLocation || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Area (FuncLoc)
										</p>
										<p className="text-sm font-semibold text-gray-800">
											{detailModal.funcLoc || "-"}
										</p>
									</div>
									<div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3.5">
										{[
											["Nilai Perolehan", detailModal.originalValue],
											["Nilai Buku", detailModal.bookValue],
											["Estimasi Pakai Ulang", detailModal.estimatedReuseValue],
										].map(([label, value]) => (
											<div key={label as string}>
												<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
													{label}
												</p>
												<p className="text-sm font-bold text-emerald-700">
													{value ? `Rp ${Number(value).toLocaleString("id-ID")}` : "Rp 0"}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Section 3: Kondisi & Status */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Kondisi & Status
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Status Aset
										</p>
										<div className="mt-0.5">{getStatusBadge(detailModal.statusAset)}</div>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Tanggal Registrasi
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.tanggalRegistrasi}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Alasan Idle
										</p>
										<p className="text-sm font-medium text-gray-800 leading-relaxed">
											{detailModal.idleReason || "Tidak ada alasan idle."}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Catatan Tambahan
										</p>
										<p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed whitespace-pre-line">
											{detailModal.notes || "Tidak ada catatan tambahan."}
										</p>
									</div>
								</div>
							</div>

							{/* Section 4: Foto Peralatan */}
							{detailPhotos.length > 0 && (
								<div>
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
										Foto Peralatan
									</h3>
									{/* ponytail: <img> polos disengaja — next/image optimizer gagal memuat
									    foto /uploads backend sehingga tampak kosong; URL langsung terbukti jalan. */}
									<a
										href={toPhotoUrl(detailPhotos[safePhotoIdx])}
										target="_blank"
										rel="noopener noreferrer"
										className="group relative block border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-[#0A356A] transition-all shadow-sm"
									>
										{/* eslint-disable-next-line @next/next/no-img-element -- lihat catatan ponytail di atas */}
										<img
											src={toPhotoUrl(detailPhotos[safePhotoIdx])}
											alt={`Foto ${safePhotoIdx + 1}`}
											className="w-full h-56 object-contain bg-white"
										/>
										<span className="absolute bottom-2 right-2 text-[10px] font-bold text-gray-500 bg-white/85 px-2 py-0.5 rounded pointer-events-none">
											Foto {safePhotoIdx + 1}/{detailPhotos.length}
										</span>
									</a>

									{detailPhotos.length > 1 && (
										<div className="grid grid-cols-4 gap-2 mt-2.5">
											{detailPhotos.map((photo, index) => {
												const isActive = index === safePhotoIdx;
												return (
													<button
														key={index}
														type="button"
														onClick={() => setActivePhotoIdx(index)}
														title={`Lihat Foto ${index + 1}`}
														className={`relative border rounded-lg overflow-hidden aspect-video bg-gray-100 transition-all ${isActive ? "border-[#0556B3] ring-2 ring-[#0556B3]/30" : "border-gray-200 hover:border-[#0A356A]"}`}
													>
														{/* eslint-disable-next-line @next/next/no-img-element -- lihat catatan ponytail di atas */}
														<img
															src={toPhotoUrl(photo)}
															alt={`Thumbnail Foto ${index + 1}`}
															className="w-full h-full object-cover"
														/>
													</button>
												);
											})}
										</div>
									)}
								</div>
							)}
						</div>

						<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
							<button
								onClick={() => setDetailModal(null)}
								className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
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
