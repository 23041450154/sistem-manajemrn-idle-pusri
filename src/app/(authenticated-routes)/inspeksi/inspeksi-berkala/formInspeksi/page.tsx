"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
	Image as ImageIcon,
	ChevronRight,
} from "lucide-react";
import { getEquipments, submitInspectionData } from "@/action/api";

export default function FormInspeksiPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const equipmentId = searchParams.get("equipmentId");

	const [equipment, setEquipment] = useState<any>(null);

	// Form State
	const [hasilInspeksi, setHasilInspeksi] = useState<string>("");
	const [jenisPerbaikan, setJenisPerbaikan] = useState<string>("");
	const [mechanicalCondition, setMechanicalCondition] = useState<string>("");
	const [electricalCondition, setElectricalCondition] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [files, setFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState<string>("");

	// UI State
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState<{
		show: boolean;
		type: "success" | "error";
		message: string;
	}>({ show: false, type: "success", message: "" });

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (equipmentId) {
			getEquipments().then((res) => {
				const eq = res.find((e: any) => String(e.id) === String(equipmentId));
				if (eq) setEquipment(eq);
			});
		}
	}, [equipmentId]);

	const showToast = (type: "success" | "error", message: string) => {
		setToast({ show: true, type, message });
		setTimeout(() => {
			setToast((prev) => ({ ...prev, show: false }));
		}, 5000);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		setFileError("");
		const selectedFiles = Array.from(e.target.files);
		let validFiles: File[] = [];
		let hasError = false;

		for (const file of selectedFiles) {
			const validTypes = ["image/jpeg", "image/jpg", "image/png"];
			if (!validTypes.includes(file.type)) {
				setFileError("Format file tidak didukung. Harap gunakan JPG, JPEG, atau PNG.");
				hasError = true;
				break;
			}

			if (file.size > 5 * 1024 * 1024) {
				setFileError(`File ${file.name} melebihi batas 5MB.`);
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

	const isNotesEmpty = !notes || notes.trim() === "";
	const isKelayakanNotSelected = hasilInspeksi === "";
	const isPerbaikanKhususNotSelected = hasilInspeksi === "REPAIR" && jenisPerbaikan === "";
	const isKondisiEmpty = !mechanicalCondition.trim() || !electricalCondition.trim();
	const isFilesNotEnough = files.length < 2;

	const isSubmitDisabled =
		isKelayakanNotSelected ||
		isPerbaikanKhususNotSelected ||
		isKondisiEmpty ||
		isNotesEmpty ||
		isFilesNotEnough ||
		loading;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitDisabled) return;

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("equipment_id", equipmentId || "");

			let requireActionId = 1;
			let isUtilizableStr = "true";
			let needsRefurbishmentStr = "false";

			if (hasilInspeksi === "READY") {
				requireActionId = 1;
				isUtilizableStr = "true";
				needsRefurbishmentStr = "false";
			} else if (hasilInspeksi === "REPAIR") {
				requireActionId = jenisPerbaikan === "RINGAN" ? 2 : 3;
				isUtilizableStr = "true";
				needsRefurbishmentStr = "true";
			} else if (hasilInspeksi === "DISPOSAL") {
				requireActionId = 4;
				isUtilizableStr = "false";
				needsRefurbishmentStr = "false";
			}

			formData.append("is_utilizable", isUtilizableStr);
			if (isUtilizableStr === "true") {
				formData.append("needs_refurbishment", needsRefurbishmentStr);
			}
			formData.append("require_action_id", requireActionId.toString());

			formData.append("mechanical_condition", mechanicalCondition.trim());
			formData.append("electrical_condition", electricalCondition.trim());
			formData.append("notes", notes.trim());

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
					router.push("/inspeksi/inspeksi-berkala");
				}, 2000);
			} else {
				showToast("error", response.message || "Gagal menyimpan hasil inspeksi.");
				setLoading(false);
			}
		} catch (error: any) {
			showToast("error", error?.message || "Terjadi kesalahan sistem.");
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
			value: "DISPOSAL",
			title: "Tidak Layak",
			desc: "Rekomendasi disposal",
			color: "red",
		},
	];

	return (
		<div className="max-w-5xl mx-auto pt-2 pb-8 px-4 sm:px-6 lg:px-8">
			{/* Toast */}
			{toast.show && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{toast.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					) : (
						<XCircle className="w-4 h-4 text-red-400" />
					)}
					<span className="text-[13px] font-medium">{toast.message}</span>
					<button
						onClick={() => setToast((prev) => ({ ...prev, show: false }))}
						className="text-gray-400 hover:text-white ml-2"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-2">
				<span>Inspeksi Teknik</span>
				<ChevronRight className="w-3.5 h-3.5" />
				<span>Inspeksi</span>
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
					className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Kembali
				</button>
			</div>

			{/* Equipment Info Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
				<div className="px-5 py-3 border-b border-gray-200 bg-gray-50/95">
					<h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
						<FileText className="w-4 h-4 text-[#0A356A]" />
						Informasi Aset
					</h2>
				</div>
				<div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kode Aset</p>
						<p className="text-[14px] font-bold text-[#0A356A]">{equipment?.equipment_code || "Memuat..."}</p>
					</div>
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Aset</p>
						<p className="text-[14px] font-bold text-gray-800">{equipment?.name || "Memuat..."}</p>
					</div>
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Plant</p>
						<p className="text-[14px] font-medium text-gray-700">
							{(typeof equipment?.plant === "string" ? equipment.plant : equipment?.plant?.name) || "-"}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lokasi Penyimpanan</p>
						<p className="text-[14px] font-medium text-gray-700">
							{equipment?.storage_location?.name || equipment?.location?.name || "-"}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Saat Ini</p>
						<span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
							{(() => {
								const s = typeof equipment?.status === "string" ? equipment.status : equipment?.status?.name || "READY TO USE";
								return s === "IDLE" ? "READY TO USE" : s;
							})()}
						</span>
					</div>
					<div>
						<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tanggal Inspeksi</p>
						<p className="text-[14px] font-medium text-gray-700">
							{new Date().toISOString().split("T")[0]}
						</p>
					</div>
				</div>
			</div>

			{/* Form Card */}
			<form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				{/* Form Header */}
				<div className="px-5 py-3 border-b border-gray-200 bg-gray-50/95 flex items-center justify-between">
					<h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
						<ClipboardCheck className="w-4 h-4 text-[#0A356A]" />
						Hasil Inspeksi
					</h2>
					<span className="text-[11px] font-bold text-red-500">* Wajib diisi</span>
				</div>

				<div className="p-5 space-y-6">
					{/* Section: Hasil Inspeksi */}
					<div>
						<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-3">
							Hasil Inspeksi Aset <span className="text-red-500">*</span>
						</label>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							{hasilOptions.map((opt) => {
								const isSelected = hasilInspeksi === opt.value;
								const colorMap: Record<string, { selected: string; hover: string; ring: string }> = {
									emerald: {
										selected: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200",
										hover: "hover:border-emerald-300",
										ring: "text-emerald-600",
									},
									amber: {
										selected: "border-amber-500 bg-amber-50 ring-1 ring-amber-200",
										hover: "hover:border-amber-300",
										ring: "text-amber-600",
									},
									red: {
										selected: "border-red-500 bg-red-50 ring-1 ring-red-200",
										hover: "hover:border-red-300",
										ring: "text-red-600",
									},
								};
								const c = colorMap[opt.color];
								return (
									<label
										key={opt.value}
										className={`relative flex flex-col gap-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? c.selected : `border-gray-200 ${c.hover} bg-white`} group`}
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
											<div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? `${c.ring} border-current` : "border-gray-300"}`}>
												{isSelected && <div className={`w-2 h-2 rounded-full ${c.ring} bg-current`} />}
											</div>
											<span className={`text-[14px] font-bold ${isSelected ? "text-gray-900" : "text-gray-700"} group-hover:text-gray-900 transition-colors`}>
												{opt.title}
											</span>
										</div>
										<p className="text-[11px] text-gray-500 font-medium pl-6">{opt.desc}</p>
									</label>
								);
							})}
						</div>

						{/* Disposal Warning */}
						{hasilInspeksi === "DISPOSAL" && (
							<div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in fade-in duration-200">
								<AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
								<p className="text-[12px] text-amber-800 font-medium">
									Aset akan diajukan sebagai rekomendasi disposal dan memerlukan persetujuan Manajer Rendal.
								</p>
							</div>
						)}
					</div>

					{/* Section: Jenis Perbaikan (Conditional) */}
					{hasilInspeksi === "REPAIR" && (
						<div className="animate-in fade-in slide-in-from-top-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
							<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-3">
								Jenis Perbaikan <span className="text-red-500">*</span>
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{[
									{ value: "RINGAN", title: "Perbaikan Ringan", desc: "Perbaikan minor, tidak memerlukan dismantling" },
									{ value: "OVERHAUL", title: "Overhaul", desc: "Perbaikan besar, memerlukan dismantling menyeluruh" },
								].map((opt) => {
									const isSelected = jenisPerbaikan === opt.value;
									return (
										<label
											key={opt.value}
											className={`relative flex flex-col gap-1 p-3.5 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? "border-[#0A356A] bg-blue-50 ring-1 ring-blue-200" : "border-gray-200 hover:border-blue-300 bg-white"} group`}
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
												<div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#0A356A]" : "border-gray-300"}`}>
													{isSelected && <div className="w-2 h-2 rounded-full bg-[#0A356A]" />}
												</div>
												<span className={`text-[14px] font-bold ${isSelected ? "text-gray-900" : "text-gray-700"} group-hover:text-gray-900 transition-colors`}>
													{opt.title}
												</span>
											</div>
											<p className="text-[11px] text-gray-500 font-medium pl-6">{opt.desc}</p>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{/* Section: Kondisi Mekanik & Elektrik */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-2">
								Kondisi Mekanik <span className="text-red-500">*</span>
							</label>
							<textarea
								value={mechanicalCondition}
								onChange={(e) => {
									setMechanicalCondition(e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = `${Math.max(80, e.target.scrollHeight)}px`;
								}}
								placeholder="Cek kondisi mekanik: bearing, gear, seal, dll."
								rows={3}
								className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium resize-none"
							/>
						</div>
						<div>
							<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-2">
								Kondisi Elektrik <span className="text-red-500">*</span>
							</label>
							<textarea
								value={electricalCondition}
								onChange={(e) => {
									setElectricalCondition(e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = `${Math.max(80, e.target.scrollHeight)}px`;
								}}
								placeholder="Cek kondisi elektrik: motor, kabel, sensor, dll."
								rows={3}
								className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium resize-none"
							/>
						</div>
					</div>

					{/* Section: Catatan */}
					<div>
						<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-2">
							Temuan Fisik / Catatan Inspeksi <span className="text-red-500">*</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Tuliskan temuan lapangan secara rinci di sini..."
							rows={5}
							className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all font-medium resize-none"
						/>
						<p className="text-[11px] text-gray-500 mt-1.5 font-medium">Wajib diisi dan tidak boleh hanya berupa spasi kosong.</p>
					</div>

					{/* Section: Upload Foto */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider">
								Foto Bukti Lapangan <span className="text-red-500">*</span>
								<span className="ml-2 text-[11px] font-bold text-red-500 normal-case">(minimal 2 foto)</span>
							</label>
							{files.length > 0 && (
								<span className={`text-[11px] font-bold ${files.length >= 2 ? "text-emerald-600" : "text-red-500"}`}>
									{files.length} berkas
								</span>
							)}
						</div>

						<div
							onClick={() => fileInputRef.current?.click()}
							className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0A356A] transition-all min-h-[120px]"
						>
							{files.length === 0 ? (
								<>
									<UploadCloud className="w-7 h-7 text-gray-400 mb-2" />
									<p className="text-[13px] font-bold text-[#0A356A] text-center">Klik atau Seret Berkas</p>
									<p className="text-[11px] text-gray-500 mt-1 text-center font-medium">JPG, PNG maks 5 MB</p>
								</>
							) : (
								<div className="w-full">
									<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full mb-3">
										{files.map((file, idx) => (
											<div key={idx} className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square bg-gray-100">
												<img
													src={URL.createObjectURL(file)}
													alt={`Preview ${idx}`}
													className="w-full h-full object-cover"
												/>
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															removeFile(idx);
														}}
														className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg"
														title="Hapus foto"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										))}
									</div>
									<div className="flex items-center justify-center gap-2 text-[12px] font-bold text-[#0A356A] bg-blue-50 py-2 rounded-md border border-blue-100 transition-colors">
										<UploadCloud className="w-4 h-4" /> Tambah Foto
									</div>
								</div>
							)}
						</div>

						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							multiple
							accept="image/jpeg, image/png, image/jpg"
							className="hidden"
						/>

						{fileError && (
							<div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-500">
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
						className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border border-gray-300 rounded-lg font-bold text-[13px] text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitDisabled}
						className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[13px] transition-all shadow-sm ${
							isSubmitDisabled
								? "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent"
								: "bg-[#0A356A] text-white hover:bg-[#062854] border border-transparent"
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
		</div>
	);
}
