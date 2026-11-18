"use client";

import React, { useMemo, useState } from "react";
import {
	Check,
	CheckCircle2,
	ChevronRight,
	Eye,
	FileText,
	RefreshCw,
	Search,
	X,
	XCircle,
} from "lucide-react";
import { verifyEquipmentProposal } from "@/action/api";
import { fileUrl } from "@/lib/file-url";

export interface ProposalAttachment {
	id?: string | number;
	file_name?: string;
	file_url?: string;
	fileUrl?: string;
	url?: string;
}

export interface ProposalItem {
	id: string;
	equipmentCode: string;
	equipmentName: string;
	plant: string;
	funcLoc: string;
	storageLocation: string;
	idleReason: string;
	rejectionNotes?: string;
	status: string;
	createdAt: string;
	proposerName: string;
	attachments: ProposalAttachment[];
}

const INSPECTION_CLUSTERS = [
	{ value: "INSPEKSI_1", label: "Inspeksi 1" },
	{ value: "INSPEKSI_2", label: "Inspeksi 2" },
	{ value: "INSPEKSI_LISTRIK", label: "Inspeksi Listrik" },
	{ value: "INSPEKSI_INSTRUMEN", label: "Inspeksi Instrumen" },
];

const IMAGE_PATTERN = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

export default function VerifikasiUsulanClient({
	proposals,
	rejectedProposals,
	onRefresh,
}: {
	proposals: ProposalItem[];
	rejectedProposals: ProposalItem[];
	onRefresh: () => Promise<void>;
}) {
	const [activeTab, setActiveTab] = useState<"antrean" | "ditolak">("antrean");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [plantFilter, setPlantFilter] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;
	const [selectedItem, setSelectedItem] = useState<ProposalItem | null>(null);
	const [previewImage, setPreviewImage] = useState<{
		url: string;
		name: string;
	} | null>(null);
	const [decisionMode, setDecisionMode] = useState<"none" | "approve" | "reject">(
		"none",
	);
	const [inspectionCluster, setInspectionCluster] = useState("INSPEKSI_1");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [modalError, setModalError] = useState<string | null>(null);
	const [toast, setToast] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const showToast = (type: "success" | "error", message: string) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 4000);
	};

	const sourceList = activeTab === "antrean" ? proposals : rejectedProposals;

	const plantOptions = useMemo(
		() =>
			[...new Set(sourceList.map((i) => i.plant).filter((v) => v && v !== "-"))].sort(),
		[sourceList],
	);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return sourceList.filter((item) => {
			if (plantFilter && item.plant !== plantFilter) return false;
			if (!q) return true;
			return (
				item.equipmentCode.toLowerCase().includes(q) ||
				item.equipmentName.toLowerCase().includes(q) ||
				item.plant.toLowerCase().includes(q) ||
				item.storageLocation.toLowerCase().includes(q) ||
				item.idleReason.toLowerCase().includes(q)
			);
		});
	}, [sourceList, search, plantFilter]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
	const safePage = Math.min(currentPage, totalPages);
	const paginated = useMemo(() => {
		const start = (safePage - 1) * ITEMS_PER_PAGE;
		return filtered.slice(start, start + ITEMS_PER_PAGE);
	}, [filtered, safePage]);

	const resetFilter = () => {
		setSearchInput("");
		setSearch("");
		setPlantFilter("");
		setCurrentPage(1);
	};

	const openReviewModal = (item: ProposalItem) => {
		setSelectedItem(item);
		setDecisionMode("none");
		setInspectionCluster("INSPEKSI_1");
		setNotes("");
		setModalError(null);
	};

	const closeModal = () => {
		if (submitting) return;
		setSelectedItem(null);
		setDecisionMode("none");
		setModalError(null);
	};

	const handleSubmitDecision = async () => {
		if (!selectedItem || decisionMode === "none" || submitting) return;

		if (decisionMode === "reject" && !notes.trim()) {
			setModalError("Alasan penolakan wajib diisi.");
			return;
		}

		setSubmitting(true);
		setModalError(null);
		const res = await verifyEquipmentProposal(selectedItem.id, {
			action: decisionMode === "approve" ? "APPROVE" : "REJECT",
			...(decisionMode === "approve"
				? { tujuan_inspeksi: inspectionCluster }
				: {}),
			...(notes.trim() ? { notes: notes.trim() } : {}),
		});

		setSubmitting(false);
		if (!res.success) {
			setModalError(res.message || "Gagal memverifikasi usulan.");
			return;
		}

		if (decisionMode === "approve") {
			showToast("success", "Usulan diterima dan diteruskan ke tim inspeksi.");
		} else {
			showToast("success", "Usulan ditolak dan dipindahkan ke riwayat ditolak.");
			setActiveTab("ditolak");
		}
		setSelectedItem(null);
		setDecisionMode("none");
		await onRefresh();
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{toast && (
				<div className="fixed top-6 right-6 z-[110] flex items-center gap-2.5 rounded bg-gray-900 px-4 py-3 text-[13px] font-medium text-white shadow-lg">
					{toast.type === "success" ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
					) : (
						<XCircle className="h-4 w-4 text-red-400 shrink-0" />
					)}
					<span>{toast.message}</span>
				</div>
			)}

			<div className="mb-3">
				<div className="mb-1 flex items-center gap-1.5 text-[13px] text-gray-500">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="h-3.5 w-3.5" />
					<span className="font-semibold text-[#0A356A]">
						Verifikasi Usulan UK
					</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-gray-900">
							Verifikasi Usulan Peralatan Idle
						</h1>
						<p className="mt-1 text-[13px] text-gray-500">
							Tinjau usulan peralatan idle dari Unit Kerja Operasi sebelum diteruskan ke antrean inspeksi teknis.
						</p>
					</div>
					<button
						type="button"
						onClick={onRefresh}
						className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-[#E6E8EA] bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] cursor-pointer self-start sm:self-center"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						<span>Muat Ulang</span>
					</button>
				</div>
			</div>

			<div className="bg-white rounded-md border border-gray-200 overflow-hidden">
				<div className="flex items-center gap-6 px-5 pt-3 border-b border-gray-200 bg-white">
					<button
						type="button"
						onClick={() => {
							setActiveTab("antrean");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === "antrean"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Antrean Usulan</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold tabular-nums ${
								activeTab === "antrean"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{proposals.length}
						</span>
					</button>

					<button
						type="button"
						onClick={() => {
							setActiveTab("ditolak");
							setCurrentPage(1);
						}}
						className={`pb-3 font-semibold text-[14px] relative transition-colors flex items-center gap-2 cursor-pointer ${
							activeTab === "ditolak"
								? "text-[#0A356A] border-b-2 border-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Riwayat Ditolak</span>
						<span
							className={`px-2 py-0.5 text-[11px] rounded-sm font-bold tabular-nums ${
								activeTab === "ditolak"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{rejectedProposals.length}
						</span>
					</button>
				</div>

				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setSearch(e.target.value);
									setCurrentPage(1);
								}}
								placeholder="Cari kode atau nama alat..."
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400 text-gray-800"
							/>
						</div>
						<button
							type="button"
							onClick={() => {
								setSearch(searchInput);
								setCurrentPage(1);
							}}
							className="px-4 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded hover:bg-[#072448] transition-colors whitespace-nowrap cursor-pointer"
						>
							Cari
						</button>
					</div>

					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={plantFilter}
							onChange={(e) => {
								setPlantFilter(e.target.value);
								setCurrentPage(1);
							}}
							aria-label="Filter plant"
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="">Semua Plant</option>
							{plantOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
						<button
							type="button"
							onClick={resetFilter}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors whitespace-nowrap cursor-pointer"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				<div className="w-full overflow-x-auto">
					<table className="w-full text-center border-collapse">
						<thead className="bg-[#F2F3F4]">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center w-12 whitespace-nowrap">
									No
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
									Peralatan
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
									Kode Alat
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Plant
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Lokasi Penyimpanan
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-left whitespace-nowrap">
									Alasan Idle
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Tgl Usulan
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Status
								</th>
								<th className="px-3 py-3 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Tindakan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white text-[12px]">
							{paginated.length === 0 ? (
								<tr>
									<td
										colSpan={9}
										className="px-4 py-12 text-center text-[13px] text-gray-500"
									>
										{activeTab === "antrean"
											? "Belum ada usulan peralatan idle yang menunggu verifikasi."
											: "Belum ada riwayat usulan yang ditolak."}
									</td>
								</tr>
							) : (
								paginated.map((item, idx) => {
									const rowNum = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
									return (
										<tr
											key={item.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-[#F2F3F4] transition-colors group"
										>
											<td className="px-3 py-2.5 text-gray-500 font-medium text-center tabular-nums">
												{rowNum}
											</td>
											<td className="px-3 py-2.5 text-left">
												<span className="font-semibold text-gray-800 leading-tight line-clamp-2 block">
													{item.equipmentName}
												</span>
											</td>
											<td className="px-3 py-2.5 text-left whitespace-nowrap">
												<span className="font-semibold text-[#0A356A]">
													{item.equipmentCode}
												</span>
											</td>
											<td className="px-3 py-2.5 text-gray-600 font-medium text-center whitespace-nowrap">
												{item.plant}
											</td>
											<td className="px-3 py-2.5 text-gray-600 font-medium text-center">
												{item.storageLocation || "-"}
											</td>
											<td className="px-3 py-2.5 text-gray-600 text-left max-w-[240px]">
												<span className="line-clamp-2">{item.idleReason}</span>
											</td>
											<td className="px-3 py-2.5 text-gray-600 font-medium text-center whitespace-nowrap tabular-nums">
												{item.createdAt || "-"}
											</td>
											<td className="px-3 py-2.5 text-center whitespace-nowrap">
												<div className="flex justify-center">
													{item.status === "PROPOSAL_REJECTED" ? (
														<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEE2E2] text-[#DC2626]">
															PROPOSAL REJECTED
														</span>
													) : (
														<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#FEF9C3] text-[#CA8A04]">
															PROPOSED
														</span>
													)}
												</div>
											</td>
											<td className="px-3 py-3 text-center whitespace-nowrap">
												<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
													{activeTab === "antrean" ? (
														<button
															type="button"
															title="Review Usulan"
															onClick={() => openReviewModal(item)}
															className="text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] p-1 px-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
														>
															<Check className="w-3.5 h-3.5" />
															<span className="text-[11px] font-bold">
																Review Usulan
															</span>
														</button>
													) : (
														<button
															type="button"
															title="Detail Info"
															onClick={() => openReviewModal(item)}
															className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 px-2 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
														>
															<Eye className="w-3.5 h-3.5" />
															<span className="text-[11px] font-bold">
																Detail Info
															</span>
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
						{filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1} -{" "}
						{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari{" "}
						{filtered.length} data (10 baris/halaman)
					</span>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={safePage === 1}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
						>
							Prev
						</button>
						<div className="flex items-center gap-1">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<button
									type="button"
									key={page}
									onClick={() => setCurrentPage(page)}
									className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
										safePage === page
											? "bg-[#0A356A] text-white"
											: "text-gray-600 hover:bg-gray-100"
									}`}
								>
									{page}
								</button>
							))}
						</div>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={safePage === totalPages}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* Modal Review Usulan UK (patuh aturan modal 1366x768 DEV-16738) */}
			{selectedItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-[#0F172A]/50"
						onClick={closeModal}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-label={`Review Usulan ${selectedItem.equipmentCode}`}
						className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded border border-[#E6E8EA] bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)]"
					>
						<div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3.5">
							<div className="flex min-w-0 items-center gap-3">
								<h2 className="truncate text-base font-bold text-gray-900">
									{selectedItem.status === "PROPOSED"
										? "Review Usulan Peralatan Idle"
										: "Detail Usulan Peralatan Idle"}
								</h2>
								<span className="text-gray-300">|</span>
								<span className="font-mono text-[13px] font-semibold text-[#0A356A] shrink-0">
									{selectedItem.equipmentCode}
								</span>
							</div>
							<button
								type="button"
								aria-label="Tutup modal review usulan"
								onClick={closeModal}
								className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
							>
								<X className="h-4 w-4" aria-hidden="true" />
							</button>
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/50 px-6 py-4 space-y-4 text-[13px]">
							<div className="rounded border border-[#E6E8EA] bg-[#F2F3F4] p-3">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
									<div className="sm:col-span-2">
										<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
											Nama Peralatan
										</span>
										<span className="mt-0.5 block font-bold text-[13px] text-[#0F172A]">
											{selectedItem.equipmentName}
										</span>
									</div>
									<div>
										<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
											Unit Kerja / Plant
										</span>
										<span className="mt-0.5 block font-semibold text-[13px] text-[#0F172A]">
											{selectedItem.plant}
										</span>
									</div>
									<div>
										<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
											Lokasi Penyimpanan
										</span>
										<span className="mt-0.5 block font-semibold text-[13px] text-[#0F172A]">
											{selectedItem.storageLocation || "-"}
										</span>
									</div>
									<div className="sm:col-span-2">
										<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
											Functional Location
										</span>
										<span className="mt-0.5 block font-mono text-[12px] font-medium text-[#334155]">
											{selectedItem.funcLoc || "-"}
										</span>
									</div>
									<div className="sm:col-span-2">
										<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
											Pengusul & Tanggal
										</span>
										<span className="mt-0.5 block font-medium text-[13px] text-[#0F172A]">
											{selectedItem.proposerName} ({selectedItem.createdAt})
										</span>
									</div>
								</div>
								<div className="mt-3 border-t border-[#E6E8EA] pt-2.5">
									<span className="block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
										Alasan Idle
									</span>
									<p className="mt-0.5 text-[13px] text-gray-800">
										{selectedItem.idleReason}
									</p>
								</div>
								{selectedItem.rejectionNotes && (
									<div className="mt-3 rounded border border-[#FECACA] bg-[#FEF2F2] p-2.5 text-[#DC2626]">
										<span className="block text-[10px] font-semibold uppercase tracking-wide">
											Alasan Penolakan
										</span>
										<p className="mt-0.5 text-[13px]">{selectedItem.rejectionNotes}</p>
									</div>
								)}
							</div>

							<div className="rounded border border-gray-200 bg-white p-4">
								<h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
									Lampiran Pendukung ({selectedItem.attachments.length})
								</h3>
								{selectedItem.attachments.length === 0 ? (
									<p className="text-xs italic text-gray-400">
										Tidak ada berkas lampiran.
									</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{selectedItem.attachments.map((att, idx) => {
											const rawUrl =
												att.file_url || att.fileUrl || att.url || "";
											const resolvedUrl = rawUrl ? fileUrl(rawUrl) : "#";
											const fileName =
												att.file_name || `Lampiran #${idx + 1}`;
											const isImg =
												IMAGE_PATTERN.test(rawUrl) ||
												IMAGE_PATTERN.test(fileName) ||
												rawUrl.startsWith("data:image");
											return (
												<div
													key={att.id ?? idx}
													className="flex items-center justify-between gap-2.5 rounded border border-gray-200 bg-gray-50/70 p-2.5"
												>
													<div className="flex min-w-0 items-center gap-2.5">
														{isImg ? (
															/* eslint-disable-next-line @next/next/no-img-element */
															<img
																src={resolvedUrl}
																alt={fileName}
																width={44}
																height={44}
																onClick={() =>
																	setPreviewImage({
																		url: resolvedUrl,
																		name: fileName,
																	})
																}
																className="h-11 w-11 rounded object-cover shrink-0 border border-gray-200 bg-white cursor-pointer hover:opacity-90"
															/>
														) : (
															<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-[#0A356A]">
																<FileText className="h-5 w-5" />
															</div>
														)}
														<span
															className="truncate text-[12px] font-semibold text-gray-800"
															title={fileName}
														>
															{fileName}
														</span>
													</div>
													<div className="flex shrink-0 items-center gap-1.5">
														{isImg ? (
															<button
																type="button"
																onClick={() =>
																	setPreviewImage({
																		url: resolvedUrl,
																		name: fileName,
																	})
																}
																className="inline-flex items-center gap-1 rounded border border-[#0A356A]/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0A356A] hover:bg-[#0A356A]/5 cursor-pointer"
															>
																<Eye className="h-3 w-3" />
																<span>Preview</span>
															</button>
														) : (
															<a
																href={resolvedUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1 rounded border border-[#0A356A]/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0A356A] hover:bg-[#0A356A]/5"
															>
																<Eye className="h-3 w-3" />
																<span>Preview</span>
															</a>
														)}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>

							{selectedItem.status === "PROPOSED" && decisionMode === "approve" && (
								<div className="rounded border border-[#BBF7D0] bg-[#F0FDF4] p-4 space-y-3">
									<label
										htmlFor="proposal-cluster"
										className="block text-[12px] font-bold text-[#0F172A]"
									>
										Rumpun Inspeksi Tujuan{" "}
										<span className="text-[#DC2626]">*</span>
									</label>
									<select
										id="proposal-cluster"
										value={inspectionCluster}
										onChange={(e) => setInspectionCluster(e.target.value)}
										className="h-9 w-full rounded border border-[#E6E8EA] bg-white px-3 text-[13px] text-gray-900 focus:border-[#0A356A] focus:outline-none"
									>
										{INSPECTION_CLUSTERS.map((c) => (
											<option key={c.value} value={c.value}>
												{c.label}
											</option>
										))}
									</select>
									<textarea
										rows={2}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Catatan verifikasi (opsional)..."
										className="w-full rounded border border-[#E6E8EA] bg-white p-2.5 text-[13px] text-gray-900 focus:border-[#0A356A] focus:outline-none"
									/>
								</div>
							)}

							{selectedItem.status === "PROPOSED" && decisionMode === "reject" && (
								<div className="rounded border border-[#FECACA] bg-[#FEF2F2] p-4 space-y-2">
									<label
										htmlFor="proposal-reject-reason"
										className="block text-[12px] font-bold text-[#DC2626]"
									>
										Alasan Penolakan (Wajib Diisi){" "}
										<span className="text-[#DC2626]">*</span>
									</label>
									<textarea
										id="proposal-reject-reason"
										rows={3}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Contoh: Alat masih terikat kontrak operasi..."
										className="w-full rounded border border-[#FECACA] bg-white p-2.5 text-[13px] text-gray-900 focus:border-[#DC2626] focus:outline-none"
									/>
								</div>
							)}

							{modalError && (
								<p className="rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#DC2626]">
									{modalError}
								</p>
							)}
						</div>

						<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3">
							<button
								type="button"
								onClick={closeModal}
								disabled={submitting}
								className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
							>
								Tutup
							</button>

							{selectedItem.status === "PROPOSED" && (
								<div className="flex flex-wrap items-center gap-2">
									{decisionMode === "none" ? (
										<>
											<button
												type="button"
												onClick={() => {
													setDecisionMode("reject");
													setModalError(null);
												}}
												className="inline-flex items-center gap-1.5 rounded bg-[#DC2626] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#B91C1C] cursor-pointer"
											>
												<XCircle className="h-4 w-4" />
												<span>Tolak Usulan</span>
											</button>
											<button
												type="button"
												onClick={() => {
													setDecisionMode("approve");
													setModalError(null);
												}}
												className="inline-flex items-center gap-1.5 rounded bg-[#059669] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#15803D] cursor-pointer"
											>
												<CheckCircle2 className="h-4 w-4" />
												<span>Terima Usulan</span>
											</button>
										</>
									) : (
										<>
											<button
												type="button"
												disabled={submitting}
												onClick={() => {
													setDecisionMode("none");
													setModalError(null);
												}}
												className="rounded border border-[#E6E8EA] bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
											>
												Batal
											</button>
											<button
												type="button"
												disabled={submitting}
												onClick={handleSubmitDecision}
												className={`rounded px-4 py-2 text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 ${
													decisionMode === "approve"
														? "bg-[#059669] hover:bg-[#15803D]"
														: "bg-[#DC2626] hover:bg-[#B91C1C]"
												}`}
											>
												{submitting
													? "Memproses..."
													: decisionMode === "approve"
														? "Konfirmasi Terima Usulan"
														: "Konfirmasi Tolak Usulan"}
											</button>
										</>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{previewImage && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 p-4 backdrop-blur-sm"
					onClick={() => setPreviewImage(null)}
				>
					<div
						className="relative flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
							<span className="truncate text-[13px] font-semibold text-gray-800">
								{previewImage.name}
							</span>
							<button
								type="button"
								onClick={() => setPreviewImage(null)}
								className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
								aria-label="Tutup preview"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<div className="flex items-center justify-center bg-gray-100 p-4 overflow-auto">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={previewImage.url}
								alt={previewImage.name}
								className="max-h-[75vh] max-w-full rounded object-contain"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
