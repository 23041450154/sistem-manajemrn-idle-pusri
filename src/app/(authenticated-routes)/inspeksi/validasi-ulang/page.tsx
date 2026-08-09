"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments, createRevalidation, getConditions } from "@/action/api";
import {
	CheckCircle2,
	Search,
	RefreshCw,
	X,
	Loader2,
	ChevronRight,
	ClipboardCheck,
	AlertCircle,
	Save,
	XCircle,
	Wrench,
	Trash2,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RevalidasiItem {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisiSebelumnya: string;
	tanggalSelesai: string;
}

export default function ValidasiUlangPage() {
	const [items, setItems] = useState<RevalidasiItem[]>([]);
	const [conditions, setConditions] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	// Modal State
	const [selectedAsset, setSelectedAsset] = useState<RevalidasiItem | null>(
		null,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [conditionId, setConditionId] = useState("");
	const [notes, setNotes] = useState("");
	const [followupRecommendation, setFollowupRecommendation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [modalError, setModalError] = useState<string | null>(null);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [data, conditionsData] = await Promise.all([
				getEquipments(),
				getConditions(),
			]);
			setConditions(conditionsData || []);

			const completedMaintenanceIds: string[] = JSON.parse(
				localStorage.getItem("completed_maintenance_ids") || "[]",
			);
			const revalidatedIds: string[] = JSON.parse(
				localStorage.getItem("revalidated_equipment_ids") || "[]",
			);

			let filtered: RevalidasiItem[] = [];

			if (Array.isArray(data) && data.length > 0) {
				filtered = data
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.filter((item: any) => {
						const statusName = String(item.status?.name || "").toUpperCase();
						const isRepairCompleted =
							item.status_id === 4 ||
							item.status?.id === 4 ||
							statusName === "REPAIR_COMPLETED";
						const isLocallyCompleted = completedMaintenanceIds.includes(String(item.id));
						const isNotRevalidatedYet = !revalidatedIds.includes(String(item.id));
						return (isRepairCompleted || isLocallyCompleted) && isNotRevalidatedYet;
					})
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.map((item: any) => {
						const plantStr =
							typeof item.plant === "string"
								? item.plant
								: item.plant?.name || "-";
						const storageStr =
							typeof item.storage_location === "string"
								? item.storage_location
								: item.storage_location?.name || "-";
						const objectTypeStr =
							typeof item.object_type === "string"
								? item.object_type
								: item.object_type?.name || "-";
						const conditionStr =
							typeof item.condition === "string"
								? item.condition
								: item.condition?.name || "-";

						return {
							id: String(item.id),
							kodeAlat: item.equipment_code || "-",
							namaAlat:
								typeof item.name === "string"
									? item.name
									: item.name?.name || "-",
							tipeObjek: objectTypeStr,
							plant: plantStr,
							lokasiPenyimpanan: storageStr,
							kondisiSebelumnya: conditionStr,
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
			console.error("Error loading validasi ulang:", err);
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterPlant, filterTipeObjek]);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(items.map((e) => e.plant).filter((v) => v && v !== "-")),
			].sort(),
		[items],
	);
	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(items.map((e) => e.tipeObjek).filter((v) => v && v !== "-")),
			].sort(),
		[items],
	);

	const handleSearch = () => setSearchQuery(searchInput);

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setFilterPlant("");
		setFilterTipeObjek("");
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
		if (filterPlant) result = result.filter((item) => item.plant === filterPlant);
		if (filterTipeObjek)
			result = result.filter((item) => item.tipeObjek === filterTipeObjek);
		return result;
	}, [items, searchQuery, filterPlant, filterTipeObjek]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	const handleOpenModal = (asset: RevalidasiItem) => {
		setSelectedAsset(asset);
		setConditionId("");
		setNotes("");
		setFollowupRecommendation("");
		setModalError(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		if (isSubmitting) return;
		setIsModalOpen(false);
		setTimeout(() => setSelectedAsset(null), 200);
	};

	const handleSubmit = async () => {
		if (!selectedAsset) return;
		if (!conditionId) {
			setModalError("Silakan pilih kondisi hasil pemeriksaan ulang.");
			return;
		}
		setIsSubmitting(true);
		setModalError(null);
		try {
			const selectedConditionObj = conditions.find((c) => String(c.id) === String(conditionId));
			const conditionNameUpper = String(selectedConditionObj?.name || "").toUpperCase();

			const isBagus = conditionNameUpper === "BAGUS" || conditionNameUpper === "BAIK";
			const isScrap = conditionNameUpper === "RUSAK_BERAT";

			const result = await createRevalidation(selectedAsset.id, Number(conditionId), {
				notes,
				followupRecommendation,
			});

			if (result.success) {
				const revalidatedIds: string[] = JSON.parse(
					localStorage.getItem("revalidated_equipment_ids") || "[]",
				);
				const completedMaintenanceIds: string[] = JSON.parse(
					localStorage.getItem("completed_maintenance_ids") || "[]",
				);

				if (isBagus) {
					// 1. BAGUS -> Naik ke REVALIDATION (menunggu persetujuan Rendal)
					if (!revalidatedIds.includes(selectedAsset.id)) {
						revalidatedIds.push(selectedAsset.id);
						localStorage.setItem("revalidated_equipment_ids", JSON.stringify(revalidatedIds));
					}
					setNotification({
						type: "success",
						message: `Validasi ulang ${selectedAsset.kodeAlat} berhasil: Kondisi BAGUS, status naik ke REVALIDATION (diteruskan ke Rendal untuk persetujuan Ready to Use).`,
					});
				} else if (isScrap) {
					// 2. RUSAK BERAT -> Dialihkan ke SCRAP / Disposal
					const updatedCompleted = completedMaintenanceIds.filter((id) => id !== selectedAsset.id);
					localStorage.setItem("completed_maintenance_ids", JSON.stringify(updatedCompleted));
					setNotification({
						type: "error",
						message: `Validasi ulang ${selectedAsset.kodeAlat}: Dinyatakan RUSAK BERAT dan berstatus SCRAP (Rekomendasi Disposal).`,
					});
				} else {
					// 3. RUSAK RINGAN / RUSAK SEDANG -> Kembali ke antrean REPAIR Pemeliharaan Lapangan
					const updatedCompleted = completedMaintenanceIds.filter((id) => id !== selectedAsset.id);
					localStorage.setItem("completed_maintenance_ids", JSON.stringify(updatedCompleted));
					const updatedReval = revalidatedIds.filter((id) => id !== selectedAsset.id);
					localStorage.setItem("revalidated_equipment_ids", JSON.stringify(updatedReval));
					setNotification({
						type: "error",
						message: `Validasi ulang ${selectedAsset.kodeAlat}: Masih RUSAK (${selectedConditionObj?.name.replace(/_/g, " ")}), status kembali ke REPAIR untuk perbaikan ulang.`,
					});
				}

				handleCloseModal();
				loadData();
			} else {
				setModalError(result.message || "Gagal menyimpan re-validasi.");
			}
		} catch (err: any) {
			setModalError(err.message || "Terjadi kesalahan.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const getConditionBadge = (kondisi: string) => {
		if (kondisi === "Baik" || kondisi === "BAGUS")
			return "bg-emerald-50 text-emerald-700 border border-emerald-200";
		if (kondisi === "-")
			return "bg-gray-50 text-gray-400 border border-gray-200";
		return "bg-amber-50 text-amber-700 border border-amber-200";
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
					<button
						onClick={() => setNotification(null)}
						className="text-gray-400 hover:text-white ml-2"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Page Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Inspeksi Teknik</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Validasi Ulang</span>
				</div>
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-gray-900 tracking-tight">
						Validasi Ulang
					</h1>
					<button
						onClick={loadData}
						disabled={isLoading}
						className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
				<p className="text-[13px] text-gray-500 mt-1">
					Pemeriksaan ulang aset yang telah selesai perbaikan oleh Pemeliharaan Lapangan.
				</p>
			</div>

			{/* Action Notification Banner */}
			{filteredItems.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat <strong className="font-bold">{filteredItems.length} aset</strong> yang
							membutuhkan validasi ulang setelah perbaikan selesai.
						</span>
					</div>
				</div>
			)}

			{/* Main Content Area (Tabel) */}
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
								<option key={p} value={p}>{p}</option>
							))}
						</select>

						<select
							value={filterTipeObjek}
							onChange={(e) => setFilterTipeObjek(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="">Semua Tipe</option>
							{tipeObjekOptions.map((t) => (
								<option key={t} value={t}>{t}</option>
							))}
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
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center w-12 whitespace-nowrap">
									No
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Kode Alat
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Nama Peralatan
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Plant
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Lokasi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Kondisi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Tgl Selesai
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Tindakan
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
							) : paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Tidak Ada Aset untuk Validasi Ulang
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Aset yang selesai diperbaiki akan muncul di sini.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedItems.map((asset, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									return (
										<tr
											key={asset.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
										>
											<td className="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">
												{rowNum}
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
											<td className="px-3 py-3 text-[15px] text-center">
												<span
													className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${getConditionBadge(asset.kondisiSebelumnya)}`}
												>
													{asset.kondisiSebelumnya}
												</span>
											</td>
											<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-center whitespace-nowrap">
												{asset.tanggalSelesai}
											</td>
											<td className="px-3 py-3 text-left">
												<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
													<button
														onClick={() => handleOpenModal(asset)}
														className="inline-flex items-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-md text-[13px] font-bold transition-all shadow-sm"
														title="Validasi Ulang"
													>
														<ClipboardCheck className="w-3.5 h-3.5" />
														Validasi
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

				{/* Pagination */}
				<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
					<span className="text-[11px] font-medium text-gray-500">
						Menampilkan{" "}
						{filteredItems.length === 0
							? 0
							: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}{" "}
						dari {filteredItems.length} data (10 baris/halaman)
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
							{Array.from(
								{ length: Math.max(1, totalPages) },
								(_, i) => i + 1,
							).map((page) => (
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
			</div>

			{/* Modal Validasi Ulang */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						{/* Modal Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<ClipboardCheck className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white">Validasi Ulang</h2>
									<p className="text-xs text-blue-100">{selectedAsset.kodeAlat} — {selectedAsset.namaAlat}</p>
								</div>
							</div>
							<button
								onClick={handleCloseModal}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Modal Body */}
						<div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
							{/* Info Aset */}
							<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 grid grid-cols-2 gap-2 text-xs">
								<div>
									<p className="text-gray-500 font-medium">Tipe Objek</p>
									<p className="text-gray-800 font-semibold">{selectedAsset.tipeObjek}</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Plant</p>
									<p className="text-gray-800 font-semibold">{selectedAsset.plant}</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Lokasi</p>
									<p className="text-gray-800 font-semibold">{selectedAsset.lokasiPenyimpanan}</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Kondisi Sebelumnya</p>
									<p className="text-gray-800 font-semibold">{selectedAsset.kondisiSebelumnya}</p>
								</div>
							</div>

							{/* Kondisi */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Kondisi Hasil Pemeriksaan <span className="text-red-500">*</span>
								</label>
								<select
									value={conditionId}
									onChange={(e) => setConditionId(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium text-gray-700 cursor-pointer"
								>
									<option value="">— Pilih Kondisi —</option>
									{conditions.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
										</option>
									))}
								</select>

								{/* Dynamic Impact Indicator Card */}
								{conditionId ? (
									<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
										{(() => {
											const selObj = conditions.find((c) => String(c.id) === String(conditionId));
											const nameUpper = String(selObj?.name || "").toUpperCase();

											if (nameUpper === "BAGUS" || nameUpper === "BAIK") {
												return (
													<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2.5 shadow-xs">
														<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
														<div>
															<p className="font-bold text-emerald-900">
																BAGUS → Status Naik ke REVALIDATION
															</p>
															<p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
																Perbaikan dinyatakan berhasil. Aset akan diteruskan ke <strong>Rendal Pemeliharaan</strong> untuk persetujuan status <strong>Ready to Use</strong>.
															</p>
														</div>
													</div>
												);
											}

											if (nameUpper === "RUSAK_BERAT") {
												return (
													<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 flex items-start gap-2.5 shadow-xs">
														<Trash2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
														<div>
															<p className="font-bold text-red-900">
																RUSAK BERAT → Status Dialihkan ke SCRAP
															</p>
															<p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
																Kerusakan berat dan tidak ekonomis diperbaiki. Aset direkomendasikan untuk proses usulan <strong>Disposal / Penghapusan</strong>.
															</p>
														</div>
													</div>
												);
											}

											return (
												<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
													<Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
													<div>
														<p className="font-bold text-amber-900">
															RUSAK (Ringan/Sedang) → Status Kembali ke REPAIR
														</p>
														<p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
															Aset masih mengalami kendala teknis dan akan dikembalikan ke antrean perbaikan <strong>Pemeliharaan Lapangan</strong>.
														</p>
													</div>
												</div>
											);
										})()}
									</div>
								) : (
									<div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-[11px] text-gray-500 leading-normal">
										<p className="font-semibold text-gray-700 mb-0.5">Panduan Keputusan Validasi Ulang:</p>
										<ul className="space-y-0.5 list-disc list-inside text-[10px]">
											<li><strong className="text-emerald-700">BAGUS</strong>: Naik ke REVALIDATION (persetujuan Rendal)</li>
											<li><strong className="text-amber-700">Rusak Ringan/Sedang</strong>: Kembali ke REPAIR (antrean perbaikan)</li>
											<li><strong className="text-red-700">Rusak Berat</strong>: Dialihkan ke SCRAP (usulan disposal)</li>
										</ul>
									</div>
								)}
							</div>

							{/* Catatan */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Catatan Pemeriksaan
								</label>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									placeholder="Hasil pemeriksaan visual, fungsi mekanik/elektrik, dll."
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all resize-none"
								/>
							</div>

							{/* Rekomendasi */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Rekomendasi Tindak Lanjut
								</label>
								<input
									type="text"
									value={followupRecommendation}
									onChange={(e) => setFollowupRecommendation(e.target.value)}
									placeholder="Misal: Dapat dimobilisasi segera"
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all"
								/>
							</div>

							{/* Error */}
							{modalError && (
								<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
									<AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
									<p className="text-xs text-red-700 font-medium">{modalError}</p>
								</div>
							)}
						</div>

						{/* Modal Footer */}
						<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
							<button
								onClick={handleCloseModal}
								disabled={isSubmitting}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
							>
								Batal
							</button>
							<button
								onClick={handleSubmit}
								disabled={isSubmitting || !conditionId}
								className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								{isSubmitting ? "Menyimpan..." : "Simpan Validasi"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
