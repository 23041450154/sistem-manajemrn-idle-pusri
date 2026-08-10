"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments } from "@/action/api";
import {
	History,
	Search,
	RefreshCw,
	CheckCircle2,
	X,
	Loader2,
	ChevronRight,
	AlertCircle,
} from "lucide-react";

interface RiwayatItem {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisi: string;
	tanggalSelesai: string;
}

export default function RiwayatPerbaikanPage() {
	const [items, setItems] = useState<RiwayatItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const loadRiwayat = async () => {
		setIsLoading(true);
		try {
			const data = await getEquipments();
			let filtered: RiwayatItem[] = [];

			if (Array.isArray(data) && data.length > 0) {
				filtered = data
					.filter((item: any) => {
						const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
						const isFinished =
							item.status_id === 4 ||
							item.status_id === 5 ||
							item.status_id === 6 ||
							item.status?.id === 4 ||
							item.status?.id === 5 ||
							item.status?.id === 6 ||
							statusName === "REPAIR_COMPLETED" ||
							statusName === "REVALIDATION" ||
							statusName === "READY_TO_REUSE" ||
							statusName === "READY TO USE";
						return isFinished;
					})
					.map((item: any) => {
						const plantStr = typeof item.plant === "string" ? item.plant : item.plant?.name || "-";
						const storageStr =
							typeof item.storage_location === "string" ? item.storage_location : item.storage_location?.name || "-";
						const objectTypeStr =
							typeof item.object_type === "string" ? item.object_type : item.object_type?.name || "-";
						const conditionStr = typeof item.condition === "string" ? item.condition : item.condition?.name || "-";

						return {
							id: String(item.id),
							kodeAlat: item.equipment_code || "-",
							namaAlat: typeof item.name === "string" ? item.name : item.name?.name || "-",
							tipeObjek: objectTypeStr,
							plant: plantStr,
							lokasiPenyimpanan: storageStr,
							kondisi: conditionStr,
							tanggalSelesai: item.updated_at
								? new Date(item.updated_at).toISOString().split("T")[0]
								: item.created_at
									? new Date(item.created_at).toISOString().split("T")[0]
									: "-",
						};
					});
			}

			setItems(filtered);
		} catch (err) {
			console.error("Error loading riwayat perbaikan:", err);
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadRiwayat();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const plantOptions = useMemo(
		() => [...new Set(items.map((e) => e.plant).filter((v) => v && v !== "-"))].sort(),
		[items],
	);
	const tipeObjekOptions = useMemo(
		() => [...new Set(items.map((e) => e.tipeObjek).filter((v) => v && v !== "-"))].sort(),
		[items],
	);
	const kondisiOptions = useMemo(
		() => [...new Set(items.map((e) => e.kondisi).filter((v) => v && v !== "-"))].sort(),
		[items],
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

	const filteredItems = useMemo(() => {
		let result = items;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.kodeAlat.toLowerCase().includes(q) ||
					item.namaAlat.toLowerCase().includes(q) ||
					item.tipeObjek.toLowerCase().includes(q) ||
					item.plant.toLowerCase().includes(q) ||
					item.lokasiPenyimpanan.toLowerCase().includes(q),
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
	}, [items, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Pemeliharaan Lapangan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Riwayat Perbaikan</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">Riwayat Perbaikan</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar peralatan yang telah selesai diperbaiki dan berstatus Ready to Use.
						</p>
					</div>
					<button
						onClick={loadRiwayat}
						disabled={isLoading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Notification Banner */}
			{!isLoading && filteredItems.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
						</span>
						<span className="text-[13px] text-emerald-800 font-medium">
							<strong className="font-bold">{filteredItems.length} peralatan</strong> telah selesai diperbaiki dan berstatus Ready to Use.
						</span>
					</div>
				</div>
			)}

			{/* Main Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
				{/* Toolbar */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Search */}
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Cari kode atau nama alat..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

						<select
							value={filterKondisi}
							onChange={(e) => setFilterKondisi(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
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
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center w-12 whitespace-nowrap">No</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Kode Alat</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Nama Peralatan</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Tipe Objek</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Plant</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Lokasi</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Kondisi</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Tgl Selesai</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
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
							) : paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">Tidak Ada Data</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Belum ada riwayat perbaikan.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedItems.map((asset, index) => (
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
										<td className="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left" title={asset.namaAlat}>
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
											{asset.tanggalSelesai}
										</td>
										<td className="px-3 py-3 text-center">
											<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
												<span className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm">
													<CheckCircle2 className="w-3 h-3" />
													Selesai
												</span>
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
						{filteredItems.length === 0
							? 0
							: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}{" "}
						dari {filteredItems.length} data ({ITEMS_PER_PAGE} baris/halaman)
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
										currentPage === page ? "bg-[#0A356A] text-white" : "text-gray-600 hover:bg-gray-100"
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
