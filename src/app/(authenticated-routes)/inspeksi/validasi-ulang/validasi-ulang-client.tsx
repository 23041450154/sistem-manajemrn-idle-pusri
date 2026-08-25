"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createRevalidation } from "@/action/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
	Eye,
} from "lucide-react";

export interface RevalidasiItem {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisiSebelumnya: string;
	tanggalSelesai: string;
	statusAset?: string;
	catatan?: string;
	vendor?: string;
	serialNumber?: string;
	tahun?: number | string;
	alasanIdle?: string;
}

/** Client Component: interaksi tab/filter/modal validasi — data di-fetch Server Component. */
export default function InspeksiValidasiUlangClient({
	items,
}: {
	items: RevalidasiItem[];
}) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
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
	const [modalMode, setModalMode] = useState<"VALIDASI" | "DETAIL">("VALIDASI");
	// Hasil validasi ulang dipilih sebagai STATUS tujuan (bukan kondisi):
	// REVALIDATION = perbaikan berhasil, REPAIR = masih perlu perbaikan,
	// DISPOSAL_RECOMMENDED = usul scrap.
	const [hasilStatus, setHasilStatus] = useState("");
	const [notes, setNotes] = useState("");
	const [followupRecommendation, setFollowupRecommendation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [modalError, setModalError] = useState<string | null>(null);


	const plantOptions = useMemo(
		() =>
			[...new Set(items.map((e) => e.plant).filter((v) => v && v !== "-"))].sort(),
		[items],
	);

	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(items.map((e) => e.tipeObjek).filter((v) => v && v !== "-")),
			].sort(),
		[items],
	);

	const isAntreanItem = (item: RevalidasiItem) =>
		item.statusAset === "REPAIR_COMPLETED";

	const antreanCount = useMemo(
		() => items.filter(isAntreanItem).length,
		[items],
	);

	const riwayatCount = useMemo(
		() => items.filter((item) => !isAntreanItem(item)).length,
		[items],
	);

	const filteredItems = useMemo(() => {
		let result = items;

		result = result.filter((item) => {
			const isAntrean = isAntreanItem(item);
			return activeTab === "antrean" ? isAntrean : !isAntrean;
		});

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
	}, [items, activeTab, searchQuery, filterPlant, filterTipeObjek]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	const handleSearch = () => {
		setSearchQuery(searchInput);
		setCurrentPage(1);
	};

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setCurrentPage(1);
	};

	const handleOpenModal = (
		asset: RevalidasiItem,
		mode: "VALIDASI" | "DETAIL" = "VALIDASI",
	) => {
		setSelectedAsset(asset);
		setModalMode(mode);
		setHasilStatus("");
		setNotes("");
		setFollowupRecommendation("");
		setModalError(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedAsset(null);
		setModalMode("VALIDASI");
		setHasilStatus("");
		setNotes("");
		setFollowupRecommendation("");
		setModalError(null);
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!selectedAsset || !hasilStatus || isSubmitting) return;

		if (!notes.trim()) {
			setModalError("Catatan / temuan inspeksi wajib diisi.");
			return;
		}
		setIsSubmitting(true);
		setModalError(null);
		try {
			const result = await createRevalidation(selectedAsset.id, hasilStatus, {
				notes,
				followupRecommendation,
			});

			if (result.success) {
				if (hasilStatus === "REVALIDATION") {
					setNotification({
						type: "success",
						message: `Validasi ulang ${selectedAsset.kodeAlat} berhasil disimpan: Perbaikan dinyatakan BERHASIL, status naik ke REVALIDATION (menunggu persetujuan Rendal).`,
					});
				} else if (hasilStatus === "DISPOSAL_RECOMMENDED") {
					setNotification({
						type: "error",
						message: `Validasi ulang ${selectedAsset.kodeAlat} berhasil disimpan: Tidak layak pakai, status DISPOSAL_RECOMMENDED (usulan scrap).`,
					});
				} else {
					setNotification({
						type: "error",
						message: `Validasi ulang ${selectedAsset.kodeAlat} berhasil disimpan: Masih perlu perbaikan, status kembali ke REPAIR.`,
					});
				}

				handleCloseModal();
				// Server action sudah revalidateApp(); tarik payload RSC terbaru.
				router.refresh();
			} else {
				setModalError(result.message || "Gagal menyimpan re-validasi ke database.");
			}
		} catch (err) {
			setModalError(
				err instanceof Error
					? err.message
					: "Terjadi kesalahan koneksi ke database.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getConditionBadge = (kondisi: string) => {
		const k = (kondisi || "").toUpperCase();
		if (k === "BAIK" || k === "BAGUS") return "bg-[#DCFCE7] text-[#16A34A]";
		if (k === "-" || !k) return "bg-gray-100 text-gray-500";
		if (k.includes("RUSAK BERAT") || k.includes("SCRAP"))
			return "bg-[#FEE2E2] text-[#DC2626]";
		return "bg-[#FEF3C7] text-[#B45309]";
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-white text-[#0F172A] px-5 py-3 rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-[#059669]" />
					) : (
						<XCircle className="w-4 h-4 text-[#DC2626]" />
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
					<span className="text-[#0A356A] font-semibold">
						Validasi Perbaikan Alat
					</span>
				</div>
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-gray-900 tracking-tight">
						Validasi Perbaikan Alat
					</h1>
					<button
						onClick={() => router.refresh()}
						className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-[#0A356A] transition-colors"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						Muat Ulang
					</button>
				</div>
				<p className="text-[13px] text-gray-500 mt-1">
					Pemeriksaan ulang aset yang telah selesai perbaikan oleh Pemeliharaan
					Lapangan.
				</p>
			</div>

			{/* Main Content Area (Tabel) */}
			<div className="bg-white border border-gray-200 rounded overflow-hidden scroll-mt-4">
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
						<span>Antrean Validasi Perbaikan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "antrean"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{antreanCount}
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
						<span>Riwayat Validasi Perbaikan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold ${
								activeTab === "riwayat"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{riwayatCount}
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
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={handleSearch}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded hover:bg-[#0556B3] transition-colors whitespace-nowrap"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={filterPlant}
							onChange={(e) => setFilterPlant(e.target.value)}
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
							onChange={(e) => setFilterTipeObjek(e.target.value)}
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

						{/* Reset Button */}
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
				<div className="overflow-hidden">
					<table className="w-full text-left border-collapse table-fixed">
						<thead className="bg-[#F2F3F4]">
							<tr className="border-b border-gray-300">
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-center w-[4%]">
									No
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-left w-[10%]">
									Kode Alat
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-left w-[16%]">
									Nama Peralatan
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-left w-[12%]">
									Tipe Objek
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-left w-[9%]">
									Plant
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-left w-[15%]">
									Lokasi
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-center w-[13%]">
									Kondisi
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-center w-[11%]">
									Tgl Selesai
								</th>
								<th className="px-2 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-wide text-center w-[10%]">
									Tindakan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white">
						{paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												{searchQuery || filterPlant || filterTipeObjek
													? "Hasil Pencarian Tidak Ditemukan"
													: activeTab === "antrean"
														? "Tidak Ada Antrean Validasi Perbaikan"
														: "Belum Ada Riwayat Validasi Perbaikan"}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{searchQuery || filterPlant || filterTipeObjek
													? "Coba sesuaikan kata kunci atau filter pencarian Anda."
													: activeTab === "antrean"
														? "Aset yang telah selesai diperbaiki oleh Pemeliharaan Lapangan akan muncul di sini."
														: "Peralatan yang telah selesai divalidasi ulang akan muncul di sini."}
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedItems.map((asset, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									const isAntreanRow = isAntreanItem(asset);
									return (
										<tr
											key={asset.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-[#F2F3F4] transition-colors group"
										>
											<td className="px-3 py-3 text-[13px] text-gray-500 font-medium text-center">
												{rowNum}
											</td>
											<td
												className="px-2 py-3 text-[12px] font-semibold text-[#0A356A] text-left"
												title={asset.kodeAlat}
											>
												<span className="line-clamp-2 block break-words leading-tight">
													{asset.kodeAlat}
												</span>
											</td>
											<td
												className="px-2 py-3 text-[12px] font-semibold text-gray-800 text-left"
												title={asset.namaAlat}
											>
												<span className="leading-tight line-clamp-2 block text-left">
													{asset.namaAlat}
												</span>
											</td>
											<td
												className="px-2 py-3 text-[12px] text-gray-600 font-medium text-left"
												title={asset.tipeObjek}
											>
												<span className="line-clamp-2 block leading-tight">
													{asset.tipeObjek}
												</span>
											</td>
											<td
												className="px-2 py-3 text-[12px] text-gray-600 font-medium text-left"
												title={asset.plant}
											>
												<span className="line-clamp-2 block leading-tight">
													{asset.plant}
												</span>
											</td>
											<td
												className="px-2 py-3 text-[12px] text-gray-600 font-medium text-left"
												title={asset.lokasiPenyimpanan}
											>
												<span className="line-clamp-2 block leading-tight">
													{asset.lokasiPenyimpanan}
												</span>
											</td>
											<td className="px-2 py-3 text-center whitespace-nowrap">
												<span
													className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getConditionBadge(asset.kondisiSebelumnya)}`}
												>
													{asset.kondisiSebelumnya}
												</span>
											</td>
											<td className="px-2 py-3 text-[11px] text-gray-600 font-medium text-center whitespace-nowrap">
												{asset.tanggalSelesai}
											</td>
											<td className="px-2 py-3 text-center whitespace-nowrap">
												<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
													{isAntreanRow ? (
														<button
															onClick={() => handleOpenModal(asset, "VALIDASI")}
															className="inline-flex items-center gap-1 bg-[#0A356A] hover:bg-[#0556B3] text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-150"
															title="Validasi Perbaikan Alat"
														>
															<ClipboardCheck className="h-3.5 w-3.5" />
															Validasi
														</button>
													) : (
														<button
															onClick={() => handleOpenModal(asset, "DETAIL")}
															className="inline-flex items-center gap-1 text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
															title="Lihat Detail"
														>
															<Eye className="h-3.5 w-3.5" />
															Detail
														</button>
													)}
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
						{filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari{" "}
						{filteredItems.length} data (10 baris/halaman)
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
							{Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(
								(page) => (
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
								),
							)}
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

			{/* Modal Validasi / Detail Perbaikan Alat */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/50 p-4 animate-in fade-in duration-200">
					<div className="bg-white rounded w-full max-w-lg overflow-hidden border border-[#E6E8EA] flex flex-col max-h-[90vh] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] animate-in zoom-in-95 fade-in duration-200">
						{modalMode === "DETAIL" ? (
							<>
								{/* Detail Header */}
								<div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E6E8EA]">
									<div className="min-w-0">
										<h2
											id="modal-title"
											className="text-[14px] font-semibold leading-tight text-[#0F172A]"
										>
											Detail Validasi Perbaikan Alat
										</h2>
										<p className="mt-0.5 truncate font-mono text-[12px] text-[#64748B]">
											{selectedAsset.kodeAlat} · {selectedAsset.namaAlat}
										</p>
									</div>
									<button
										onClick={handleCloseModal}
										aria-label="Tutup dialog"
										className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#64748B] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0F172A]"
									>
										<X className="h-4 w-4" />
									</button>
								</div>

								{/* Detail Body */}
								<div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
									<div className="bg-[#F2F3F4] border border-[#E6E8EA] rounded p-3 grid grid-cols-2 gap-3 text-xs">
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Kode Alat
											</p>
											<p className="font-bold text-[#0F172A]">{selectedAsset.kodeAlat}</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Nama Peralatan
											</p>
											<p className="font-bold text-[#0F172A]">{selectedAsset.namaAlat}</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Tipe Objek
											</p>
											<p className="font-semibold text-[#0F172A]">
												{selectedAsset.tipeObjek}
											</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Plant
											</p>
											<p className="font-semibold text-[#0F172A]">{selectedAsset.plant}</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Lokasi Simpan
											</p>
											<p className="font-semibold text-[#0F172A]">
												{selectedAsset.lokasiPenyimpanan}
											</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Kondisi
											</p>
											<div className="mt-0.5">
												<span
													className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getConditionBadge(selectedAsset.kondisiSebelumnya)}`}
												>
													{selectedAsset.kondisiSebelumnya}
												</span>
											</div>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Tanggal Selesai
											</p>
											<p className="font-semibold text-[#0F172A]">
												{selectedAsset.tanggalSelesai}
											</p>
										</div>
										<div>
											<p className="text-[#64748B] text-[11px] font-medium mb-0.5">
												Status Aset
											</p>
											<div className="mt-0.5">
												<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
													VALIDATED
												</span>
											</div>
										</div>
									</div>

									<div className="bg-white border border-[#E6E8EA] rounded p-3 space-y-2 text-xs">
										<div className="flex justify-between py-1 border-b border-gray-100">
											<span className="text-[#64748B] font-medium">Vendor / Pabrikan</span>
											<span className="font-semibold text-[#0F172A]">
												{selectedAsset.vendor || "-"}
											</span>
										</div>
										<div className="flex justify-between py-1 border-b border-gray-100">
											<span className="text-[#64748B] font-medium">No. Seri</span>
											<span className="font-semibold text-[#0F172A]">
												{selectedAsset.serialNumber || "-"}
											</span>
										</div>
										<div className="flex justify-between py-1 border-b border-gray-100">
											<span className="text-[#64748B] font-medium">Tahun</span>
											<span className="font-semibold text-[#0F172A]">
												{selectedAsset.tahun || "-"}
											</span>
										</div>
										<div className="flex justify-between py-1 border-b border-gray-100">
											<span className="text-[#64748B] font-medium">Alasan Idle</span>
											<span className="font-semibold text-[#0F172A]">
												{selectedAsset.alasanIdle || "-"}
											</span>
										</div>
										<div className="pt-1">
											<span className="text-[#64748B] font-medium block mb-1">
												Catatan
											</span>
											<p className="text-[#0F172A] leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
												{selectedAsset.catatan || "-"}
											</p>
										</div>
									</div>
								</div>

								{/* Detail Footer */}
								<div className="px-6 py-3.5 border-t border-[#E6E8EA] bg-gray-50 flex justify-end">
									<button
										onClick={handleCloseModal}
										className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										Tutup
									</button>
								</div>
							</>
						) : (
							<>
								{/* Modal Header */}
								<div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E6E8EA]">
									<div className="min-w-0">
										<h2
											id="modal-title"
											className="text-[14px] font-semibold leading-tight text-[#0F172A]"
										>
											Validasi Perbaikan Alat
										</h2>
										<p className="mt-0.5 truncate font-mono text-[12px] text-[#64748B]">
											{selectedAsset.kodeAlat} · {selectedAsset.namaAlat}
										</p>
									</div>
									<button
										onClick={handleCloseModal}
										aria-label="Tutup dialog"
										className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#64748B] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0F172A]"
									>
										<X className="h-4 w-4" />
									</button>
								</div>

								{/* Modal Body */}
								<div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
									{/* Info Aset */}
									<div className="bg-gray-50 rounded p-3 border border-gray-200 grid grid-cols-2 gap-2 text-xs">
										<div>
											<p className="text-gray-500 font-medium">Tipe Objek</p>
											<p className="text-gray-800 font-semibold">
												{selectedAsset.tipeObjek}
											</p>
										</div>
										<div>
											<p className="text-gray-500 font-medium">Plant</p>
											<p className="text-gray-800 font-semibold">{selectedAsset.plant}</p>
										</div>
										<div>
											<p className="text-gray-500 font-medium">Lokasi</p>
											<p className="text-gray-800 font-semibold">
												{selectedAsset.lokasiPenyimpanan}
											</p>
										</div>
										<div>
											<p className="text-gray-500 font-medium">Kondisi Sebelumnya</p>
											<p className="text-gray-800 font-semibold">
												{selectedAsset.kondisiSebelumnya}
											</p>
										</div>
									</div>

									{/* Hasil Validasi Ulang (status tujuan) */}
									<div>
										<label className="text-xs font-bold text-gray-700 block mb-1.5">
											Hasil Validasi Ulang <span className="text-[#DC2626]">*</span>
										</label>
										<div className="grid grid-cols-1 gap-2">
											{[
												{
													value: "REVALIDATION",
													title: "Perbaikan Berhasil",
													desc: "Aset layak, lanjut ke persetujuan Rendal",
												},
												{
													value: "REPAIR",
													title: "Masih Perlu Perbaikan",
													desc: "Kembali ke antrean perbaikan",
												},
												{
													value: "DISPOSAL_RECOMMENDED",
													title: "Tidak Layak Pakai",
													desc: "Usul scrap / penghapusan",
												},
											].map((opt) => (
												<label
													key={opt.value}
													className={`flex items-start gap-2.5 border rounded p-2.5 cursor-pointer transition-all ${
														hasilStatus === opt.value
															? "border-[#0A356A] bg-blue-50/40"
															: "border-gray-200 bg-white hover:bg-gray-50"
													}`}
												>
													<input
														type="radio"
														name="hasil-validasi-ulang"
														value={opt.value}
														checked={hasilStatus === opt.value}
														onChange={(e) => setHasilStatus(e.target.value)}
														className="mt-0.5 accent-[#0A356A]"
													/>
													<span>
														<span className="block text-sm font-semibold text-gray-800">
															{opt.title}
														</span>
														<span className="block text-[11px] text-gray-500">
															→ Status {opt.value.replace(/_/g, " ")} — {opt.desc}
														</span>
													</span>
												</label>
											))}
										</div>

										{/* Dynamic Impact Indicator Card */}
										{hasilStatus === "REVALIDATION" && (
											<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200 border border-[#059669] bg-white rounded p-3 text-xs text-[#334155] flex items-start gap-2.5">
												<CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
												<div>
													<p className="font-bold text-[#059669]">
														Status Naik ke REVALIDATION
													</p>
													<p className="text-[11px] text-[#059669] mt-0.5 leading-relaxed">
														Perbaikan dinyatakan berhasil. Aset akan diteruskan ke{" "}
														<strong>Rendal Pemeliharaan</strong> untuk persetujuan status{" "}
														<strong>Ready to Use</strong>.
													</p>
												</div>
											</div>
										)}
										{hasilStatus === "REPAIR" && (
											<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200 border border-[#B45309] bg-white rounded p-3 text-xs text-[#334155] flex items-start gap-2.5">
												<Wrench className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
												<div>
													<p className="font-bold text-[#B45309]">
														Status Kembali ke REPAIR
													</p>
													<p className="text-[11px] text-[#B45309] mt-0.5 leading-relaxed">
														Aset masih mengalami kendala teknis dan akan dikembalikan ke
														antrean perbaikan <strong>Pemeliharaan Lapangan</strong>.
													</p>
												</div>
											</div>
										)}
										{hasilStatus === "DISPOSAL_RECOMMENDED" && (
											<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200 border border-[#DC2626] bg-white rounded p-3 text-xs text-[#334155] flex items-start gap-2.5">
												<Trash2 className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
												<div>
													<p className="font-bold text-[#DC2626]">
														Status Dialihkan ke DISPOSAL_RECOMMENDED
													</p>
													<p className="text-[11px] text-[#DC2626] mt-0.5 leading-relaxed">
														Kerusakan berat dan tidak ekonomis diperbaiki. Aset
														direkomendasikan untuk proses usulan{" "}
														<strong>Scrap / Penghapusan</strong>.
													</p>
												</div>
											</div>
										)}
									</div>

									{/* Catatan */}
									<div>
										<label className="text-xs font-bold text-gray-700 block mb-1.5">
											Catatan Pemeriksaan
										</label>
										<textarea
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											rows={3}
											placeholder="Hasil pemeriksaan visual, fungsi mekanik/elektrik, dll."
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all resize-none"
										/>
									</div>

									{/* Rekomendasi */}
									<div>
										<label className="text-xs font-bold text-gray-700 block mb-1.5">
											Rekomendasi Tindak Lanjut
										</label>
										<input
											type="text"
											value={followupRecommendation}
											onChange={(e) => setFollowupRecommendation(e.target.value)}
											placeholder="Misal: Dapat dimobilisasi segera"
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all"
										/>
									</div>

									{/* Error */}
									{modalError && (
										<div className="flex items-start gap-2 border border-[#DC2626] bg-white rounded p-3">
											<AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
											<p className="text-xs text-[#DC2626] font-medium">{modalError}</p>
										</div>
									)}
								</div>

								{/* Modal Footer */}
								<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
									<button
										onClick={handleCloseModal}
										disabled={isSubmitting}
										className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
									>
										Batal
									</button>
									<button
										onClick={() => setIsConfirmOpen(true)}
										disabled={isSubmitting || !hasilStatus}
										className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Save className="w-4 h-4" />
										)}
										{isSubmitting ? "Menyimpan..." : "Simpan Validasi"}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSubmit();
				}}
				title="Kirim Hasil Validasi Ulang?"
				description={`Hasil pemeriksaan ulang ${selectedAsset?.kodeAlat ?? ""} akan disimpan dan status aset berubah menjadi ${hasilStatus.replace(/_/g, " ")}.`}
				confirmLabel="Ya, Kirim"
				pendingLabel="Mengirim..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
