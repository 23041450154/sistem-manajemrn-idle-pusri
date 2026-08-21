"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	Search,
	RefreshCw,
	AlertCircle,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	ClipboardCheck,
	Loader2,
	ChevronRight,
	CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getEquipments, getInspections } from "@/action/api";
import {
	inspectionQueue,
	type LastInspection,
} from "@/lib/inspection-schedule";

interface Equipment extends Partial<LastInspection> {
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

interface InspectionItem {
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
}

export default function InspeksiAntreanPage() {
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
	const [antreanData, setAntreanData] = useState<Equipment[]>([]);
	const [riwayatData, setRiwayatData] = useState<InspectionItem[]>([]);
	const [loading, setLoading] = useState(true);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const fetchData = useCallback(async () => {
		try {
			const [resultEq, resultInsp] = await Promise.all([
				getEquipments().catch(() => []),
				getInspections().catch(() => []),
			]);

			const allInspections = Array.isArray(resultInsp) ? resultInsp : [];

			if (Array.isArray(resultEq) && resultEq.length > 0) {
				// Semua aset READY_TO_USE tetap terdaftar; yang berubah setelah diinspeksi
				// hanyalah kolom "Inspeksi Terakhir". Interval berbeda per equipment, jadi
				// tidak ada aset yang dibuang otomatis dari daftar.
				setAntreanData(inspectionQueue(resultEq as Equipment[], allInspections));
			} else {
				setAntreanData([]);
			}

			if (allInspections.length > 0) {
				const mappedInspections: InspectionItem[] = allInspections.map(
					(ins: any) => {
						const eq = ins.equipment || {};
						let plantStr = "-";
						if (typeof eq.plant === "string") plantStr = eq.plant;
						else if (eq.plant?.name) plantStr = eq.plant.name;
						else if (eq.plant_description) plantStr = String(eq.plant_description);

						let typeStr = "-";
						if (typeof eq.object_type === "string") typeStr = eq.object_type;
						else if (eq.object_type?.name) typeStr = eq.object_type.name;
						else if (ins.object_type_name) typeStr = ins.object_type_name;

						return {
							id: ins.id,
							equipment_id: ins.equipment_id,
							equipment_code:
								ins.equipment_code || eq.equipment_code || `EQ-${ins.equipment_id}`,
							equipment_name: ins.equipment_name || eq.name || "Equipment Tanpa Nama",
							plant: plantStr,
							object_type: typeStr,
							inspection_date:
								ins.inspection_date || ins.created_at || new Date().toISOString(),
							notes: ins.notes || ins.summary || "Inspeksi berkala selesai.",
							condition_name: ins.condition?.name || ins.condition_name || "Baik",
							require_action_name:
								ins.require_action?.name || ins.require_action_name || "-",
							status_name: "Selesai",
						};
					},
				);
				setRiwayatData(mappedInspections);
			} else {
				setRiwayatData([]);
			}
		} catch (err) {
			console.error("Gagal mengambil data inspeksi berkala:", err);
			setAntreanData([]);
			setRiwayatData([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// setLoading(true) dipisah dari fetchData: state awal sudah true, jadi mount tidak
	// perlu setState sinkron di dalam effect (react-hooks/set-state-in-effect).
	const reload = useCallback(() => {
		setLoading(true);
		void fetchData();
	}, [fetchData]);

	useEffect(() => {
		// ponytail: client-fetch on mount, pola yang sama dipakai di semua halaman inspeksi.
		// Rule ini statis dan tidak melihat bahwa setState terjadi setelah await.
		// Upgrade path: pindahkan fetch ke server component + Suspense (Next 16) kalau
		// halaman ini di-refactor.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void fetchData();
	}, [fetchData]);

	// Halaman di-reset lewat handler filter (bukan effect) agar tak memicu cascading render.

	const plantOptions = useMemo(
		() =>
			[
				...new Set(
					antreanData
						.map((e) => (typeof e.plant === "string" ? e.plant : e.plant?.name))
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[antreanData],
	);

	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(
					antreanData
						.map((e) =>
							typeof e.object_type === "string" ? e.object_type : e.object_type?.name,
						)
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[antreanData],
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
		let filtered = antreanData.filter((row) => {
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
	}, [antreanData, search, filterPlant, filterTipeObjek, sortConfig]);

	const filteredRiwayat = useMemo(() => {
		return riwayatData.filter((row) => {
			if (!search.trim()) return true;
			const query = search.toLowerCase().trim();
			const code = row.equipment_code?.toLowerCase() || "";
			const name = row.equipment_name?.toLowerCase() || "";
			return code.includes(query) || name.includes(query);
		});
	}, [riwayatData, search]);

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
						onClick={reload}
						disabled={loading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Main Content Card Container */}
			<div
				id="inspeksi-table-container"
				className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4"
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
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "antrean"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{antreanData.length}
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
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "riwayat"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{riwayatData.length}
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
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={() => {
								setSearch(searchInput);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
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
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
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
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
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
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
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
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">
									No
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("equipment_code")}
								>
									<div className="flex items-center justify-start">
										Kode Alat {getSortIcon("equipment_code")}
									</div>
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									onClick={() => handleSort("name")}
								>
									<div className="flex items-center justify-start">
										Nama Peralatan {getSortIcon("name")}
									</div>
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-start">
										Plant {getSortIcon("plant")}
									</div>
								</th>
								{activeTab === "antrean" ? (
									<>
										<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
											Lokasi
										</th>
										<th
											className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
											onClick={() => handleSort("date")}
										>
											<div className="flex items-center justify-start">
												Tgl Idle {getSortIcon("date")}
											</div>
										</th>
										<th
											className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
											onClick={() => handleSort("last")}
										>
											<div className="flex items-center justify-start">
												Inspeksi Terakhir {getSortIcon("last")}
											</div>
										</th>
										<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
											Aksi
										</th>
									</>
								) : (
									<>
										<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
											Tgl Inspeksi
										</th>
										<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Hasil / Catatan
										</th>
										<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
											Status
										</th>
									</>
								)}
							</tr>
						</thead>
						<tbody className="bg-white">
							{loading ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
											<p className="text-[13px] font-medium">Memuat data...</p>
										</div>
									</td>
								</tr>
							) : paginatedAssets.length === 0 ? (
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
											className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
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
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
														Belum pernah
													</span>
												)}
											</td>
											<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
												<Link
													href={`/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`}
													className="inline-flex items-center gap-1 bg-[#0A356A] hover:bg-[#062854] text-white px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all shadow-sm"
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
											className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
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
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
													<CheckCircle2 className="w-3 h-3" />
													{row.status_name}
												</span>
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
							className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-[13px]"
						>
							Sebelumnya
						</button>

						<span className="px-3 py-1 font-medium text-gray-800">
							{currentPage} / {totalPages}
						</span>

						<button
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-[13px]"
						>
							Selanjutnya
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
