"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	RefreshCw,
	AlertCircle,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	ClipboardCheck,
	ChevronRight,
	CheckCircle2,
	Eye,
	X,
} from "lucide-react";
import Link from "next/link";
import { type LastInspection } from "@/lib/inspection-schedule";

export interface Equipment extends Partial<LastInspection> {
	id: string | number;
	equipment_code: string;
	name: string;
	status: string | { name: string };
	location?: string | { name: string };
	plant?: string | { name: string };
	storage_location?: { name: string };
	area?: { name: string };
	object_type?: string | { name: string };
	updated_at?: string;
	created_at?: string;
}

export interface InspectionItem {
	id: string | number;
	equipment_id: string | number;
	equipment_code?: string;
	equipment_name?: string;
	plant?: string;
	object_type?: string;
	inspection_date?: string;
	created_at?: string;
	notes?: string;
	condition_name?: string;
	require_action_name?: string;
	status_name?: string;
	photos?: string[];
}

/** Client Component: interaksi tab/filter/sort/paginasi — data di-fetch Server Component. */
export default function InspeksiBerkalaClient({
	antrean,
	riwayat,
}: {
	antrean: Equipment[];
	riwayat: InspectionItem[];
}) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	// Modal detail riwayat inspeksi.
	const [detailIns, setDetailIns] = useState<InspectionItem | null>(null);
	const ITEMS_PER_PAGE = 10;

	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	// Halaman di-reset lewat handler filter (bukan effect) agar tak memicu cascading render.

	const plantOptions = useMemo(
		() =>
			[
				...new Set(
					antrean
						.map((e) => (typeof e.plant === "string" ? e.plant : e.plant?.name))
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[antrean],
	);

	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(
					antrean
						.map((e) =>
							typeof e.object_type === "string" ? e.object_type : e.object_type?.name,
						)
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[antrean],
	);

	const handleReset = () => {
		setSearchInput("");
		setSearch("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setCurrentPage(1);
		setSortConfig(null);
	};

	const filteredAntrean = useMemo(() => {
		let filtered = antrean.filter((row) => {
			if (!search.trim()) return true;
			const query = search.toLowerCase().trim();
			const code = row.equipment_code?.toLowerCase() || "";
			const name = row.name?.toLowerCase() || "";
			return code.includes(query) || name.includes(query);
		});

		if (filterPlant) {
			filtered = filtered.filter((row) => {
				const plantStr =
					typeof row.plant === "string" ? row.plant : row.plant?.name;
				return plantStr === filterPlant;
			});
		}

		if (filterTipeObjek) {
			filtered = filtered.filter((row) => {
				const typeStr =
					typeof row.object_type === "string"
						? row.object_type
						: row.object_type?.name;
				return typeStr === filterTipeObjek;
			});
		}

		if (sortConfig !== null) {
			filtered.sort((a, b) => {
				let valA = "";
				let valB = "";
				if (sortConfig.key === "name") {
					valA = a.name.toLowerCase();
					valB = b.name.toLowerCase();
				} else if (sortConfig.key === "equipment_code") {
					valA = a.equipment_code.toLowerCase();
					valB = b.equipment_code.toLowerCase();
				} else if (sortConfig.key === "plant") {
					valA = (
						(typeof a.plant === "string" ? a.plant : a.plant?.name) ||
						a.area?.name ||
						""
					).toLowerCase();
					valB = (
						(typeof b.plant === "string" ? b.plant : b.plant?.name) ||
						b.area?.name ||
						""
					).toLowerCase();
				} else if (sortConfig.key === "date") {
					valA = a.updated_at || a.created_at || "";
					valB = b.updated_at || b.created_at || "";
				} else if (sortConfig.key === "last") {
					// Belum pernah diinspeksi = prioritas, jadi string kosong diurutkan paling awal.
					valA = a.last_inspection_date || "";
					valB = b.last_inspection_date || "";
				}
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [antrean, search, filterPlant, filterTipeObjek, sortConfig]);

	const filteredRiwayat = useMemo(() => {
		return riwayat.filter((row) => {
			if (!search.trim()) return true;
			const query = search.toLowerCase().trim();
			const code = row.equipment_code?.toLowerCase() || "";
			const name = row.equipment_name?.toLowerCase() || "";
			return code.includes(query) || name.includes(query);
		});
	}, [riwayat, search]);

	const displayList =
		activeTab === "antrean" ? filteredAntrean : filteredRiwayat;

	const paginatedAssets = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return displayList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [displayList, currentPage]);

	const totalPages = Math.ceil(displayList.length / ITEMS_PER_PAGE) || 1;

	const handleSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: string) => {
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

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Page Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Inspeksi Teknik</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Inspeksi Berkala</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Inspeksi Berkala
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar peralatan berstatus READY_TO_USE beserta tanggal inspeksi fisik
							terakhirnya.
						</p>
					</div>
					<button
						onClick={() => router.refresh()}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-[#0A356A] transition-colors"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Main Content Card Container */}
			<div
				id="inspeksi-table-container"
				className="bg-white border border-gray-200 rounded overflow-hidden scroll-mt-4"
			>
				{/* Navigation Tabs */}
				<div className="flex items-center border-b border-gray-200 px-5 pt-3 bg-white gap-6">
					<button
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
						<span>Antrean Inspeksi</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "antrean"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{antrean.length}
						</span>
					</button>

					<button
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
						<span>Riwayat Inspeksi</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "riwayat"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{riwayat.length}
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
								placeholder="Cari kode atau nama alat..."
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setSearch(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={() => {
								setSearch(searchInput);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded hover:bg-[#0556B3] transition-colors whitespace-nowrap"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						{activeTab === "antrean" && (
							<>
								<select
									value={filterPlant}
									onChange={(e) => {
										setFilterPlant(e.target.value);
										setCurrentPage(1);
									}}
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
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
									onChange={(e) => {
										setFilterTipeObjek(e.target.value);
										setCurrentPage(1);
									}}
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
								>
									<option value="">Semua Tipe</option>
									{tipeObjekOptions.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>

								<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
							</>
						)}

						<button
							onClick={handleReset}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
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
						<thead className="bg-[#F2F3F4]">
							<tr className="border-b border-gray-300">
								<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center w-10">
									No
								</th>
								<th
									className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("equipment_code")}
								>
									<div className="flex items-center justify-start">
										Kode Alat {getSortIcon("equipment_code")}
									</div>
								</th>
								<th
									className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left"
									onClick={() => handleSort("name")}
								>
									<div className="flex items-center justify-start">
										Nama Peralatan {getSortIcon("name")}
									</div>
								</th>
								<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th
									className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-start">
										Plant {getSortIcon("plant")}
									</div>
								</th>
								{activeTab === "antrean" ? (
									<>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
											Lokasi
										</th>
										<th
											className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left whitespace-nowrap"
											onClick={() => handleSort("date")}
										>
											<div className="flex items-center justify-start">
												Tgl Idle {getSortIcon("date")}
											</div>
										</th>
										<th
											className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors text-left whitespace-nowrap"
											onClick={() => handleSort("last")}
										>
											<div className="flex items-center justify-start">
												Inspeksi Terakhir {getSortIcon("last")}
											</div>
										</th>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
											Aksi
										</th>
									</>
								) : (
									<>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
											Tgl Inspeksi
										</th>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left">
											Hasil / Catatan
										</th>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
											Status
										</th>
										<th className="px-2.5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
											Aksi
										</th>
									</>
								)}
							</tr>
						</thead>
						<tbody className="bg-white">
							{paginatedAssets.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Data Tidak Ditemukan
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{activeTab === "antrean"
													? "Tidak ada aset berstatus READY_TO_USE untuk diinspeksi."
													: "Belum ada riwayat inspeksi berkala."}
											</p>
										</div>
									</td>
								</tr>
							) : activeTab === "antrean" ? (
								(paginatedAssets as Equipment[]).map((row, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									const idleDateStr =
										row.updated_at || row.created_at || new Date().toISOString();
									const idleDate = new Date(idleDateStr);
									const plantStr =
										(typeof row.plant === "string" ? row.plant : row.plant?.name) ||
										row.area?.name ||
										"-";
									const typeStr =
										typeof row.object_type === "string"
											? row.object_type
											: row.object_type?.name || "-";
									const lokasiStr =
										row.storage_location?.name ||
										(typeof row.location === "string"
											? row.location
											: row.location?.name) ||
										"-";

									return (
										<tr
											key={row.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-[#F2F3F4] transition-colors group"
										>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-500 font-medium text-center">
												{rowNum}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] font-semibold text-[#0A356A] text-left whitespace-nowrap">
												{row.equipment_code}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] font-medium text-gray-900 text-left">
												{row.name}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{typeStr}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{plantStr}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left">
												{lokasiStr}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{idleDate.toISOString().split("T")[0]}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-left whitespace-nowrap">
												{row.last_inspection_date ? (
													<span className="text-gray-600">
														{row.last_inspection_date.split("T")[0]}
													</span>
												) : (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-[#F2F3F4] text-[#334155]">
														Belum pernah
													</span>
												)}
											</td>
											<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
												<Link
													href={`/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`}
													className="inline-flex items-center gap-1 bg-[#0A356A] hover:bg-[#0556B3] text-white px-2.5 py-1 rounded text-[12px] font-bold transition-all"
												>
													<ClipboardCheck className="w-3.5 h-3.5" />
													Form Inspeksi
												</Link>
											</td>
										</tr>
									);
								})
							) : (
								(paginatedAssets as InspectionItem[]).map((row, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									const dateStr = row.inspection_date
										? new Date(row.inspection_date).toISOString().split("T")[0]
										: "-";

									return (
										<tr
											key={row.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-[#F2F3F4] transition-colors group"
										>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-500 font-medium text-center">
												{rowNum}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] font-semibold text-[#0A356A] text-left whitespace-nowrap">
												{row.equipment_code}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] font-medium text-gray-900 text-left">
												{row.equipment_name}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{row.object_type}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{row.plant}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left whitespace-nowrap">
												{dateStr}
											</td>
											<td className="px-2.5 py-2.5 text-[13px] text-gray-600 text-left">
												<span className="font-semibold text-gray-800 block">
													Kondisi: {row.condition_name}
												</span>
												<span className="text-gray-500 text-[11px] block">{row.notes}</span>
											</td>
											<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-white text-[#059669]">
													<CheckCircle2 className="w-3 h-3" />
													{row.status_name}
												</span>
											</td>
											<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
												<button
													onClick={() => setDetailIns(row)}
													className="inline-flex items-center gap-1 bg-gray-100 hover:bg-[#0A356A] hover:text-white text-gray-700 px-2.5 py-1 rounded text-[12px] font-bold transition-all"
													title="Lihat Detail Inspeksi"
												>
													<Eye className="w-3.5 h-3.5" />
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
				<div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-gray-500">
					<div>
						Menampilkan{" "}
						<span className="font-semibold text-gray-800">
							{displayList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
						</span>{" "}
						-{" "}
						<span className="font-semibold text-gray-800">
							{Math.min(currentPage * ITEMS_PER_PAGE, displayList.length)}
						</span>{" "}
						dari{" "}
						<span className="font-semibold text-gray-800">{displayList.length}</span>{" "}
						data
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-[13px]"
						>
							Sebelumnya
						</button>

						<span className="px-3 py-1 font-medium text-gray-800">
							{currentPage} / {totalPages}
						</span>

						<button
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-[13px]"
						>
							Selanjutnya
						</button>
					</div>
				</div>

				{/* Modal Detail Riwayat Inspeksi */}
				{detailIns && (
					<div
						className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
						onClick={() => setDetailIns(null)}
					>
						<div
							className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
								<div className="flex items-center gap-3">
									<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
										<Eye className="w-5 h-5 text-white" />
									</div>
									<div>
										<h2 className="text-base font-bold text-white leading-tight">
											Detail Inspeksi Berkala
										</h2>
										<p className="text-xs text-blue-100 font-medium mt-0.5">
											{detailIns.equipment_code}
										</p>
									</div>
								</div>
								<button
									onClick={() => setDetailIns(null)}
									className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="p-6 overflow-y-auto">
								<div className="grid grid-cols-2 gap-x-6 gap-y-4">
									{[
										["Kode Alat", detailIns.equipment_code],
										["Nama Peralatan", detailIns.equipment_name],
										["Jenis Aset", detailIns.object_type],
										["Plant", detailIns.plant],
										[
											"Tanggal Inspeksi",
											detailIns.inspection_date
												? new Date(detailIns.inspection_date).toISOString().split("T")[0]
												: "-",
										],
										["Kondisi", detailIns.condition_name],
										["Tindak Lanjut", detailIns.require_action_name],
										["Status", detailIns.status_name],
									].map(([label, value]) => (
										<div key={label}>
											<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
												{label}
											</p>
											<p className="text-sm font-medium text-gray-800">{value || "-"}</p>
										</div>
									))}
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
											Catatan / Hasil Inspeksi
										</p>
										<p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line leading-relaxed">
											{detailIns.notes || "Tidak ada catatan."}
										</p>
									</div>
									{(detailIns.photos?.length ?? 0) > 0 && (
										<div className="col-span-2">
											<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
												Foto Inspeksi
											</p>
											<div className="grid grid-cols-3 gap-2">
												{detailIns.photos!.map((photo, idx) => (
													<a
														key={idx}
														href={photo}
														target="_blank"
														rel="noopener noreferrer"
														className="relative aspect-video border border-gray-200 rounded-lg overflow-hidden bg-gray-100 hover:border-[#0A356A] transition-all"
													>
														{/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
														<img
															src={photo}
															alt={`Foto Inspeksi ${idx + 1}`}
															className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
														/>
													</a>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
								<button
									onClick={() => setDetailIns(null)}
									className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
								>
									Tutup
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
