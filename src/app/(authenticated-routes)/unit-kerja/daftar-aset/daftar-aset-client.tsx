"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAttachmentsByEquipmentId, createReuseRequest } from "@/action/api";
import { statusBadgeStyle, statusText } from "@/lib/equipment-status";
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
	CheckCircle2,
	FileText,
	ImageOff,
	Info,
	LayoutGrid,
	List,
} from "lucide-react";

export interface EquipmentItem {
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
	notes: string;
	created_at: string;
	/** Sudah dinormalisasi jadi URL absolut oleh getEquipments(). */
	attachments?: { file_url?: string; fileUrl?: string; url?: string }[];
}

/** Unit Kerja hanya melihat aset siap pakai + yang sedang diperbaiki. */
const VISIBLE_STATUSES = ["READY_TO_USE", "REPAIR"];

/* Lampiran dipisah: yang bisa dirender sebagai gambar vs dokumen.
   ponytail: klasifikasi lewat ekstensi URL. Kalau backend nanti mengirim
   mime_type, ganti ke field itu. */
const IMAGE_URL_PATTERN = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

/** Client Component: interaksi tabel/katalog/modal ajukan reuse — data di-fetch Server Component. */
export default function DaftarAsetClient({
	equipments,
}: {
	equipments: EquipmentItem[];
}) {
	const router = useRouter();
	const [viewMode, setViewMode] = useState<"table" | "catalog">("table");

	// Filters
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterPlant, setFilterPlant] = useState("");
	const [filterTipeObjek, setFilterTipeObjek] = useState("");
	const [filterKondisi, setFilterKondisi] = useState("");
	const [activeTab, setActiveTab] = useState<"semua" | "ready" | "perbaikan">(
		"semua",
	);

	// Pagination & Sorting
	const [currentPage, setCurrentPage] = useState(1);

	// Detail Modal
	const [selectedAsset, setSelectedAsset] = useState<EquipmentItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [attachments, setAttachments] = useState<any[]>([]);
	const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
	const [activePhotoIndex, setActivePhotoIndex] = useState(0);
	const [failedPhotoUrls, setFailedPhotoUrls] = useState<string[]>([]);

	// Request Reuse Modal
	const [requestModalAsset, setRequestModalAsset] =
		useState<EquipmentItem | null>(null);
	const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
	const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(
		null,
	);
	// Toaster sukses pengajuan — lalu redirect ke riwayat permintaan.
	const [successToast, setSuccessToast] = useState<string | null>(null);

	const [requestFormData, setRequestFormData] = useState({
		requesting_project: "",
		requesting_plant: "",
		installation_location: "",
		reuse_date: new Date().toISOString().split("T")[0],
		estimated_new_purchase_cost: "",
		justification: "",
		notes: "",
	});

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
		() =>
			equipments.map((item) =>
				normalizeEquipment(item as unknown as Record<string, unknown>),
			),
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

	const openRequestModal = async (item: EquipmentItem) => {
		setRequestModalAsset(item);
		setRequestFormData({
			requesting_project: "",
			requesting_plant: "",
			installation_location: "",
			reuse_date: new Date().toISOString().split("T")[0],
			estimated_new_purchase_cost: "",
			justification: "",
			notes: "",
		});
		setRequestErrorMessage(null);
		setActivePhotoIndex(0);
		setFailedPhotoUrls([]);

		// Verifikasi visual: pemohon harus melihat unit fisiknya sebelum mengajukan.
		setIsLoadingAttachments(true);
		try {
			const res = await getAttachmentsByEquipmentId(item.id);
			setAttachments(Array.isArray(res) ? res : []);
		} catch {
			setAttachments([]);
		} finally {
			setIsLoadingAttachments(false);
		}
	};

	const handleRequestSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!requestModalAsset || isSubmittingRequest) return;

		// Backend CreateReuseRequest: semua field di bawah ini validate:"required".
		if (!requestFormData.requesting_project.trim()) {
			setRequestErrorMessage("Proyek pemohon wajib diisi.");
			return;
		}

		if (!requestFormData.requesting_plant.trim()) {
			setRequestErrorMessage("Plant pemohon wajib diisi.");
			return;
		}

		if (!requestFormData.installation_location.trim()) {
			setRequestErrorMessage("Lokasi pemasangan wajib diisi.");
			return;
		}

		if (!requestFormData.reuse_date) {
			setRequestErrorMessage("Tanggal reuse wajib diisi.");
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
				requestingProject: requestFormData.requesting_project.trim(),
				requestingPlant: requestFormData.requesting_plant.trim(),
				installationLocation: requestFormData.installation_location.trim(),
				reuseDate: requestFormData.reuse_date,
				estimatedNewPurchaseCost: estimatedNewPurchaseCost,
				justification: requestFormData.justification.trim(),
				notes: requestFormData.notes.trim(),
			});

			if (res && res.success) {
				// Server action sudah revalidateApp(); tarik payload RSC terbaru
				// (aset terajukan otomatis keluar dari daftar di server).
				setRequestModalAsset(null);
				if (isDetailOpen) setIsDetailOpen(false);
				// Toaster sukses, lalu arahkan ke riwayat permintaan.
				setSuccessToast(
					`Pengajuan pemakaian ${requestModalAsset.equipment_code} berhasil dikirim.`,
				);
				setTimeout(() => router.push("/unit-kerja/riwayat-permintaan"), 1200);
			} else {
				setRequestErrorMessage(
					res?.message || "Gagal mengirim pengajuan pemakaian.",
				);
			}
		} catch (err) {
			console.error("Submit error:", err);
			setRequestErrorMessage(
				err instanceof Error
					? err.message
					: "Terjadi kesalahan sistem saat mengirim pengajuan.",
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

	/** Nilai spesifikasi kosong dari API dirender "—", bukan baris kosong. */
	const specValue = (val?: string | number) => {
		if (val === null || val === undefined) return "—";
		const s = String(val).trim();
		return s.length > 0 && s !== "0" ? s : "—";
	};

	/* Lampiran dipisah: yang bisa dirender sebagai gambar vs dokumen.
	   ponytail: klasifikasi lewat ekstensi URL. Kalau backend nanti mengirim
	   mime_type, ganti ke field itu. */

	const normalizedAttachments = useMemo(
		() =>
			attachments
				.map((att: any) => ({
					url: String(att?.file_url || att?.url || "").trim(),
					name: String(att?.file_name || att?.name || "").trim(),
				}))
				.filter((att) => att.url.length > 0),
		[attachments],
	);

	const requestPhotos = useMemo(() => {
		// ponytail: backend bisa mengirim URL foto yang sama di beberapa attachment;
		// dedupe per URL agar key React & galeri tidak duplikat.
		const seen = new Set<string>();
		return normalizedAttachments.filter((att) => {
			if (
				!IMAGE_URL_PATTERN.test(att.url) ||
				failedPhotoUrls.includes(att.url) ||
				seen.has(att.url)
			) {
				return false;
			}
			seen.add(att.url);
			return true;
		});
	}, [normalizedAttachments, failedPhotoUrls]);

	const requestDocuments = useMemo(
		() => normalizedAttachments.filter((att) => !IMAGE_URL_PATTERN.test(att.url)),
		[normalizedAttachments],
	);

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toaster Sukses Pengajuan — di tengah layar, di atas konten/modal */}
			{successToast && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px] animate-in fade-in duration-200 pointer-events-none">
					<div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-56 p-8 flex flex-col items-center gap-3 text-center animate-in zoom-in-95 duration-200">
						<CheckCircle2 className="w-12 h-12 text-emerald-500" />
						<span className="text-sm font-semibold text-gray-900 leading-snug">
							{successToast}
						</span>
					</div>
				</div>
			)}

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
							onClick={() => router.refresh()}
							className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Muat Ulang
						</button>
						<div
							className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm"
							role="tablist"
							aria-label="Mode tampilan aset"
						>
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
			<div
				className={`${viewMode === "table" ? "" : "hidden"} bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4`}
			>
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
							className="px-3 py-1.5 bg-brand text-white text-[13px] font-medium rounded-lg hover:bg-brand-hover transition-colors duration-150 ease-out whitespace-nowrap"
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
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap w-[130px]">
									Kode Alat
								</th>
								<th className="px-2.5 py-2.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-left w-[240px] max-w-[280px]">
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
							{paginatedItems.length === 0 ? (
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
										<td className="px-2.5 py-2.5 text-[13px] font-medium text-gray-900 w-[240px] max-w-[280px]">
											<span
												className="line-clamp-2 block leading-tight"
												title={asset.name}
											>
												{asset.name}
											</span>
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
												className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
													asset.condition_name.toUpperCase().includes("BAIK")
														? "bg-[#DCFCE7] text-[#16A34A]"
														: asset.condition_name.toUpperCase().includes("RUSAK")
															? "bg-[#FEE2E2] text-[#DC2626]"
															: "bg-[#FEF3C7] text-[#B45309]"
												}`}
											>
												{asset.condition_name.replace(/_/g, " ")}
											</span>
										</td>
										<td className="px-2.5 py-2.5 text-center whitespace-nowrap">
											<span
												className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusBadgeStyle(asset.status_name)}`}
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
													<button
														type="button"
														onClick={() => openRequestModal(asset)}
														className="flex items-center gap-1 px-2.5 py-1 bg-brand text-white text-[12px] font-semibold rounded-lg hover:bg-brand-hover transition-colors duration-150 ease-out cursor-pointer"
													>
														<Send className="w-3 h-3" />
														<span>Permintaan</span>
													</button>
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
				{filteredItems.length > 0 && (
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
									<div className="mt-0.5">
										<span
											className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
												selectedAsset.condition_name.toUpperCase().includes("BAIK")
													? "bg-[#DCFCE7] text-[#16A34A]"
													: selectedAsset.condition_name.toUpperCase().includes("RUSAK")
														? "bg-[#FEE2E2] text-[#DC2626]"
														: "bg-[#FEF3C7] text-[#B45309]"
											}`}
										>
											{selectedAsset.condition_name.replace(/_/g, " ")}
										</span>
									</div>
								</div>
							</div>

							{/* Specs & Additional Info */}
							<div className="space-y-3 text-[13px]">
								<h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 text-[14px]">
									Spesifikasi Teknis
								</h3>
								<p className="text-[#0F172A] bg-[#F2F3F4] p-3 rounded-lg border border-[#E6E8EA] whitespace-pre-wrap">
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
								<button
									type="button"
									onClick={() => {
										setIsDetailOpen(false);
										openRequestModal(selectedAsset);
									}}
									className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors duration-150 ease-out cursor-pointer"
								>
									<Send className="w-3.5 h-3.5" />
									<span>Ajukan Permintaan Aset Ini</span>
								</button>
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

			{/* Modal Ajukan Permintaan Pemakaian — DESIGN.md tokens only.
			    Two columns: left rail verifies the physical unit, right column collects
			    the 8 CreateReuseRequest fields. */}
			{requestModalAsset && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="request-modal-title"
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/50 animate-in fade-in duration-200"
				>
					<div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white border border-[#E6E8EA] rounded-lg shadow-[0_8px_24px_-4px_rgb(15_23_42/0.12)] animate-in zoom-in-[0.98] duration-200">
						{/* Header — flat brand fill, no gradient, no icon tile */}
						<div className="flex items-start justify-between gap-4 px-5 py-4 bg-brand rounded-t-lg">
							<div className="min-w-0">
								<p className="font-mono text-[12px] tracking-[0.02em] text-white/75">
									{requestModalAsset.equipment_code}
								</p>
								<h2
									id="request-modal-title"
									className="mt-0.5 text-base font-semibold tracking-[-0.01em] leading-tight text-white truncate"
								>
									Ajukan Permintaan Pemakaian
								</h2>
							</div>
							<button
								type="button"
								onClick={() => {
									if (!isSubmittingRequest) setRequestModalAsset(null);
								}}
								disabled={isSubmittingRequest}
								aria-label="Tutup formulir permintaan"
								className="shrink-0 -mt-2 -mr-2 inline-flex items-center justify-center w-11 h-11 rounded-lg text-white transition-colors duration-150 ease-out hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Body */}
						<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
							{/* Left rail — the physical asset */}
							<div className="p-5 bg-[#F8FAFC] border-b border-[#E6E8EA] lg:border-b-0 lg:border-r lg:overflow-y-auto">
								<div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F2F3F4] border border-[#E6E8EA] rounded-lg">
									{isLoadingAttachments ? (
										<div className="flex items-center justify-center w-full h-full text-[#64748B]">
											<Loader2 className="w-5 h-5 animate-spin" />
										</div>
									) : requestPhotos.length > 0 ? (
										/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */
										<img
											src={requestPhotos[activePhotoIndex]?.url}
											alt={`Foto peralatan ${requestModalAsset.name}`}
											className="absolute inset-0 w-full h-full object-cover"
											onError={() =>
												setFailedPhotoUrls((prev) => [
													...prev,
													requestPhotos[activePhotoIndex]?.url,
												])
											}
										/>
									) : (
										<div className="flex flex-col items-center justify-center gap-2 w-full h-full p-4 text-center text-[#64748B]">
											<ImageOff className="w-6 h-6" />
											<p className="text-[12px] font-medium leading-snug">
												Belum ada foto peralatan yang diunggah.
											</p>
										</div>
									)}
								</div>

								{requestPhotos.length > 1 && (
									<div className="flex flex-wrap gap-2 mt-2">
										{requestPhotos.map((photo, idx) => (
											<button
												key={photo.url}
												type="button"
												onClick={() => setActivePhotoIndex(idx)}
												aria-label={`Lihat foto ${idx + 1}`}
												aria-pressed={idx === activePhotoIndex}
												className={`relative w-14 h-14 overflow-hidden bg-[#F2F3F4] rounded-lg transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155] cursor-pointer ${
													idx === activePhotoIndex
														? "border-2 border-brand"
														: "border border-[#E6E8EA] hover:border-[#64748B]"
												}`}
											>
												{/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
												<img
													src={photo.url}
													alt=""
													className="absolute inset-0 w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}

								<div className="mt-5">
									<h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										Identitas Peralatan
									</h3>
									<dl className="mt-2 border-t border-[#E6E8EA]">
										{[
											{
												label: "Nama",
												value: specValue(requestModalAsset.name),
											},
											{
												label: "Tipe objek",
												value: specValue(requestModalAsset.object_type_name),
											},
											{
												label: "Serial number",
												value: specValue(requestModalAsset.serial_number),
												mono: true,
											},
											{
												label: "Plant asal",
												value: specValue(requestModalAsset.plant),
											},
											{
												label: "Lokasi simpan",
												value: specValue(requestModalAsset.storage_location),
											},
											{
												label: "Kondisi",
												value: specValue(requestModalAsset.condition_name),
												accent: true,
											},
										].map((row) => (
											<div
												key={row.label}
												className="flex items-baseline justify-between gap-4 py-2 border-b border-[#E6E8EA]"
											>
												<dt className="shrink-0 text-[12px] font-medium leading-snug text-[#64748B]">
													{row.label}
												</dt>
												<dd
													className={`text-[13px] leading-snug text-right tabular-nums text-[#0F172A] [overflow-wrap:anywhere] ${
														row.mono ? "font-mono text-[12px]" : ""
													} ${row.accent ? "font-semibold text-state-ready" : ""}`}
												>
													{row.value}
												</dd>
											</div>
										))}
									</dl>
								</div>

								<div className="mt-5">
									<h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										Spesifikasi & Nilai
									</h3>
									<dl className="mt-2 border-t border-[#E6E8EA]">
										{[
											{
												label: "Kapasitas",
												value: specValue(requestModalAsset.capacity),
											},
											{
												label: "Vendor",
												value: specValue(requestModalAsset.vendor),
											},
											{
												label: "Tahun perolehan",
												value: specValue(requestModalAsset.year_of_purchase),
											},
											{
												label: "Nilai buku",
												value: requestModalAsset.book_value
													? formatRupiah(requestModalAsset.book_value)
													: "—",
											},
										].map((row) => (
											<div
												key={row.label}
												className="flex items-baseline justify-between gap-4 py-2 border-b border-[#E6E8EA]"
											>
												<dt className="shrink-0 text-[12px] font-medium leading-snug text-[#64748B]">
													{row.label}
												</dt>
												<dd className="text-[13px] leading-snug text-right tabular-nums text-[#0F172A] [overflow-wrap:anywhere]">
													{row.value}
												</dd>
											</div>
										))}
									</dl>
									{requestModalAsset.specifications?.trim() && (
										<p className="mt-2 text-[12px] leading-relaxed text-[#475569] [overflow-wrap:anywhere]">
											{requestModalAsset.specifications}
										</p>
									)}
								</div>

								{requestDocuments.length > 0 && (
									<div className="mt-5">
										<h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
											Dokumen Lampiran
										</h3>
										<div className="mt-2 border-t border-[#E6E8EA]">
											{requestDocuments.map((doc, idx) => (
												<a
													key={doc.url}
													href={doc.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 min-h-11 py-2 border-b border-[#E6E8EA] text-[12px] font-medium text-[#0556B3] transition-colors duration-150 ease-out hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
												>
													<FileText className="w-4 h-4 shrink-0" />
													<span className="truncate">
														{doc.name || `Lampiran ${idx + 1}`}
													</span>
												</a>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Right column — the form */}
							<form onSubmit={handleRequestSubmit} className="flex flex-col min-h-0">
								<div className="flex flex-col gap-5 flex-1 min-h-0 p-5 lg:overflow-y-auto">
									{requestErrorMessage && (
										<div className="flex items-start gap-2 px-3 py-2.5 bg-white border border-[#DC2626] rounded-lg text-[12px] leading-relaxed text-[#DC2626]">
											<AlertCircle className="w-4 h-4 shrink-0" />
											<span>{requestErrorMessage}</span>
										</div>
									)}

									<fieldset className="border-0 p-0 m-0">
										<legend className="p-0 mb-3 text-[13px] font-semibold leading-snug text-[#0F172A]">
											Tujuan pemakaian
										</legend>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="flex flex-col gap-1.5">
												<label
													htmlFor="req-project"
													className="text-[12px] font-medium leading-snug text-[#0F172A]"
												>
													Proyek pemohon <span className="text-[#DC2626]">*</span>
												</label>
												<input
													id="req-project"
													type="text"
													value={requestFormData.requesting_project}
													onChange={(e) =>
														setRequestFormData({
															...requestFormData,
															requesting_project: e.target.value,
														})
													}
													required
													placeholder="Revamp Pabrik IB"
													className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<label
													htmlFor="req-plant"
													className="text-[12px] font-medium leading-snug text-[#0F172A]"
												>
													Plant pemohon <span className="text-[#DC2626]">*</span>
												</label>
												<input
													id="req-plant"
													type="text"
													value={requestFormData.requesting_plant}
													onChange={(e) =>
														setRequestFormData({
															...requestFormData,
															requesting_plant: e.target.value,
														})
													}
													required
													placeholder="PUSRI IB"
													className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
												/>
											</div>
										</div>
										<div className="flex flex-col gap-1.5 mt-3">
											<label
												htmlFor="req-location"
												className="text-[12px] font-medium leading-snug text-[#0F172A]"
											>
												Lokasi pemasangan <span className="text-[#DC2626]">*</span>
											</label>
											<input
												id="req-location"
												type="text"
												value={requestFormData.installation_location}
												onChange={(e) =>
													setRequestFormData({
														...requestFormData,
														installation_location: e.target.value,
													})
												}
												required
												placeholder="Area Ammonia, Pabrik IB"
												className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
											/>
										</div>
									</fieldset>

									<fieldset className="border-0 p-0 m-0">
										<legend className="p-0 mb-3 text-[13px] font-semibold leading-snug text-[#0F172A]">
											Waktu & nilai penggantian
										</legend>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="flex flex-col gap-1.5">
												<label
													htmlFor="req-date"
													className="text-[12px] font-medium leading-snug text-[#0F172A]"
												>
													Tanggal reuse <span className="text-[#DC2626]">*</span>
												</label>
												<input
													id="req-date"
													type="date"
													value={requestFormData.reuse_date}
													onChange={(e) =>
														setRequestFormData({
															...requestFormData,
															reuse_date: e.target.value,
														})
													}
													required
													className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] tabular-nums transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<label
													htmlFor="req-cost"
													className="text-[12px] font-medium leading-snug text-[#0F172A]"
												>
													Estimasi harga unit baru <span className="text-[#DC2626]">*</span>
												</label>
												<div className="flex items-stretch">
													<span className="inline-flex items-center px-2.5 bg-[#F2F3F4] border border-r-0 border-[#E6E8EA] rounded-l-lg text-[12px] font-medium text-[#475569]">
														Rp
													</span>
													<input
														id="req-cost"
														type="text"
														inputMode="numeric"
														value={
															requestFormData.estimated_new_purchase_cost
																? Number(
																		requestFormData.estimated_new_purchase_cost,
																	).toLocaleString("id-ID")
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
														className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-r-lg text-[13px] leading-normal text-[#0F172A] tabular-nums placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
													/>
												</div>
												<p className="text-[11px] leading-snug text-[#64748B]">
													Dipakai untuk menghitung cost avoidance.
												</p>
											</div>
										</div>
									</fieldset>

									<fieldset className="border-0 p-0 m-0">
										<legend className="p-0 mb-3 text-[13px] font-semibold leading-snug text-[#0F172A]">
											Keterangan
										</legend>
										<div className="flex flex-col gap-1.5">
											<label
												htmlFor="req-justification"
												className="text-[12px] font-medium leading-snug text-[#0F172A]"
											>
												Alasan kebutuhan{" "}
												<span className="font-normal text-[#64748B]">(opsional)</span>
											</label>
											<textarea
												id="req-justification"
												rows={3}
												value={requestFormData.justification}
												onChange={(e) =>
													setRequestFormData({
														...requestFormData,
														justification: e.target.value,
													})
												}
												placeholder="Alasan unit ini dibutuhkan di lokasi tujuan."
												className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] resize-y placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
											/>
										</div>
										<div className="flex flex-col gap-1.5 mt-3">
											<label
												htmlFor="req-notes"
												className="text-[12px] font-medium leading-snug text-[#0F172A]"
											>
												Catatan{" "}
												<span className="font-normal text-[#64748B]">(opsional)</span>
											</label>
											<textarea
												id="req-notes"
												rows={2}
												value={requestFormData.notes}
												onChange={(e) =>
													setRequestFormData({
														...requestFormData,
														notes: e.target.value,
													})
												}
												placeholder="Catatan tambahan untuk verifikator."
												className="w-full min-h-10 px-3 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] leading-normal text-[#0F172A] resize-y placeholder:text-[#64748B] transition-colors duration-150 ease-out hover:border-[#64748B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155]"
											/>
										</div>
									</fieldset>
								</div>

								{/* Footer — outside the scroll container */}
								<div className="flex items-center justify-end gap-3 shrink-0 px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E6E8EA] rounded-b-lg">
									<button
										type="button"
										onClick={() => setRequestModalAsset(null)}
										disabled={isSubmittingRequest}
										className="inline-flex items-center justify-center gap-2 min-h-9 px-3.5 py-2 bg-white border border-[#E6E8EA] rounded-lg text-[13px] font-medium text-[#334155] transition-colors duration-150 ease-out hover:bg-[#F2F3F4] hover:text-brand active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										Batal
									</button>
									<button
										type="submit"
										disabled={isSubmittingRequest}
										className="inline-flex items-center justify-center gap-2 min-h-9 px-3.5 py-2 bg-brand border border-brand rounded-lg text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-hover hover:border-brand-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#334155] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
									>
										{isSubmittingRequest ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												<span>Mengirim</span>
											</>
										) : (
											<>
												<Send className="w-4 h-4" />
												<span>Kirim Pengajuan</span>
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
