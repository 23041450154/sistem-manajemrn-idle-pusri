"use client";

import React, { useMemo, useState } from "react";
import {
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
	const [search, setSearch] = useState("");
	const [plantFilter, setPlantFilter] = useState("");
	const [selectedItem, setSelectedItem] = useState<ProposalItem | null>(null);
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

			<div className="overflow-hidden rounded border border-[#E6E8EA] bg-white">
				<div className="flex items-center gap-6 border-b border-[#E6E8EA] bg-white px-5 pt-3">
					<button
						type="button"
						onClick={() => setActiveTab("antrean")}
						className={`flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors cursor-pointer ${
							activeTab === "antrean"
								? "border-b-2 border-[#0A356A] text-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Antrean Usulan</span>
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
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
						onClick={() => setActiveTab("ditolak")}
						className={`flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors cursor-pointer ${
							activeTab === "ditolak"
								? "border-b-2 border-[#0A356A] text-[#0A356A]"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span>Riwayat Ditolak</span>
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
								activeTab === "ditolak"
									? "bg-[#0A356A] text-white"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{rejectedProposals.length}
						</span>
					</button>
				</div>

				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-[#E6E8EA] p-3.5">
					<div className="relative flex-1 max-w-md">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Cari kode alat, nama, plant, atau alasan..."
							className="h-9 w-full rounded border border-[#E6E8EA] bg-white pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#0A356A] focus:outline-none"
						/>
					</div>

					<div className="flex items-center gap-2">
						<select
							value={plantFilter}
							onChange={(e) => setPlantFilter(e.target.value)}
							aria-label="Filter plant"
							className="h-9 rounded border border-[#E6E8EA] bg-white px-2.5 text-[13px] text-gray-700 focus:border-[#0A356A] focus:outline-none"
						>
							<option value="">Semua Plant</option>
							{plantOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
						{(search || plantFilter) && (
							<button
								type="button"
								onClick={() => {
									setSearch("");
									setPlantFilter("");
								}}
								className="h-9 rounded border border-[#E6E8EA] px-3 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
							>
								Reset
							</button>
						)}
					</div>
				</div>

				<div className="w-full overflow-x-auto">
					<table className="w-full border-collapse text-left">
						<thead className="bg-[#F8F9FA]">
							<tr className="border-b border-[#E6E8EA]">
								<th className="w-10 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
									No
								</th>
								<th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap">
									Tgl Usulan
								</th>
								<th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap">
									Unit Kerja / Plant
								</th>
								<th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
									Peralatan
								</th>
								<th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
									Lokasi Penyimpanan
								</th>
								<th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
									Alasan Idle
								</th>
								<th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap">
									Status
								</th>
								<th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#64748B] whitespace-nowrap">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#E6E8EA] bg-white text-[13px]">
							{filtered.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-10 text-center text-gray-500"
									>
										{activeTab === "antrean"
											? "Belum ada usulan peralatan idle yang menunggu verifikasi."
											: "Belum ada riwayat usulan yang ditolak."}
									</td>
								</tr>
							) : (
								filtered.map((item, idx) => (
									<tr key={item.id} className="hover:bg-blue-50/30">
										<td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">
											{idx + 1}
										</td>
										<td className="px-3 py-2.5 text-gray-600 whitespace-nowrap tabular-nums">
											{item.createdAt}
										</td>
										<td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
											{item.plant}
										</td>
										<td className="px-3 py-2.5">
											<p className="font-semibold text-gray-900">
												{item.equipmentName}
											</p>
											<p className="font-mono text-[11px] font-semibold text-[#0A356A]">
												{item.equipmentCode}
											</p>
										</td>
										<td className="px-3 py-2.5 text-gray-600">
											{item.storageLocation}
										</td>
										<td className="px-3 py-2.5 text-gray-600 max-w-[240px]">
											<span className="line-clamp-2">{item.idleReason}</span>
										</td>
										<td className="px-3 py-2.5 text-center whitespace-nowrap">
											{item.status === "PROPOSAL_REJECTED" ? (
												<span className="inline-flex items-center rounded-[2px] border border-current/20 bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
													PROPOSAL REJECTED
												</span>
											) : (
												<span className="inline-flex items-center rounded-[2px] border border-current/20 bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]">
													PROPOSED
												</span>
											)}
										</td>
										<td className="px-3 py-2.5 text-center whitespace-nowrap">
											{activeTab === "antrean" ? (
												<button
													type="button"
													onClick={() => openReviewModal(item)}
													className="inline-flex items-center gap-1.5 rounded bg-[#0A356A] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#062854] cursor-pointer"
												>
													Review Usulan
												</button>
											) : (
												<button
													type="button"
													onClick={() => openReviewModal(item)}
													className="inline-flex items-center gap-1 rounded border border-[#E6E8EA] bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
												>
													<Eye className="h-3.5 w-3.5" />
													<span>Detail</span>
												</button>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
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
						className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-[#E6E8EA] bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)]"
					>
						<div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E6E8EA] bg-[#0A356A] px-6 py-4 text-white">
							<div className="min-w-0">
								<p className="font-mono text-[12px] text-blue-200">
									{selectedItem.equipmentCode}
								</p>
								<h2 className="truncate text-base font-bold">
									{selectedItem.equipmentName}
								</h2>
							</div>
							<button
								type="button"
								aria-label="Tutup modal review usulan"
								onClick={closeModal}
								className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-[13px]">
							<dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded border border-[#E6E8EA] bg-[#F8F9FA] p-4">
								<div>
									<dt className="text-[11px] font-semibold uppercase text-[#64748B]">
										Unit Kerja / Plant
									</dt>
									<dd className="mt-0.5 font-medium text-gray-900">
										{selectedItem.plant}
									</dd>
								</div>
								<div>
									<dt className="text-[11px] font-semibold uppercase text-[#64748B]">
										Functional Location
									</dt>
									<dd className="mt-0.5 font-medium text-gray-900">
										{selectedItem.funcLoc}
									</dd>
								</div>
								<div>
									<dt className="text-[11px] font-semibold uppercase text-[#64748B]">
										Lokasi Penyimpanan
									</dt>
									<dd className="mt-0.5 font-medium text-gray-900">
										{selectedItem.storageLocation}
									</dd>
								</div>
								<div>
									<dt className="text-[11px] font-semibold uppercase text-[#64748B]">
										Pengusul & Tanggal
									</dt>
									<dd className="mt-0.5 font-medium text-gray-900">
										{selectedItem.proposerName} ({selectedItem.createdAt})
									</dd>
								</div>
								<div className="sm:col-span-2">
									<dt className="text-[11px] font-semibold uppercase text-[#64748B]">
										Alasan Idle
									</dt>
									<dd className="mt-0.5 text-gray-800">
										{selectedItem.idleReason}
									</dd>
								</div>
								{selectedItem.rejectionNotes && (
									<div className="sm:col-span-2 rounded border border-[#FECACA] bg-[#FEF2F2] p-2.5 text-[#DC2626]">
										<dt className="text-[11px] font-semibold uppercase">
											Alasan Penolakan
										</dt>
										<dd className="mt-0.5">{selectedItem.rejectionNotes}</dd>
									</div>
								)}
							</dl>

							<div>
								<h3 className="mb-2 text-[12px] font-semibold uppercase text-[#64748B]">
									Lampiran Pendukung ({selectedItem.attachments.length})
								</h3>
								{selectedItem.attachments.length === 0 ? (
									<p className="text-xs italic text-gray-400">
										Tidak ada berkas lampiran.
									</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
										{selectedItem.attachments.map((att, idx) => {
											const url =
												att.file_url || att.fileUrl || att.url || "#";
											const isImg = IMAGE_PATTERN.test(url);
											return (
												<a
													key={att.id ?? idx}
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2.5 rounded border border-[#E6E8EA] bg-white p-2.5 hover:bg-gray-50"
												>
													{isImg ? (
														/* eslint-disable-next-line @next/next/no-img-element */
														<img
															src={url}
															alt={att.file_name || `Lampiran ${idx + 1}`}
															width={40}
															height={40}
															className="h-10 w-10 rounded object-cover shrink-0 border border-[#E6E8EA]"
														/>
													) : (
														<FileText className="h-5 w-5 text-[#0A356A] shrink-0" />
													)}
													<span className="truncate text-xs font-medium text-[#0A356A]">
														{att.file_name || `Lampiran #${idx + 1}`}
													</span>
												</a>
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

						<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E6E8EA] bg-[#F8F9FA] px-6 py-4">
							<button
								type="button"
								onClick={closeModal}
								disabled={submitting}
								className="rounded border border-[#E6E8EA] bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
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
		</div>
	);
}
