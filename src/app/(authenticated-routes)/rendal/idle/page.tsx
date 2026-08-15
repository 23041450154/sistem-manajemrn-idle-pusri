"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getEquipments, getObjectTypes } from "@/action/api";
import {
	Search,
	AlertCircle,
	RefreshCw,
	Plus,
	RotateCcw,
	ChevronRight,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Eye,
	Upload,
	Wrench,
	CheckCircle,
	Loader2,
	X,
} from "lucide-react";

// Tipe Data menyesuaikan dengan struktur standar Asset/Equipment
type AssetState =
	| "REGISTERED"
	| "VALIDATED"
	| "REJECTED"
	| "IDLE"
	| "DALAM_PERBAIKAN"
	| "READY_TO_REUSE"
	| "READY TO USE"
	| "DISPOSAL"
	| "TIDAK LAYAK"
	| "NEED_REVISION";
type ApprovalState =
	| "PENDING"
	| "IN_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "NEED_REVISION";

interface Equipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: AssetState;
	statusPersetujuan: ApprovalState;
	storageLocation?: string;
	funcLoc?: string;
	vendor?: string;
	year?: string | number;
	originalValue?: number;
	notes?: string;
	idleReason?: string;
	photos?: string[];
}

export default function RendalIdlePage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	// States untuk Modal Perbaikan & Detail
	const [repairModal, setRepairModal] = useState<Equipment | null>(null);
	const [detailModal, setDetailModal] = useState<Equipment | null>(null);
	const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);

	const ITEMS_PER_PAGE = 10;

	const handleSubmitRepair = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmittingRepair(true);
		setTimeout(() => {
			setIsSubmittingRepair(false);
			alert(
				"Berhasil! Hasil perbaikan dan bukti biaya telah disimpan. Status alat berubah menjadi Ready to Use.",
			);
			setRepairModal(null);
		}, 1500);
	};

	const fetchEquipments = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [data, objTypes] = await Promise.all([
				getEquipments(),
				getObjectTypes(),
			]);
			data.sort((a: any, b: any) => {
				const idA = Number(a.id) || 0;
				const idB = Number(b.id) || 0;
				return idB - idA;
			});

			let revisedIds: string[] = [];
			if (typeof window !== "undefined") {
				try {
					revisedIds = JSON.parse(
						localStorage.getItem("revised_equipment_ids") || "[]",
					);
				} catch (e) {}
			}

			const mappedData = data.map((item: any) => {
				let objectTypeName = "Belum Ditentukan";
				if (item.object_type?.name) {
					objectTypeName = item.object_type.name;
				} else if (item.objectType?.name) {
					objectTypeName = item.objectType.name;
				} else {
					const otId =
						item.id_object_type || item.object_type_id || item.objectTypeId;
					if (otId && objTypes) {
						const found = objTypes.find(
							(o: any) => o.id === otId || o.id === Number(otId),
						);
						if (found) objectTypeName = found.name;
					}
				}

				const isRevised = revisedIds.includes(String(item.id));
				const rawStatus =
					(typeof item.status === "string" ? item.status : item.status?.name) ||
					"";
				let statusStr = isRevised
					? "REGISTERED"
					: (
							rawStatus ||
							(item.status_id === 2
								? "VALIDATED"
								: item.status_id === 3
									? "REJECTED"
									: item.status_id === 4
										? "READY TO USE"
										: item.status_id === 5
											? "READY_TO_REUSE"
											: "REGISTERED")
						).toUpperCase();

				if (statusStr === "IDLE") statusStr = "READY TO USE";

				return {
					id: item.id?.toString() || "-",
					kodeAlat: item.equipment_code,
					namaAlat: item.name,
					plant: item.plant?.name || "-",
					jenisAlat: objectTypeName,
					tanggalRegistrasi: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: "-",
					statusAset: statusStr,
					statusPersetujuan: "PENDING",
					storageLocation: item.storage_location?.name || "Belum Ditentukan",
					funcLoc:
						typeof item.func_loc === "string"
							? item.func_loc
							: item.func_loc?.name || "-",
					vendor: item.vendor || "-",
					year: item.year || "-",
					originalValue: item.original_value || 0,
					notes: item.notes || "-",
					idleReason: item.idle_reason || "-",
					photos: item.attachments
						? item.attachments
								.filter(
									(att: any) =>
										att.attachment_category === "equipment_photo" ||
										att.attachment_category === "photo" ||
										att.category === "equipment_photo" ||
										att.category === "photo",
								)
								.map((att: any) => {
									const url = att.file_url || att.fileUrl || "";
									return url.replace(/\\/g, "/");
								})
						: [],
				};
			});
			setEquipments(mappedData as Equipment[]);
		} catch (err: unknown) {
			console.error(err);
			setError(
				"Gagal terhubung ke database. Menampilkan data kosong atau periksa kembali koneksi backend Anda.",
			);
			setEquipments([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchEquipments();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, plantFilter, statusFilter]);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(
					equipments.map((e) => e.plant).filter((v) => v && v !== "-"),
				),
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
				((statusFilter === "READY TO USE" || statusFilter === "READY_TO_REUSE") &&
					((item.statusAset as string) === "READY_TO_REUSE" ||
						(item.statusAset as string) === "READY TO REUSE" ||
						item.statusAset === "READY TO USE"));
			return matchSearch && matchPlant && matchStatus;
		});

		if (sortConfig) {
			result.sort((a, b) => {
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}
		return result;
	}, [equipments, search, plantFilter, statusFilter, sortConfig]);

	const paginatedData = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredData, currentPage]);

	const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

	const handleSort = (key: keyof Equipment) => {
		let direction: "asc" | "desc" = "asc";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "asc"
		) {
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
			REGISTERED: "bg-blue-50 text-blue-700 border-blue-200",
			VALIDATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
			REJECTED: "bg-red-50 text-red-700 border-red-200",
			IDLE: "bg-indigo-50 text-indigo-700 border-indigo-200",
			"READY TO USE": "bg-indigo-50 text-indigo-700 border-indigo-200",
			DALAM_PERBAIKAN: "bg-amber-50 text-amber-700 border-amber-200",
			PERBAIKAN: "bg-amber-50 text-amber-700 border-amber-200",
			READY_TO_REUSE: "bg-teal-50 text-teal-700 border-teal-200",
			NEED_REVISION: "bg-orange-50 text-orange-700 border-orange-200",
			REVISI: "bg-orange-50 text-orange-700 border-orange-200",
			DISPOSAL: "bg-purple-50 text-purple-700 border-purple-200",
			"TIDAK LAYAK": "bg-rose-50 text-rose-700 border-rose-200",
		};

		let displayStatus = (status || "").replace(/_/g, " ");
		if (status === "IDLE" || status === "READY_TO_REUSE") {
			displayStatus = "READY TO USE";
		} else if (status === "DALAM_PERBAIKAN") {
			displayStatus = "PERBAIKAN";
		} else if (status === "NEED_REVISION") {
			displayStatus = "REVISI";
		}

		const style =
			styles[displayStatus] ||
			styles[status] ||
			styles["READY TO USE"] ||
			"bg-gray-50 text-gray-700 border-gray-200";
		return (
			<span
				className={`inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded border leading-tight ${style}`}
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
							Daftar seluruh aset idle yang telah diregistrasi beserta status proses validasinya.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={fetchEquipments}
							disabled={isLoading}
							className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
							/>
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

			{/* Error Banner */}
			{error && (
				<div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg shadow-sm text-[13px]">
					<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
					<p className="font-medium leading-relaxed">{error}</p>
				</div>
			)}

			{/* Notification Banner */}
			{!isLoading && filteredData.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat <strong className="font-bold">{filteredData.length} aset</strong> terdaftar di sistem.
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
							<option value="REGISTERED">REGISTERED</option>
							<option value="VALIDATED">VALIDATED</option>
							<option value="READY TO USE">READY TO USE</option>
							<option value="DALAM_PERBAIKAN">DALAM PERBAIKAN</option>
							<option value="READY_TO_REUSE">READY TO USE</option>
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
							{isLoading ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
											<p className="text-[13px] font-medium">Memuat data peralatan...</p>
										</div>
									</td>
								</tr>
							) : paginatedData.length === 0 ? (
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
											{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td className="px-2 py-2 font-semibold text-[#0A356A] text-left truncate" title={item.kodeAlat}>
											{item.kodeAlat}
										</td>
										<td className="px-2 py-2 font-semibold text-gray-800 text-left" title={item.namaAlat}>
											<span className="leading-tight line-clamp-2 block text-left">
												{item.namaAlat}
											</span>
										</td>
										<td className="px-2 py-2 text-gray-600 font-medium text-left truncate" title={item.plant}>
											{item.plant}
										</td>
										<td className="px-2 py-2 text-gray-600 font-medium text-left truncate" title={item.jenisAlat}>
											{item.jenisAlat}
										</td>
										<td className="px-2 py-2 text-gray-600 font-medium text-left truncate">
											{item.tanggalRegistrasi}
										</td>
										<td className="px-2 py-2 text-center truncate">
											{getStatusBadge(item.statusAset)}
										</td>
										<td className="px-2 py-2 text-center">
											<div className="flex justify-center items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
												{item.statusAset === "DALAM_PERBAIKAN" && (
													<button
														onClick={() => setRepairModal(item)}
														className="inline-flex items-center justify-center gap-1 bg-[#0A356A] hover:bg-[#062854] text-white px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
														title="Catat Hasil Perbaikan"
													>
														<Wrench className="w-3 h-3" />
														<span>Perbaikan</span>
													</button>
												)}
												{item.statusAset === "REJECTED" ||
												item.statusAset === "DISPOSAL" ||
												item.statusAset === "TIDAK LAYAK" ||
												item.statusAset === "NEED_REVISION" ? (
													<Link
														href={`/rendal/register-equipment?editId=${item.id}`}
														className="inline-flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
														title="Revisi (Dinyatakan Tidak Layak)"
													>
														<RotateCcw className="w-3 h-3" />
														<span>Revisi</span>
													</Link>
												) : (
													item.statusAset !== "DALAM_PERBAIKAN" && (
														<button
															onClick={() => setDetailModal(item)}
															className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-[#0A356A] hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
															title="Lihat Detail"
														>
															<Eye className="w-3 h-3" />
															<span>Detail</span>
														</button>
													)
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{!isLoading && filteredData.length > 0 && (
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
								onClick={() =>
									setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))
								}
								disabled={currentPage === Math.max(1, totalPages)}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Pencatatan Perbaikan */}
			{repairModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Wrench className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Pencatatan Hasil Perbaikan
									</h2>
									<p className="text-xs text-blue-100 font-medium mt-0.5">
										{repairModal.kodeAlat} - {repairModal.namaAlat}
									</p>
								</div>
							</div>
							<button
								onClick={() => setRepairModal(null)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form
							onSubmit={handleSubmitRepair}
							className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
						>
							<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs text-gray-600 leading-normal">
								Unggah bukti biaya dan deskripsi tindakan perbaikan di bawah ini
								untuk merubah status peralatan menjadi{" "}
								<strong className="text-[#0A356A]">Ready to Use</strong>.
							</div>

							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Deskripsi Perbaikan <span className="text-red-500">*</span>
								</label>
								<textarea
									required
									rows={3}
									placeholder="Jelaskan tindakan perbaikan/refurbish yang telah dilakukan secara detail..."
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all resize-none shadow-sm"
								></textarea>
							</div>

							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Total Biaya Aktual <span className="text-red-500">*</span>
								</label>
								<div className="relative shadow-sm rounded-lg">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<span className="text-gray-500 text-sm font-bold">Rp</span>
									</div>
									<input
										required
										type="number"
										min="0"
										placeholder="Contoh: 15000000"
										className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all"
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Unggah Bukti Biaya / Nota Perbaikan{" "}
									<span className="text-red-500">*</span>
								</label>
								<label className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0A356A] cursor-pointer transition-colors bg-gray-50">
									<Upload className="w-6 h-6 text-gray-400 mb-2" />
									<span className="text-sm font-bold text-gray-700">
										Pilih file nota / invoice perbaikan
									</span>
									<span className="text-[10px] text-gray-500 mt-1">
										Mendukung format PDF, JPG, PNG (Maks. 5MB)
									</span>
									<input required type="file" className="hidden" />
								</label>
							</div>

							<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 -mx-6 -mb-5 mt-4">
								<button
									type="button"
									disabled={isSubmittingRepair}
									onClick={() => setRepairModal(null)}
									className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmittingRepair}
									className="px-5 py-2 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
								>
									{isSubmittingRepair ? (
										<RefreshCw className="w-4 h-4 animate-spin" />
									) : (
										<CheckCircle className="w-4 h-4" />
									)}
									{isSubmittingRepair ? "Menyimpan..." : "Simpan & Ubah Status"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

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
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Nilai Perolehan
										</p>
										<p className="text-sm font-bold text-emerald-700">
											{detailModal.originalValue
												? `Rp ${Number(detailModal.originalValue).toLocaleString("id-ID")}`
												: "Rp 0"}
										</p>
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
										<div className="mt-0.5">
											{getStatusBadge(detailModal.statusAset)}
										</div>
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
							{detailModal.photos && detailModal.photos.length > 0 && (
								<div>
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
										Foto Peralatan
									</h3>
									<div className="grid grid-cols-3 gap-2.5">
										{detailModal.photos.map((photo, index) => {
											const photoUrl =
												photo.startsWith("http") || photo.startsWith("/")
													? photo
													: `/${photo}`;
											return (
												<a
													key={index}
													href={photoUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="group relative border border-gray-200 rounded-lg overflow-hidden aspect-video bg-gray-100 hover:border-[#0A356A] transition-all shadow-sm"
												>
													<img
														src={photoUrl}
														alt={`Foto ${index + 1}`}
														className="w-full h-full object-cover transition-all group-hover:scale-105"
													/>
												</a>
											);
										})}
									</div>
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
