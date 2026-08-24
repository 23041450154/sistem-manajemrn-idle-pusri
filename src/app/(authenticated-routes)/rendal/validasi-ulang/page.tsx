"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
	getEquipments,
	getApprovals,
	approveRevalidationEquipment,
} from "@/action/api";
import { statusName as canonStatus } from "@/lib/equipment-status";
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
	XCircle,
	Eye,
} from "lucide-react";

interface ValidasiUlangItem {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisi: string;
	tanggalRevalidasi: string;
	statusAset: string;
	statusId: number;
	approvalId?: string;
	approvalStatus?: string;
	catatanInspeksi?: string;
}

export default function RendalValidasiUlangPage() {
	const [items, setItems] = useState<ValidasiUlangItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof ValidasiUlangItem;
		direction: "asc" | "desc";
	} | null>(null);

	// Modal State
	const [selectedAsset, setSelectedAsset] = useState<ValidasiUlangItem | null>(
		null,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"APPROVAL" | "DETAIL">("APPROVAL");
	const [approvalNotes, setApprovalNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [data, approvalsData] = await Promise.all([
				getEquipments(),
				// Halaman ini menangani validasi ulang -> approval jenis REVALIDATION.
				getApprovals("revalidation").catch(() => []),
			]);

			const approvalsList = Array.isArray(approvalsData)
				? approvalsData
				: (approvalsData as any)?.data || [];

			let filtered: ValidasiUlangItem[] = [];

			if (Array.isArray(data) && data.length > 0) {
				filtered = data
					.filter((item: any) => {
						const statusName = canonStatus(item.status?.name || item.statusAset);
						const isRevalidation = statusName === "REVALIDATION";
						const isReadyToUse = statusName === "READY_TO_USE";
						return isRevalidation || isReadyToUse;
					})
					.map((item: any) => {
						const plantStr =
							typeof item.plant === "string"
								? item.plant
								: item.plant?.name || item.plant?.description || "-";
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
								: item.condition?.name || "BAGUS";

						const statusName = String(
							item.status?.name || item.statusAset || "",
						).toUpperCase();
						const isReady = statusName === "READY_TO_USE";

						const matchingApproval = approvalsList.find(
							(a: any) =>
								String(a.equipment_id) === String(item.id) ||
								String(a.equipment?.id) === String(item.id),
						);

						let displayStatus = "REVALIDATION";
						let displayStatusId = 5;
						if (isReady) {
							displayStatus = "READY_TO_USE";
							displayStatusId = 6;
						}

						const approvalStatus =
							matchingApproval?.approval_status ||
							(isReady ? "APPROVED" : "PENDING");

						return {
							id: String(item.id),
							kodeAlat: item.equipment_code || item.kodeAlat || "-",
							namaAlat:
								typeof item.name === "string"
									? item.name
									: item.name?.name || item.namaAlat || "-",
							tipeObjek: objectTypeStr,
							plant: plantStr,
							lokasiPenyimpanan: storageStr,
							kondisi: conditionStr.replace(/_/g, " "),
							tanggalRevalidasi: item.updated_at
								? new Date(item.updated_at).toISOString().split("T")[0]
								: item.created_at
									? new Date(item.created_at).toISOString().split("T")[0]
									: new Date().toISOString().split("T")[0],
							statusAset: displayStatus,
							statusId: displayStatusId,
							approvalId: matchingApproval?.id
								? String(matchingApproval.id)
								: undefined,
							approvalStatus: approvalStatus,
							catatanInspeksi:
								item.notes ||
								"Hasil validasi ulang menunjukkan kondisi alat siap pakai.",
						};
					});
				filtered.sort((a: any, b: any) => {
					const timeA = a.tanggalRevalidasi ? new Date(a.tanggalRevalidasi).getTime() : 0;
					const timeB = b.tanggalRevalidasi ? new Date(b.tanggalRevalidasi).getTime() : 0;
					if (timeB !== timeA) return timeB - timeA;
					return (Number(b.id) || 0) - (Number(a.id) || 0);
				});
			}

			setItems(filtered);
		} catch (err) {
			console.error("Error loading validasi ulang data in rendal:", err);
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
		void loadData();
	}, [loadData]);

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

	const antreanCount = useMemo(() => {
		return items.filter((item) => item.statusAset !== "READY_TO_USE").length;
	}, [items]);

	const riwayatCount = useMemo(() => {
		return items.filter((item) => item.statusAset === "READY_TO_USE").length;
	}, [items]);

	const handleSearch = () => setSearchQuery(searchInput);

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setCurrentPage(1);
		setSortConfig(null);
	};

	const filteredItems = useMemo(() => {
		let result = items;

		result = result.filter((item) => {
			const isReady = item.statusAset === "READY_TO_USE";
			return activeTab === "antrean" ? !isReady : isReady;
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

		if (sortConfig) {
			result = [...result].sort((a, b) => {
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return result;
	}, [items, activeTab, searchQuery, filterPlant, filterTipeObjek, sortConfig]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	// Halaman dijepit ke rentang valid supaya perubahan filter/tab tidak perlu
	// me-reset currentPage lewat effect.
	const page = Math.min(currentPage, totalPages);
	const paginatedItems = useMemo(() => {
		const start = (page - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredItems, page]);

	const handleSort = (key: keyof ValidasiUlangItem) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const handleOpenModal = (
		asset: ValidasiUlangItem,
		mode: "APPROVAL" | "DETAIL" = "APPROVAL",
	) => {
		setSelectedAsset(asset);
		setModalMode(mode);
		setApprovalNotes("");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		if (isSubmitting) return;
		setIsModalOpen(false);
		setSelectedAsset(null);
		setModalMode("APPROVAL");
		setApprovalNotes("");
	};

	const handleApprove = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!selectedAsset || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const result = await approveRevalidationEquipment(
				selectedAsset.approvalId,
				approvalNotes || selectedAsset.catatanInspeksi,
			);

			if (result.success) {
				setItems((prev) =>
					prev.map((item) =>
						item.id === selectedAsset.id
							? {
									...item,
									statusAset: "READY_TO_USE",
									statusId: 6,
									approvalStatus: "APPROVED",
								}
							: item,
					),
				);
				setNotification({
					type: "success",
					message: `Peralatan ${selectedAsset.kodeAlat} berhasil disetujui!`,
				});
				handleCloseModal();
				await loadData();
			} else {
				setNotification({
					type: "error",
					message: `Gagal menyetujui validasi ulang: ${result.message || "Terjadi kesalahan"}`,
				});
			}
			setTimeout(() => setNotification(null), 3000);
		} catch (err) {
			console.error(err);
			setNotification({
				type: "error",
				message: `Gagal menyetujui validasi ulang: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStatusBadge = (item: ValidasiUlangItem) => {
		const status =
			item.approvalStatus?.toUpperCase() ||
			(item.statusAset === "READY_TO_USE" ? "APPROVED" : "PENDING");

		if (status === "APPROVED") {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
					DISETUJUI
				</span>
			);
		}

		if (status === "REJECTED") {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEE2E2] text-[#DC2626]">
					DITOLAK
				</span>
			);
		}

		if (status === "REVISION_REQUIRED" || status === "REVISION") {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#F3E8FF] text-[#9333EA]">
					PERLU REVISI
				</span>
			);
		}

		if (status === "IN_REVIEW") {
			return (
				<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#E0F2FE] text-[#0284C7]">
					SEDANG DIREVIEW
				</span>
			);
		}

		return (
			<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEF3C7] text-[#B45309]">
				MENUNGGU PERSETUJUAN
			</span>
		);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast */}
			{notification && (
				<div
					className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
						notification.type === "success"
							? "bg-gray-900 text-white"
							: "bg-red-950 text-white"
					}`}
				>
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					) : (
						<XCircle className="w-4 h-4 text-red-400 shrink-0" />
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
			<div className="mb-2">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">
						Persetujuan Perbaikan Alat
					</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Persetujuan Perbaikan Alat
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar peralatan yang telah selesai diperbaiki dan divalidasi ulang oleh
							Inspeksi Teknik untuk disetujui menjadi Ready to Use.
						</p>
					</div>
					<button
						onClick={loadData}
						disabled={isLoading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
			</div>

			{/* Unified Table Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
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
						<span>Antrean Persetujuan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
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
						<span>Riwayat Persetujuan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "riwayat"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{riwayatCount}
						</span>
					</button>
				</div>

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
				<div className="overflow-x-auto lg:overflow-x-hidden">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">
									No
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("kodeAlat")}
								>
									Kode Alat
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									onClick={() => handleSort("namaAlat")}
								>
									Nama Peralatan
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th
									className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left whitespace-nowrap"
									onClick={() => handleSort("plant")}
								>
									Plant
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Kondisi
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Tgl Re-Validasi
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Status
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
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
							) : paginatedItems.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												{searchQuery || filterPlant || filterTipeObjek
													? "Hasil Pencarian Tidak Ditemukan"
													: activeTab === "antrean"
														? "Tidak Ada Antrean Persetujuan"
														: "Belum Ada Riwayat Persetujuan"}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{searchQuery || filterPlant || filterTipeObjek
													? "Coba sesuaikan kata kunci atau filter pencarian Anda."
													: activeTab === "antrean"
														? "Peralatan yang divalidasi ulang oleh Inspeksi Teknik akan muncul di sini."
														: "Peralatan yang telah disetujui Ready to Use akan muncul di sini."}
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
											{(page - 1) * ITEMS_PER_PAGE + index + 1}
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
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-left whitespace-nowrap">
											{asset.plant}
										</td>
										<td className="px-3 py-3 text-center whitespace-nowrap">
											<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
												{asset.kondisi}
											</span>
										</td>
										<td className="px-3 py-3 text-[15px] text-gray-600 font-medium text-center whitespace-nowrap">
											{asset.tanggalRevalidasi}
										</td>
										<td className="px-3 py-3 text-center whitespace-nowrap">
											{renderStatusBadge(asset)}
										</td>
										<td className="px-3 py-3 text-center whitespace-nowrap">
											<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
												{activeTab === "riwayat" || asset.approvalStatus === "APPROVED" || asset.statusAset === "READY_TO_USE" || asset.statusAset === "READY TO USE" ? (
													<button
														onClick={() => handleOpenModal(asset, "DETAIL")}
														className="inline-flex items-center gap-1 text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
														title="Lihat Detail"
													>
														<Eye className="h-3.5 w-3.5" />
														Detail
													</button>
												) : (
													<button
														onClick={() => handleOpenModal(asset, "APPROVAL")}
														className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-md text-[13px] font-bold transition-all shadow-sm"
														title="Setujui Menjadi Ready To Use"
													>
														<ClipboardCheck className="w-3.5 h-3.5" />
														<span>Setujui</span>
													</button>
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
				{!isLoading && filteredItems.length > 0 && (
					<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
						<span className="text-[11px] font-medium text-gray-500">
							Menampilkan{" "}
							{filteredItems.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(page * ITEMS_PER_PAGE, filteredItems.length)} dari{" "}
							{filteredItems.length} data ({ITEMS_PER_PAGE} baris/halaman)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
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
								disabled={page === Math.max(1, totalPages)}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Konfirmasi Persetujuan / Detail */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						{modalMode === "DETAIL" ? (
							<>
								{/* Detail Header */}
								<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
									<div className="flex items-center gap-3">
										<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
											<ClipboardCheck className="w-5 h-5 text-white" />
										</div>
										<div>
											<h2 className="text-base font-bold text-white">
												Detail Persetujuan Re-Validasi
											</h2>
											<p className="text-xs text-blue-100">
												{selectedAsset.kodeAlat} - {selectedAsset.namaAlat}
											</p>
										</div>
									</div>
									<button
										onClick={handleCloseModal}
										className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Detail Body */}
								<div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
									<div className="bg-emerald-50/70 rounded-lg p-3.5 border border-emerald-100 text-xs text-emerald-900 leading-normal">
										Peralatan ini telah <strong className="text-emerald-700">Disetujui</strong> dan status aset diperbarui menjadi{" "}
										<strong className="text-emerald-700">Ready to Use</strong> dan siap
										dimanfaatkan kembali di operasional pabrik.
									</div>

									<div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 grid grid-cols-2 gap-3 text-xs">
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kode Alat
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.kodeAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Nama Peralatan
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.namaAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Plant & Lokasi
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.plant} - {selectedAsset.lokasiPenyimpanan}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Tipe Objek
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.tipeObjek}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kondisi Fisik
											</p>
											<div className="mt-0.5">
												<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#DCFCE7] text-[#16A34A]">
													{selectedAsset.kondisi}
												</span>
											</div>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Tgl Re-Validasi
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.tanggalRevalidasi}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Status Persetujuan
											</p>
											<div className="mt-0.5">
												{renderStatusBadge(selectedAsset)}
											</div>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Status Aset
											</p>
											<div className="mt-0.5">
												<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#E0E7FF] text-[#4F46E5]">
													READY TO USE
												</span>
											</div>
										</div>
									</div>

									{selectedAsset.catatanInspeksi && (
										<div>
											<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
												Catatan Re-Validasi
											</label>
											<p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
												{selectedAsset.catatanInspeksi}
											</p>
										</div>
									)}
								</div>

								{/* Detail Footer */}
								<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
									<button
										type="button"
										onClick={handleCloseModal}
										className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Tutup
									</button>
								</div>
							</>
						) : (
							<>
								{/* Modal Header */}
								<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
									<div className="flex items-center gap-3">
										<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
											<ClipboardCheck className="w-5 h-5 text-white" />
										</div>
										<div>
											<h2 className="text-base font-bold text-white">
												Persetujuan Perbaikan
											</h2>
											<p className="text-xs text-blue-100">
												{selectedAsset.kodeAlat} - {selectedAsset.namaAlat}
											</p>
										</div>
									</div>
									<button
										onClick={handleCloseModal}
										disabled={isSubmitting}
										className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Form */}
								<form
									onSubmit={handleApprove}
									className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
								>
									{/* Info box */}
									<div className="bg-blue-50/70 rounded-lg p-3.5 border border-blue-100 text-xs text-blue-900 leading-normal">
										Peralatan ini telah selesai diperbaiki dan telah dinyatakan{" "}
										<strong>{selectedAsset.kondisi}</strong> pada pemeriksaan ulang oleh
										Inspeksi Teknik.
										<div className="mt-1 text-gray-700">
											Menyetujui tindakan ini akan mengubah status aset secara resmi menjadi{" "}
											<strong className="text-[#0A356A]">Ready to Use</strong>.
										</div>
									</div>

									{/* Detail Ringkasan */}
									<div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 grid grid-cols-2 gap-3 text-xs">
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kode Alat
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.kodeAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Plant & Lokasi
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.plant} - {selectedAsset.lokasiPenyimpanan}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kondisi Fisik
											</p>
											<p className="font-bold text-emerald-700 mt-0.5">
												{selectedAsset.kondisi}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Tgl Re-Validasi
											</p>
											<p className="font-semibold text-gray-800 mt-0.5">
												{selectedAsset.tanggalRevalidasi}
											</p>
										</div>
									</div>

									{/* Catatan Persetujuan */}
									<div>
										<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
											Catatan Persetujuan (Opsional)
										</label>
										<textarea
											rows={3}
											value={approvalNotes}
											onChange={(e) => setApprovalNotes(e.target.value)}
											placeholder="Tambahkan catatan persetujuan atau arahan penempatan aset..."
											className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all resize-none shadow-sm"
										/>
									</div>

									{/* Modal Footer Actions */}
									<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 -mx-6 -mb-5 mt-4">
										<button
											type="button"
											disabled={isSubmitting}
											onClick={handleCloseModal}
											className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
										>
											Batal
										</button>
										<button
											type="button"
											onClick={() => setIsConfirmOpen(true)}
											disabled={isSubmitting}
											className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-lg transition-colors shadow-sm disabled:opacity-50"
										>
											{isSubmitting ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												<CheckCircle2 className="w-4 h-4" />
											)}
											{isSubmitting ? "Menyetujui..." : "Setujui Menjadi Ready To Use"}
										</button>
									</div>
								</form>
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
					handleApprove();
				}}
				title="Setujui Validasi Ulang?"
				description={`${selectedAsset?.kodeAlat ?? ""} — Aset akan ditetapkan READY_TO_USE dan keluar dari antrean persetujuan.`}
				confirmLabel="Ya, Setujui"
				pendingLabel="Memproses..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
