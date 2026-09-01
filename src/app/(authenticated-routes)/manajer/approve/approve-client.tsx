"use client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	Eye,
	X,
	Shield,
	CheckCircle2,
	RefreshCw,
	XCircle,
	Search,
} from "lucide-react";
import {
	reviewApproval,
	startReviewApproval,
	getApprovalById,
	getAttachmentsByEquipmentId,
	getEquipmentById,
	getValidations,
} from "@/action/api";
import { statusBadgeStyle, statusText } from "@/lib/equipment-status";

type Lookup = {
	id: number;
	name: string;
	description: string;
};

type StorageLocation = {
	id: number;
	name: string;
	description: string;
	plantId: number;
	plant?: Lookup | null;
};

export interface RequestAsset {
	id: string;
	nomorRequest: string;
	kodeAset: string;
	objectType: Lookup | null;
	namaAset: string;
	plant: Lookup | null;
	funcLoc: Lookup | null;
	storage: StorageLocation | null;
	tanggalPengajuan: string;
	statusAset: string;
	/** Enum backend (PENDING | IN_REVIEW | APPROVED | REVISION_REQUIRED) — dipakai untuk semua logic. */
	approvalStatus: string;
	/** Label bahasa Indonesia dari backend (status_label) — dipakai untuk tampilan saja. */
	statusLabel: string;
	inspekturNPP: string;
	equipmentId: string;
}

// Label fallback bila backend belum mengirim status_label.
const APPROVAL_STATUS_LABEL: Record<string, string> = {
	PENDING: "Menunggu Review",
	IN_REVIEW: "Sedang Direview",
	APPROVED: "Disetujui",
	REVISION_REQUIRED: "Perlu Revisi",
};

// Format angka ke Rupiah; null/undefined ditampilkan sebagai "-".
const formatRupiah = (v?: number) =>
	v == null ? "-" : `Rp ${new Intl.NumberFormat("id-ID").format(v)}`;

// Hasil validasi diturunkan dari kondisi aset (logika sama dengan backend CreateValidation):
// BAGUS lolos, rusak ringan/sedang masuk perbaikan, rusak berat diafkir.
const CONDITION_RESULT: Record<string, string> = {
	BAGUS: "Layak Digunakan",
	RUSAK_RINGAN: "Perbaikan Ringan",
	RUSAK_SEDANG: "Perbaikan Sedang",
	RUSAK_BERAT: "Scrap (Rusak Berat)",
};

/** Client Component: alur review multi-step (mulai review -> approve/revisi).
 * Data inbox di-fetch Server Component; detail per-aset tetap dimuat saat modal dibuka. */
