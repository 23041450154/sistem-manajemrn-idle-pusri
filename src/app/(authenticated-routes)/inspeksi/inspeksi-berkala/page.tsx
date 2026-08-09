"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { getEquipments } from "@/action/api";

interface Equipment {
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

export default function InspeksiAntreanPage() {
	const [data, setData] = useState<Equipment[]>([]);
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

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await getEquipments();
				if (result && result.length > 0) {
					let idleEqs = result.filter((eq: any) => {
						const statusStr = typeof eq.status === "string" ? eq.status : eq.status?.name;
						return statusStr === "IDLE" || statusStr === "READY_TO_USE" || statusStr === "READY TO USE";
					});
					setData(idleEqs);
				} else {
					setData([]);
				}
			} catch (err) {
				console.error("Gagal mengambil data peralatan:", err);
				setData([]);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, filterPlant, filterTipeObjek]);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(
					data
						.map((e) => (typeof e.plant === "string" ? e.plant : e.plant?.name))
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[data],
	);
	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(
					data
						.map((e) =>
							typeof e.object_type === "string" ? e.object_type : e.object_type?.name,
						)
						.filter((v) => v && v !== "-"),
				),
			].sort(),
		[data],
	);

	const handleReset = () => {
		setSearchInput("");
		setSearch("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setCurrentPage(1);
		setSortConfig(null);
	};

	const filteredData = useMemo(() => {
		let filtered = data.filter((row) => {
			if (!search.trim()) return true;
			const query = search.toLowerCase().trim();
			const code = row.equipment_code?.toLowerCase() || "";
			const name = row.name?.toLowerCase() || "";
			return code.includes(query) || name.includes(query);
		});

		if (filterPlant) {
			filtered = filtered.filter((row) => {
				const plantStr = typeof row.plant === "string" ? row.plant : row.plant?.name;
				return plantStr === filterPlant;
			});
		}

		if (filterTipeObjek) {
			filtered = filtered.filter((row) => {
				const typeStr = typeof row.object_type === "string" ? row.object_type : row.object_type?.name;
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
					valA = ((typeof a.plant === "string" ? a.plant : a.plant?.name) || a.area?.name || "").toLowerCase();
					valB = ((typeof b.plant === "string" ? b.plant : b.plant?.name) || b.area?.name || "").toLowerCase();
				} else if (sortConfig.key === "date") {
					valA = a.updated_at || a.created_at || "";
					valB = b.updated_at || b.created_at || "";
				}
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [data, search, filterPlant, filterTipeObjek, sortConfig]);

	const paginatedAssets = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredData, currentPage]);

	const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

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
					<span className="text-[#0A356A] font-semibold">Inspeksi</span>
				</div>
				<h1 className="text-xl font-bold text-gray-900 tracking-tight">
					Inspeksi Berkala
				</h1>
				<p className="text-[13px] text-gray-500 mt-1">
					Daftar peralatan idle yang membutuhkan inspeksi fisik berkala.
				</p>
			</div>

			{/* Notification Banner */}
			{!loading && filteredData.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat <strong className="font-bold">{filteredData.length} aset</strong> idle yang siap untuk inspeksi berkala.
						</span>
					</div>
				</div>
			)}

			{/* Main Content Area (Tabel) */}
			<div
				id="inspeksi-table-container"
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
									setSearch(e.target.value);
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
							value={filterPlant}
							onChange={(e) => setFilterPlant(e.target.value)}
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
							onChange={(e) => setFilterTipeObjek(e.target.value)}
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
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center w-12 whitespace-nowrap">
									No
								</th>
								<th
									className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("equipment_code")}
								>
									<div className="flex items-center justify-start">
										Kode Alat {getSortIcon("equipment_code")}
									</div>
								</th>
								<th
									className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("name")}
								>
									<div className="flex items-center justify-start">
										Nama Peralatan {getSortIcon("name")}
									</div>
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th
									className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-start">
										Plant {getSortIcon("plant")}
									</div>
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Lokasi
								</th>
								<th
									className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("date")}
								>
									<div className="flex items-center justify-start">
										Tgl Idle {getSortIcon("date")}
									</div>
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Tindakan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white">
							{loading ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
											<p className="text-[13px] font-medium">Memuat data...</p>
										</div>
									</td>
								</tr>
							) : paginatedAssets.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Data Tidak Ditemukan
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Tidak ada aset IDLE untuk diinspeksi.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedAssets.map((row, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									const idleDateStr = row.updated_at || row.created_at || new Date().toISOString();
									const idleDate = new Date(idleDateStr);
									const plantStr = (typeof row.plant === "string" ? row.plant : row.plant?.name) || row.area?.name || "-";
									const typeStr = typeof row.object_type === "string" ? row.object_type : row.object_type?.name || "-";
									const lokasiStr = row.storage_location?.name || (typeof row.location === "string" ? row.location : row.location?.name) || "-";

									return (
										<tr
											key={row.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
										>
											<td className="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">
												{rowNum}
											</td>
											<td className="px-3 py-3 text-[15px] font-semibold text-[#0A356A] text-left whitespace-nowrap">
												{row.equipment_code}
											</td>
											<td className="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left" title={row.name}>
												<span className="leading-tight line-clamp-2 block text-left">
													{row.name}
												</span>
											</td>
											<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
												{typeStr}
											</td>
											<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
												{plantStr}
											</td>
											<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left">
												{lokasiStr}
											</td>
											<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left whitespace-nowrap">
												{idleDate.toISOString().split("T")[0]}
											</td>
											<td className="px-3 py-3 text-left">
												<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
													<Link
														href={`/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`}
														className="inline-flex items-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-md text-[13px] font-bold transition-all shadow-sm"
													>
														<ClipboardCheck className="w-3.5 h-3.5" />
														Inspeksi
													</Link>
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
				<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
					<span className="text-[11px] font-medium text-gray-500">
						Menampilkan{" "}
						{filteredData.length === 0
							? 0
							: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}{" "}
						dari {filteredData.length} data ({ITEMS_PER_PAGE} baris/halaman)
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
							{Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
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
							onClick={() => setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
							disabled={currentPage === Math.max(1, totalPages)}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
