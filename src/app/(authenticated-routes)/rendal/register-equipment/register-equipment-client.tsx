"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	Save,
	Info,
	AlertCircle,
	UploadCloud,
	CheckCircle2,
	X,
	Loader2,
	ChevronLeft,
	Paperclip,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import {
	createEquipment,
	getEquipmentCodes,
	updateEquipment,
	uploadAttachment,
} from "@/action/api";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import YearPicker from "@/components/YearPicker";
import AutocompleteInput, {
	type AutocompleteOption,
} from "@/components/AutocompleteInput";

export interface MasterEquipmentCode {
	id: number;
	code: string;
	description: string;
}

export interface MasterOption {
	id: number;
	name: string;
}

export interface RegisterInitialData {
	equipmentCode: string;
	name: string;
	funcLocId: string;
	plantId: string;
	objectTypeId: string;
	vendor: string;
	year: string;
	originalValue: string;
	bookValue: string;
	estimatedReuseValue: string;
	idleReason: string;
	storageLocationId: string;
	notes: string;
}

const EMPTY_FORM: RegisterInitialData = {
	equipmentCode: "",
	name: "",
	funcLocId: "",
	plantId: "",
	objectTypeId: "",
	vendor: "",
	year: "",
	originalValue: "",
	bookValue: "",
	estimatedReuseValue: "",
	idleReason: "",
	storageLocationId: "",
	notes: "",
};

/** Input rupiah dengan prefix Rp + pemisah ribuan id-ID (opsional, tanpa validasi wajib). */
function RupiahField({
	label,
	name,
	value,
	onChange,
}: {
	label: string;
	name: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
				{label}
			</label>
			<div className="relative">
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
					Rp
				</span>
				<input
					type="text"
					name={name}
					value={value}
					onChange={onChange}
					placeholder="0"
					className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0556B3] outline-none transition-all"
				/>
			</div>
		</div>
	);
}

