"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	UploadCloud,
	X,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Loader2,
	ClipboardCheck,
	FileText,
	Paperclip,
	ChevronRight,
	Eye,
	Download,
} from "lucide-react";
import { submitInspectionData } from "@/action/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/components/AuthProvider";
import { getInspectionClusterName } from "@/lib/inspection-cluster";
import { formatNotesWithSapNotification } from "@/lib/sap-notification";
import { todayLocalDate } from "@/lib/utils";

/** Client Component: form inspeksi, data awal & master di-fetch Server Component. */
export default function FormInspeksiClient({
	equipmentId,
	equipment,
	requireActions,
}: {
	equipmentId: string | null;
	equipment: any;
	requireActions: any[];
}) {
	const router = useRouter();
	const { user } = useAuth();
	const inspectionRoleName = getInspectionClusterName(user);
	const todayStr = todayLocalDate();

	// Form State
	const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState<string>(todayStr);
	const [tanggalPemeriksaanError, setTanggalPemeriksaanError] = useState<string>("");
	const [hasilInspeksi, setHasilInspeksi] = useState<string>("");
	const [jenisPerbaikan, setJenisPerbaikan] = useState<string>("");
	const [inspectionCondition, setInspectionCondition] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [sapNotificationNumber, setSapNotificationNumber] = useState<string>("");
	const [sapNotificationError, setSapNotificationError] = useState<string>("");
	const [files, setFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState<string>("");

	// UI State
	const [loading, setLoading] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [toast, setToast] = useState<{
		show: boolean;
		type: "success" | "error";
		message: string;
	}>({ show: false, type: "success", message: "" });

	const [previewModal, setPreviewModal] = useState<{ url: string; title?: string; isPdf?: boolean } | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const showToast = (type: "success" | "error", message: string) => {
		setToast({ show: true, type, message });
		// Modal sukses dibiarkan tampil sampai redirect; hanya error yang auto-dismiss.
		if (type === "error") {
			setTimeout(() => {
				setToast((prev) => ({ ...prev, show: false }));
			}, 5000);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		setFileError("");
		const selectedFiles = Array.from(e.target.files);
		const validFiles: File[] = [];
		let hasError = false;

		const allowedExtensions = [
			".pdf", ".doc", ".docx", ".xls", ".xlsx", ".dwg", ".dxf", ".jpg", ".jpeg", ".png", ".webp"
		];

		for (const file of selectedFiles) {
			const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
			const isAllowed = allowedExtensions.includes(ext) || file.type.startsWith("image/");
			if (!isAllowed) {
				setFileError(
					`Format file ${file.name} tidak didukung. Harap gunakan PDF, DOCX, XLSX, DWG, atau Foto.`,
				);
				hasError = true;
				break;
			}

			if (file.size > 25 * 1024 * 1024) {
				setFileError(`File ${file.name} melebihi batas 25MB.`);
				hasError = true;
				break;
			}

			validFiles.push(file);
		}

		if (!hasError) {
			setFiles((prev) => [...prev, ...validFiles]);
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
		if (fileError) setFileError("");
	};

	const isTanggalEmpty = !tanggalPemeriksaan || tanggalPemeriksaan.trim() === "";
	const isTanggalFuture = Boolean(
		tanggalPemeriksaan && tanggalPemeriksaan > todayStr,
	);
	const isNotesEmpty = !notes || notes.trim() === "";
	const isKelayakanNotSelected = hasilInspeksi === "";
	const isPerbaikanKhususNotSelected =
		hasilInspeksi === "REPAIR" && jenisPerbaikan === "";
	const isKondisiEmpty = !inspectionCondition || inspectionCondition.trim() === "";
	const isFilesEmpty = files.length === 0;

	// US-17-FE: Muncul hanya saat Tidak Layak (Scrap -> wajib) atau Perlu Perbaikan (Repair -> opsional).
	// Saat Layak Digunakan (READY) atau belum dipilih, kolom disembunyikan.
	const showSapNotificationField =
		hasilInspeksi === "SCRAP" || hasilInspeksi === "REPAIR";
	const isSapNotificationRequired =
		showSapNotificationField &&
		(hasilInspeksi === "SCRAP" ||
			inspectionCondition.toLowerCase().includes("rusak berat"));
	const isSapNotificationEmpty =
		isSapNotificationRequired && (!sapNotificationNumber || sapNotificationNumber.trim() === "");

	const isSubmitDisabled =
		isTanggalEmpty ||
		isTanggalFuture ||
		isKelayakanNotSelected ||
		isPerbaikanKhususNotSelected ||
		isKondisiEmpty ||
		isNotesEmpty ||
		isSapNotificationEmpty ||
		isFilesEmpty ||
		loading;

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!tanggalPemeriksaan || !tanggalPemeriksaan.trim()) {
			setTanggalPemeriksaanError("Tanggal pemeriksaan fisik wajib diisi.");
			return;
		}
		if (tanggalPemeriksaan > todayStr) {
			setTanggalPemeriksaanError(
				"Tidak dapat memilih tanggal di masa depan.",
			);
			return;
		}
		if (files.length === 0) {
			setFileError("Berkas lampiran/foto inspeksi wajib diunggah minimal 1 file.");
			return;
		}

		const effectiveSap = showSapNotificationField
			? sapNotificationNumber.trim()
			: "";

		if (isSapNotificationRequired && !effectiveSap) {
			setSapNotificationError(
				"Nomor Notifikasi SAP wajib diisi untuk rekomendasi Scrap / kondisi Rusak Berat.",
			);
			return;
		}

		if (effectiveSap.length > 50) {
			setSapNotificationError("Nomor Notifikasi SAP maksimal 50 karakter.");
			return;
		}

		if (isSubmitDisabled) return;

		setLoading(true);

		try {
			// Resolusi tindak lanjut dari master require_action by nama target
			// status/kondisi (vokabular stabil), bukan ID auto-increment yang
			// bisa meleset kalau master data berubah.
			const resolveRequireActionId = (
				targetStatus: string,
				targetCondition?: string,
			): number | null => {
				const match = requireActions.find((ra) => {
					const st = String(ra.target_status?.name || "").toUpperCase();
					if (st !== targetStatus) return false;
					if (targetCondition) {
						const cond = String(ra.target_condition?.name || "").toUpperCase();
						if (cond !== targetCondition) return false;
					}
					return true;
				});
				return match ? Number(match.id) : null;
			};

			let resolvedId: number | null = null;
			let isUtilizableStr = "true";
			let needsRefurbishmentStr = "false";

			if (hasilInspeksi === "READY") {
				resolvedId = resolveRequireActionId("READY_TO_USE");
				isUtilizableStr = "true";
				needsRefurbishmentStr = "false";
			} else if (hasilInspeksi === "REPAIR") {
				resolvedId =
					jenisPerbaikan === "RINGAN"
						? resolveRequireActionId("REPAIR", "RUSAK_RINGAN")
						: resolveRequireActionId("REPAIR", "RUSAK_SEDANG");
				isUtilizableStr = "true";
				needsRefurbishmentStr = "true";
			} else if (hasilInspeksi === "SCRAP") {
				resolvedId = resolveRequireActionId("SCRAP_RECOMMENDED");
				isUtilizableStr = "false";
				needsRefurbishmentStr = "false";
			}

			// Gagal resolusi = master tindak lanjut tidak lengkap/belum termuat.
			// Blokir submit daripada mengirim ID ngawur yang merusak kondisi aset.
			if (!resolvedId) {
				showToast(
					"error",
					"Master tindak lanjut (require action) tidak tersedia. Muat ulang halaman atau hubungi admin.",
				);
				setLoading(false);
				return;
			}

			const formData = new FormData();
			formData.append("equipment_id", equipmentId || "");
			formData.append("inspection_date", tanggalPemeriksaan);

			formData.append("is_utilizable", isUtilizableStr);
			if (isUtilizableStr === "true") {
				formData.append("needs_refurbishment", needsRefurbishmentStr);
			}
			formData.append("require_action_id", resolvedId.toString());

			formData.append("mechanical_condition", inspectionCondition.trim());
			formData.append("electrical_condition", inspectionCondition.trim());
			formData.append("inspection_condition", inspectionCondition.trim());

			if (effectiveSap) {
				formData.append("sap_notification_number", effectiveSap);
				formData.append("sap_notification_num", effectiveSap);
				formData.append("notification_number", effectiveSap);
			}

			const finalNotes = formatNotesWithSapNotification(notes, effectiveSap);
			formData.append("notes", finalNotes);

			files.forEach((file) => {
				formData.append("photo", file);
			});

			const response = await submitInspectionData(formData);

			if (response.success) {
				showToast(
					"success",
					`Hasil inspeksi berhasil disimpan dengan status ${response.new_status || "BERHASIL"}`,
				);
				setTimeout(() => {
					router.push("/inspeksi/inspeksi-berkala?tab=riwayat");
				}, 2000);
			} else {
				showToast("error", response.message || "Gagal menyimpan hasil inspeksi.");
				setLoading(false);
			}
		} catch (error) {
			showToast(
				"error",
				error instanceof Error ? error.message : "Terjadi kesalahan sistem.",
			);
			setLoading(false);
		}
	};

	const hasilOptions = [
		{
			value: "READY",
			title: "Layak",
			desc: "Tidak perlu perbaikan",
			color: "emerald",
		},
		{
			value: "REPAIR",
			title: "Perlu Perbaikan",
			desc: "Membutuhkan perbaikan ringan atau overhaul",
			color: "amber",
		},
		{
			value: "SCRAP",
			title: "Tidak Layak",
			desc: "Rekomendasi scrap",
			color: "red",
		},
	];

	return (
		<div className="max-w-5xl mx-auto pt-2 pb-8 px-4 sm:px-6 lg:px-8">
			{/* Toast
			    Sukses = modal center + overlay: konfirmasi bahwa inspeksi sudah tercatat,
			    sekaligus mengunci form selama redirect berjalan.
			    Error = toast sudut, agar inspektor tetap bisa membaca & memperbaiki form. */}
			{toast.show && toast.type === "success" && (
				<div
					className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/50 px-4 animate-in fade-in duration-200"
					role="alertdialog"
					aria-modal="true"
					aria-labelledby="inspeksi-toast-title"
				>
					<div className="bg-white rounded shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
						<div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5">
							<CheckCircle2 className="w-9 h-9 text-[#059669]" />
						</div>
						<h2
							id="inspeksi-toast-title"
							className="text-xl font-bold text-gray-900 mb-2"
						>
							Inspeksi Tersimpan
						</h2>
						<p className="text-[14px] text-gray-600 leading-relaxed">
							{toast.message}
						</p>
						<p className="text-[13px] text-gray-400 mt-4">
							Mengalihkan ke daftar inspeksi...
						</p>
					</div>
				</div>
			)}

			{toast.show && toast.type === "error" && (
				<div
					className="fixed top-6 right-6 z-[70] bg-white text-[#0F172A] px-5 py-3 rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
					role="alert"
				>
					<XCircle className="w-4 h-4 text-[#DC2626]" />
					<span className="text-[13px] font-medium">{toast.message}</span>
					<button
						type="button"
						onClick={() => setToast((prev) => ({ ...prev, show: false }))}
						className="text-gray-400 hover:text-white ml-2"
						aria-label="Tutup notifikasi"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-2">
				<span>Inspeksi Teknik</span>
				<ChevronRight className="w-3.5 h-3.5" />
				<span>Inspeksi Berkala</span>
				<ChevronRight className="w-3.5 h-3.5" />
				<span className="text-[#0A356A] font-semibold">Form Inspeksi</span>
			</div>

			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
						<ClipboardCheck className="w-5 h-5 text-[#0A356A]" />
						Formulir Inspeksi Fisik Lapangan
					</h1>
					<p className="text-[13px] text-gray-500 mt-1">
						Lengkapi data hasil pengecekan untuk menentukan kelayakan peralatan.
					</p>
				</div>
				<button
					onClick={() => router.back()}
					className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-[#0A356A] transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Kembali
				</button>
			</div>

			{/* Equipment Info Card (ringkas agar tidak makan tinggi layar) */}
			<div className="bg-white border border-gray-200 rounded overflow-hidden mb-3">
				<div className="px-4 py-2 border-b border-gray-200 bg-[#F2F3F4] flex items-center justify-between gap-2">
					<h2 className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
						<FileText className="w-4 h-4 text-[#0A356A]" />
						Informasi Aset
					</h2>
					<span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
						{(() => {
							const s =
								typeof equipment?.status === "string"
									? equipment.status
									: equipment?.status?.name || "READY TO USE";
							return s === "IDLE" ? "READY TO USE" : s;
						})()}
					</span>
				</div>
				<div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Kode Aset</p>
						<p className="text-[13px] font-mono font-bold text-[#0A356A]">
							{equipment?.equipment_code || "Memuat..."}
						</p>
					</div>
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Nama Aset</p>
						<p className="text-[13px] font-bold text-gray-800 truncate" title={equipment?.name}>
							{equipment?.name || "Memuat..."}
						</p>
					</div>
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Plant</p>
						<p className="text-[13px] font-medium text-gray-700">
							{(typeof equipment?.plant === "string"
								? equipment.plant
								: equipment?.plant?.name) || "-"}
						</p>
					</div>
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Lokasi Simpan</p>
						<p className="text-[13px] font-medium text-gray-700 truncate">
							{equipment?.storage_location?.name || equipment?.location?.name || "-"}
						</p>
					</div>
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Kondisi Fisik</p>
						<p className="text-[13px] font-medium text-gray-700">
							{(typeof equipment?.condition === "object"
								? equipment?.condition?.name
								: equipment?.condition) || "BAIK"}
						</p>
					</div>
					<div>
						<p className="text-[10.5px] font-semibold text-gray-500">Catatan Aset</p>
						<p className="text-[12px] text-gray-700 italic truncate" title={equipment?.notes || equipment?.description || "-"}>
							{equipment?.notes && equipment?.notes !== "-"
								? equipment.notes
								: equipment?.description && equipment?.description !== "-"
									? equipment.description
									: "-"}
						</p>
					</div>
				</div>
			</div>

			{/* Form Card */}
			<form
				onSubmit={handleSubmit}
				className="bg-white border border-gray-200 rounded overflow-hidden"
			>
				{/* Form Header */}
				<div className="px-4 py-2 border-b border-gray-200 bg-[#F2F3F4] flex items-center justify-between">
					<h2 className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
						<ClipboardCheck className="w-4 h-4 text-[#0A356A]" />
						Hasil Inspeksi
					</h2>
					<span className="text-[11px] font-bold text-[#DC2626]">* Wajib diisi</span>
				</div>

				<div className="p-4 space-y-3.5">
					{/* Baris 1: Tanggal Pemeriksaan Fisik + Hasil Inspeksi Aset sejajar */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
						{/* Tanggal Pemeriksaan Fisik (DEV-16711) */}
						<div className="lg:col-span-4">
							<label
								htmlFor="tanggal-pemeriksaan-fisik"
								className="block text-[12.5px] font-bold text-gray-700 mb-1.5"
							>
								Tanggal Pemeriksaan Fisik <span className="text-[#DC2626]">*</span>
							</label>
							<input
								id="tanggal-pemeriksaan-fisik"
								type="date"
								required
								value={tanggalPemeriksaan}
								max={todayStr}
								onChange={(e) => {
									const val = e.target.value;
									setTanggalPemeriksaan(val);
									if (!val) {
										setTanggalPemeriksaanError(
											"Tanggal pemeriksaan fisik wajib diisi.",
										);
									} else if (val > todayStr) {
										setTanggalPemeriksaanError(
											"Tidak dapat memilih tanggal di masa depan.",
										);
									} else {
										setTanggalPemeriksaanError("");
									}
								}}
								className={`h-9 w-full px-3 text-[13px] border rounded bg-white outline-none transition-colors font-medium tabular-nums ${
									tanggalPemeriksaanError || isTanggalFuture
										? "border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
										: "border-gray-300 focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]"
								}`}
							/>
							{tanggalPemeriksaanError ? (
								<p className="text-[11px] text-[#DC2626] mt-1 font-medium">
									{tanggalPemeriksaanError}
								</p>
							) : (
								<p className="text-[11px] text-gray-500 mt-1">
									Maksimal tanggal hari ini.
								</p>
							)}
						</div>

						{/* Hasil Inspeksi */}
						<div className="lg:col-span-8">
							<label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">
								Hasil Inspeksi Aset <span className="text-[#DC2626]">*</span>
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								{hasilOptions.map((opt) => {
									const isSelected = hasilInspeksi === opt.value;
									const colorMap: Record<
										string,
										{ selected: string; hover: string; ring: string }
									> = {
										emerald: {
											selected: "border-[#059669] bg-white ring-1 ring-[#059669]",
											hover: "hover:border-[#059669]",
											ring: "text-[#059669]",
										},
										amber: {
											selected: "border-[#B45309] bg-white ring-1 ring-[#B45309]",
											hover: "hover:border-[#B45309]",
											ring: "text-[#B45309]",
										},
										red: {
											selected: "border-[#DC2626] bg-white ring-1 ring-[#DC2626]",
											hover: "hover:border-[#DC2626]",
											ring: "text-[#DC2626]",
										},
									};
									const c = colorMap[opt.color];
									return (
										<label
											key={opt.value}
											className={`relative flex flex-col gap-0.5 p-2.5 border-2 rounded cursor-pointer transition-all ${isSelected ? c.selected : `border-gray-200 ${c.hover} bg-white`} group`}
										>
											<input
												type="radio"
												name="hasil_inspeksi"
												value={opt.value}
												checked={isSelected}
												onChange={(e) => {
													setHasilInspeksi(e.target.value);
													setJenisPerbaikan("");
												}}
												className="sr-only"
											/>
											<div className="flex items-center gap-2">
												<div
													className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? `${c.ring} border-current` : "border-gray-300"}`}
												>
													{isSelected && (
														<div className={`w-1.5 h-1.5 rounded-full ${c.ring} bg-current`} />
													)}
												</div>
												<span
													className={`text-[13px] font-bold ${isSelected ? "text-gray-900" : "text-gray-700"} group-hover:text-gray-900 transition-colors`}
												>
													{opt.title}
												</span>
											</div>
											<p className="text-[11px] text-gray-500 pl-5">
												{opt.desc}
											</p>
										</label>
									);
								})}
							</div>

							{/* Scrap Warning */}
							{hasilInspeksi === "SCRAP" && (
								<div className="mt-2 flex items-center gap-2 bg-white border border-[#B45309] rounded px-3 py-2 animate-in fade-in duration-200">
									<AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
									<p className="text-[12px] text-[#B45309] font-medium">
										Aset akan diajukan sebagai rekomendasi scrap dan memerlukan persetujuan Manajer Rendal.
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Section: Jenis Perbaikan (Conditional) */}
					{hasilInspeksi === "REPAIR" && (
						<div className="animate-in fade-in slide-in-from-top-2 bg-gray-50 border border-gray-200 rounded p-4">
							<label className="block text-[13px] font-bold text-gray-700 mb-3">
								Jenis Perbaikan <span className="text-[#DC2626]">*</span>
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{[
									{
										value: "RINGAN",
										title: "Perbaikan Ringan",
										desc: "Perbaikan minor, tidak memerlukan dismantling",
									},
									{
										value: "OVERHAUL",
										title: "Overhaul",
										desc: "Perbaikan besar, memerlukan dismantling menyeluruh",
									},
								].map((opt) => {
									const isSelected = jenisPerbaikan === opt.value;
									return (
										<label
											key={opt.value}
											className={`relative flex flex-col gap-1 p-3.5 border-2 rounded cursor-pointer transition-all ${isSelected ? "border-[#0A356A] bg-[#F2F3F4] ring-1 ring-[#0A356A]" : "border-[#E6E8EA] hover:border-[#0A356A] bg-white"} group`}
										>
											<input
												type="radio"
												name="jenis_perbaikan"
												value={opt.value}
												checked={isSelected}
												onChange={(e) => setJenisPerbaikan(e.target.value)}
												className="sr-only"
											/>
											<div className="flex items-center gap-2">
												<div
													className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#0A356A]" : "border-gray-300"}`}
												>
													{isSelected && (
														<div className="w-2 h-2 rounded-full bg-[#0A356A]" />
													)}
												</div>
												<span
													className={`text-[14px] font-bold ${isSelected ? "text-gray-900" : "text-gray-700"} group-hover:text-gray-900 transition-colors`}
												>
													{opt.title}
												</span>
											</div>
											<p className="text-[11px] text-gray-500 font-medium pl-6">
												{opt.desc}
											</p>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{/* Baris 2: Kondisi + Catatan Inspeksi sejajar */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
						<div>
							<label className="block text-[12.5px] font-bold text-gray-700 mb-1.5 uppercase">
								Kondisi {inspectionRoleName} <span className="text-[#DC2626]">*</span>
							</label>
							<textarea
								value={inspectionCondition}
								onChange={(e) => {
									setInspectionCondition(e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = `${Math.max(72, e.target.scrollHeight)}px`;
								}}
								placeholder="Tuliskan hasil evaluasi pemeriksaan kondisi alat..."
								rows={3}
								className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium resize-none"
							/>
						</div>

						<div>
							<label className="block text-[12.5px] font-bold text-gray-700 mb-1.5">
								Catatan Inspeksi <span className="text-[#DC2626]">*</span>
							</label>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Tuliskan temuan lapangan secara rinci di sini..."
								rows={3}
								className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium resize-none"
							/>
						</div>
					</div>

					{/* Section: Nomor Notifikasi SAP (US-17-FE: tampil kondisional saat Scrap / Repair) */}
					{showSapNotificationField && (
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label
									htmlFor="sap-notification-berkala"
									className="block text-[12.5px] font-bold text-gray-700"
								>
									Nomor Notifikasi SAP{" "}
									{isSapNotificationRequired ? (
										<span className="text-[#DC2626] font-bold">* (Wajib)</span>
									) : (
										<span className="text-gray-400 font-normal text-xs">(Opsional)</span>
									)}
								</label>
								<span className="text-[11px] text-gray-400 font-medium tabular-nums">
									{sapNotificationNumber.length}/50
								</span>
							</div>
							<input
								id="sap-notification-berkala"
								type="text"
								maxLength={50}
								value={sapNotificationNumber}
								onChange={(e) => {
									setSapNotificationNumber(e.target.value);
									if (sapNotificationError) setSapNotificationError("");
								}}
								placeholder="Contoh: 10023489"
								className={`h-9 w-full px-3 text-[13px] border rounded bg-gray-50 focus:bg-white outline-none transition-all font-medium ${
									sapNotificationError
										? "border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
										: isSapNotificationRequired && !sapNotificationNumber.trim()
											? "border-[#B45309] focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]"
											: "border-gray-200 focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]"
								}`}
							/>
							{sapNotificationError && (
								<p className="text-[11px] text-[#DC2626] mt-1 font-medium">
									{sapNotificationError}
								</p>
							)}
						</div>
					)}

					{/* Section: Upload Foto */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="block text-[13px] font-bold text-gray-700">
								Upload File / Attachment <span className="text-red-500 font-bold text-xs">* (Wajib)</span>
							</label>
							{files.length > 0 && (
								<span className="text-[11px] font-bold text-gray-500">
									{files.length} berkas
								</span>
							)}
						</div>

						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => {
								e.preventDefault();
								if (e.dataTransfer.files) {
									const dt = e.dataTransfer.files;
									const fakeEvent = {
										target: { files: dt, value: "" },
									} as any;
									handleFileChange(fakeEvent);
								}
							}}
							className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-5 transition-all bg-gray-50/70 hover:border-[#0A356A]"
						>
							{/* Area Dropzone Klik */}
							<div
								onClick={() => fileInputRef.current?.click()}
								className="flex flex-col items-center justify-center text-center cursor-pointer py-1.5 hover:opacity-80 transition-opacity"
							>
								<UploadCloud className="w-7 h-7 text-gray-400 mb-1" />
								<p className="text-[13px] font-bold text-[#0A356A]">
									Klik atau tarik & lepas file dokumen/foto di sini
								</p>
								<p className="text-[11px] text-gray-500 font-medium mt-0.5">
									Format: PDF, DOCX, XLSX, DWG, JPG, PNG (Maks 25MB)
								</p>
								<span className="text-[10px] text-gray-400 mt-0.5">
									Klik untuk memilih file lampiran (Wajib minimal 1 file)
								</span>
							</div>

							{/* Daftar Berkas Terlampir (Tetap di dalam kotak) */}
							{files.length > 0 && (
								<div className="mt-4 pt-3.5 border-t border-gray-200">
									<div className="flex items-center justify-between mb-2 px-0.5">
										<span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
											Berkas Terlampir ({files.length})
										</span>
										<span className="text-[10px] text-gray-400">
											Klik baris untuk melihat preview
										</span>
									</div>
									<div className="space-y-2">
										{files.map((file, idx) => {
											const isImage = file.type.startsWith("image/");
											const isPdf =
												file.type === "application/pdf" ||
												file.name.toLowerCase().endsWith(".pdf");
											const previewUrl = URL.createObjectURL(file);
											const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";

											return (
												<div
													key={idx}
													onClick={(e) => {
														e.stopPropagation();
														if (isPdf) {
															setPreviewModal({
																url: previewUrl,
																title: file.name,
																isPdf: true,
															});
														} else if (isImage) {
															setPreviewModal({
																url: previewUrl,
																title: file.name,
																isPdf: false,
															});
														} else {
															const a = document.createElement("a");
															a.href = previewUrl;
															a.download = file.name;
															a.click();
														}
													}}
													className="group flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#0A356A] hover:shadow-sm transition-all cursor-pointer"
													title={`Klik untuk melihat preview: ${file.name}`}
												>
													<div className="flex items-center gap-3 min-w-0 flex-1">
														<div className="w-10 h-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative">
															{isImage ? (
																/* eslint-disable-next-line @next/next/no-img-element */
																<img
																	src={previewUrl}
																	alt={file.name}
																	className="w-full h-full object-cover"
																/>
															) : (
																<span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
																	{ext}
																</span>
															)}
														</div>
														<div className="min-w-0 flex-1">
															<p className="text-[12px] font-semibold text-gray-800 truncate group-hover:text-[#0A356A] transition-colors">
																{file.name}
															</p>
															<p className="text-[10px] text-gray-400">
																{(file.size / (1024 * 1024)).toFixed(2)} MB
															</p>
														</div>
													</div>

													<div className="flex items-center gap-2 shrink-0 ml-3">
														<span className="text-[11px] font-medium text-[#0A356A] bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
															<Eye className="w-3.5 h-3.5" /> Preview
														</span>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																removeFile(idx);
															}}
															className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
															title="Hapus berkas"
														>
															<X className="w-4 h-4" />
														</button>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>

						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							multiple
							accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.webp"
							className="hidden"
						/>

						{fileError && (
							<div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[#DC2626]">
								<AlertCircle className="w-3.5 h-3.5" /> {fileError}
							</div>
						)}
					</div>
				</div>

				{/* Form Footer */}
				<div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
					<button
						type="button"
						onClick={() => router.back()}
						className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border border-gray-300 rounded font-bold text-[13px] text-gray-700 bg-white hover:bg-gray-50 transition-all"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={() => setIsConfirmOpen(true)}
						disabled={isSubmitDisabled}
						className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded font-bold text-[13px] transition-all ${
							isSubmitDisabled
								? "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent"
								: "bg-[#0A356A] text-white hover:bg-[#0556B3] border border-transparent"
						}`}
					>
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Mengirim...
							</>
						) : (
							<>
								<CheckCircle2 className="w-4 h-4" />
								Kirim Hasil Inspeksi
							</>
						)}
					</button>
				</div>
			</form>

			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSubmit();
				}}
				title="Kirim Hasil Inspeksi Berkala?"
				description={`Hasil inspeksi untuk ${equipment?.equipment_code ?? equipmentId ?? "peralatan ini"} akan disimpan dan status peralatan diperbarui.`}
				confirmLabel="Ya, Kirim"
				pendingLabel="Mengirim..."
				isPending={loading}
			/>

			{previewModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm"
					onClick={() => setPreviewModal(null)}
				>
					<div className="absolute top-4 right-4 flex items-center gap-3 z-20">
						<a
							href={previewModal.url}
							download={previewModal.title || "lampiran"}
							target="_blank"
							rel="noreferrer"
							className="bg-white/10 hover:bg-white/25 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<Download className="w-4 h-4" /> Buka Tab Baru / Unduh
						</a>
						<button
							className="text-white hover:bg-white/20 p-2 rounded transition-colors"
							onClick={(e) => {
								e.stopPropagation();
								setPreviewModal(null);
							}}
							title="Tutup preview"
						>
							<X className="w-6 h-6" />
						</button>
					</div>
					<div className="relative w-[92vw] max-w-5xl h-[85vh] flex items-center justify-center p-2">
						{previewModal.isPdf ? (
							<iframe
								src={previewModal.url}
								title={previewModal.title || "Preview PDF"}
								className="w-full h-full rounded-lg bg-white shadow-2xl border-0"
							/>
						) : (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={previewModal.url}
								alt={previewModal.title || "Preview Foto"}
								className="max-w-full max-h-full object-contain rounded shadow-2xl"
								onClick={(e) => e.stopPropagation()}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