export default function ManajerApproveClient({
	requests,
	plants,
}: {
	requests: RequestAsset[];
	plants: any[];
}) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [plant, setPlant] = useState("Semua Plant");
	const [status, setStatus] = useState("Semua Status");
	const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [selectedAsset, setSelectedAsset] = useState<RequestAsset | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isRevisiOpen, setIsRevisiOpen] = useState(false);
	const [revisiCatatan, setRevisiCatatan] = useState("");
	const [revisiError, setRevisiError] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [approvalSteps, setApprovalSteps] = useState<any[]>([]);
	// Validasi & data finansial diambil dari DB saat modal dibuka (bukan hardcode).
	const [validationDetail, setValidationDetail] = useState<any>(null);
	const [equipmentDetail, setEquipmentDetail] = useState<any>(null);
	const [attachments, setAttachments] = useState<any[]>([]);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const openModal = async (asset: RequestAsset) => {
		setSelectedAsset(asset);
		setIsModalOpen(true);
		setValidationDetail(null);
		setEquipmentDetail(null);
		setAttachments([]);
		try {
			const [data, attsData, validations, eqDetail] = await Promise.all([
				getApprovalById(asset.id),
				getAttachmentsByEquipmentId(asset.equipmentId),
				getValidations(asset.equipmentId),
				getEquipmentById(asset.equipmentId),
			]);

			if (data && data.steps) {
				setApprovalSteps(data.steps);
			} else {
				setApprovalSteps([]);
			}

			if (attsData && Array.isArray(attsData)) {
				setAttachments(attsData);
			}

			// Validasi terbaru (GET /api/validation) — sumber data Hasil Validasi.
			if (Array.isArray(validations) && validations.length > 0) {
				setValidationDetail(validations[0]);
			}
			if (eqDetail) {
				setEquipmentDetail(eqDetail);
			}
		} catch (err) {
			console.error(err);
			setApprovalSteps([]);
		}
	};

	const handleMulaiReview = async () => {
		if (selectedAsset && selectedAsset.approvalStatus === "PENDING") {
			let res: { success: boolean; message?: string };
			try {
				res = await startReviewApproval(selectedAsset.id);
			} catch (err) {
				res = {
					success: false,
					message: err instanceof Error ? err.message : String(err),
				};
			}

			// Transisi gagal = status TIDAK berubah. Jangan update UI optimistis
			// kalau backend menolak, supaya inbox tetap mencerminkan state server.
			if (!res.success) {
				console.error("Failed to start review on backend:", res.message);
				setNotification({
					type: "error",
					message: `Gagal memulai review: ${res.message || "coba lagi"}.`,
				});
				setTimeout(() => setNotification(null), 3000);
				return;
			}

			// List di belakang mengikuti state server; server action sudah revalidateApp().
			router.refresh();

			// Update selected asset state so UI re-renders immediately
			setSelectedAsset({
				...selectedAsset,
				approvalStatus: "IN_REVIEW",
				statusLabel: APPROVAL_STATUS_LABEL.IN_REVIEW,
			});
		}
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setPreviewImage(null);
		setApprovalSteps([]);
		setTimeout(() => setSelectedAsset(null), 300);
	};

	const handleApprove = async () => {
		if (selectedAsset) {
			const res = await reviewApproval(
				selectedAsset.id,
				"APPROVE",
				"Disetujui oleh manajer",
			);

			if (res.success) {
				setNotification({
					type: "success",
					message: "Berhasil menyetujui aset!",
				});
				// Server action sudah revalidateApp(); tarik payload RSC terbaru.
				router.refresh();
				setIsConfirmOpen(false);
				closeModal();
				setTimeout(() => setNotification(null), 3000);
			} else {
				setNotification({
					type: "error",
					message: "Gagal menyetujui aset: " + (res.message || "Silakan coba lagi."),
				});
				setTimeout(() => setNotification(null), 3000);
			}
		}
	};

	const handleKirimRevisi = async () => {
		if (!revisiCatatan.trim()) {
			setRevisiError(true);
			return;
		}

		if (selectedAsset) {
			const res = await reviewApproval(
				selectedAsset.id,
				"REVISION",
				revisiCatatan,
			);

			if (res.success) {
				setNotification({
					type: "success",
					message: "Berhasil mengirim permintaan revisi!",
				});
				// Server action sudah revalidateApp(); tarik payload RSC terbaru.
				router.refresh();
				setIsRevisiOpen(false);
				closeModal();
				setTimeout(() => setNotification(null), 3000);
			} else {
				setNotification({
					type: "error",
					message:
						"Gagal mengirim permintaan revisi: " +
						(res.message || "Silakan coba lagi."),
				});
				setTimeout(() => setNotification(null), 3000);
			}
		}
	};

	// Daftar hasil filter diturunkan langsung dari state filter, bukan disalin ke
	// state terpisah lewat effect.
	const filteredRequests = useMemo(() => {
		const query = searchInput || search;
		return requests.filter((req) => {
			const isAwaitingDecision =
				(req.approvalStatus === "PENDING" || req.approvalStatus === "IN_REVIEW") &&
				req.statusAset !== "READY_TO_USE";
			const matchTab =
				activeTab === "inbox" ? isAwaitingDecision : !isAwaitingDecision;
			const matchSearch = query
				? req.nomorRequest.toLowerCase().includes(query.toLowerCase()) ||
					req.kodeAset.toLowerCase().includes(query.toLowerCase()) ||
					req.namaAset.toLowerCase().includes(query.toLowerCase())
				: true;
			const matchPlant =
				plant !== "Semua Plant" ? req.plant?.name === plant : true;
			const matchStatus =
				status !== "Semua Status" ? req.approvalStatus === status : true;

			let matchDate = true;
			if (startDate && endDate) {
				const reqDate = new Date(req.tanggalPengajuan);
				matchDate = reqDate >= new Date(startDate) && reqDate <= new Date(endDate);
			} else if (startDate) {
				matchDate = req.tanggalPengajuan.startsWith(startDate);
			}
			return matchTab && matchSearch && matchPlant && matchStatus && matchDate;
		});
	}, [
		requests,
		activeTab,
		search,
		searchInput,
		plant,
		status,
		startDate,
		endDate,
	]);

	const inboxCount = requests.filter(
		(req) =>
			(req.approvalStatus === "PENDING" || req.approvalStatus === "IN_REVIEW") &&
			req.statusAset !== "READY_TO_USE",
	).length;
	const historyCount = requests.length - inboxCount;

	const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
	// Halaman dijepit ke rentang valid agar filter tidak menyisakan halaman kosong.
	const page = Math.min(currentPage, Math.max(totalPages, 1));
	const paginatedRequests = filteredRequests.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	const handleReset = () => {
		setSearchInput("");
		setSearch("");
		setPlant("Semua Plant");
		setStatus("Semua Status");
		setStartDate("");
		setEndDate("");
		setCurrentPage(1);
	};

	// Teks badge = nama status dari backend apa adanya (lihat lib/equipment-status).
	const getStatusAsetBadge = (status: string) => (
		<span
			className={`${statusBadgeStyle(status)} px-3 py-1 rounded-full text-[11px] font-semibold`}
		>
			{statusText(status)}
		</span>
	);

	// Warna badge dipilih dari enum backend; teksnya memakai label dari backend.
	const APPROVAL_BADGE_STYLE: Record<string, string> = {
		PENDING: "bg-[#FEF9C3] text-[#CA8A04]",
		IN_REVIEW: "bg-[#E0F2FE] text-[#0284C7]",
		REVISION_REQUIRED: "bg-[#F3E8FF] text-[#9333EA]",
		APPROVED: "bg-[#DCFCE7] text-[#16A34A]",
	};

	const getApprovalBadge = (approvalStatus: string, label: string) => (
		<span
			className={`${APPROVAL_BADGE_STYLE[approvalStatus] || "bg-gray-100 text-gray-700"} px-3 py-1 rounded-full text-[11px] font-semibold`}
		>
			{label}
		</span>
	);

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
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-bold text-gray-900 tracking-tight">
					Pusat Data Aset
				</h1>
			</div>

			{/* Table Section */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				<div className="flex items-center gap-6 border-b border-gray-200 bg-white px-5 pt-3">
					<button
						type="button"
						onClick={() => {
							setActiveTab("inbox");
							setCurrentPage(1);
						}}
						className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${activeTab === "inbox" ? "border-b-2 border-[#0A356A] text-[#0A356A]" : "text-gray-500 hover:text-gray-700"}`}
					>
						Antrean Persetujuan
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === "inbox" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"}`}
						>
							{inboxCount}
						</span>
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("history");
							setCurrentPage(1);
						}}
						className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${activeTab === "history" ? "border-b-2 border-[#0A356A] text-[#0A356A]" : "text-gray-500 hover:text-gray-700"}`}
					>
						Riwayat Persetujuan
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === "history" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"}`}
						>
							{historyCount}
						</span>
					</button>
				</div>
				{/* Toolbar / Filters (Identik dengan halaman Inspeksi Validasi) */}
				<div className="border-b border-gray-200 bg-white p-4">
					<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
						{/* Search */}
						<div className="flex w-full gap-2 xl:w-[360px] xl:shrink-0">
							<div className="relative min-w-0 flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									placeholder="Cari request, kode, atau nama..."
									value={searchInput}
									onChange={(e) => {
										setSearchInput(e.target.value);
										setSearch(e.target.value);
									}}
									className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-4 pl-9 text-[13px] font-medium placeholder:text-gray-400 focus:border-[#0A356A] focus:bg-white focus:ring-1 focus:ring-[#0A356A] focus:outline-none"
								/>
							</div>
							<button
								type="button"
								onClick={() => setSearch(searchInput)}
								className="h-10 shrink-0 rounded-lg bg-[#0A356A] px-3.5 text-[13px] font-semibold whitespace-nowrap text-white shadow-xs transition-colors hover:bg-[#062854] cursor-pointer"
							>
								Cari
							</button>
						</div>

						{/* Filter Group */}
						<div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center xl:w-auto xl:flex-nowrap">
							<select
								value={plant}
								onChange={(e) => setPlant(e.target.value)}
								className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] sm:w-[115px] cursor-pointer"
							>
								<option value="Semua Plant">Semua Plant</option>
								{plants.map((p: any) => (
									<option key={p.id} value={p.name}>
										{p.description || p.name}
									</option>
								))}
							</select>

							<select
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] sm:w-[130px] cursor-pointer"
							>
								<option value="Semua Status">Semua Status</option>
								<option value="PENDING">Menunggu Review</option>
								<option value="IN_REVIEW">Sedang Direview</option>
								<option value="REVISION_REQUIRED">Perlu Revisi</option>
								<option value="APPROVED">Disetujui</option>
							</select>

							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-700 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] sm:min-w-[140px] cursor-pointer"
							/>

							{/* Reset Button */}
							<button
								type="button"
								onClick={handleReset}
								className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 whitespace-nowrap cursor-pointer"
								title="Reset semua filter"
							>
								<RefreshCw className="w-3.5 h-3.5" />
								Reset
							</button>
						</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-12 whitespace-nowrap">
									No
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									No. Registrasi
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									Kode
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider min-w-[120px] whitespace-nowrap text-center">
									Nama
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									Plant
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									Tanggal
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									Status Aset
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
									Status
								</th>
								<th className="px-2 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-100">
							{paginatedRequests.length === 0 ? (
								<tr>
									<td
										colSpan={9}
										className="px-4 py-8 text-center text-[13px] text-gray-500"
									>
										Tidak ada pengajuan validasi.
									</td>
								</tr>
							) : (
								paginatedRequests.map((req, index) => (
									<tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
										<td className="px-2 py-2 text-[12px] text-gray-500 font-medium text-center">
											{index + 1 + (page - 1) * ITEMS_PER_PAGE}
										</td>
										<td className="px-2 py-2 text-[12px] font-bold text-[#0A356A] leading-snug text-center">
											{req.nomorRequest}
										</td>
										<td className="px-2 py-2 whitespace-nowrap text-[12px] font-bold text-gray-900 text-center">
											{req.kodeAset}
										</td>
										<td className="px-2 py-2 text-[12px] text-gray-600 font-medium leading-snug text-center">
											{req.namaAset}
										</td>
										<td className="px-2 py-2 whitespace-nowrap text-[12px] text-gray-600 font-medium text-center">
											{req.plant?.name ?? "-"}
										</td>
										<td className="px-2 py-2 text-[11px] text-gray-600 font-medium leading-snug text-center whitespace-nowrap">
											{req.tanggalPengajuan}
										</td>
										<td className="px-2 py-2 whitespace-nowrap text-center">
											{getStatusAsetBadge(req.statusAset)}
										</td>
										<td className="px-2 py-2 text-center">
											{getApprovalBadge(req.approvalStatus, req.statusLabel)}
										</td>
										<td className="px-2 py-2 text-center w-[80px]">
											<button
												onClick={() => openModal(req)}
												className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors w-full"
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
				</div>

				{filteredRequests.length > 0 && (
					<div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
						<span className="text-[12px] font-medium text-gray-500">
							Menampilkan{" "}
							{filteredRequests.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(page * ITEMS_PER_PAGE, filteredRequests.length)} dari{" "}
							{filteredRequests.length} data (10 baris/halaman)
						</span>
						{totalPages > 1 && (
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Prev
								</button>
								<div className="flex items-center gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`w-7 h-7 rounded-md text-[12px] font-bold flex items-center justify-center transition-colors ${
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
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Modal Detail Informasi Aset */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
						onClick={closeModal}
					/>

					<div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
						{/* Modal Header */}
						<div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
							<div>
								<h2 className="text-lg font-bold text-[#1e293b]">
									Detail Review Persetujuan
								</h2>
								<p className="text-[13px] text-gray-500 font-medium mt-0.5">
									{selectedAsset.kodeAset}
								</p>
							</div>
							<button
								onClick={closeModal}
								className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-md transition-colors font-bold mt-1"
							>
								<X className="w-5 h-5" strokeWidth={3} />
							</button>
						</div>

						{/* Modal Body */}
						<div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
							{/* Alert Banner Dinamis */}
							<div
								className={`border rounded-lg p-3.5 flex items-start gap-3 mb-6 ${
									selectedAsset.approvalStatus === "PENDING"
										? "bg-[#FEF9C3] border-yellow-200 text-yellow-800"
										: selectedAsset.approvalStatus === "IN_REVIEW"
											? "bg-[#E0F2FE] border-blue-200 text-blue-800"
											: selectedAsset.approvalStatus === "REVISION_REQUIRED"
												? "bg-[#F3E8FF] border-purple-200 text-purple-800"
												: "bg-gray-100 border-gray-200 text-gray-800"
								}`}
							>
								<Shield className="w-5 h-5 shrink-0 mt-0.5" />
								<p className="text-[13px] font-medium leading-relaxed">
									Status: <strong>{selectedAsset.statusLabel}</strong>.
									{selectedAsset.approvalStatus === "PENDING" &&
										" Silakan mulai review untuk melihat detail lebih lanjut."}
									{selectedAsset.approvalStatus === "IN_REVIEW" &&
										" Anda sedang mereview pengajuan ini. Berikan keputusan setujui atau minta revisi."}
									{selectedAsset.approvalStatus === "REVISION_REQUIRED" &&
										" Menunggu perbaikan dari Tim Inspeksi Teknik."}
								</p>
							</div>

							{/* Section 1: Detail Spesifikasi Alat */}
							<div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
								<h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">
									1. Detail Spesifikasi Aset
								</h3>
								<div className="grid grid-cols-2 gap-x-8 gap-y-4">
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Nomor Request:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.nomorRequest}
										</p>
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Kode Aset:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.kodeAset}
										</p>
									</div>

									<div className="col-span-2">
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Nama Aset:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.namaAset}
										</p>
									</div>

									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Jenis Aset:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.objectType?.name ?? "-"}
										</p>
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">Plant:</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.plant?.name ?? "-"}
										</p>
									</div>

									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Functional Location:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.funcLoc?.name ?? "-"}
										</p>
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Storage Location:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{selectedAsset.storage?.name ?? "-"}
										</p>
									</div>

									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Tanggal Registrasi:
										</p>
										<p className="text-[11px] font-medium text-gray-900">
											{selectedAsset.tanggalPengajuan}
										</p>
									</div>
									<div className="hidden"></div>

									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Status Aset:
										</p>
										{getStatusAsetBadge(selectedAsset.statusAset)}
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Status Persetujuan:
										</p>
										{getApprovalBadge(
											selectedAsset.approvalStatus,
											selectedAsset.statusLabel,
										)}
									</div>
								</div>

								{/* Foto Dokumentasi Aset */}
								{attachments.length > 0 && (
									<div className="mt-4">
										<p className="text-[12px] text-gray-500 font-medium mb-2">
											Foto Dokumentasi:
										</p>
										<div className="grid grid-cols-3 gap-3">
											{attachments.map((att: any, idx: number) => (
												<div
													key={idx}
													className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square"
													onClick={() => setPreviewImage(att.file_url || att.url)}
												>
													{/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
													<img
														src={att.file_url || att.url}
														alt={att.description || att.file_name || `Foto ${idx + 1}`}
														className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
													/>
													<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
														<Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
													</div>
													{att.description && (
														<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
															<p className="text-[10px] text-white font-medium truncate">
																{att.description}
															</p>
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Section 2: Informasi Finansial */}
							<div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
								<h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">
									2. Informasi Finansial
								</h3>
								<div className="grid grid-cols-3 gap-4">
									<div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
										<p className="text-[11px] text-gray-500 font-medium mb-1">
											Original Value
										</p>
										<p className="text-[14px] font-bold text-gray-900">
											{formatRupiah(equipmentDetail?.original_value)}
										</p>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
										<p className="text-[11px] text-gray-500 font-medium mb-1">
											Book Value
										</p>
										<p className="text-[14px] font-bold text-gray-900">
											{formatRupiah(equipmentDetail?.book_value)}
										</p>
									</div>
									<div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
										<p className="text-[11px] text-blue-700 font-medium mb-1">
											Estimated Reuse Value
										</p>
										<p className="text-[14px] font-bold text-[#0f4a8a]">
											{formatRupiah(equipmentDetail?.estimated_reuse_value)}
										</p>
									</div>
								</div>
							</div>

							{/* Section 3: Hasil Validasi Inspeksi Teknik */}
							<div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
								{selectedAsset.approvalStatus === "PENDING" && (
									<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
										<div className="bg-white px-4 py-2 border border-gray-200 rounded-full shadow-md text-[12px] font-bold text-gray-600 flex items-center gap-2">
											<Shield className="w-4 h-4 text-blue-500" />
											Mulai review untuk melihat detail inspeksi
										</div>
									</div>
								)}

								<h3 className="text-[14px] font-bold text-[#0f4a8a] border-b border-blue-100 pb-2 mb-4">
									3. Hasil Validasi Inspeksi Teknik
								</h3>

								<div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Nama Inspektur:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{validationDetail?.inspector_user?.name || "-"}
										</p>
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											NPP / Role:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{validationDetail?.inspector_user?.npp || "-"} /{" "}
											{validationDetail?.inspector_user?.role || "-"}
										</p>
									</div>

									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Waktu Pemeriksaan:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{validationDetail?.start_at
												? new Date(validationDetail.start_at).toLocaleString("id-ID", {
														day: "numeric",
														month: "short",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})
												: "-"}
										</p>
									</div>
									<div>
										<p className="text-[12px] text-gray-500 font-medium mb-1">
											Durasi / Lokasi:
										</p>
										<p className="text-[13px] font-bold text-gray-900">
											{validationDetail?.start_at && validationDetail?.end_at
												? `${Math.max(
														1,
														Math.round(
															(new Date(validationDetail.end_at).getTime() -
																new Date(validationDetail.start_at).getTime()) /
																86_400_000,
														) + 1,
													)} Hari / ${selectedAsset.plant?.name ?? "-"}`
												: "-"}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 mb-5">
									<div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
										<p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
											Kondisi Aset
										</p>
										<p className="text-[13px] text-gray-800">
											{equipmentDetail?.condition?.name || (
												<span className="text-gray-400 italic">
													Belum ada data (menunggu validasi)
												</span>
											)}
										</p>
										{equipmentDetail?.condition?.description && (
											<p className="text-[11px] text-gray-500 mt-1">
												{equipmentDetail.condition.description}
											</p>
										)}
									</div>
									<div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
										<p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
											Status Aset
										</p>
										<p className="text-[13px] text-gray-800">
											{equipmentDetail?.status?.name || (
												<span className="text-gray-400 italic">Belum ada data</span>
											)}
										</p>
										{equipmentDetail?.status?.description && (
											<p className="text-[11px] text-gray-500 mt-1">
												{equipmentDetail.status.description}
											</p>
										)}
									</div>
								</div>

								{(() => {
									// Hasil & warnanya mengikuti kondisi aset hasil validasi terakhir.
									const conditionName = (
										equipmentDetail?.condition?.name || ""
									).toUpperCase();
									const hasResult = !!validationDetail && !!conditionName;
									const isBad = hasResult && conditionName.startsWith("RUSAK");
									const tone = !hasResult
										? {
												box: "bg-gray-50 border-gray-200",
												dot: "bg-gray-400",
												text: "text-gray-500",
											}
										: isBad
											? {
													box: "bg-red-50 border-red-200",
													dot: "bg-red-500",
													text: "text-red-800",
												}
											: {
													box: "bg-green-50 border-green-200",
													dot: "bg-green-500",
													text: "text-green-800",
												};

									return (
										<div className={`border rounded-lg p-4 mb-5 ${tone.box}`}>
											<div className="flex items-center gap-2 mb-2">
												<div className={`w-2 h-2 rounded-full ${tone.dot}`}></div>
												<p
													className={`text-[13px] font-bold uppercase tracking-wide ${tone.text}`}
												>
													Hasil:{" "}
													{hasResult
														? CONDITION_RESULT[conditionName] || conditionName
														: "Belum Ada Hasil Validasi"}
												</p>
											</div>
											{validationDetail?.inspection_number && (
												<p className="text-[11px] text-gray-500 pl-4">
													No. Pemeriksaan:{" "}
													<span className="font-semibold text-gray-700">
														{validationDetail.inspection_number}
													</span>
												</p>
											)}
											<div className="pl-4">
												<p className="text-[12px] text-gray-500 font-medium mt-2">
													Catatan Pemeriksaan:
												</p>
												<p className="text-[13px] text-gray-800 italic">
													{validationDetail?.notes ? (
														`"${validationDetail.notes}"`
													) : (
														<span className="text-gray-400">Belum ada catatan</span>
													)}
												</p>

												<p className="text-[12px] text-gray-500 font-medium mt-3">
													Rekomendasi Tindakan:
												</p>
												<p className="text-[13px] font-bold text-gray-900">
													{validationDetail?.followup_recommendation || (
														<span className="text-gray-400 font-normal italic">
															Belum ada rekomendasi
														</span>
													)}
												</p>
											</div>
										</div>
									);
								})()}

								{/* Dokumentasi */}
								<p className="text-[12px] text-gray-500 font-medium mb-2">
									Dokumentasi Foto & Riwayat Audit:
								</p>
								<div className="flex gap-3">
									{attachments.length > 0 ? (
										attachments.slice(0, 2).map((att: any, idx: number) => (
											<div
												key={idx}
												className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
												onClick={() => setPreviewImage(att.file_url || att.url)}
											>
												{/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
												<img
													src={att.file_url || att.url}
													className="absolute inset-0 w-full h-full object-cover"
													alt={`Foto ${idx + 1}`}
												/>
											</div>
										))
									) : (
										<div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
											<span className="text-[10px] font-medium text-center px-2">
												Tidak ada foto
											</span>
										</div>
									)}
									<div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 overflow-y-auto h-24">
										<p className="font-bold text-gray-700 mb-1">Riwayat Audit (Log):</p>
										<ul className="list-disc pl-4 space-y-1">
											{approvalSteps.length > 0 ? (
												approvalSteps.map((step) => (
													<li key={step.id}>
														{step.approval_date
															? new Date(step.approval_date).toLocaleString("en-GB", {
																	day: "2-digit",
																	month: "short",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																})
															: "-"}{" "}
														- {step.status_label || step.approval_status}{" "}
														{step.approval_name
															? `(${step.approval_name})`
															: step.approval_role
																? `(${step.approval_role})`
																: ""}
													</li>
												))
											) : (
												<li>Belum ada riwayat audit</li>
											)}
										</ul>
									</div>
								</div>
							</div>
						</div>

						{/* Modal Footer dengan Tombol Aksi Sesuai Status */}
						<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
							<button
								onClick={closeModal}
								className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors"
							>
								Tutup
							</button>

							{selectedAsset.approvalStatus === "PENDING" && (
								<button
									onClick={handleMulaiReview}
									className="px-6 py-2.5 bg-[#0f4a8a] text-white rounded-md text-[13px] font-semibold hover:bg-[#0b386b] transition-colors shadow-sm"
								>
									Mulai Review
								</button>
							)}

							{selectedAsset.approvalStatus === "IN_REVIEW" && (
								<>
									<button
										onClick={() => {
											setRevisiCatatan("");
											setRevisiError(false);
											setIsRevisiOpen(true);
										}}
										className="px-6 py-2.5 bg-white border border-[#f60000] text-[#f60000] rounded-md text-[13px] font-semibold hover:bg-red-50 transition-colors"
									>
										Minta Revisi
									</button>
									<button
										onClick={() => setIsConfirmOpen(true)}
										className="px-6 py-2.5 bg-[#166534] text-white rounded-md text-[13px] font-semibold hover:bg-[#14532d] transition-colors shadow-sm"
									>
										Setujui (Approve)
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi */}
			{isConfirmOpen && selectedAsset && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
						onClick={() => setIsConfirmOpen(false)}
					/>

					<div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
						<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
							<CheckCircle2 className="w-7 h-7 text-green-600" />
						</div>

						<h3 className="text-lg font-bold text-gray-900 mb-2">
							Konfirmasi Persetujuan Aset
						</h3>

						<p className="text-[13px] text-gray-600 mb-6 leading-relaxed">
							Apakah Anda yakin ingin menyetujui hasil validasi ini? Setelah disetujui,{" "}
							<span className="font-bold">{selectedAsset.kodeAset}</span> aset akan
							berubah menjadi{" "}
							<span className="font-bold text-green-700">READY_TO_USE</span>, proses
							persetujuan selesai, dan pengajuan tidak lagi muncul pada Inbox Approval.
						</p>

						<div className="flex items-center gap-3 w-full justify-center">
							<button
								onClick={() => setIsConfirmOpen(false)}
								className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors w-[120px]"
							>
								Batal
							</button>
							<button
								onClick={handleApprove}
								className="px-5 py-2.5 bg-[#166534] text-white rounded-md text-[13px] font-semibold hover:bg-[#14532d] transition-colors w-[120px]"
							>
								Ya, Setujui
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Minta Revisi */}
			{isRevisiOpen && selectedAsset && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
						onClick={() => setIsRevisiOpen(false)}
					/>

					<div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-start animate-in zoom-in-95 duration-200">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
								<RefreshCw className="w-4 h-4 text-purple-600" strokeWidth={3} />
							</div>
							<h3 className="text-[16px] font-bold text-gray-900">
								Minta Revisi Validasi
							</h3>
						</div>

						<p className="text-[13px] text-gray-600 mb-5 leading-relaxed text-left">
							Apakah Anda yakin ingin meminta revisi? Tim Inspeksi Teknik akan dapat
							memperbarui hasil validasi berdasarkan catatan revisi yang Anda berikan
							di bawah ini.
						</p>

						<div className="text-left w-full mb-6">
							<label className="block text-[12px] font-bold text-gray-800 mb-1.5">
								Catatan Revisi Manajer (Wajib) *
							</label>
							<textarea
								value={revisiCatatan}
								onChange={(e) => {
									setRevisiCatatan(e.target.value);
									if (e.target.value.trim()) setRevisiError(false);
								}}
								placeholder="Tulis instruksi revisi secara spesifik (misal: 'Perbaiki foto plat nama yang buram')..."
								className={`w-full p-3 border rounded-lg text-[13px] outline-none transition-colors resize-none h-24 ${revisiError ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"}`}
							/>
							{revisiError && (
								<p className="text-red-500 text-[11px] mt-1.5 font-medium">
									Catatan revisi tidak boleh kosong.
								</p>
							)}
						</div>

						<div className="flex items-center justify-end gap-3 w-full">
							<button
								onClick={() => setIsRevisiOpen(false)}
								className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors"
							>
								Batal
							</button>
							<button
								onClick={handleKirimRevisi}
								className="px-5 py-2 bg-[#ff0000] text-white rounded-md text-[13px] font-semibold hover:bg-[#8c0000] transition-colors"
							>
								Kirim Permintaan Revisi
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Image Preview Modal */}
			{previewImage && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm"
					onClick={() => setPreviewImage(null)}
				>
					<button
						className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							setPreviewImage(null);
						}}
					>
						<X className="w-6 h-6" />
					</button>
					<div className="relative w-[92vw] max-w-5xl h-[85vh] flex items-center justify-center">
						{/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
						<img
							src={previewImage}
							alt="Preview Foto"
							className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