/** Client Component: form registrasi/revisi — data awal & master di-fetch Server Component. */
export default function RegisterEquipmentClient({
	editId,
	objectTypes,
	plants,
	storageLocations,
	funcLocs,
	initialEquipmentCodes = [],
	initialData,
}: {
	editId: string | null;
	objectTypes: MasterOption[];
	plants: MasterOption[];
	storageLocations: MasterOption[];
	funcLocs: MasterOption[];
	initialEquipmentCodes?: MasterEquipmentCode[];
	initialData: RegisterInitialData | null;
}) {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);

	// State untuk efek Loading dan Validasi
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [fileError, setFileError] = useState<string | null>(null);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// UX Improvement: Semua nilai dropdown & radio di-set kosong ("") di awal;
	// mode revisi menerima nilai awal dari Server Component.
	const [formData, setFormData] = useState<RegisterInitialData>(
		initialData ?? EMPTY_FORM,
	);

	// Kode Aset/Tag: dropdown dari master backend (/equipment-codes).
	// Inisialisasi awal langsung dari server component agar instan dan tidak kedip/kosong.
	const [codeOptions, setCodeOptions] = useState<AutocompleteOption[]>(() =>
		initialEquipmentCodes.map((r) => ({
			id: r.id,
			value: r.code,
			label: r.code,
			sublabel: r.description,
			raw: r,
		})),
	);

	useEffect(() => {
		const q = formData.equipmentCode.trim();
		const t = setTimeout(
			async () => {
				const rows = await getEquipmentCodes(q || undefined);
				if (Array.isArray(rows) && rows.length > 0) {
					setCodeOptions((prev) => {
						const map = new Map<string, AutocompleteOption>();
						// Simpan daftar opsi sebelumnya agar pencarian lokal tetap kaya
						prev.forEach((opt) => map.set(String(opt.value || opt.label), opt));
						// Masukkan opsi baru dari respon backend
						rows.forEach((r) =>
							map.set(r.code, {
								id: r.id,
								value: r.code,
								label: r.code,
								sublabel: r.description,
								raw: r,
							}),
						);
						return Array.from(map.values());
					});
				}
			},
			q ? 200 : 0,
		);
		return () => clearTimeout(t);
	}, [formData.equipmentCode]);

	const handleEquipmentCodeChange = (
		value: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature wajib cocok dgn onChange AutocompleteInput
		_option?: AutocompleteOption,
	) => {
		setTouched((prev) => ({
			...prev,
			equipmentCode: true,
		}));
		// Nama Peralatan sengaja TIDAK diisi otomatis dari description — user isi manual.
		setFormData((prev) => ({ ...prev, equipmentCode: value }));
	};

	const handleSelectChange = (name: string, value: string) => {
		setTouched((prev) => ({
			...prev,
			[name]: true,
			...(!formData.equipmentCode ? { equipmentCode: true } : {}),
		}));
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectBlur = (name: string) => {
		setTouched((prev) => ({ ...prev, [name]: true }));
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name } = e.target;
		let { value } = e.target;

		if (name === "equipmentCode" && value.length > 50) {
			value = value.slice(0, 50);
		}

		if (
			name === "originalValue" ||
			name === "bookValue" ||
			name === "estimatedReuseValue"
		) {
			const rawValue = value.replace(/\D/g, "");
			value = rawValue ? parseInt(rawValue, 10).toLocaleString("id-ID") : "";
		}

		if (name === "plantId") {
			setFormData((prev) => ({
				...prev,
				plantId: value,
			}));
			setTouched((prev) => ({ ...prev, plantId: true }));
			return;
		}

		// Jika user mengisi form lain (misal nama), kita anggap equipmentCode otomatis "touched" agar tervalidasi
		setTouched((prev) => ({
			...prev,
			[name]: true,
			...(name !== "equipmentCode" && !formData.equipmentCode
				? { equipmentCode: true }
				: {}),
		}));

		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
		const target = e.target as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;
		if (target.name) {
			setTouched((prev) => ({ ...prev, [target.name]: true }));
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			let errorMsg: string | null = null;
			const validFiles = files.filter((f) => {
				if (f.size > 5 * 1024 * 1024) {
					errorMsg = `Ukuran file ${f.name} melebihi batas 5MB.`;
					return false;
				}
				return true;
			});
			setFileError(errorMsg);
			setUploadedFiles((prev) => [...prev, ...validFiles]);
			e.target.value = ""; // Reset input to allow selecting the same file again
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files) {
			const files = Array.from(e.dataTransfer.files);
			let errorMsg: string | null = null;
			const validFiles = files.filter((f) => {
				if (f.size > 5 * 1024 * 1024) {
					errorMsg = `Ukuran file ${f.name} melebihi batas 5MB.`;
					return false;
				}
				return true;
			});
			setFileError(errorMsg);
			setUploadedFiles((prev) => [...prev, ...validFiles]);
		}
	};

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();

		// Custom Validation Check
		if (
			!formData.equipmentCode ||
			!formData.name ||
			!formData.objectTypeId ||
			!formData.plantId ||
			!formData.storageLocationId ||
			!formData.funcLocId ||
			!formData.vendor ||
			!formData.idleReason
		) {
			setShowValidationErrors(true);
			return;
		}

		setIsSubmitting(true);
		setShowValidationErrors(false);

		if (editId) {
			const res = await updateEquipment(editId, {
				equipment_code: formData.equipmentCode,
				name: formData.name,
				id_func_loc: Number(formData.funcLocId) || undefined,
				id_plant: Number(formData.plantId),
				id_object_type: Number(formData.objectTypeId),
				object_type_id: Number(formData.objectTypeId),
				id_storage_location: Number(formData.storageLocationId),
				storage_location_id: Number(formData.storageLocationId),
				vendor: formData.vendor,
				year: Number(formData.year) || new Date().getFullYear(),
				original_value: Number(formData.originalValue.replace(/\./g, "")) || 0,
				book_value: Number(formData.bookValue.replace(/\./g, "")) || 0,
				estimated_reuse_value:
					Number(formData.estimatedReuseValue.replace(/\./g, "")) || 0,
				idle_reason: formData.idleReason,
				notes: formData.notes,
			});

			if (res.success && uploadedFiles.length) {
				for (const file of uploadedFiles) {
					const upload = await uploadAttachment(editId, file, "equipment_photo");
					if (!upload.success)
						console.error("Gagal upload foto:", file.name, upload.message);
				}
			}

			setIsSubmitting(false);
			setNotification({
				type: res.success ? "success" : "error",
				message: res.success
					? "Berhasil! Data revisi peralatan idle telah disimpan."
					: `Gagal menyimpan data: ${res.message || "Pastikan field sudah sesuai."}`,
			});
			if (res.success) setTimeout(() => router.push("/rendal/idle"), 1500);
			return;
		}

		// Backend memakai tag `form:` -> multipart/form-data, foto ikut di request yang sama.
		const fd = new FormData();
		fd.append("equipment_code", formData.equipmentCode);
		fd.append("name", formData.name);
		fd.append("id_object_type", formData.objectTypeId);
		fd.append("id_plant", formData.plantId);
		fd.append("id_storage_location", formData.storageLocationId);
		fd.append("id_func_loc", formData.funcLocId);
		fd.append("vendor", formData.vendor);
		fd.append("year", String(Number(formData.year) || new Date().getFullYear()));
		fd.append(
			"original_value",
			String(Number(formData.originalValue.replace(/\./g, "")) || 0),
		);
		fd.append(
			"book_value",
			String(Number(formData.bookValue.replace(/\./g, "")) || 0),
		);
		fd.append(
			"estimated_reuse_value",
			String(Number(formData.estimatedReuseValue.replace(/\./g, "")) || 0),
		);
		fd.append("idle_reason", formData.idleReason);
		fd.append("notes", formData.notes);
		for (const file of uploadedFiles) fd.append("photo", file);

		const res = await createEquipment(fd);

		if (res.success && res.data?.id) {
			// Foto sudah terkirim di request multipart yang sama (field `photo`),
			// backend menyimpannya dalam satu transaksi -> tidak perlu upload terpisah.
			setIsSubmitting(false);
			setNotification({
				type: "success",
				message: "Berhasil! Peralatan idle telah didaftarkan.",
			});
			setTimeout(() => {
				router.push("/rendal/idle");
			}, 1500);
		} else {
			setIsSubmitting(false);
			setNotification({
				type: "error",
				message:
					"Gagal menyimpan data: " + (res.message || "Pastikan field sudah sesuai."),
			});
			setTimeout(() => setNotification(null), 3000);
		}
	};

	return (
		<div className="max-w-[1400px] mx-auto pb-8 pt-2 relative">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					) : (
						<XCircle className="w-4 h-4 text-red-400" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
				</div>
			)}

			{/* Header Title */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
				<div>
					<Link
						href="/rendal/idle"
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A356A] transition-colors mb-2.5"
					>
						<ChevronLeft className="w-4 h-4" />
						Kembali
					</Link>
					<h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">
						{editId
							? "Revisi Registrasi Peralatan Idle"
							: "Registrasi Peralatan Idle"}
					</h1>
					<p className="text-gray-500 text-sm mt-0.5">
						{editId
							? "Perbarui spesifikasi dan data aset yang dinyatakan tidak layak untuk diajukan kembali."
							: "Daftarkan aset atau peralatan yang saat ini tidak digunakan."}
					</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className="grid grid-cols-1 lg:grid-cols-12 gap-5"
			>
				{/* PANEL KIRI: Data Utama & Spesifikasi (Lebar 7 Kolom) */}
				<div className="lg:col-span-8 flex flex-col gap-5">
					<div className="bg-white rounded shadow-sm border border-gray-200">
						{/* Judul Panel */}
						<div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50 rounded-t">
							<Info className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
							<h2 className="text-lg font-bold text-gray-900">
								Informasi & Lokasi Aset
							</h2>
						</div>

						{/* Grid Isian Kiri */}
						<div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
							{/* Baris 1: Peralatan */}
							<div className="space-y-1.5 lg:col-span-1">
								<div className="flex justify-between items-end">
									<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
										KODE ASET / TAG <span className="text-red-500">*</span>
									</label>
									<span className="text-[9px] text-gray-400 font-medium">
										Maks 50 karakter
									</span>
								</div>
								<AutocompleteInput
									mode="text"
									name="equipmentCode"
									maxLength={50}
									showOnFocus
									value={formData.equipmentCode}
									onChange={handleEquipmentCodeChange}
									onBlur={() => handleSelectBlur("equipmentCode")}
									options={codeOptions}
									placeholder="Ketik kode aset..."
									hasError={
										(showValidationErrors || touched.equipmentCode) &&
										!formData.equipmentCode
									}
									emptyMessage="Tidak ada kode aset yang cocok."
								/>
								{(showValidationErrors || touched.equipmentCode) &&
									!formData.equipmentCode && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Kode Aset wajib diisi.
										</p>
									)}
							</div>
							<div className="space-y-1.5 lg:col-span-2">
								<div className="flex justify-between items-end">
									<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
										NAMA PERALATAN <span className="text-red-500">*</span>
									</label>
									<span
										className={`text-[9px] font-medium ${formData.name.length >= 150 ? "text-orange-500" : "text-gray-400"}`}
									>
										Maks 150 karakter
									</span>
								</div>
								<input
									onBlur={handleBlur}
									maxLength={150}
									type="text"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Masukkan nama peralatan..."
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${(showValidationErrors || touched.name) && !formData.name ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : formData.name.length >= 150 ? "border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-orange-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
								/>
								{(showValidationErrors || touched.name) && !formData.name && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										* Nama Peralatan wajib diisi.
									</p>
								)}
								{formData.name.length >= 150 && (
									<p className="text-[10px] text-orange-500 mt-1 font-medium">
										* Batas maksimal karakter (150) telah tercapai.
									</p>
								)}
							</div>

							{/* Baris 2: Klasifikasi */}
							<div className="space-y-1.5 lg:col-span-1">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									KATEGORI (TIPE) <span className="text-red-500">*</span>
								</label>
								<AutocompleteInput
									mode="select"
									name="objectTypeId"
									showOnFocus
									value={formData.objectTypeId}
									onChange={(val) => handleSelectChange("objectTypeId", val)}
									onBlur={() => handleSelectBlur("objectTypeId")}
									options={objectTypes}
									placeholder="Ketik kategori..."
									hasError={
										(showValidationErrors || touched.objectTypeId) &&
										!formData.objectTypeId
									}
									emptyMessage="Kategori tidak ditemukan."
								/>
								{(showValidationErrors || touched.objectTypeId) &&
									!formData.objectTypeId && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Kategori wajib dipilih.
										</p>
									)}
							</div>
							<div className="space-y-1.5 lg:col-span-2">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									PABRIK / PLANT <span className="text-red-500">*</span>
								</label>
								<AutocompleteInput
									mode="select"
									name="plantId"
									showOnFocus
									value={formData.plantId}
									onChange={(val) => handleSelectChange("plantId", val)}
									onBlur={() => handleSelectBlur("plantId")}
									options={plants}
									placeholder="Ketik pabrik / plant..."
									hasError={
										(showValidationErrors || touched.plantId) && !formData.plantId
									}
									emptyMessage="Pabrik tidak ditemukan."
								/>
								{(showValidationErrors || touched.plantId) && !formData.plantId && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										* Pabrik / Plant wajib dipilih.
									</p>
								)}
							</div>

							{/* Baris 3: Area */}
							<div className="space-y-1.5 lg:col-span-1">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									LOKASI PENYIMPANAN <span className="text-red-500">*</span>
								</label>
								<AutocompleteInput
									mode="select"
									name="storageLocationId"
									showOnFocus
									value={formData.storageLocationId}
									onChange={(val) => handleSelectChange("storageLocationId", val)}
									onBlur={() => handleSelectBlur("storageLocationId")}
									options={storageLocations}
									placeholder="Ketik lokasi simpan..."
									hasError={
										(showValidationErrors || touched.storageLocationId) &&
										!formData.storageLocationId
									}
									emptyMessage="Lokasi penyimpanan tidak ditemukan."
								/>
								{(showValidationErrors || touched.storageLocationId) &&
									!formData.storageLocationId && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Lokasi penyimpanan wajib dipilih.
										</p>
									)}
							</div>
							<div className="space-y-1.5 lg:col-span-2">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									AREA (FUNCLOC) <span className="text-red-500">*</span>
								</label>
								<AutocompleteInput
									mode="select"
									name="funcLocId"
									showOnFocus
									value={formData.funcLocId}
									onChange={(val) => handleSelectChange("funcLocId", val)}
									onBlur={() => handleSelectBlur("funcLocId")}
									options={funcLocs}
									placeholder="Ketik functional location..."
									hasError={
										(showValidationErrors || touched.funcLocId) &&
										!formData.funcLocId
									}
									emptyMessage="Functional location tidak ditemukan."
								/>
								{(showValidationErrors || touched.funcLocId) &&
									!formData.funcLocId && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Area (Funcloc) wajib dipilih.
										</p>
									)}
							</div>

							{/* Garis Pemisah Visual */}
							<div className="col-span-full border-t border-gray-100 my-1"></div>

							{/* Baris 4: Spesifikasi Khusus */}
							<div className="space-y-1.5 lg:col-span-2">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									VENDOR / MERK <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="vendor"
									value={formData.vendor}
									onChange={handleChange}
									onBlur={handleBlur}
									aria-required="true"
									aria-invalid={
										(showValidationErrors || touched.vendor) && !formData.vendor
									}
									placeholder="Masukkan vendor / merk..."
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${(showValidationErrors || touched.vendor) && !formData.vendor ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
								/>
								{(showValidationErrors || touched.vendor) && !formData.vendor && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										Vendor / merk wajib diisi.
									</p>
								)}
							</div>
							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									TAHUN PEROLEHAN{" "}
									<span className="text-gray-400 lowercase font-normal">(opsional)</span>
								</label>
								<YearPicker
									value={formData.year}
									onChange={(year) => setFormData((prev) => ({ ...prev, year }))}
									placeholder="Pilih tahun perolehan"
								/>
							</div>

							{/* Baris 5: Nilai Aset — satu baris penuh, 3 kolom sejajar */}
							<div className="sm:col-span-2 lg:col-span-3">
								<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
									NILAI ASET{" "}
									<span className="text-gray-400 lowercase font-normal">
										(Rp, opsional)
									</span>
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
									<RupiahField
										label="Nilai Perolehan"
										name="originalValue"
										value={formData.originalValue}
										onChange={handleChange}
									/>
									<RupiahField
										label="Nilai Buku"
										name="bookValue"
										value={formData.bookValue}
										onChange={handleChange}
									/>
									<RupiahField
										label="Estimasi Pakai Ulang"
										name="estimatedReuseValue"
										value={formData.estimatedReuseValue}
										onChange={handleChange}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Banner Bawah (Menghemat ruang vertikal) */}
					<div className="bg-blue-50/70 border border-blue-100 rounded p-4 flex items-center gap-3">
						<CheckCircle2 className="w-7 h-7 text-[#0556B3] shrink-0" />
						<div>
							<h4 className="text-sm font-bold text-[#0A356A]">
								Proses Verifikasi Aset
							</h4>
							<p className="text-xs text-gray-600 mt-0.5">
								Pastikan plat nama peralatan terlihat jelas di foto. Data akan
								diverifikasi selambatnya 24 jam kerja.
							</p>
						</div>
					</div>
				</div>

				{/* PANEL KANAN: Kondisi, File, & Submit (Lebar 5 Kolom) */}
				<div className="lg:col-span-4 flex flex-col gap-5">
					<div className="bg-white rounded shadow-sm border border-gray-200 flex flex-col h-full">
						{/* Judul Panel */}
						<div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50 rounded-t">
							<AlertCircle className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
							<h2 className="text-lg font-bold text-gray-900">Kondisi & Berkas</h2>
						</div>

						<div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
							{/* Alasan Idle (Input teks manual agar fleksibel) */}
							<div>
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
									ALASAN IDLE <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									onBlur={handleBlur}
									name="idleReason"
									value={formData.idleReason}
									onChange={handleChange}
									placeholder="Masukkan Alasan Idle..."
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${
										(showValidationErrors || touched.idleReason) && !formData.idleReason
											? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10 text-gray-900"
											: "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"
									}`}
								/>
								{(showValidationErrors || touched.idleReason) &&
									!formData.idleReason && (
										<p className="text-[10px] text-red-500 mt-1.5 font-medium">
											* Alasan idle wajib diisi.
										</p>
									)}
							</div>

							{/* Catatan Tambahan (Pendek) */}
							<div>
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
									CATATAN TAMBAHAN
								</label>
								<textarea
									name="notes"
									value={formData.notes}
									onChange={handleChange}
									rows={2}
									placeholder="Keterangan kondisi, kontak penanggung jawab..."
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0556B3] outline-none transition-all resize-none"
								></textarea>
							</div>

							{/* Upload Dropzone (Lebih proporsional) */}
							<div className="flex-1 flex flex-col">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
									FOTO PERALATAN
								</label>
								<input
									type="file"
									multiple
									ref={fileInputRef}
									className="hidden"
									onChange={handleFileChange}
									accept=".jpg,.jpeg,.png,.pdf"
								/>
								<div
									onClick={() => fileInputRef.current?.click()}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									className={`flex-1 border-2 border-dashed rounded p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[110px] ${
										isDragging
											? "border-[#0556B3] bg-blue-50/80"
											: "border-gray-300 hover:bg-blue-50/40 hover:border-[#0556B3]"
									}`}
								>
									<UploadCloud
										className={`w-7 h-7 mb-2 ${isDragging ? "text-[#0556B3] animate-bounce" : "text-gray-400"}`}
									/>
									<span className="text-xs font-bold text-gray-900">
										Klik atau tarik & lepas foto di sini
									</span>
									<span className="text-[10px] text-gray-500 mt-1">
										Maksimal 5MB per file
									</span>

									{/* Preview Selected Files */}
									{uploadedFiles.length > 0 && (
										<div
											className="mt-4 w-full flex flex-wrap justify-center gap-3"
											onClick={(e) => e.stopPropagation()}
										>
											{uploadedFiles.map((file, i) => {
												const isImage = file.type.startsWith("image/");
												const previewUrl = isImage ? URL.createObjectURL(file) : null;
												return (
													<div
														key={i}
														className="relative group border border-gray-200 rounded overflow-hidden bg-white w-[100px] shadow-sm hover:shadow-md transition-all hover:border-[#0A356A]"
													>
														{isImage ? (
															<div className="h-16 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
																{/* <img> wajib: URL blob lokal (createObjectURL) tak bisa lewat next/image remotePatterns */}
																{/* eslint-disable-next-line @next/next/no-img-element -- URL blob lokal (createObjectURL) tidak dapat melewati next/image remotePatterns */}
																<img
																	src={previewUrl!}
																	alt={file.name}
																	className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
																/>
															</div>
														) : (
															<div className="h-16 w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
																<Paperclip className="w-5 h-5 mb-1" />
																<span className="text-[9px] font-bold">PDF</span>
															</div>
														)}
														<div className="px-1.5 py-1 border-t border-gray-100 bg-white">
															<span
																className="block text-[9px] font-medium text-gray-700 truncate text-center"
																title={file.name}
															>
																{file.name}
															</span>
														</div>
														<button
															onClick={(e) => {
																e.stopPropagation();
																removeFile(i);
															}}
															className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-md transition-colors opacity-0 group-hover:opacity-100"
															title="Hapus"
														>
															<X className="w-3 h-3" />
														</button>
													</div>
												);
											})}
										</div>
									)}
								</div>
								{fileError && (
									<p className="text-[10px] text-red-500 mt-1.5 font-medium">
										* {fileError}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons (Ditempelkan di bawah Panel Kanan) */}
					<div className="flex items-center justify-end gap-3 mt-1">
						<Link
							href="/rendal/idle"
							className="px-5 py-2.5 rounded border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
						>
							Batal
						</Link>
						<button
							type="button"
							onClick={() => {
								if (
									!formData.equipmentCode ||
									!formData.name ||
									!formData.objectTypeId ||
									!formData.plantId ||
									!formData.storageLocationId ||
									!formData.funcLocId ||
									!formData.vendor ||
									!formData.idleReason
								) {
									setShowValidationErrors(true);
									return;
								}
								setIsConfirmOpen(true);
							}}
							disabled={isSubmitting}
							className="w-full px-5 py-2.5 rounded bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Save className="w-4 h-4" />
							)}
							{isSubmitting ? "Menyimpan Data..." : "Simpan Data Peralatan"}
						</button>
					</div>
				</div>
			</form>

			{/* FULLSCREEN SPINNER OVERLAY (MUTAR-MUTAR) */}
			{isSubmitting && (
				<div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white p-8 rounded shadow-xl flex flex-col items-center border border-gray-100">
						<Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
						<h2 className="text-lg font-bold text-gray-900">Menyimpan Data...</h2>
						<p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
					</div>
				</div>
			)}

			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSubmit();
				}}
				title="Simpan Data Peralatan?"
				description="Data peralatan akan didaftarkan ke sistem dan masuk alur validasi Rendal Pemeliharaan."
				confirmLabel="Ya, Simpan"
				pendingLabel="Menyimpan..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
