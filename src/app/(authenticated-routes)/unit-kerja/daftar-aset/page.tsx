"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments, getObjectTypes, getAttachmentsByEquipmentId, createReuseRequest } from "@/action/api";
import RequestModalButton from "../katalog/[id]/request-modal-button";
import {
	Search,
	RefreshCw,
	Loader2,
	ChevronRight,
	AlertCircle,
	Wrench,
	CheckCircle2,
	Clock,
	XCircle,
	Eye,
	Send,
	X,
	FileText,
	Building,
	MapPin,
	Info,
	ArrowUpDown,
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
	year_of_purchase?: number;
	book_value?: number;
	estimated_reuse_value?: number;
	specifications: string;
	capacity: string;
	notes?: string;
	created_at?: string;
}

export default function DaftarAsetPage() {
	const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"semua" | "ready" | "perbaikan">("semua");
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	// Detail Modal
	const [selectedAsset, setSelectedAsset] = useState<EquipmentItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [attachments, setAttachments] = useState<any[]>([]);
	const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
	const [isRequestMode, setIsRequestMode] = useState(false);
	const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [requestForm, setRequestForm] = useState({
		installation_location: "",
		target_plant: "",
		start_date: "",
		end_date: "",
		justification: "",
		estimated_cost_avoidance: "",
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
					.filter((item: any) => {
						const rawStatus = (typeof item.status === "object" ? item.status?.name : item.status || "").toUpperCase();
						const isScrap =
							item.status_id === 8 ||
							item.status?.id === 8 ||
							rawStatus.includes("SCRAP") ||
							rawStatus.includes("DISPOSAL");
						return !isScrap;
					})
					.map((item: any) => {
					let catName = "Peralatan Umum";
					if (typeof item.object_type?.name === "string") catName = item.object_type.name;
					else if (typeof item.objectType?.name === "string") catName = item.objectType.name;
					else if (typeof item.object_type_name === "string") catName = item.object_type_name;
					else if (item.object_type_id && objTypes) {
						const found = objTypes.find((o: any) => String(o.id) === String(item.object_type_id));
						if (found && typeof found.name === "string") catName = found.name;
					}

					let plantStr = "STG & Boilers";
					if (typeof item.plant === "string") {
						plantStr = item.plant;
					} else if (item.plant && typeof item.plant === "object") {
						plantStr = item.plant.name || item.plant.plant || item.plant.description || "STG & Boilers";
					}

					let storageLoc = "Gudang Utama Pusri";
					if (typeof item.storage_location === "string") storageLoc = item.storage_location;
					else if (item.storage_location && typeof item.storage_location === "object") storageLoc = item.storage_location.name || "Gudang Utama Pusri";

					const rawStatus = (typeof item.status === "object" ? item.status?.name : item.status || "").toUpperCase();
					let normalizedStatus = "READY TO USE";
					if (item.status_id === 3 || rawStatus.includes("PERBAIKAN") || rawStatus.includes("MAINTENANCE") || rawStatus.includes("REPAIR")) {
						normalizedStatus = "DALAM PERBAIKAN";
					} else if (item.status_id === 8 || rawStatus.includes("SCRAP") || rawStatus.includes("DISPOSAL")) {
						normalizedStatus = "SCRAP";
					} else if (item.status_id === 1 || rawStatus.includes("REGISTERED")) {
						normalizedStatus = "REGISTERED";
					}

					let conditionStr = "Baik";
					if (typeof item.condition === "object") conditionStr = item.condition?.name || "Baik";
					else if (typeof item.condition === "string") conditionStr = item.condition;

					return {
						id: String(item.id),
						equipment_code: String(item.equipment_code || item.kodeAlat || `EQ-${item.id}`),
						name: String(item.name || item.namaAlat || "Equipment Tanpa Nama"),
						plant: plantStr,
						object_type_name: String(catName),
						status_name: normalizedStatus,
						condition_name: conditionStr.replace(/_/g, " "),
						storage_location: String(storageLoc),
						serial_number: String(item.serial_number || "-"),
						vendor: String(item.vendor || item.manufacturer || "-"),
						year_of_purchase: item.year_of_purchase ? Number(item.year_of_purchase) : undefined,
						book_value: item.book_value != null ? Number(item.book_value) : undefined,
						estimated_reuse_value: item.estimated_reuse_value != null ? Number(item.estimated_reuse_value) : undefined,
						specifications: String(item.specifications || item.specification || item.description || "-"),
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
		loadData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeTab, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const plantOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.plant).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);

	const tipeObjekOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.object_type_name).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);

	const kondisiOptions = useMemo(
		() => [...new Set(equipments.map((e) => e.condition_name).filter((v) => v && v !== "-"))].sort(),
		[equipments],
	);

	const stats = useMemo(() => {
		const total = equipments.length;
		const ready = equipments.filter((e) => e.status_name === "READY TO USE" || e.status_name === "IDLE").length;
		const perbaikan = equipments.filter((e) => e.status_name === "DALAM PERBAIKAN").length;
		const scrap = equipments.filter((e) => e.status_name === "SCRAP").length;
		return { total, ready, perbaikan, scrap };
	}, [equipments]);

	const handleSearch = () => setSearchQuery(searchInput);

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
			result = result.filter((e) => e.status_name === "READY TO USE" || e.status_name === "IDLE");
		} else if (activeTab === "perbaikan") {
			result = result.filter((e) => e.status_name === "DALAM PERBAIKAN");
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
		if (filterTipeObjek) result = result.filter((item) => item.object_type_name === filterTipeObjek);
		if (filterKondisi) result = result.filter((item) => item.condition_name === filterKondisi);

		return result;
	}, [equipments, activeTab, searchQuery, filterPlant, filterTipeObjek, filterKondisi]);

	const ITEMS_PER_PAGE = 10;
	const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
	const paginatedItems = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredItems, currentPage]);

	const openDetailModal = async (item: EquipmentItem) => {
		setSelectedAsset(item);
		setIsDetailOpen(true);
		setIsRequestMode(false);
		setRequestError(null);
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

	const openRequestModal = async (item: EquipmentItem) => {
		await openDetailModal(item);
		setIsRequestMode(true);
		setRequestForm({
			installation_location: "",
			target_plant: item.plant === "-" ? "" : item.plant,
			start_date: new Date().toISOString().split("T")[0],
			end_date: "",
			justification: "",
			estimated_cost_avoidance: item.estimated_reuse_value ? String(item.estimated_reuse_value) : "",
			contact_person: "",
			contact_npp: "",
			contact_phone: "",
		});
	};

	const handleRequestSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedAsset || isSubmittingRequest) return;
		if (!requestForm.installation_location.trim() || !requestForm.start_date || !requestForm.justification.trim()) {
			setRequestError("Lokasi penggunaan, tanggal mulai, dan alasan kebutuhan wajib diisi.");
			return;
		}

		setIsSubmittingRequest(true);
		setRequestError(null);
		try {
			const result = await createReuseRequest({
				equipment_id: selectedAsset.id,
				request_number: `REQ-REUSE-${Date.now().toString().slice(-6)}`,
				target_plant: requestForm.target_plant,
				installation_location: requestForm.installation_location,
				requesting_unit: requestForm.installation_location,
				start_date: requestForm.start_date,
				end_date: requestForm.end_date || undefined,
				justification: requestForm.justification,
				estimated_cost_avoidance: Number(requestForm.estimated_cost_avoidance) || 0,
				contact_person: requestForm.contact_person,
				contact_npp: requestForm.contact_npp,
				contact_phone: requestForm.contact_phone,
			});
			if (!result?.success) {
				setRequestError(result?.message || "Gagal menyimpan permintaan.");
				return;
			}
			setIsDetailOpen(false);
			setIsRequestMode(false);
			await loadData();
		} catch (error: any) {
			setRequestError(error?.message || "Terjadi kesalahan saat menyimpan permintaan.");
		} finally {
			setIsSubmittingRequest(false);
		}
	};

	const formatRupiah = (val?: number) => {
		if (!val) return "Rp 0";
		return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
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
							Daftar seluruh peralatan idle yang tersedia dan dapat diajukan untuk pemakaian kembali oleh Unit Kerja Operasi.
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


			{/* Main Table Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
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
								activeTab === "semua" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"
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
								activeTab === "ready" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"
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
								activeTab === "perbaikan" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"
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
												className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
													asset.status_name === "READY TO USE"
														? "bg-emerald-100 text-emerald-800"
														: asset.status_name === "DALAM PERBAIKAN"
															? "bg-amber-100 text-amber-800"
															: asset.status_name === "SCRAP"
																? "bg-rose-100 text-rose-800"
																: "bg-blue-100 text-blue-800"
												}`}
											>
												{asset.status_name}
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

								<RequestModalButton eq={{ id: asset.id, code: asset.equipment_code, name: asset.name, plant: asset.plant, objectType: asset.object_type_name, estimatedReuseValue: asset.estimated_reuse_value }} compact />
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
							dari <span className="font-semibold text-gray-800">{filteredItems.length}</span> peralatan
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

			{/* Detail Modal */}
			{isDetailOpen && selectedAsset && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
					<div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 my-8">
						<div className="p-4 bg-[#0A356A] text-white flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Info className="w-5 h-5 text-blue-300" />
								<div>
									<h2 className="text-base font-bold">Detail Peralatan Idle</h2>
									<p className="text-[11px] text-blue-200">{selectedAsset.equipment_code}</p>
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
							{isRequestMode && (
								<form onSubmit={handleRequestSubmit} className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-3">
									<h3 className="font-bold text-[#0A356A] text-sm">Form Permintaan Pemakaian</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-blue-100 rounded p-3">
										<div><span className="text-[11px] text-gray-500 block">Peralatan</span><span className="font-bold text-gray-900">{selectedAsset.name}</span></div>
										<div><span className="text-[11px] text-gray-500 block">Kategori</span><span className="font-semibold text-gray-800">{selectedAsset.object_type_name}</span></div>
									</div>
									{requestError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{requestError}</p>}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<label className="text-xs font-semibold text-gray-700">Plant Tujuan *<input required value={requestForm.target_plant} onChange={(e) => setRequestForm((p) => ({ ...p, target_plant: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
										<label className="text-xs font-semibold text-gray-700">Lokasi Pemasangan *<input required value={requestForm.installation_location} onChange={(e) => setRequestForm((p) => ({ ...p, installation_location: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
										<label className="text-xs font-semibold text-gray-700">Tanggal Mulai Pemakaian *<input required type="date" value={requestForm.start_date} onChange={(e) => setRequestForm((p) => ({ ...p, start_date: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
										<label className="text-xs font-semibold text-gray-700">Estimasi Cost Avoidance (Rp)<input type="number" min="0" value={requestForm.estimated_cost_avoidance} onChange={(e) => setRequestForm((p) => ({ ...p, estimated_cost_avoidance: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
									</div>
									<label className="text-xs font-semibold text-gray-700 block">Alasan Kebutuhan &amp; Justifikasi *<textarea required value={requestForm.justification} onChange={(e) => setRequestForm((p) => ({ ...p, justification: e.target.value }))} rows={3} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<label className="text-xs font-semibold text-gray-700">Nama Penanggung Jawab<input value={requestForm.contact_person} onChange={(e) => setRequestForm((p) => ({ ...p, contact_person: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
										<label className="text-xs font-semibold text-gray-700">NPP<input value={requestForm.contact_npp} onChange={(e) => setRequestForm((p) => ({ ...p, contact_npp: e.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-2.5 py-2 font-normal outline-none focus:border-[#0A356A]" /></label>
									</div>
									<div className="flex justify-end gap-2">
										<button type="button" onClick={() => setIsRequestMode(false)} className="px-3 py-2 text-xs font-semibold rounded border border-gray-300 bg-white">Kembali ke detail</button>
										<button type="submit" disabled={isSubmittingRequest} className="px-3 py-2 text-xs font-semibold rounded bg-[#0A356A] text-white disabled:opacity-50">{isSubmittingRequest ? "Menyimpan..." : "Kirim Permintaan"}</button>
									</div>
								</form>
							)}
							{/* Core Info Box */}
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Nama Peralatan</span>
									<span className="font-bold text-gray-900 text-base">{selectedAsset.name}</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Kode Alat</span>
									<span className="font-mono font-semibold text-[#0A356A]">{selectedAsset.equipment_code}</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Tipe Objek</span>
									<span className="font-medium text-gray-800">{selectedAsset.object_type_name}</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Plant</span>
									<span className="font-medium text-gray-800">{selectedAsset.plant}</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Lokasi Penyimpanan</span>
									<span className="font-medium text-gray-800">{selectedAsset.storage_location}</span>
								</div>
								<div>
									<span className="text-gray-500 block text-[11px] font-semibold uppercase">Kondisi</span>
									<span className="font-medium text-emerald-700">{selectedAsset.condition_name}</span>
								</div>
							</div>

							{/* Specs & Additional Info */}
							<div className="space-y-3 text-[13px]">
								<h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 text-[14px]">Spesifikasi Teknis</h3>
								<p className="text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">
									{selectedAsset.specifications}
								</p>

								<div className="grid grid-cols-2 gap-4 pt-2">
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">Serial Number</span>
										<span className="font-medium text-gray-800">{selectedAsset.serial_number}</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">Vendor / Pabrikan</span>
										<span className="font-medium text-gray-800">{selectedAsset.vendor}</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">Tahun Pembelian</span>
										<span className="font-medium text-gray-800">{selectedAsset.year_of_purchase}</span>
									</div>
									<div>
										<span className="text-gray-500 text-[11px] font-semibold uppercase block">Nilai Buku</span>
										<span className="font-medium text-gray-800">{formatRupiah(selectedAsset.book_value)}</span>
									</div>
								</div>
							</div>

							{/* Lampiran Files */}
							<div className="space-y-2 pt-2">
								<h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 text-[14px]">Dokumen & Foto Lampiran</h3>
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
												<span className="truncate">{att.file_name || att.name || `Lampiran #${idx + 1}`}</span>
											</a>
										))}
									</div>
								) : (
									<p className="text-xs text-gray-400 italic py-1">Tidak ada dokumen atau foto lampiran.</p>
								)}
							</div>
						</div>

						<div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
							<button
								onClick={() => setIsDetailOpen(false)}
								className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
							>
								Tutup
							</button>

							<RequestModalButton eq={{ id: selectedAsset.id, code: selectedAsset.equipment_code, name: selectedAsset.name, plant: selectedAsset.plant, objectType: selectedAsset.object_type_name, estimatedReuseValue: selectedAsset.estimated_reuse_value }} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
