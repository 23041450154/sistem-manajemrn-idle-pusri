"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	Eye,
	X,
	FileText,
	CheckCircle2,
	RefreshCw,
	XCircle,
	Boxes,
	Search,
} from "lucide-react";
import { getReuseRequests, updateReuseRequestStatus } from "@/action/api";
import { reuseDisplayStatus } from "@/lib/approvals";

interface ReuseRequest {
	id: string;
	/** ID approval request (bukan ID reuse request). Dipakai untuk aksi review. */
	approval_id: string | null;
	request_number: string;
	equipment_id: string;
	equipment_code: string;
	equipment_name: string;
	requesting_unit: string;
	target_plant: string;
	start_date: string;
	end_date?: string;
	justification: string;
	estimated_cost_avoidance?: number;
	contact_person: string;
	contact_npp?: string;
	contact_phone?: string;
	status:
		| "PENDING"
		| "IN_REVIEW"
		| "APPROVED"
		| "REJECTED"
		| "REVISION_REQUESTED";
	created_at?: string;
	review_notes?: string;
	history?: Array<{
		id: string;
		title: string;
		description: string;
		timestamp: string;
		user: string;
	}>;
}

/** Bentuk baris reuse request dari backend (snake_case, relasi di-preload). */
interface ReuseRequestApi {
	id: number | string;
	approval_id?: string | null;
	approval_status?: string;
	approvalStatus?: string;
	ApprovalStatus?: string;
	status?: string;
	request_number?: string;
	equipment_id?: number | string;
	requesting_project?: string;
	requesting_plant?: string;
	installation_location?: string;
	reuse_date?: string;
	requested_at?: string;
	created_at?: string;
	estimated_cost_avoidance?: number;
	justification?: string;
	notes?: string;
	equipment?: {
		id?: number | string;
		equipment_code?: string;
		name?: string;
		plant?: { name?: string; description?: string };
	};
	requested_by_user?: { name?: string; npp?: string };
}

