"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments, completeEquipmentMaintenance } from "@/action/api";
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
	ClipboardCheck,
} from "lucide-react";

interface MaintenanceEquipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	tipeObjek: string;
	plant: string;
	lokasiPenyimpanan: string;
	kondisi: string;
	terakhirDiperbarui: string;
	statusAset: string;
	statusId: number;
}

const INITIAL_MAINTENANCE_SAMPLES: MaintenanceEquipment[] = [];

export default function PerbaikanAlatPage() {
	const [equipments, setEquipments] = useState<MaintenanceEquipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const [selectedAsset, setSelectedAsset] = useState<MaintenanceEquipment | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [actualCost, setActualCost] = useState("0");
	const [displayCost, setDisplayCost] = useState("Rp 0");
	const [conditionId, setConditionId] = useState("");
	const [preservationStatus, setPreservationStatus] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [modalError, setModalError] = useState<string | null>(null);

	const loadEquipments = async () => {
		setIsLoading(true);
		try {
			const data = await getEquipments();
			let filteredData: MaintenanceEquipment[] = [];

			if (Array.isArray(data) && data.length > 0) {
				filteredData = data
					.filter((item: any) => {
						const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
						const isRepair =
							item.status_id === 3 ||
							item.status?.id === 3 ||
							statusName === "REPAIR" ||
							statusName === "MAINTENANCE" ||
							statusName === "DALAM_PERBAIKAN";
						const isRepairCompleted =
							item.status_id === 4 ||
							item.status_id === 5 ||
							item.status_id === 6 ||
							item.status?.id === 4 ||
							item.status?.id === 5 ||
							item.status?.id === 6 ||
							statusName === "REPAIR_COMPLETED" ||
							statusName === "REVALIDATION" ||
							statusName === "READY_TO_USE" ||
							statusName === "READY TO USE" ||
							statusName === "READY_TO_REUSE";
						return isRepair || isRepairCompleted;
					})
					.map((item: any) => {
						const plantStr = typeof item.plant === "string" ? item.plant : item.plant?.name || item.plant?.description || "-";
						const storageStr =
							typeof item.storage_location === "string" ? item.storage_location : item.storage_location?.name || "-";
						const objectTypeStr =
							typeof item.object_type === "string" ? item.object_type : item.object_type?.name || "-";
						const conditionStr = typeof item.condition === "string" ? item.condition : item.condition?.name || "-";

						const rawStatusId = item.status_id || item.status?.id || 3;
						const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();

						let displayStatusName = "MAINTENANCE";
						if (rawStatusId === 6 || statusName === "READY_TO_USE" || statusName === "READY TO USE") {
							displayStatusName = "READY_TO_USE";
						} else if (rawStatusId === 5 || statusName === "REVALIDATION" || statusName === "REVALIDASI") {
							displayStatusName = "REVALIDATION";
						} else if (rawStatusId === 4 || statusName === "REPAIR_COMPLETED") {
							displayStatusName = "REPAIR_COMPLETED";
						} else if (rawStatusId === 8 || statusName === "SCRAP") {
							displayStatusName = "SCRAP";
						}

						return {
							id: String(item.id),
							kodeAlat: item.equipment_code || item.kodeAlat || "-",
							namaAlat: typeof item.name === "string" ? item.name : item.name?.name || item.namaAlat || "-",
							tipeObjek: objectTypeStr,
							plant: plantStr,
							lokasiPenyimpanan: storageStr,
							kondisi: conditionStr,
							terakhirDiperbarui: item.updated_at
								? new Date(item.updated_at).toISOString().split("T")[0]
								: item.created_at
									? new Date(item.created_at).toISOString().split("T")[0]
									: new Date().toISOString().split("T")[0],
							statusAset: displayStatusName,
							statusId: rawStatusId,
						};
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
		loadEquipments();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeTab, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const plantOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.plant).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);
	const tipeObjekOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.tipeObjek).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);
	const kondisiOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.kondisi).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);

	const antreanCount = useMemo(() => {
		return equipments.filter((item) => item.statusAset === "MAINTENANCE" || item.statusId === 3).length;
	}, [equipments]);

	const riwayatCount = useMemo(() => {
		return equipments.filter((item) => item.statusAset !== "MAINTENANCE" && item.statusId !== 3).length;
	}, [equipments]);

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

		result = result.filter((item) => {
			const isAntrean = item.statusAset === "MAINTENANCE" || item.statusId === 3;
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
	}, [equipments, activeTab, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

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
		setConditionId("");
		setPreservationStatus("");
		setModalError(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		if (isSubmitting) return;
		setIsModalOpen(false);
		setSelectedAsset(null);
		setModalError(null);
	};

	const isCostValid = useMemo(() => {
		if (!actualCost) return false;
		const num = parseFloat(actualCost);
		return !isNaN(num) && num >= 0 && /^\d+$/.test(actualCost);
	}, [actualCost]);

	const isConditionValid = useMemo(() => {
		return conditionId === "1" || conditionId === "2";
	}, [conditionId]);

	const isPreservationValid = useMemo(() => {
		return preservationStatus === "Preserved" || preservationStatus === "Not Preserved";
	}, [preservationStatus]);

	const isFormInvalid = !isCostValid || !isConditionValid || !isPreservationValid;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isFormInvalid || !selectedAsset || isSubmitting) return;

		setIsSubmitting(true);
		setNotification(null);

		try {
			const formData = new FormData();
			formData.append("actual_cost", actualCost);
			formData.append("condition_id", conditionId);
			formData.append("preservation_status", preservationStatus);

			const result = await completeEquipmentMaintenance(selectedAsset.id, formData);

			if (result.success) {
				setEquipments((prev) =>
					prev.map((item) =>
						item.id === selectedAsset.id
							? {
									...item,
									statusAset: "REPAIR_COMPLETED",
									statusId: 4,
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
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast */}
			{notification && (
				<div
					className={`fixed top-6 right-6 z-[70] px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
						notification.type === "success" ? "bg-gray-900 text-white" : "bg-red-950 text-white"
					}`}
				>
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					) : (
						<XCircle className="w-4 h-4 text-red-400 shrink-0" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
					<button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white ml-2">
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Pemeliharaan Lapangan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Perbaikan Alat</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">Daftar Perbaikan Aset</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Daftar peralatan yang saat ini berada dalam proses perbaikan (MAINTENANCE).
						</p>
					</div>
					<button
						onClick={loadEquipments}
						disabled={isLoading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
				</div>
			</div>


			{/* Main Card */}
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
						<span>Antrean Perbaikan</span>
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
						<span>Riwayat Perbaikan</span>
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
				<div className="overflow-x-auto lg:overflow-x-hidden">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">No</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Kode Alat</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">Nama Peralatan</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Tipe Objek</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">Plant</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">Lokasi</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Kondisi</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Tgl Diperbarui</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Aksi</th>
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
												{searchQuery || filterPlant || filterTipeObjek || filterKondisi
													? "Hasil Pencarian Tidak Ditemukan"
													: activeTab === "antrean"
														? "Tidak Ada Antrean Perbaikan"
														: "Belum Ada Riwayat Perbaikan"}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{searchQuery || filterPlant || filterTipeObjek || filterKondisi
													? "Coba sesuaikan kata kunci atau filter pencarian Anda."
													: activeTab === "antrean"
														? "Saat ini belum ada peralatan yang membutuhkan perbaikan."
														: "Peralatan yang telah selesai diperbaiki akan muncul di sini."}
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedEquipments.map((asset, index) => (
									<tr key={asset.id} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
										<td className="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">
											{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td className="px-3 py-3 text-[15px] font-semibold text-[#0A356A] text-left whitespace-nowrap">
											{asset.kodeAlat}
										</td>
										<td className="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left" title={asset.namaAlat}>
											<span className="leading-tight line-clamp-2 block text-left">{asset.namaAlat}</span>
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
												{asset.statusAset === "READY_TO_USE" ? (
													<span className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm">
														<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
														Selesai
													</span>
												) : asset.statusAset === "REVALIDATION" ? (
													<span className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-[#0A356A] border border-blue-200 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm">
														<ClipboardCheck className="w-3.5 h-3.5 text-[#0A356A]" />
														Menunggu Persetujuan Rendal
													</span>
												) : asset.statusAset === "REPAIR_COMPLETED" ? (
													<span className="inline-flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm">
														<RefreshCw className="w-3.5 h-3.5 text-amber-600" />
														Menunggu Validasi Ulang
													</span>
												) : asset.statusAset === "SCRAP" ? (
													<span className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shadow-sm">
														<XCircle className="w-3.5 h-3.5 text-red-600" />
														Rekomendasi Scrap
													</span>
												) : (
													<button
														onClick={() => handleOpenModal(asset)}
														className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] hover:bg-[#062854] text-white px-3 py-1.5 rounded-md text-[13px] font-bold transition-all shadow-sm"
														title="Selesaikan Perbaikan"
													>
														<Wrench className="w-3.5 h-3.5" />
														Selesaikan
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

				{/* Pagination */}
				<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
					<span className="text-[11px] font-medium text-gray-500">
						Menampilkan{" "}
						{filteredEquipments.length === 0
							? 0
							: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredEquipments.length)}{" "}
						dari {filteredEquipments.length} data ({ITEMS_PER_PAGE} baris/halaman)
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

			{/* Modal */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						{/* Modal Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Wrench className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white">Pencatatan Hasil Perbaikan</h2>
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
						<form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
							{/* Info box */}
							<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs text-gray-600 leading-normal">
								Lengkapi detail realisasi perbaikan di bawah ini untuk mengubah status peralatan menjadi{" "}
								<strong className="text-[#0A356A]">Ready to Use</strong>.
							</div>

							{/* Biaya Aktual */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Biaya Aktual Perbaikan (Rupiah) <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={displayCost}
									onChange={handleCostChange}
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-mono"
								/>
								<p className="text-[11px] text-gray-500 mt-1">Format ketikan otomatis menjadi mata uang Rupiah.</p>
							</div>

							{/* Grid: Kondisi & Preservasi */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
								<div className="flex flex-col">
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5 min-h-[32px] flex items-end">
										<span>Kondisi Aset Setelah Perbaikan <span className="text-red-500">*</span></span>
									</label>
									<select
										value={conditionId}
										onChange={(e) => setConditionId(e.target.value)}
										className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
									>
										<option value="">-- Pilih Kondisi --</option>
										<option value="1">Bagus</option>
										<option value="2">Rusak Ringan</option>
									</select>
									<p className="text-[11px] text-gray-500 mt-1.5 leading-tight">
										Pilih kondisi fisik aktual aset setelah perbaikan selesai.
									</p>
								</div>

								<div className="flex flex-col">
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5 min-h-[32px] flex items-end">
										<span>Status Preservasi Terbaru <span className="text-red-500">*</span></span>
									</label>
									<select
										value={preservationStatus}
										onChange={(e) => setPreservationStatus(e.target.value)}
										className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium text-gray-800 cursor-pointer"
									>
										<option value="">-- Pilih Preservasi --</option>
										<option value="Preserved">Preserved</option>
										<option value="Not Preserved">Not Preserved</option>
									</select>
									<p className="text-[11px] text-gray-500 mt-1.5 leading-tight">
										Pilih apakah aset masih memerlukan preservasi setelah perbaikan.
									</p>
								</div>
							</div>

							{/* Footer */}
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
									type="submit"
									disabled={isFormInvalid || isSubmitting}
									className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<CheckCircle2 className="w-4 h-4" />
									)}
									{isSubmitting ? "Menyimpan..." : "Selesai Perbaikan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}