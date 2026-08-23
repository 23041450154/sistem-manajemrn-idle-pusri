"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
	getEquipments,
	getObjectTypes,
	getAttachmentsByEquipmentId,
	createReuseRequest,
} from "@/action/api";
import {
	statusBadgeStyle,
	statusName,
	statusText,
} from "@/lib/equipment-status";
import KatalogClient from "../katalog/katalog-client";
import { normalizeEquipment } from "../katalog/shared";
import {
	Search,
	RefreshCw,
	Loader2,
	ChevronRight,
	AlertCircle,
	Eye,
	Send,
	X,
	FileText,
	Info,
	ArrowUpDown,
	LayoutGrid,
	List,
} from "lucide-react";

interface EquipmentItem {
	id: string;
	equipment_code: string;
	name: string;
	plant: string;
	object_type_name: string;
	status_name: string;
	condition_name: string;
	storage_location: string;
	serial_number: string;
	vendor: string;
	year_of_purchase: number;
	book_value: number;
	specifications: string;
	capacity: string;
	notes?: string;
	created_at?: string;
}

/** Unit Kerja hanya melihat aset siap pakai + yang sedang diperbaiki. */
const VISIBLE_STATUSES = ["READY_TO_USE", "REPAIR"];

export default function DaftarAsetPage() {
	const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"semua" | "ready" | "perbaikan">(
		"semua",
	);
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [viewMode, setViewMode] = useState<"table" | "catalog">("table");

	// Detail Modal
	const [selectedAsset, setSelectedAsset] = useState<EquipmentItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [attachments, setAttachments] = useState<any[]>([]);
	const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

	// Request Reuse Modal
	const [requestModalAsset, setRequestModalAsset] =
		useState<EquipmentItem | null>(null);
	const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
	const [requestSuccessMessage, setRequestSuccessMessage] = useState<
		string | null
	>(null);
	const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(
		null,
	);

	const [requestFormData, setRequestFormData] = useState({
		requesting_project: "",
		requesting_plant: "",
		installation_location: "",
		start_date: new Date().toISOString().split("T")[0],
		estimated_new_purchase_cost: "",
		justification: "",
		notes: "",
		contact_person: "",
		contact_npp: "",
		contact_phone: "",
	});

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [rawEqList, objTypes] = await Promise.all([
				getEquipments(),
				getObjectTypes().catch(() => []),
			]);

			if (Array.isArray(rawEqList)) {
				const mapped: EquipmentItem[] = rawEqList
					.filter((item: any) =>
						VISIBLE_STATUSES.includes(
							statusName(
								typeof item.status === "object" ? item.status?.name : item.status,
							),
						),
					)
					.map((item: any) => {
						let catName = "Peralatan Umum";
						if (typeof item.object_type?.name === "string")
							catName = item.object_type.name;
						else if (typeof item.objectType?.name === "string")
							catName = item.objectType.name;
						else if (typeof item.object_type_name === "string")
							catName = item.object_type_name;
						else if (item.object_type_id && objTypes) {
							const found = objTypes.find(
								(o: any) => String(o.id) === String(item.object_type_id),
							);
							if (found && typeof found.name === "string") catName = found.name;
						}

						let plantStr = "STG & Boilers";
						if (typeof item.plant === "string") {
							plantStr = item.plant;
						} else if (item.plant && typeof item.plant === "object") {
							plantStr =
								item.plant.name ||
								item.plant.plant ||
								item.plant.description ||
								"STG & Boilers";
						}

						let storageLoc = "Gudang Utama Pusri";
						if (typeof item.storage_location === "string")
							storageLoc = item.storage_location;
						else if (
							item.storage_location &&
							typeof item.storage_location === "object"
						)
							storageLoc = item.storage_location.name || "Gudang Utama Pusri";

						// Nama status kanonik dari backend (lihat lib/equipment-status).
						const normalizedStatus = statusName(
							typeof item.status === "object" ? item.status?.name : item.status,
						);

						let conditionStr = "Baik";
						if (typeof item.condition === "object")
							conditionStr = item.condition?.name || "Baik";
						else if (typeof item.condition === "string")
							conditionStr = item.condition;

						return {
							id: String(item.id),
							equipment_code: String(
								item.equipment_code || item.kodeAlat || `EQ-${item.id}`,
							),
							name: String(item.name || item.namaAlat || "Equipment Tanpa Nama"),
							plant: plantStr,
							object_type_name: String(catName),
							status_name: normalizedStatus,
							condition_name: conditionStr.replace(/_/g, " "),
							storage_location: String(storageLoc),
							serial_number: String(item.serial_number || "SN-2026-X89"),
							vendor: String(
								item.vendor || item.manufacturer || "PT Utama Engineering",
							),
							year_of_purchase: Number(item.year_of_purchase) || 2020,
							book_value: Number(item.book_value) || 120000000,
							specifications: String(
								item.specifications ||
									item.specification ||
									item.description ||
									"Spesifikasi standar operasional pabrik",
							),
							capacity: String(item.capacity || "-"),
							notes: item.notes || "-",
							created_at: item.created_at || "-",
						};
					});

				setEquipments(mapped);
			} else {
				setEquipments([]);
			}
		} catch (err) {
			console.error("Error loading daftar aset for unit kerja:", err);
			setEquipments([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
		loadData();
	}, []);

	const plantOptions = useMemo(
		() =>
			[
				...new Set(equipments.map((e) => e.plant).filter((v) => v && v !== "-")),
			].sort(),
		[equipments],
	);

	const tipeObjekOptions = useMemo(
		() =>
			[
				...new Set(
					equipments.map((e) => e.object_type_name).filter((v) => v && v !== "-"),
				),
			].sort(),
		[equipments],
	);

	const kondisiOptions = useMemo(
		() =>
			[
				...new Set(
					equipments.map((e) => e.condition_name).filter((v) => v && v !== "-"),
				),
			].sort(),
		[equipments],
	);

	const stats = useMemo(() => {
		const total = equipments.length;
		const ready = equipments.filter(
			(e) => e.status_name === "READY_TO_USE",
		).length;
		const perbaikan = equipments.filter((e) => e.status_name === "REPAIR").length;
		return { total, ready, perbaikan };
	}, [equipments]);

	const handleSearch = () => {
		setSearchQuery(searchInput);
		setCurrentPage(1);
	};

	const handleReset = () => {
		setSearchInput("");
		setSearchQuery("");
		setFilterPlant("");
		setFilterTipeObjek("");
		setFilterKondisi("");
		setCurrentPage(1);
	};

	const filteredItems = useMemo(() => {
		let result = equipments;

		if (activeTab === "ready") {
			result = result.filter((e) => e.status_name === "READY_TO_USE");
		} else if (activeTab === "perbaikan") {
			result = result.filter((e) => e.status_name === "REPAIR");
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.equipment_code.toLowerCase().includes(q) ||
					item.name.toLowerCase().includes(q) ||
					item.object_type_name.toLowerCase().includes(q) ||
					item.plant.toLowerCase().includes(q) ||
					item.storage_location.toLowerCase().includes(q),
			);
		}

		if (filterPlant) result = result.filter((item) => item.plant === filterPlant);
		if (filterTipeObjek)
			result = result.filter((item) => item.object_type_name === filterTipeObjek);
		if (filterKondisi)
			result = result.filter((item) => item.condition_name === filterKondisi);

		return result;
	}, [
		equipments,
		activeTab,
		searchQuery,
		filterPlant,
		filterTipeObjek,
		filterKondisi,
	]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	const catalogItems = useMemo(
		() => equipments.map((item) => normalizeEquipment(item as unknown as Record<string, unknown>)),
		[equipments],
	);

	const openDetailModal = async (item: EquipmentItem) => {
		setSelectedAsset(item);
		setIsDetailOpen(true);
		setIsLoadingAttachments(true);
		try {
			const res = await getAttachmentsByEquipmentId(item.id).catch(() => []);
			setAttachments(Array.isArray(res) ? res : []);
		} catch {
			setAttachments([]);
		} finally {
			setIsLoadingAttachments(false);
		}
	};

	const openRequestModal = (item: EquipmentItem) => {
		setRequestModalAsset(item);
		setRequestFormData({
			requesting_project: "",
			requesting_plant: "",
			installation_location: "",
			start_date: new Date().toISOString().split("T")[0],
			estimated_new_purchase_cost: "",
			justification: "",
			notes: "",
			contact_person: "",
			contact_npp: "",
			contact_phone: "",
		});
		setRequestErrorMessage(null);
	};

	const handleRequestSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!requestModalAsset || isSubmittingRequest) return;

		if (!requestFormData.installation_location.trim()) {
			setRequestErrorMessage("Lokasi pemasangan wajib diisi.");
			return;
		}

		if (!requestFormData.justification.trim()) {
			setRequestErrorMessage("Alasan kebutuhan / justifikasi wajib diisi.");
			return;
		}

		const estimatedNewPurchaseCost = Number(
			String(requestFormData.estimated_new_purchase_cost).replace(/\D/g, ""),
		);
		if (estimatedNewPurchaseCost <= 0) {
			setRequestErrorMessage("Estimasi biaya pembelian baru harus lebih dari 0.");
			return;
		}

		setIsSubmittingRequest(true);
		setRequestErrorMessage(null);

		try {
			const res = await createReuseRequest({
				equipment_id: requestModalAsset.id,
				requestingProject: requestFormData.requesting_project,
				requestingPlant: requestFormData.requesting_plant,
				installation_location: requestFormData.installation_location,
				reuseDate: requestFormData.start_date,
				estimatedNewPurchaseCost: estimatedNewPurchaseCost,
				justification: requestFormData.justification,
				notes: requestFormData.notes,
				contact_person: requestFormData.contact_person,
				contact_npp: requestFormData.contact_npp,
				contact_phone: requestFormData.contact_phone,
			});

			if (res && res.success) {
				setRequestSuccessMessage(
					`Permintaan untuk peralatan "${requestModalAsset.name}" (${requestModalAsset.equipment_code}) berhasil diajukan.`,
				);
				setRequestModalAsset(null);
				if (isDetailOpen) setIsDetailOpen(false);
			} else {
				setRequestErrorMessage(
					res?.message || "Gagal mengirim pengajuan pemakaian.",
				);
			}
		} catch (err: any) {
			console.error("Submit error:", err);
			setRequestErrorMessage(
				err?.message || "Terjadi kesalahan sistem saat mengirim pengajuan.",
			);
		} finally {
			setIsSubmittingRequest(false);
		}
	};

	const formatRupiah = (val?: number) => {
		if (!val) return "Rp 0";
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Page Header */}
			<div className="mb-3">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Unit Kerja Operasi</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Daftar Aset</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Daftar Peralatan Idle
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Peralatan idle yang siap digunakan dan yang sedang dalam perbaikan.
							Permintaan pemakaian hanya bisa diajukan untuk aset siap pakai.
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
						<button
							onClick={loadData}
							disabled={isLoading}
							className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
							Muat Ulang
						</button>
						<div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm" role="tablist" aria-label="Mode tampilan aset">
							<button
								type="button"
								onClick={() => setViewMode("table")}
								role="tab"
								aria-selected={viewMode === "table"}
								className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${viewMode === "table" ? "bg-[#0A356A] text-white" : "text-gray-600 hover:bg-gray-100"}`}
							>
								<List className="h-3.5 w-3.5" />
								Daftar Tabel
							</button>
							<button
								type="button"
								onClick={() => setViewMode("catalog")}
								role="tab"
								aria-selected={viewMode === "catalog"}
								className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${viewMode === "catalog" ? "bg-[#0A356A] text-white" : "text-gray-600 hover:bg-gray-100"}`}
							>
								<LayoutGrid className="h-3.5 w-3.5" />
								Katalog
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className={`${viewMode === "table" ? "" : "hidden"} bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4`}>
				{/* Navigation Tabs */}
				<div className="flex items-center border-b border-gray-200 px-5 pt-3 bg-white gap-6">
					<button
						onClick={() => {
							setActiveTab("semua");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 ${
							activeTab === "semua"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Semua Aset</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "semua"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{stats.total}
						</span>
					</button>

					<button
						onClick={() => {
							setActiveTab("ready");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 ${
							activeTab === "ready"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Siap Pakai</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "ready"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{stats.ready}
						</span>
					</button>

					<button
						onClick={() => {
							setActiveTab("perbaikan");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 ${
							activeTab === "perbaikan"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Dalam Perbaikan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
								activeTab === "perbaikan"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{stats.perbaikan}
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

						<select
							value={filterKondisi}
							onChange={(e) => {
								setFilterKondisi(e.target.value);
								setCurrentPage(1);
							}}
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
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center w-10">
									No
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Kode Alat
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">
									Nama Peralatan
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Tipe Objek
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Plant
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left">
									Lokasi
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Kondisi
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
												{searchQuery || filterPlant || filterTipeObjek || filterKondisi
													? "Hasil Pencarian Tidak Ditemukan"
													: "Belum Ada Peralatan"}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												{searchQuery || filterPlant || filterTipeObjek || filterKondisi
													? "Coba sesuaikan kata kunci atau filter pencarian Anda."
													: "Peralatan idle yang tersedia akan muncul di sini."}
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
										<td className="px-2.5 py-2.5 text-[13px] text-gray-500 font-medium text-center">
											{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td className="px-2.5 py-2.5 text-[13px] font-semibold text-[#0A356A] whitespace-nowrap">
											{asset.equipment_code}
										</td>
										<td className="px-2.5 py-2.5 text-[13px] font-medium text-gray-900">
											{asset.name}
										</td>
										<td className="px-2.5 py-2.5 text-[13px] text-gray-600 whitespace-nowrap">
											{asset.object_type_name}
										</td>
										<td className="px-2.5 py-2.5 text-[13px] text-gray-600 whitespace-nowrap">
											{asset.plant}
										</td>
										<td className="px-2.5 py-2.5 text-[13px] text-gray-600">
											{asset.storage_location}
										</td>
										<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
											<span
												className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
													asset.condition_name.toUpperCase().includes("BAIK")
														? "bg-emerald-50 text-emerald-700 border border-emerald-200"
														: asset.condition_name.toUpperCase().includes("RUSAK")
															? "bg-rose-50 text-rose-700 border border-rose-200"
															: "bg-amber-50 text-amber-700 border border-amber-200"
												}`}
											>
												{asset.condition_name}
											</span>
										</td>
										<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
											<span
												className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeStyle(asset.status_name)}`}
											>
												{statusText(asset.status_name)}
											</span>
										</td>
										<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
											<div className="flex items-center justify-center gap-1.5">
												<button
													onClick={() => openDetailModal(asset)}
													className="p-1.5 text-gray-500 hover:text-[#0A356A] hover:bg-gray-100 rounded-lg transition-colors"
													title="Lihat Detail"
												>
													<Eye className="w-4 h-4" />
												</button>

												{asset.status_name === "READY_TO_USE" ? (
													<Link
														href={`/unit-kerja/permintaan?equipment_id=${asset.id}`}
														className="flex items-center gap-1 px-2.5 py-1 bg-[#0A356A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#062854] transition-colors shadow-sm"
													>
														<Send className="w-3 h-3" />
														<span>Permintaan</span>
													</Link>
												) : (
													<span
														className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-400 text-[12px] font-semibold rounded-lg cursor-not-allowed"
														title="Aset sedang dalam perbaikan, belum bisa diajukan"
													>
														<Send className="w-3 h-3" />
														<span>Permintaan</span>
													</span>
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
				{!isLoading && filteredItems.length > 0 && (
					<div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-gray-500">
						<div>
							Menampilkan{" "}
							<span className="font-semibold text-gray-800">
								{(currentPage - 1) * ITEMS_PER_PAGE + 1}
							</span>{" "}
							-{" "}
							<span className="font-semibold text-gray-800">
								{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
							</span>{" "}
							dari{" "}
							<span className="font-semibold text-gray-800">
								{filteredItems.length}
							</span>{" "}
							peralatan
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
				)}
			</div>

			{viewMode === "catalog" && (
				<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
					<KatalogClient items={catalogItems} embedded />
				</div>
			)}

			{/* Detail Modal */}
			{isDetailOpen && selectedAsset && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
					<div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 my-8">
						<div className="p-4 bg-[#0A356A] text-white flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Info className="w-5 h-5 text-blue-300" />
								<div>
									<h2 className="text-base font-bold">Detail Peralatan Idle</h2>
									<p className="text-[11px] text-blue-200">
										{selectedAsset.equipment_code}
									</p>
								</div>
							</div>
							<button
								onClick={() => setIsDetailOpen(false)}
								className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
							{/* Core Info Box */}
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Nama Peralatan
									</span>
									<span className="font-bold text-gray-900 text-base">
										{selectedAsset.name}
									</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Kode Alat
									</span>
									<span className="font-mono font-semibold text-[#0A356A]">
										{selectedAsset.equipment_code}
									</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Tipe Objek
									</span>
									<span className="font-medium text-gray-800">
										{selectedAsset.object_type_name}
									</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Plant
									</span>
									<span className="font-medium text-gray-800">
										{selectedAsset.plant}
									</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Lokasi Penyimpanan
									</span>
									<span className="font-medium text-gray-800">
										{selectedAsset.storage_location}
									</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">
										Kondisi
									</span>
									<span className="font-medium text-emerald-700">
										{selectedAsset.condition_name}
									</span>
								</div>
							</div>

							{/* Specs & Additional Info */}
							<div className="space-y-3 text-[13px]">
								<h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 text-[14px]">
									Spesifikasi Teknis
								</h3>
								<p className="text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">
									{selectedAsset.specifications}
								</p>

								<div className="grid grid-cols-2 gap-4 pt-2">
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">
											Serial Number
										</span>
										<span className="font-medium text-gray-800">
											{selectedAsset.serial_number}
										</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">
											Vendor / Pabrikan
										</span>
										<span className="font-medium text-gray-800">
											{selectedAsset.vendor}
										</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">
											Tahun Pembelian
										</span>
										<span className="font-medium text-gray-800">
											{selectedAsset.year_of_purchase}
										</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">
											Nilai Buku
										</span>
										<span className="font-medium text-gray-800">
											{formatRupiah(selectedAsset.book_value)}
										</span>
									</div>
								</div>
							</div>

							{/* Lampiran Files */}
							<div className="space-y-2 pt-2">
								<h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 text-[14px]">
									Dokumen & Foto Lampiran
								</h3>
								{isLoadingAttachments ? (
									<div className="flex items-center gap-2 text-gray-500 py-3">
										<Loader2 className="w-4 h-4 animate-spin text-[#0A356A]" />
										<span className="text-xs">Memuat lampiran...</span>
									</div>
								) : attachments.length > 0 ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{attachments.map((att: any, idx: number) => (
											<a
												key={idx}
												href={att.file_url || att.url || "#"}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
											>
												<FileText className="w-4 h-4 shrink-0 text-blue-600" />
												<span className="truncate">
													{att.file_name || att.name || `Lampiran #${idx + 1}`}
												</span>
											</a>
										))}
									</div>
								) : (
									<p className="text-xs text-gray-400 italic py-1">
										Tidak ada dokumen atau foto lampiran.
									</p>
								)}
							</div>
						</div>

						<div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
							<button
								onClick={() => setIsDetailOpen(false)}
								className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
							>
								Tutup
							</button>

							{selectedAsset.status_name === "READY_TO_USE" ? (
								<Link
									href={`/unit-kerja/permintaan?equipment_id=${selectedAsset.id}`}
									className="flex items-center gap-1.5 px-4 py-2 bg-[#0A356A] text-white text-xs font-bold rounded-lg hover:bg-[#062854] transition-colors shadow-sm"
								>
									<Send className="w-3.5 h-3.5" />
									<span>Ajukan Permintaan Aset Ini</span>
								</Link>
							) : (
								<span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">
									<AlertCircle className="w-3.5 h-3.5" />
									<span>Belum Bisa Diajukan (Dalam Perbaikan)</span>
								</span>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Modal Ajukan Permintaan Pemakaian */}
			{requestModalAsset && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 my-8">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Send className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white">
										Ajukan Permintaan Pemakaian
									</h2>
									<p className="text-xs text-blue-100">
										{requestModalAsset.equipment_code} — {requestModalAsset.name}
									</p>
								</div>
							</div>
							<button
								onClick={() => {
									if (!isSubmittingRequest) setRequestModalAsset(null);
								}}
								disabled={isSubmittingRequest}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form Content */}
						<form
							onSubmit={handleRequestSubmit}
							className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
						>
							{requestErrorMessage && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
									<AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
									<span>{requestErrorMessage}</span>
								</div>
							)}

							{/* Summary Box */}
							<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 grid grid-cols-2 gap-2 text-xs">
								<div>
									<p className="text-gray-500 font-medium">Peralatan</p>
									<p className="text-gray-800 font-semibold truncate">
										{requestModalAsset.name}
									</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Tipe Objek</p>
									<p className="text-gray-800 font-semibold">
										{requestModalAsset.object_type_name}
									</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Lokasi Asal</p>
									<p className="text-gray-800 font-semibold">
										{requestModalAsset.plant}
									</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Kondisi</p>
									<p className="text-emerald-700 font-semibold">
										{requestModalAsset.condition_name}
									</p>
								</div>
							</div>

							{/* Project & Plant */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Proyek Pemohon <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={requestFormData.requesting_project}
										onChange={(e) =>
											setRequestFormData({
												...requestFormData,
												requesting_project: e.target.value,
											})
										}
										required
										placeholder="misal: Proyek Revamp Pabrik"
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Plant Pemohon <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={requestFormData.requesting_plant}
										onChange={(e) =>
											setRequestFormData({
												...requestFormData,
												requesting_plant: e.target.value,
											})
										}
										required
										placeholder="misal: Plant PUSRI IB"
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Lokasi Pemasangan <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={requestFormData.installation_location}
									onChange={(e) => setRequestFormData({ ...requestFormData, installation_location: e.target.value })}
									required
									placeholder="misal: Area Ammonia Pabrik IB"
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
								/>
							</div>

							{/* Reuse Date & Cost */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Tanggal Reuse <span className="text-red-500">*</span>
									</label>
									<input
										type="date"
										value={requestFormData.start_date}
										onChange={(e) =>
											setRequestFormData({
												...requestFormData,
												start_date: e.target.value,
											})
										}
										required
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Estimasi Biaya Pembelian Baru <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
											Rp
										</span>
										<input
											type="text"
											inputMode="numeric"
											value={
												requestFormData.estimated_new_purchase_cost
													? Number(requestFormData.estimated_new_purchase_cost).toLocaleString("id-ID")
													: ""
											}
											onChange={(e) =>
												setRequestFormData({
													...requestFormData,
													estimated_new_purchase_cost: e.target.value.replace(/\D/g, ""),
												})
											}
											required
											placeholder="15.000.000"
											className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
										/>
									</div>
								</div>
							</div>

							{/* Justification */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Alasan Kebutuhan / Justifikasi <span className="text-red-500">*</span>
								</label>
								<textarea
									rows={3}
									value={requestFormData.justification}
									onChange={(e) =>
										setRequestFormData({
											...requestFormData,
											justification: e.target.value,
										})
									}
									required
									placeholder="Jelaskan kebutuhan pemakaian peralatan ini..."
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none resize-none"
								/>
							</div>

					{/* Contact Person */}
					<div className="pt-2 border-t border-gray-100">
						<p className="text-xs font-bold text-gray-800 mb-2">
							Informasi Penanggung Jawab (PIC)
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
							<div>
								<label className="text-[11px] text-gray-500 font-semibold block mb-1">
									Nama PIC
								</label>
								<input
									type="text"
									value={requestFormData.contact_person}
									onChange={(e) =>
										setRequestFormData({
											...requestFormData,
											contact_person: e.target.value,
										})
									}
									className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-[#0A356A] outline-none"
								/>
							</div>
							<div>
								<label className="text-[11px] text-gray-500 font-semibold block mb-1">
									NPP
								</label>
								<input
									type="text"
									value={requestFormData.contact_npp}
									onChange={(e) =>
										setRequestFormData({
											...requestFormData,
											contact_npp: e.target.value,
										})
									}
									className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-[#0A356A] outline-none"
								/>
							</div>
							<div>
								<label className="text-[11px] text-gray-500 font-semibold block mb-1">
									No. Telp / HP
								</label>
								<input
									type="text"
									value={requestFormData.contact_phone}
									onChange={(e) =>
										setRequestFormData({
											...requestFormData,
											contact_phone: e.target.value,
										})
									}
									className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-[#0A356A] outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Catatan */}
					<div>
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Catatan</label>
						<textarea
							rows={2}
							value={requestFormData.notes}
							onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
							placeholder="Catatan tambahan bila diperlukan"
							className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none resize-none"
						/>
					</div>


							{/* Footer Actions */}
							<div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => setRequestModalAsset(null)}
									disabled={isSubmittingRequest}
									className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmittingRequest}
									className="flex items-center gap-1.5 px-4 py-2 bg-[#0A356A] hover:bg-[#062854] text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
								>
									{isSubmittingRequest ? (
										<>
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
											<span>Mengirim...</span>
										</>
									) : (
										<>
											<Send className="w-3.5 h-3.5" />
											<span>Kirim Pengajuan</span>
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