export default function ManajerPeminjamanPage() {
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [plant, setPlant] = useState("Semua Plant");
	const [status, setStatus] = useState("Semua Status");
	const [listTab, setListTab] = useState<"inbox" | "history">("inbox");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [requests, setRequests] = useState<ReuseRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Centered Modal State
	const [selectedRequest, setSelectedRequest] = useState<ReuseRequest | null>(
		null,
	);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"detail" | "history">("detail");
	const [actionNotes, setActionNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const fetchRequests = useCallback(async () => {
		try {
			// Manajer melihat semua pengajuan: GET /api/reuse-request/all
			const data = await getReuseRequests("all");
			let mapped: ReuseRequest[] = [];

			if (Array.isArray(data) && data.length > 0) {
				mapped = data.map((item: ReuseRequestApi) => {
					const eq = item.equipment || {};
					const rawDate =
						item.reuse_date ||
						item.requested_at ||
						item.created_at ||
						new Date().toISOString();
					const startDateStr =
						typeof rawDate === "string"
							? rawDate.split("T")[0]
							: new Date().toISOString().split("T")[0];

					return {
						id: String(item.id),
						approval_id: item.approval_id ?? null,
						request_number: item.request_number || `REQ-${item.id}`,
						equipment_id: String(item.equipment_id || eq.id || ""),
						equipment_code: eq.equipment_code || "-",
						equipment_name: eq.name || "Peralatan Idle",
						requesting_unit:
							item.installation_location ||
							item.requesting_project ||
							"Unit Operasi",
						target_plant:
							item.requesting_plant ||
							eq.plant?.name ||
							eq.plant?.description ||
							"-",
						start_date: startDateStr,
						end_date: "-",
						justification:
							item.justification ||
							item.notes ||
							"Kebutuhan operasional unit kerja",
						estimated_cost_avoidance:
							Number(item.estimated_cost_avoidance) || 0,
						contact_person: item.requested_by_user?.name || "-",
						contact_npp: item.requested_by_user?.npp || "-",
						contact_phone: "-",
						// Backend mengembalikan approval_status = APPROVED setelah
						// Manager menyetujui. Variasi casing dipertahankan agar tidak
						// kembali tampil sebagai PENDING saat data dimuat ulang.
						status: reuseDisplayStatus(
							item.approval_status ||
								item.approvalStatus ||
								item.ApprovalStatus ||
								item.status,
						),
						// Gunakan waktu pengajuan untuk pengurutan tabel; tanggal reuse
						// adalah tanggal pemakaian yang dapat berada di masa depan.
						created_at:
							item.created_at || item.requested_at || (typeof rawDate === "string" ? rawDate : undefined),
						review_notes: item.notes || "",
					};
				});
			}

			setRequests(mapped);
		} catch (e) {
			console.error("Error fetching reuse requests:", e);
			// Tidak memakai data contoh: daftar kosong lebih jujur daripada pengajuan
			// palsu yang bisa ditindak Manajer.
			setRequests([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
		void fetchRequests();
	}, [fetchRequests]);

	// Daftar hasil filter diturunkan dari state filter (bukan disalin ke state
	// terpisah), jadi tidak ada effect yang menyalin state ke state.
	const filteredRequests = useMemo(() => {
		const query = searchInput || search;
		return requests.filter((req) => {
			const isAwaitingDecision = req.status === "PENDING" || req.status === "IN_REVIEW";
			const matchTab = listTab === "inbox" ? isAwaitingDecision : !isAwaitingDecision;
			const matchSearch = query
				? req.request_number.toLowerCase().includes(query.toLowerCase()) ||
					req.equipment_code.toLowerCase().includes(query.toLowerCase()) ||
					req.equipment_name.toLowerCase().includes(query.toLowerCase()) ||
					req.requesting_unit.toLowerCase().includes(query.toLowerCase())
				: true;
			const matchPlant =
				plant !== "Semua Plant" ? req.target_plant === plant : true;
			const matchStatus =
				status !== "Semua Status"
					? (status === "Disetujui" && req.status === "APPROVED") ||
						(status === "Ditolak" && req.status === "REJECTED") ||
						(status === "Perlu Revisi" &&
							req.status === "REVISION_REQUESTED") ||
						(status === "Menunggu Review" &&
							(req.status === "PENDING" || req.status === "IN_REVIEW"))
					: true;

			let matchDate = true;
			if (startDate && endDate) {
				const reqDate = new Date(req.start_date);
				matchDate =
					reqDate >= new Date(startDate) && reqDate <= new Date(endDate);
			} else if (startDate) {
				matchDate = req.start_date.startsWith(startDate);
			}
			return matchTab && matchSearch && matchPlant && matchStatus && matchDate;
		}).sort((a, b) => {
			const aTime = Date.parse(a.created_at || "") || 0;
			const bTime = Date.parse(b.created_at || "") || 0;
			return bTime - aTime;
		});
	}, [requests, listTab, search, searchInput, plant, status, startDate, endDate]);

	const inboxCount = requests.filter(
		(req) => req.status === "PENDING" || req.status === "IN_REVIEW",
	).length;
	const historyCount = requests.length - inboxCount;

	const handleReset = () => {
		setSearchInput("");
		setSearch("");
		setPlant("Semua Plant");
		setStatus("Semua Status");
		setStartDate("");
		setEndDate("");
		setCurrentPage(1);
	};

	const openDrawer = (req: ReuseRequest) => {
		setSelectedRequest(req);
		setIsDrawerOpen(true);
		setActiveTab("detail");
		setActionNotes("");
	};

	const closeDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedRequest(null);
		setActionNotes("");
	};

	/**
	 * Backend approval REUSE hanya mengenal IN_REVIEW | APPROVE | REVISION.
	 * Tidak ada aksi penolakan, jadi "Tolak" dikirim sebagai REVISION dengan
	 * catatan wajib dan status pengajuan menjadi REVISION_REQUESTED.
	 */
	const handleAction = async (newStatus: "APPROVED" | "REVISION_REQUESTED") => {
		if (!selectedRequest) return;

		if (newStatus === "REVISION_REQUESTED" && !actionNotes.trim()) {
			alert("Harap berikan catatan/alasan penolakan.");
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await updateReuseRequestStatus(
				selectedRequest.approval_id,
				newStatus,
				actionNotes,
				selectedRequest.id,
			);
			if (result.success) {
				const updated = requests.map((r) =>
					r.id === selectedRequest.id
						? {
								...r,
								status: newStatus,
								review_notes: actionNotes,
								history: [
									...(r.history || []),
									{
										id: `h-${Date.now()}`,
										title:
											newStatus === "APPROVED"
												? "Pengajuan Disetujui"
												: "Pengajuan Dikembalikan untuk Revisi",
										description:
											actionNotes || `Status diperbarui menjadi ${newStatus}`,
										timestamp: new Date().toISOString(),
										user: "Manajer Rendal Pemeliharaan",
									},
								],
							}
						: r,
				);
				setRequests(updated);
				// Sumber kebenaran status adalah ApprovalRequest di backend. Muat ulang
				// setelah transaksi approval selesai agar tabel langsung menampilkan
				// approval_status terbaru (mis. APPROVED).
				await fetchRequests();

				setNotification({
					type: "success",
					message:
						newStatus === "APPROVED"
							? `Pengajuan peminjaman ${selectedRequest.request_number} telah disetujui!`
							: `Pengajuan peminjaman ${selectedRequest.request_number} dikembalikan untuk revisi.`,
				});

				setTimeout(() => setNotification(null), 3000);
				closeDrawer();
			} else {
				alert(result.message || "Gagal memperbarui status.");
			}
		} catch (e) {
			console.error(e);
			alert("Terjadi kesalahan sistem.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
	// Halaman dijepit ke rentang valid supaya filter yang mengecilkan hasil tidak
	// meninggalkan halaman kosong.
	const page = Math.min(currentPage, Math.max(totalPages, 1));
	const paginatedRequests = filteredRequests.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	const getStatusBadge = (statusName?: string) => {
		const s = (statusName || "PENDING").toUpperCase();
		if (s.includes("APPROV") || s.includes("VALIDAT")) {
			return (
				<span className="bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[11px] font-semibold">
					Disetujui
				</span>
			);
		}
		if (s.includes("REJECT") || s.includes("DISPOS")) {
			return (
				<span className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-[11px] font-semibold">
					Ditolak
				</span>
			);
		}
		if (s.includes("REVISI")) {
			return (
				<span className="bg-[#FEF3C7] text-[#D97706] px-3 py-1 rounded-full text-[11px] font-semibold">
					Perlu Revisi
				</span>
			);
		}
		return (
			<span className="bg-[#F3E8FF] text-[#9333EA] px-3 py-1 rounded-full text-[11px] font-semibold">
				Menunggu Review
			</span>
		);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					<span className="text-[13px] font-medium">
						{notification.message}
					</span>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-bold text-gray-900 tracking-tight">
					Persetujuan Peminjaman Aset
				</h1>
			</div>

			{/* Table Section */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				<div className="flex items-center gap-6 border-b border-gray-200 bg-white px-5 pt-3">
					<button
						type="button"
						onClick={() => {
							setListTab("inbox");
							setCurrentPage(1);
						}}
						className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${listTab === "inbox" ? "border-b-2 border-[#0A356A] text-[#0A356A]" : "text-gray-500 hover:text-gray-700"}`}
					>
						Antrean Persetujuan
						<span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${listTab === "inbox" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"}`}>
							{inboxCount}
						</span>
					</button>
					<button
						type="button"
						onClick={() => {
							setListTab("history");
							setCurrentPage(1);
						}}
						className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors ${listTab === "history" ? "border-b-2 border-[#0A356A] text-[#0A356A]" : "text-gray-500 hover:text-gray-700"}`}
					>
						Riwayat Persetujuan
						<span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${listTab === "history" ? "bg-[#0A356A] text-white" : "bg-gray-100 text-gray-600"}`}>
							{historyCount}
						</span>
					</button>
				</div>
				{/* Toolbar / Filters (Identik dengan halaman Inspeksi Validasi) */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Search */}
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Cari request, kode, atau nama..."
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setSearch(e.target.value);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400 font-medium"
							/>
						</div>
						<button
							type="button"
							onClick={() => setSearch(searchInput)}
							className="px-3.5 py-1.5 bg-[#0A356A] text-white text-[13px] font-semibold rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-xs cursor-pointer"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={plant}
							onChange={(e) => setPlant(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer font-medium"
						>
							<option value="Semua Plant">Semua Plant</option>
							<option value="PUSRI-IB">PUSRI-IB</option>
							<option value="PUSRI-IIB">PUSRI-IIB</option>
							<option value="PUSRI-III">PUSRI-III</option>
							<option value="PUSRI-IV">PUSRI-IV</option>
							<option value="STG-1">STG-1</option>
						</select>

						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[140px] cursor-pointer font-medium"
						>
							<option value="Semua Status">Semua Status</option>
							<option value="Menunggu Review">Menunggu Review</option>
							<option value="Disetujui">Disetujui</option>
							<option value="Ditolak">Ditolak</option>
						</select>

						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer font-medium"
						/>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						{/* Reset Button */}
						<button
							type="button"
							onClick={handleReset}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>
				<table className="w-full text-left border-collapse table-fixed">
					<thead className="bg-gray-50 border-b border-gray-200">
						<tr>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[35px]">
								No
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[125px]">
								No. Request
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[110px]">
								Kode Aset
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left">
								Nama Aset
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-left w-[150px]">
								Lokasi Instalasi
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[80px]">
								Plant
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[95px]">
								Tanggal
							</th>
							<th className="px-2 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-[125px]">
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
									colSpan={9}
									className="px-4 py-8 text-center text-sm text-gray-500"
								>
									<RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0A356A]" />
									Memuat data pengajuan peminjaman...
								</td>
							</tr>
						) : paginatedRequests.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-8 text-center text-sm text-gray-500"
								>
									Tidak ada data pengajuan peminjaman.
								</td>
							</tr>
						) : (
							paginatedRequests.map((req, index) => (
								<tr
									key={req.id}
									className="hover:bg-gray-50/50 transition-colors h-[48px]"
								>
									<td className="px-2 py-2 text-sm text-gray-500 font-medium text-center">
										{index + 1 + (page - 1) * ITEMS_PER_PAGE}
									</td>
									<td
										className="px-2 py-2 text-sm font-bold text-[#0A356A] text-center truncate"
										title={req.request_number}
									>
										{req.request_number}
									</td>
									<td
										className="px-2 py-2 text-sm font-bold text-gray-900 text-center truncate"
										title={req.equipment_code}
									>
										{req.equipment_code}
									</td>
									<td
										className="px-2 py-2 text-sm text-gray-600 font-medium truncate"
										title={req.equipment_name}
									>
										{req.equipment_name}
									</td>
									<td
										className="px-2 py-2 text-sm text-gray-600 font-medium truncate"
										title={req.requesting_unit}
									>
										{req.requesting_unit}
									</td>
									<td className="px-2 py-2 text-sm text-gray-600 font-medium text-center truncate">
										{req.target_plant}
									</td>
									<td className="px-2 py-2 text-sm text-gray-600 font-medium text-center whitespace-nowrap font-mono text-[11px]">
										{req.start_date}
									</td>
									<td className="px-2 py-2 text-sm text-center whitespace-nowrap">
										{getStatusBadge(req.status)}
									</td>
									<td className="px-2 py-2 text-center w-[90px]">
										<button
											type="button"
											onClick={() => openDrawer(req)}
											className="inline-flex items-center justify-center gap-1.5 bg-[#0A356A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0556B3] transition-colors whitespace-nowrap shadow-xs cursor-pointer"
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

				{/* Table Pagination */}
				{!isLoading && filteredRequests.length > 0 && (
					<div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
						<span className="text-xs text-gray-500 font-medium">
							Menampilkan{" "}
							{Math.min(
								(page - 1) * ITEMS_PER_PAGE + 1,
								filteredRequests.length,
							)}{" "}
							- {Math.min(page * ITEMS_PER_PAGE, filteredRequests.length)} dari{" "}
							{filteredRequests.length} data
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setCurrentPage(Math.max(1, page - 1))}
								disabled={page === 1}
								className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Prev
							</button>
							<div className="flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(p) => (
										<button
											key={p}
											type="button"
											onClick={() => setCurrentPage(p)}
											className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
												page === p
													? "bg-[#0A356A] text-white"
													: "text-gray-600 hover:bg-gray-100"
											}`}
										>
											{p}
										</button>
									),
								)}
							</div>
							<button
								type="button"
								onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
								disabled={page === totalPages}
								className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Centered Modal Dialog Component (Popup di Tengah Layar) */}
			{isDrawerOpen && selectedRequest && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
						onClick={closeDrawer}
					/>

					{/* Centered Dialog Window */}
					<div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
						{/* Header */}
						<div className="bg-gradient-to-r from-[#0A356A] to-[#0D478A] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
							<div>
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold uppercase tracking-wider bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-md border border-blue-300/30">
										Persetujuan Peminjaman Aset
									</span>
								</div>
								<h2 className="text-lg font-extrabold tracking-tight font-mono mt-1 flex items-center gap-2">
									{selectedRequest.request_number}
								</h2>
							</div>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									closeDrawer();
								}}
								className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
								title="Tutup"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Status & Tab Navigation Bar */}
						<div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold text-slate-500">
									Status Pengajuan:
								</span>
								{getStatusBadge(selectedRequest.status)}
							</div>

							{/* Tabs */}
							<div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
								<button
									type="button"
									onClick={() => setActiveTab("detail")}
									className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
										activeTab === "detail"
											? "bg-[#0A356A] text-white shadow-xs"
											: "text-slate-600 hover:bg-slate-100"
									}`}
								>
									Detail Info
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("history")}
									className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
										activeTab === "history"
											? "bg-[#0A356A] text-white shadow-xs"
											: "text-slate-600 hover:bg-slate-100"
									}`}
								>
									Riwayat Approval
								</button>
							</div>
						</div>

						{/* Scrollable Modal Body */}
						<div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
							{activeTab === "detail" && (
								<>
									{/* Card 1: Informasi Peralatan */}
									<div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
										<div className="flex items-center justify-between border-b border-slate-100 pb-2">
											<span className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider flex items-center gap-1.5">
												<Boxes className="w-4 h-4 text-[#0A356A]" />
												Informasi Peralatan Idle
											</span>
											<span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
												{selectedRequest.equipment_code}
											</span>
										</div>

										<div>
											<span className="text-[10px] font-semibold text-slate-400 uppercase block">
												Nama Alat
											</span>
											<h3 className="text-sm font-bold text-slate-900 leading-snug">
												{selectedRequest.equipment_name}
											</h3>
										</div>

										<div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													Unit Pemohon / Lokasi Pasang
												</span>
												<span className="font-semibold text-slate-800 block mt-0.5">
													{selectedRequest.requesting_unit}
												</span>
											</div>
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													Target Plant
												</span>
												<span className="font-semibold text-slate-800 block mt-0.5">
													{selectedRequest.target_plant}
												</span>
											</div>
										</div>
									</div>

									{/* Card 2: Detail Peminjaman & Justifikasi */}
									<div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
										<span className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider block border-b border-slate-100 pb-2 flex items-center gap-1.5">
											<FileText className="w-4 h-4 text-[#0A356A]" />
											Detail Peminjaman & Cost Benefit
										</span>

										<div className="grid grid-cols-2 gap-4 text-xs">
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													Tanggal Permintaan
												</span>
												<span className="font-bold text-slate-900 block mt-0.5 font-mono">
													{selectedRequest.start_date}
												</span>
											</div>
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													Estimasi Cost Avoidance
												</span>
												<span className="font-extrabold text-blue-700 text-xs block mt-0.5">
													{selectedRequest.estimated_cost_avoidance
														? `Rp ${selectedRequest.estimated_cost_avoidance.toLocaleString("id-ID")}`
														: "-"}
												</span>
											</div>
										</div>

										<div className="pt-2 border-t border-slate-100 space-y-1">
											<span className="text-[10px] font-semibold text-slate-400 uppercase block">
												Justifikasi Kebutuhan Operasional
											</span>
											<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-medium">
												{selectedRequest.justification}
											</div>
										</div>
									</div>

									{/* Card 3: Kontak Pemohon */}
									<div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
										<span className="text-[11px] font-bold text-[#0A356A] uppercase tracking-wider block border-b border-slate-100 pb-2">
											Kontak Person Pemohon
										</span>
										<div className="grid grid-cols-2 gap-3 text-xs pt-1">
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													Nama Kontak
												</span>
												<span className="font-bold text-slate-900 block mt-0.5">
													{selectedRequest.contact_person}
												</span>
											</div>
											<div>
												<span className="text-[10px] font-semibold text-slate-400 uppercase block">
													No. Telepon / HP
												</span>
												<span className="font-medium text-slate-700 block mt-0.5 font-mono">
													{selectedRequest.contact_phone || "-"}
												</span>
											</div>
										</div>
									</div>

									{/* Action Review Form / Catatan */}
									{selectedRequest.status === "PENDING" ||
									selectedRequest.status === "IN_REVIEW" ? (
										<div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
											<label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block flex items-center justify-between">
												<span>Catatan Keputusan Manajer</span>
												<span className="text-[10px] text-slate-400 font-normal lowercase">
													*wajib jika menolak
												</span>
											</label>
											<textarea
												rows={3}
												value={actionNotes}
												onChange={(e) => setActionNotes(e.target.value)}
												placeholder="Masukkan catatan atau alasan penolakan..."
												className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-all resize-none font-medium text-slate-900"
											/>
										</div>
									) : selectedRequest.review_notes ? (
										<div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
											<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
												Catatan Keputusan Manajer
											</span>
											<p className="text-xs text-slate-800 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
												&quot;{selectedRequest.review_notes}&quot;
											</p>
										</div>
									) : null}
								</>
							)}

							{activeTab === "history" && (
								<div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
									<h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
										Timeline & Riwayat Pengajuan
									</h4>
									<div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
										{(selectedRequest.history || []).map((h) => (
											<div key={h.id} className="relative">
												<div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-2 border-[#0A356A]" />
												<div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
													<div className="flex items-center justify-between">
														<h5 className="text-xs font-bold text-slate-900">
															{h.title}
														</h5>
														<span className="text-[10px] font-medium text-slate-400">
															{new Date(h.timestamp).toLocaleDateString(
																"id-ID",
																{
																	day: "2-digit",
																	month: "short",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)}
														</span>
													</div>
													<p className="text-xs text-slate-600 font-medium">
														{h.description}
													</p>
													<span className="text-[10px] text-slate-400 font-semibold block pt-1">
														Oleh: {h.user}
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Modal Footer Actions: Hanya "Tolak" dan "Setujui Peminjaman" */}
						<div className="bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3 shrink-0">
							<button
								type="button"
								onClick={closeDrawer}
								className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
							>
								Batal
							</button>
							{selectedRequest.status === "PENDING" ||
							selectedRequest.status === "IN_REVIEW" ? (
								<>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={(e) => {
											e.preventDefault();
											handleAction("REVISION_REQUESTED");
										}}
										className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
									>
										<XCircle className="w-4 h-4" />
										Tolak
									</button>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={(e) => {
											e.preventDefault();
											handleAction("APPROVED");
										}}
										className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0A356A] text-white hover:bg-[#0556B3] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
									>
										{isSubmitting ? (
											<RefreshCw className="w-4 h-4 animate-spin" />
										) : (
											<CheckCircle2 className="w-4 h-4" />
										)}
										Setujui Peminjaman
									</button>
								</>
							) : null}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
