"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import {
	getEquipments,
	getDisposals,
	getInspections,
	getDisposalMethods,
	createDisposalRequest,
	getValidations,
} from "@/action/api";
import {
	Trash2,
	Search,
	RefreshCw,
	FileText,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Upload,
	X,
	ChevronRight,
	Loader2,
	Eye,
	Clock,
} from "lucide-react";

interface Equipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: string;
	storageLocation: string;
	funcLoc: string;
	vendor: string;
	year: string | number;
	originalValue: number;
	notes: string;
}

interface Inspection {
	id: number;
	equipment_id: number;
	notes: string;
	is_utilizable?: boolean;
	condition?: { name?: string };
	require_action?: { name?: string };
	followup_recommendation?: string;
}

interface DisposalMethod {
	id: number;
	name: string;
	description: string;
}

interface DisposalItem {
	id: string;
	equipment_id: string;
	disposal_number: string;
	equipment_code?: string;
	equipment_name?: string;
	disposal_method?: string;
	scrap_value?: number;
	plant?: string;
	justification?: string;
	status?: string;
	created_at?: string;
}

export default function RendalScrapPage() {
	const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");

	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [inspections, setInspections] = useState<Inspection[]>([]);
	const [disposals, setDisposals] = useState<DisposalItem[]>([]);
	const [methods, setMethods] = useState<DisposalMethod[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter & Search
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	// Modal State
	const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedHistoryItem, setSelectedHistoryItem] =
		useState<DisposalItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	// Form Fields State
	const [verificationDate, setVerificationDate] = useState("");
	const [disposalMethodId, setDisposalMethodId] = useState("");
	const [justification, setJustification] = useState("");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	// Hasil validasi teknik (GET /api/validation) — sumber alasan & rekomendasi scrap.
	const [assetValidation, setAssetValidation] = useState<any>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const loadData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [eqData, insData, dispData, methData] = await Promise.all([
				getEquipments(),
				getInspections(),
				getDisposals(),
				getDisposalMethods(),
			]);

			// Build a set of equipment IDs that have a disposal-recommending inspection
			const inspArr: any[] = insData || [];
			const disposalInspectedIds = new Set<string>();
			inspArr.forEach((ins: any) => {
				const isDisposal =
					ins.is_utilizable === false ||
					String(ins.require_action_id) === "4" ||
					ins.require_action?.name?.toLowerCase().includes("disposal") ||
					ins.condition?.name?.toUpperCase() === "RUSAK_BERAT" ||
					ins.condition?.name?.toUpperCase() === "RUSAK BERAT";
				if (isDisposal && ins.equipment_id) {
					disposalInspectedIds.add(String(ins.equipment_id));
				}
			});

			const mappedEq = (eqData || []).map((item: any) => {
				const rawStatus =
					(typeof item.status === "string" ? item.status : item.status?.name) || "";
				const objectTypeName =
					item.object_type?.name || item.objectType?.name || "Belum Ditentukan";

				// Normalize status: replace spaces with underscores, uppercase
				let normalizedStatus = rawStatus.toUpperCase().replace(/\s+/g, "_");

				// If equipment has a disposal-recommending inspection, override status
				const eqId = item.id?.toString() || "-";
				if (
					disposalInspectedIds.has(eqId) &&
					!["DISPOSAL_RECOMMENDED", "SCRAP", "RUSAK_BERAT"].includes(
						normalizedStatus,
					)
				) {
					normalizedStatus = "DISPOSAL_RECOMMENDED";
				}

				return {
					id: eqId,
					kodeAlat: item.equipment_code || "-",
					namaAlat: item.name || "-",
					plant: item.plant?.name || "-",
					jenisAlat: objectTypeName,
					tanggalRegistrasi: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: "-",
					statusAset: normalizedStatus,
					storageLocation: item.storage_location?.name || "-",
					funcLoc:
						typeof item.func_loc === "string"
							? item.func_loc
							: item.func_loc?.name || "-",
					vendor: item.vendor || "-",
					year: item.year || "-",
					originalValue: item.original_value || 0,
					notes: item.notes || "-",
				};
			});

			setEquipments(mappedEq);
			setInspections(insData || []);
			setDisposals(dispData || []);
			setMethods(methData || []);
		} catch (err: any) {
			console.error(err);
			setError("Gagal memuat data dari server.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, activeTab]);

	const showToast = (type: "success" | "error", message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 4000);
	};

	// 1. Filter equipments waiting for scrap request (Tab 1: Antrean Request)
	const pendingAssets = useMemo(() => {
		const submittedIds = new Set(disposals.map((d) => String(d.equipment_id)));
		const query = search.toLowerCase().trim();
		const disposalStatuses = new Set([
			"DISPOSAL_RECOMMENDED",
			"DISPOSAL RECOMMENDED",
			"SCRAP",
			"RUSAK_BERAT",
			"RUSAK BERAT",
			"CONDEMNED",
			"DISPOSED",
		]);
		return equipments.filter((eq) => {
			const normalized = eq.statusAset.replace(/\s+/g, "_");
			const isRecommended =
				disposalStatuses.has(eq.statusAset) || disposalStatuses.has(normalized);
			const isNotSubmitted = !submittedIds.has(eq.id);
			const matchSearch =
				!query ||
				eq.kodeAlat.toLowerCase().includes(query) ||
				eq.namaAlat.toLowerCase().includes(query);
			return isRecommended && isNotSubmitted && matchSearch;
		});
	}, [equipments, disposals, search]);

	// 2. Filter submitted scrap requests (Tab 2: Riwayat Permintaan)
	const historyRequests = useMemo(() => {
		const query = search.toLowerCase().trim();
		return disposals.filter((item) => {
			const matchSearch =
				!query ||
				(item.disposal_number &&
					item.disposal_number.toLowerCase().includes(query)) ||
				(item.equipment_code &&
					item.equipment_code.toLowerCase().includes(query)) ||
				(item.equipment_name && item.equipment_name.toLowerCase().includes(query));
			return matchSearch;
		});
	}, [disposals, search]);

	const currentListLength =
		activeTab === "inbox" ? pendingAssets.length : historyRequests.length;

	const paginatedAssets = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return pendingAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [pendingAssets, currentPage]);

	const paginatedHistory = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return historyRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [historyRequests, currentPage]);

	const totalPages = Math.ceil(currentListLength / ITEMS_PER_PAGE) || 1;

	const handleOpenVerification = async (asset: Equipment) => {
		setSelectedAsset(asset);
		setAssetValidation(null);

		const todayStr = new Date().toISOString().split("T")[0];
		setVerificationDate(todayStr);

		const defaultMethod =
			methods.find((m) => m.name.toLowerCase() === "scrap")?.id?.toString() ||
			methods[0]?.id?.toString() ||
			"";
		setDisposalMethodId(defaultMethod);

		setJustification("");
		setUploadedFile(null);
		setIsModalOpen(true);

		const validations = await getValidations(asset.id);
		if (Array.isArray(validations) && validations.length > 0) {
			setAssetValidation(validations[0]);
		}
	};

	// Find latest inspection details for selected asset
	const assetInspection = useMemo(() => {
		if (!selectedAsset) return null;
		return (
			inspections
				.filter((ins) => String(ins.equipment_id) === String(selectedAsset.id))
				.sort((a, b) => b.id - a.id)[0] || null
		);
	}, [selectedAsset, inspections]);

	// Hasil inspeksi & alasan scrap: validasi teknik lebih otoritatif dari inspeksi berkala.
	const inspectionResult = useMemo(() => {
		const source = assetValidation || assetInspection;
		if (!source) return null;
		const condition = source.condition?.name || source.condition_name;
		const action = source.require_action?.name;
		const utilizable = source.is_utilizable;
		const label =
			utilizable === false
				? "Tidak Layak"
				: utilizable === true
					? "Layak"
					: condition || null;
		if (!label) return null;
		return action ? `${label} (${action})` : label;
	}, [assetValidation, assetInspection]);

	const scrapReason = useMemo(
		() =>
			assetValidation?.followup_recommendation ||
			assetValidation?.notes ||
			assetInspection?.notes ||
			null,
		[assetValidation, assetInspection],
	);

	const handleSubmitVerification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedAsset) return;

		setIsSubmitting(true);
		try {
			const payload = {
				equipment_id: Number(selectedAsset.id),
				disposal_method_id: Number(disposalMethodId),
				scrap_value: 0,
				disposal_date: verificationDate,
				justification:
					justification.trim() ||
					"Diverifikasi oleh Rendal Pemeliharaan untuk pengajuan scrap.",
			};

			const res = await createDisposalRequest(payload);
			if (res.success) {
				if (uploadedFile) {
					const fd = new FormData();
					fd.append("equipment_id", selectedAsset.id);
					fd.append("file", uploadedFile);
					fd.append("category", "disposal_attachment");

					const tokenMatch = document.cookie.match(/(^|;)\s*token\s*=\s*([^;]+)/);
					const token = tokenMatch ? tokenMatch[2] : "";
					const API_URL =
						process.env.NEXT_PUBLIC_API_URL || "https://api.testing.naufal.me";

					await fetch(`${API_URL}/api/attachments/upload`, {
						method: "POST",
						headers: { Authorization: `Bearer ${token}` },
						body: fd,
					}).catch((err) => console.error("Error uploading scrap doc:", err));
				}

				// Update local state so item instantly moves from Inbox to History with PENDING status
				const selectedMethod = methods.find(
					(m) => String(m.id) === String(disposalMethodId),
				);
				const newDisposalItem: DisposalItem = {
					id: String(res.data?.id || `DSP-${Date.now()}`),
					// Nomor usulan berasal dari backend (DISP-<tahun>-<seq>).
					disposal_number: res.data?.disposal_number || "-",
					equipment_id: String(selectedAsset.id),
					equipment_code: selectedAsset.kodeAlat,
					equipment_name: selectedAsset.namaAlat,
					disposal_method: selectedMethod?.name || "Scrap (Besi Tua)",
					scrap_value: 0,
					plant: selectedAsset.plant,
					justification:
						justification.trim() ||
						"Diverifikasi oleh Rendal Pemeliharaan untuk pengajuan scrap.",
					status: "PENDING",
					created_at: new Date().toISOString(),
				};

				setDisposals((prev) => [newDisposalItem, ...prev]);

				// Update equipment status in state
				setEquipments((prev) =>
					prev.map((eq) =>
						eq.id === selectedAsset.id
							? { ...eq, statusAset: "DISPOSAL_VERIFIED" }
							: eq,
					),
				);

				showToast(
					"success",
					"Permintaan scrap berhasil diajukan dan dikirim ke Manajer!",
				);
				setIsModalOpen(false);
				setActiveTab("history");
				await loadData();
			} else {
				showToast("error", res.message || "Gagal menyimpan permintaan scrap.");
			}
		} catch (err) {
			console.error(err);
			showToast(
				"error",
				"Terjadi kesalahan sistem saat mengirim permintaan scrap.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					) : (
						<XCircle className="w-4 h-4 text-red-400" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
				</div>
			)}

			{/* Page Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Permintaan Scrap</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Permintaan Scrap
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Kelola antrean permohonan scrap peralatan Rusak Berat serta pantau
							riwayat persetujuan Manajer Rendal.
						</p>
					</div>
					<button
						onClick={loadData}
						disabled={isLoading}
						className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Muat Ulang
					</button>
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
			{!isLoading && activeTab === "inbox" && pendingAssets.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat{" "}
							<strong className="font-bold">
								{pendingAssets.length} aset Rusak Berat (Scrap)
							</strong>{" "}
							siap diajukan permohonan scrap ke Manajer.
						</span>
					</div>
				</div>
			)}

			{/* Main Table Container */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
				{/* Toolbar / Search & Tabs */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Tabs */}
					<div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
						<button
							onClick={() => setActiveTab("inbox")}
							className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
								activeTab === "inbox"
									? "bg-[#0A356A] text-white shadow-xs"
									: "text-gray-600 hover:bg-gray-200"
							}`}
						>
							Antrean Request ({pendingAssets.length})
						</button>
						<button
							onClick={() => setActiveTab("history")}
							className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
								activeTab === "history"
									? "bg-[#0A356A] text-white shadow-xs"
									: "text-gray-600 hover:bg-gray-200"
							}`}
						>
							Riwayat Permintaan ({historyRequests.length})
						</button>
					</div>

					{/* Search Bar */}
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
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm cursor-pointer"
						>
							Cari
						</button>
						{(search || searchInput) && (
							<button
								onClick={() => {
									setSearch("");
									setSearchInput("");
								}}
								className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
							>
								<RefreshCw className="w-3.5 h-3.5" />
								Reset
							</button>
						)}
					</div>
				</div>

				{/* Table Container */}
				<div className="overflow-x-hidden">
					{activeTab === "inbox" ? (
						/* Tab 1: Antrean Request */
						<table className="w-full text-left border-collapse table-fixed">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[35px]">
										No
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[105px]">
										Kode Alat
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[170px]">
										Nama Peralatan
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[65px]">
										Plant
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[110px]">
										Lokasi
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[95px]">
										Tipe Objek
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[110px]">
										Status
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[90px]">
										Aksi
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-100">
								{isLoading ? (
									<tr>
										<td
											colSpan={8}
											className="px-4 py-8 text-center text-xs text-gray-500"
										>
											<div className="flex flex-col items-center">
												<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
												<p className="font-medium">Memuat data...</p>
											</div>
										</td>
									</tr>
								) : paginatedAssets.length === 0 ? (
									<tr>
										<td
											colSpan={8}
											className="px-4 py-8 text-center text-xs text-gray-500"
										>
											<div className="flex flex-col items-center">
												<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
												<p className="font-bold text-gray-900">Tidak Ada Data</p>
												<p className="text-[11px] text-gray-500 mt-1">
													Tidak ada peralatan Rusak Berat yang menunggu permintaan scrap.
												</p>
											</div>
										</td>
									</tr>
								) : (
									paginatedAssets.map((asset, index) => (
										<tr
											key={asset.id}
											className="hover:bg-gray-50/50 transition-colors h-[48px]"
										>
											<td className="px-2 py-2 text-xs text-gray-500 font-medium text-center">
												{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
											</td>
											<td
												className="px-2 py-2 text-xs font-bold text-[#0A356A] text-center truncate"
												title={asset.kodeAlat}
											>
												{asset.kodeAlat}
											</td>
											<td
												className="px-2 py-2 text-xs font-semibold text-gray-800 text-left truncate"
												title={asset.namaAlat}
											>
												<span className="leading-tight line-clamp-2 block text-left">
													{asset.namaAlat}
												</span>
											</td>
											<td className="px-2 py-2 text-xs text-gray-600 font-medium text-center truncate">
												{asset.plant}
											</td>
											<td
												className="px-2 py-2 text-xs text-gray-600 font-medium text-left truncate"
												title={asset.storageLocation}
											>
												{asset.storageLocation}
											</td>
											<td
												className="px-2 py-2 text-xs text-gray-600 font-medium text-left truncate"
												title={asset.jenisAlat}
											>
												{asset.jenisAlat}
											</td>
											<td className="px-2 py-2 text-center whitespace-nowrap">
												<span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-800">
													RUSAK BERAT
												</span>
											</td>
											<td className="px-2 py-2 text-center w-[90px]">
												<button
													type="button"
													onClick={() => handleOpenVerification(asset)}
													className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
												>
													<Trash2 className="w-3.5 h-3.5" />
													Request
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					) : (
						/* Tab 2: Riwayat Permintaan */
						<table className="w-full text-left border-collapse table-fixed">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[35px]">
										No
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[120px]">
										No. Pengajuan
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[110px]">
										Kode Alat
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left">
										Nama Peralatan
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[120px]">
										Metode Scrap
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[140px]">
										Status Persetujuan
									</th>
									<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[90px]">
										Aksi
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-100">
								{isLoading ? (
									<tr>
										<td
											colSpan={7}
											className="px-4 py-8 text-center text-xs text-gray-500"
										>
											<div className="flex flex-col items-center">
												<Loader2 className="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
												<p className="font-medium">Memuat data riwayat...</p>
											</div>
										</td>
									</tr>
								) : paginatedHistory.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className="px-4 py-8 text-center text-xs text-gray-500"
										>
											<div className="flex flex-col items-center">
												<Clock className="w-6 h-6 text-gray-300 mb-2" />
												<p className="font-bold text-gray-900">Belum Ada Riwayat</p>
												<p className="text-[11px] text-gray-500 mt-1">
													Belum ada permohonan scrap yang pernah diajukan.
												</p>
											</div>
										</td>
									</tr>
								) : (
									paginatedHistory.map((item, index) => (
										<tr
											key={item.id}
											className="hover:bg-gray-50/50 transition-colors h-[48px]"
										>
											<td className="px-2 py-2 text-xs text-gray-500 font-medium text-center">
												{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
											</td>
											<td className="px-2 py-2 text-xs font-bold text-[#0A356A] text-center truncate">
												{item.disposal_number || "-"}
											</td>
											<td className="px-2 py-2 text-xs font-bold text-gray-900 text-center truncate">
												{item.equipment_code || "-"}
											</td>
											<td
												className="px-2 py-2 text-xs font-semibold text-gray-800 text-left truncate"
												title={item.equipment_name}
											>
												<span className="leading-tight line-clamp-2 block text-left">
													{item.equipment_name || "-"}
												</span>
											</td>
											<td className="px-2 py-2 text-xs text-gray-600 font-medium text-left truncate">
												{item.disposal_method || "Scrap"}
											</td>
											<td className="px-2 py-2 text-center whitespace-nowrap">
												{item.status === "DISPOSED" || item.status === "APPROVED" ? (
													<span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
														<CheckCircle2 className="w-3 h-3" />
														Disetujui Manajer
													</span>
												) : item.status === "REJECTED" ? (
													<span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
														<XCircle className="w-3 h-3" />
														Ditolak Manajer
													</span>
												) : (
													<span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
														<Clock className="w-3 h-3" />
														Menunggu Manajer
													</span>
												)}
											</td>
											<td className="px-2 py-2 text-center w-[90px]">
												<button
													type="button"
													onClick={() => {
														setSelectedHistoryItem(item);
														setIsDetailOpen(true);
													}}
													className="inline-flex items-center justify-center gap-1 bg-[#0A356A] text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
												>
													<Eye className="w-3.5 h-3.5" />
													Detail
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					)}
				</div>

				{/* Pagination Footer */}
				{!isLoading && currentListLength > 0 && (
					<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
						<span className="text-[11px] font-medium text-gray-500">
							Menampilkan{" "}
							{currentListLength === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(currentPage * ITEMS_PER_PAGE, currentListLength)} dari{" "}
							{currentListLength} data ({ITEMS_PER_PAGE} baris/halaman)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
							>
								Prev
							</button>
							<div className="flex items-center gap-1">
								{Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(
									(page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
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
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Form Permintaan Scrap (Tab 1: Antrean Request) */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
						onClick={() => setIsModalOpen(false)}
					/>

					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3] flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Trash2 className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Form Permintaan Scrap Aset
									</h2>
									<p className="text-xs text-blue-100 mt-0.5">
										{selectedAsset.kodeAlat} - {selectedAsset.namaAlat}
									</p>
								</div>
							</div>
							<button
								onClick={() => setIsModalOpen(false)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Scrollable Form Body */}
						<form
							onSubmit={handleSubmitVerification}
							className="flex-1 overflow-y-auto flex flex-col"
						>
							<div className="p-6 flex flex-col gap-5">
								{/* Read Only Asset Info */}
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
										<FileText className="w-4 h-4" /> Informasi Aset (Read-Only)
									</h3>
									<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kode Alat
											</p>
											<p className="text-sm font-semibold text-gray-800">
												{selectedAsset.kodeAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Nama Alat
											</p>
											<p className="text-sm font-semibold text-gray-800">
												{selectedAsset.namaAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Plant
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.plant}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Lokasi Penyimpanan
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.storageLocation}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kategori
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.jenisAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Hasil Inspeksi
											</p>
											{inspectionResult ? (
												<p className="text-sm font-bold text-red-600">{inspectionResult}</p>
											) : (
												<p className="text-sm font-medium text-gray-400 italic">
													Belum ada hasil inspeksi
												</p>
											)}
										</div>
										<div className="col-span-2">
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Alasan Scrap dari Inspeksi
											</p>
											<p className="text-xs mt-1 leading-relaxed bg-white border border-gray-200 p-2.5 rounded-lg">
												{scrapReason ? (
													<span className="text-gray-600">{scrapReason}</span>
												) : (
													<span className="text-gray-400 italic">
														Inspeksi Teknik belum mengisi alasan/rekomendasi scrap.
													</span>
												)}
											</p>
										</div>
									</div>
								</div>

								{/* Form Verifikasi */}
								<div className="flex flex-col gap-4">
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-1">
										Form Permintaan Scrap
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
												Nomor Usulan Scrap
											</label>
											<input
												type="text"
												value="Digenerate otomatis oleh sistem"
												readOnly
												className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 italic text-gray-500 cursor-not-allowed"
											/>
										</div>

										<div>
											<label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
												Tanggal Permintaan
											</label>
											<input
												type="date"
												value={verificationDate}
												readOnly
												className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
											/>
										</div>
									</div>

									<div>
										<label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
											Metode Scrap <span className="text-red-500">*</span>
										</label>
										<select
											value={disposalMethodId}
											onChange={(e) => setDisposalMethodId(e.target.value)}
											required
											className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-800 focus:outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]"
										>
											<option value="">Pilih Metode...</option>
											{methods.map((m) => (
												<option key={m.id} value={m.id}>
													{m.name} - {m.description}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
											Catatan Permintaan (Justifikasi)
										</label>
										<textarea
											rows={3}
											placeholder="Masukkan catatan pendukung atau justifikasi tambahan..."
											value={justification}
											onChange={(e) => setJustification(e.target.value)}
											className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] text-gray-800"
										/>
									</div>

									<div>
										<label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
											Dokumen Pendukung
										</label>
										<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/40 hover:border-[#0A356A] transition-colors relative">
											<input
												type="file"
												accept=".pdf,.png,.jpg,.jpeg"
												onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="w-6 h-6 text-gray-400 mb-1.5" />
											<span className="text-xs font-semibold text-gray-600">
												{uploadedFile
													? uploadedFile.name
													: "Klik atau seret file PDF / Gambar pendukung"}
											</span>
											<span className="text-[10px] text-gray-400 mt-0.5">
												Maks. 5MB (Optional)
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Footer Actions */}
							<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									disabled={isSubmitting}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 bg-white transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-5 py-2 bg-[#0A356A] hover:bg-[#062854] text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
								>
									{isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
									{isSubmitting ? "Mengirim..." : "Kirim ke Manajer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal Detail Riwayat (Tab 2: Riwayat Permintaan) */}
			{isDetailOpen && selectedHistoryItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
						onClick={() => setIsDetailOpen(false)}
					/>

					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3] flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
									<FileText className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Detail Permintaan Scrap
									</h2>
									<p className="text-xs text-blue-100 mt-0.5">
										{selectedHistoryItem.disposal_number}
									</p>
								</div>
							</div>
							<button
								onClick={() => setIsDetailOpen(false)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Body */}
						<div className="p-6 flex flex-col gap-4 overflow-y-auto">
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">
											Kode Alat
										</p>
										<p className="text-sm font-bold text-[#0A356A]">
											{selectedHistoryItem.equipment_code || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">
											Nama Alat
										</p>
										<p className="text-sm font-semibold text-gray-800">
											{selectedHistoryItem.equipment_name || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">Plant</p>
										<p className="text-xs font-medium text-gray-700">
											{selectedHistoryItem.plant || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">
											Metode Scrap
										</p>
										<p className="text-xs font-semibold text-gray-800">
											{selectedHistoryItem.disposal_method || "Scrap"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">
											Tanggal Permintaan
										</p>
										<p className="text-xs text-gray-700">
											{selectedHistoryItem.created_at
												? new Date(selectedHistoryItem.created_at).toLocaleDateString(
														"id-ID",
													)
												: "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase">
											Status Persetujuan
										</p>
										<span className="inline-block mt-0.5">
											{selectedHistoryItem.status === "DISPOSED" ||
											selectedHistoryItem.status === "APPROVED" ? (
												<span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
													<CheckCircle2 className="w-3 h-3" /> Disetujui Manajer
												</span>
											) : selectedHistoryItem.status === "REJECTED" ? (
												<span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
													<XCircle className="w-3 h-3" /> Ditolak Manajer
												</span>
											) : (
												<span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
													<Clock className="w-3 h-3" /> Menunggu Manajer
												</span>
											)}
										</span>
									</div>
								</div>
								<div>
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Justifikasi / Catatan
									</p>
									<p className="text-xs text-gray-700 mt-1 bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed italic">
										&quot;
										{selectedHistoryItem.justification ||
											"Tidak ada rincian justifikasi."}
										&quot;
									</p>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
							<button
								onClick={() => setIsDetailOpen(false)}
								className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
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
