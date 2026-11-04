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
	Eye,
	Download,
} from "lucide-react";
import Link from "next/link";
import {
	createEquipment,
	searchSapEquipment,
	updateEquipment,
	uploadAttachment,
	type SapEquipmentRow,
} from "@/action/api";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import YearPicker from "@/components/YearPicker";
import AutocompleteInput, {
	type AutocompleteOption,
} from "@/components/AutocompleteInput";

export interface MasterEquipmentCode {
	// Baris SAP live; FK lokal tidak dikirim backend lagi — plant/funcloc/object type
	// dikembalikan sebagai STRING SAP dan di-resolve ke ID master lokal di FE.
	equipment: string;
	description: string;
	maintenance_plant: string;
	functional_location: string;
	object_type: string;
	master_resolved: boolean;
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
	inspectionCluster: string;
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
	inspectionCluster: "",
};

/** Autocomplete dari baris SAP: satu sumber data, dua tampilan (kode-dulu / nama-dulu). */
function toCodeOptions(rows: SapEquipmentRow[]): AutocompleteOption[] {
	return rows.map((r) => ({
		value: r.equipment,
		label: r.equipment,
		sublabel: r.description,
		raw: r,
	}));
}
function toNameOptions(rows: SapEquipmentRow[]): AutocompleteOption[] {
	return rows.map((r) => ({
		value: r.description,
		label: r.description,
		sublabel: r.equipment,
		raw: r,
	}));
}

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
	initialEquipmentCodes?: SapEquipmentRow[];
	initialData: RegisterInitialData | null;
}) {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [previewModal, setPreviewModal] = useState<{ url: string; title?: string; isPdf?: boolean } | null>(null);

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

	// Kode Aset/Tag & Nama Peralatan: autocomplete DUA ARAH dari SAP live
	// (/api/sap/equipment — sumber tunggal, keyword dicocokkan kode+deskripsi
	// sekaligus di backend, jadi satu state hasil untuk kedua input).
	const [codeOptions, setCodeOptions] = useState<AutocompleteOption[]>(() =>
		toCodeOptions(initialEquipmentCodes),
	);
	const [nameOptions, setNameOptions] = useState<AutocompleteOption[]>(() =>
		toNameOptions(initialEquipmentCodes),
	);
	// Fetch ulang tiap keyword berubah; kedua daftar opsi diisi dari hasil yang sama.
	const [sapQuery, setSapQuery] = useState("");

	useEffect(() => {
		const t = setTimeout(
			async () => {
				const rows = await searchSapEquipment(sapQuery || undefined, 20);
				if (rows.length > 0) {
					setCodeOptions(toCodeOptions(rows));
					setNameOptions(toNameOptions(rows));
				}
			},
			sapQuery ? 300 : 0,
		);
		return () => clearTimeout(t);
	}, [sapQuery]);

	const handleSapQueryChange = (value: string) => {
		// Debounce keyword SAP di sini — dipicu dari input kode maupun input nama.
		setSapQuery(value);
	};

	// Kode aset yang sedang auto-fill field turunannya (nama/kategori/plant/funcloc);
	// null = belum ada auto-fill. Dipakai untuk membersihkan field saat kode dilepas.
	const autoFilledRef = useRef<{
		code: string;
		name: string;
		objectTypeId: string;
		plantId: string;
		funcLocId: string;
	} | null>(null);

	// Plant/funcloc/object type dari SAP berupa string — resolve ke ID master lokal
	// by name (master lokal adalah hasil sync SAP, jadi namanya identik).
	// masterResolved=false berarti FK lokal belum ada: field dibiarkan kosong agar
	// user tahu (dan backend menolak registrasinya sampai admin sync master).
	const applySapRow = (raw: SapEquipmentRow) => {
		const objectTypeId = String(
			objectTypes.find((o) => o.name === raw.object_type)?.id ?? "",
		);
		const plantId = String(
			plants.find((p) => p.name === raw.maintenance_plant)?.id ?? "",
		);
		const funcLocId = String(
			funcLocs.find((f) => f.name === raw.functional_location)?.id ?? "",
		);
		const name = raw.description || "";
		autoFilledRef.current = {
			code: raw.equipment,
			name,
			objectTypeId,
			plantId,
			funcLocId,
		};
		setFormData((prev) => ({
			...prev,
			equipmentCode: raw.equipment,
			name,
			objectTypeId,
			plantId,
			funcLocId,
		}));
	};

	// Dipilih dari input KODE atau input NAMA — sama-sama memakai baris SAP yang sama.
	const handleEquipmentCodeChange = (
		value: string,
		option?: AutocompleteOption,
	) => {
		setTouched((prev) => ({
			...prev,
			equipmentCode: true,
		}));

		const raw = option?.raw as SapEquipmentRow | undefined;
		if (raw && value) {
			applySapRow(raw);
			return;
		}

		// Kode aset dikosongkan / diubah dari kode yang terpilih → bersihkan hasil auto-fill.
		if (autoFilledRef.current && value !== autoFilledRef.current.code) {
			autoFilledRef.current = null;
			setFormData((prev) => ({
				...prev,
				name: "",
				objectTypeId: "",
				plantId: "",
				funcLocId: "",
			}));
		}
		setFormData((prev) => ({ ...prev, equipmentCode: value }));
	};

	// Arah kedua: pilih dari NAMA → isi kode aset + field turunannya.
	const handleNameChange = (
		value: string,
		option?: AutocompleteOption,
	) => {
		setTouched((prev) => ({ ...prev, name: true }));

		const raw = option?.raw as SapEquipmentRow | undefined;
		if (raw && value) {
			applySapRow(raw);
			return;
		}

		if (autoFilledRef.current && value !== autoFilledRef.current.name) {
			autoFilledRef.current = null;
			setFormData((prev) => ({
				...prev,
				equipmentCode: "",
				objectTypeId: "",
				plantId: "",
				funcLocId: "",
			}));
		}
		setFormData((prev) => ({ ...prev, name: value }));
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
				if (f.size > 10 * 1024 * 1024) {
					errorMsg = `Ukuran file ${f.name} melebihi batas 10MB.`;
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
				if (f.size > 10 * 1024 * 1024) {
					errorMsg = `Ukuran file ${f.name} melebihi batas 10MB.`;
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
			!formData.idleReason ||
			!formData.inspectionCluster
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
				inspection_cluster: formData.inspectionCluster,
				inspection_purpose: formData.inspectionCluster,
				tujuan_inspeksi: formData.inspectionCluster,
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
		fd.append("tujuan_inspeksi", formData.inspectionCluster);
		fd.append("inspection_purpose", formData.inspectionCluster);
		fd.append("inspection_cluster", formData.inspectionCluster);
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
							{/* Baris 1: Peralatan — Nama di posisi utama sebelum Kode Aset */}
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
								<AutocompleteInput
									mode="text"
									name="name"
									maxLength={150}
									showOnFocus
									value={formData.name}
									onChange={handleNameChange}
									onQueryChange={handleSapQueryChange}
									onBlur={handleBlur as unknown as () => void}
									options={nameOptions}
									placeholder="Ketik nama peralatan (mis. FLOW TRANSMITTER)..."
									hasError={
										(showValidationErrors || touched.name) && !formData.name
									}
									emptyMessage="Tidak ada nama peralatan yang cocok."
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
									onQueryChange={handleSapQueryChange}
									onBlur={() => handleSelectBlur("equipmentCode")}
									options={codeOptions}
									placeholder="Ketik kode aset (mis. F1N-FT201)..."
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

							{/* Baris 2: Trisula Informasi (Pabrik & Functional Location) */}
							<div className="space-y-1.5 lg:col-span-1">
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
										(showValidationErrors || touched.funcLocId) && !formData.funcLocId
									}
									emptyMessage="Functional location tidak ditemukan."
								/>
								{(showValidationErrors || touched.funcLocId) && !formData.funcLocId && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										* Area (Funcloc) wajib dipilih.
									</p>
								)}
							</div>

							{/* Baris 3: Klasifikasi & Lokasi Simpan */}
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

							{/* Baris Rumpun Inspeksi Tujuan */}
							<div className="space-y-1.5 lg:col-span-3">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
									RUMPUN INSPEKSI TUJUAN <span className="text-red-500">*</span>
								</label>
								<select
									name="inspectionCluster"
									value={formData.inspectionCluster}
									onChange={handleChange}
									onBlur={handleBlur}
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all cursor-pointer ${
										(showValidationErrors || touched.inspectionCluster) &&
										!formData.inspectionCluster
											? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10 text-gray-900"
											: "border-gray-300 bg-white text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"
									}`}
								>
									<option value="">Pilih Rumpun Inspeksi Tujuan...</option>
									<option value="INSPEKSI_1">Inspeksi 1</option>
									<option value="INSPEKSI_2">Inspeksi 2</option>
									<option value="INSPEKSI_LISTRIK">Inspeksi Listrik</option>
									<option value="INSPEKSI_INSTRUMEN">Inspeksi Instrumen</option>
								</select>
								{(showValidationErrors || touched.inspectionCluster) &&
									!formData.inspectionCluster && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Rumpun Inspeksi Tujuan wajib dipilih.
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

							{/* Upload Dropzone */}
							<div className="flex-1 flex flex-col">
								<label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
									Upload File / Attachment <span className="text-gray-400 font-normal normal-case">(Opsional)</span>
								</label>
								<input
									type="file"
									multiple
									ref={fileInputRef}
									className="hidden"
									onChange={handleFileChange}
									accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.webp"
								/>
								<div
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									className={`border-2 border-dashed rounded-lg p-4 sm:p-5 transition-all ${
										isDragging
											? "border-[#0556B3] bg-blue-50/80"
											: "border-gray-300 hover:border-[#0556B3] bg-gray-50/60"
									}`}
								>
									{/* Area Dropzone Klik */}
									<div
										onClick={() => fileInputRef.current?.click()}
										className="flex flex-col items-center justify-center text-center cursor-pointer py-1.5 hover:opacity-80 transition-opacity"
									>
										<UploadCloud
											className={`w-7 h-7 mb-1 ${isDragging ? "text-[#0556B3] animate-bounce" : "text-gray-400"}`}
										/>
										<span className="text-xs font-bold text-gray-900">
											Klik atau tarik & lepas file dokumen/foto di sini
										</span>
										<span className="text-[10px] text-gray-500 mt-0.5">
											Format: PDF, DOCX, XLSX, DWG, JPG, PNG (Maks. 10MB per file)
										</span>
										<span className="text-[10px] text-gray-400 mt-0.5">
											Klik untuk memilih file lampiran (Opsional)
										</span>
									</div>

									{/* Daftar Berkas Terlampir (Tetap di dalam kotak) */}
									{uploadedFiles.length > 0 && (
										<div className="mt-4 pt-3.5 border-t border-gray-200">
											<div className="flex items-center justify-between mb-2 px-0.5">
												<span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
													Berkas Terlampir ({uploadedFiles.length})
												</span>
												<span className="text-[10px] text-gray-400">
													Klik baris untuk melihat preview
												</span>
											</div>
											<div className="space-y-2">
												{uploadedFiles.map((file, i) => {
													const isImage = file.type.startsWith("image/");
													const isPdf =
														file.type === "application/pdf" ||
														file.name.toLowerCase().endsWith(".pdf");
													const previewUrl = URL.createObjectURL(file);
													const ext =
														file.name.split(".").pop()?.toUpperCase() || "FILE";

													return (
														<div
															key={i}
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
																<span className="text-[11px] font-medium text-[#0A356A] bg-blue-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
																	<Eye className="w-3.5 h-3.5" /> Preview
																</span>
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		removeFile(i);
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
									!formData.idleReason ||
									!formData.inspectionCluster
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
