"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Save,
	Info,
	AlertCircle,
	FileSpreadsheet,
	UploadCloud,
	CheckCircle2,
	X,
	Loader2,
	ChevronLeft,
	Paperclip,
	XCircle,
	Download,
} from "lucide-react";
import Link from "next/link";
import {
	createEquipment,
	updateEquipment,
	getEquipments,
	getObjectTypes,
	getPlants,
	getStorageLocations,
	getFunctionalLocations,
} from "@/action/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterEquipmentPage() {
	const router = useRouter();
	const editId = useSearchParams().get("editId");
	const [showImportModal, setShowImportModal] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);

	// State untuk efek Loading dan Validasi
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [isImporting, setIsImporting] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const [objectTypes, setObjectTypes] = useState<{ id: number; name: string }[]>(
		[],
	);
	const [plants, setPlants] = useState<{ id: number; name: string }[]>([]);
	const [storageLocations, setStorageLocations] = useState<
		{ id: number; name: string }[]
	>([]);
	const [funcLocs, setFuncLocs] = useState<{ id: number; name: string }[]>([]);

	// UX Improvement: Semua nilai dropdown & radio di-set kosong ("") di awal
	const [formData, setFormData] = useState({
		equipmentCode: "",
		name: "",
		funcLocId: "",
		plantId: "",
		objectTypeId: "",
		vendor: "",
		year: "",
		originalValue: "",
		idleReason: "",
		storageLocationId: "",
		notes: "",
	});

	useEffect(() => {
		async function loadData() {
			const [objs, plantsList, funcLocList, equipments] = await Promise.all([
				getObjectTypes(),
				getPlants(),
				getFunctionalLocations(),
				editId ? getEquipments() : Promise.resolve([]),
			]);
			setObjectTypes(objs);
			setPlants(plantsList);
			setFuncLocs(funcLocList);

			// ponytail: backend equipment shape belum punya DTO frontend bersama.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const found = equipments.find((item: any) => String(item.id) === editId);
			if (found) {
				const plantId = String(found.id_plant || "");
				setFormData({
					equipmentCode: found.equipment_code || "",
					name: found.name || "",
					funcLocId: String(
						found.func_loc_id || found.id_func_loc || found.func_loc?.id || "",
					),
					plantId,
					objectTypeId: String(
						found.object_type_id ||
							found.id_object_type ||
							found.object_type?.id ||
							"",
					),
					vendor: found.vendor || "",
					year: found.year ? String(found.year) : "",
					originalValue: found.original_value
						? Number(found.original_value).toLocaleString("id-ID")
						: "",
					idleReason: found.idle_declaration?.idle_reason || found.idle_reason || "",
					storageLocationId: String(
						found.storage_location_id ||
							found.id_storage_location ||
							found.storage_location?.id ||
							"",
					),
					notes: found.notes || "",
				});
				if (plantId) {
					getStorageLocations(plantId).then(setStorageLocations);
				}
			}
		}
		loadData();
	}, [editId]);

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

		if (name === "originalValue") {
			const rawValue = value.replace(/\D/g, "");
			value = rawValue ? parseInt(rawValue, 10).toLocaleString("id-ID") : "";
		}

		if (name === "plantId") {
			setFormData((prev) => ({
				...prev,
				plantId: value,
				storageLocationId: "",
			}));
			if (value) {
				getStorageLocations(value).then((locs) => {
					setStorageLocations(locs);
					if (locs && locs.length > 0) {
						setFormData((prev) => ({
							...prev,
							storageLocationId: String(locs[0].id),
						}));
					}
				});
			} else {
				setStorageLocations([]);
			}
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Custom Validation Check
		if (
			!formData.equipmentCode ||
			!formData.name ||
			!formData.objectTypeId ||
			!formData.plantId ||
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
				idle_reason: formData.idleReason,
				notes: formData.notes,
			});

			if (res.success && uploadedFiles.length) {
				for (const file of uploadedFiles) {
					const attachment = new FormData();
					attachment.append("equipment_id", editId);
					attachment.append("category", "equipment_photo");
					attachment.append("file", file);
					const upload = await fetch("/api/upload", {
						method: "POST",
						body: attachment,
					});
					if (!upload.ok)
						console.error("Gagal upload foto:", file.name, await upload.text());
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

	const handleDownloadTemplate = () => {
		const headers = [
			"Kode Aset",
			"Nama Peralatan",
			"Kategori (Tipe)",
			"Lokasi Penyimpanan",
			"Pabrik (Plant)",
			"Area (FuncLoc)",
			"Vendor / Merk",
			"Tahun Perolehan",
			"Nilai Perolehan (Rp)",
			"Alasan Idle",
			"Catatan Tambahan",
		];

		const columns = headers
			.map(
				(h) =>
					`<Column ss:Width="${Math.max(h.length * 7 + 10, 80)}" ss:AutoFitWidth="1"/>`,
			)
			.join("");

		const cells = headers
			.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`)
			.join("");

		const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n<Worksheet ss:Name="Template Registrasi">\n<Table>\n${columns}\n<Row>${cells}</Row>\n</Table>\n</Worksheet>\n</Workbook>`;

		const blob = new Blob([xml], {
			type: "application/vnd.ms-excel;charset=utf-8;",
		});
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", "Template_Registrasi_Equipment.xls");
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
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

			{/* Header Title & Import */}
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
				{/* Hidden import excel button */}
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
								<input
									onBlur={handleBlur}
									maxLength={50}
									type="text"
									name="equipmentCode"
									value={formData.equipmentCode}
									onChange={handleChange}
									placeholder="Masukkan kode aset..."
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${(showValidationErrors || touched.equipmentCode) && !formData.equipmentCode ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
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
								<select
									onBlur={handleBlur}
									name="objectTypeId"
									value={formData.objectTypeId}
									onChange={handleChange}
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all bg-white ${(showValidationErrors || touched.objectTypeId) && !formData.objectTypeId ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 bg-red-50/10" : !formData.objectTypeId ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
								>
									<option value="" disabled>
										Pilih Kategori...
									</option>
									{objectTypes.map((type: { id: number; name: string }) => (
										<option key={type.id} value={type.id} className="text-gray-900">
											{type.name}
										</option>
									))}
								</select>
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
								<select
									onBlur={handleBlur}
									name="plantId"
									value={formData.plantId}
									onChange={handleChange}
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all bg-white ${(showValidationErrors || touched.plantId) && !formData.plantId ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 bg-red-50/10" : !formData.plantId ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
								>
									<option value="" disabled>
										Pilih Pabrik...
									</option>
									{plants.map((p) => (
										<option key={p.id} value={p.id} className="text-gray-900">
											{p.name}
										</option>
									))}
								</select>
								{(showValidationErrors || touched.plantId) && !formData.plantId && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										* Pabrik / Plant wajib dipilih.
									</p>
								)}
							</div>

							{/* Baris 3: Area */}
							<div className="space-y-1.5 lg:col-span-1">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									LOKASI PENYIMPANAN
								</label>
								<select
									onBlur={handleBlur}
									name="storageLocationId"
									value={formData.storageLocationId}
									onChange={handleChange}
									disabled={!formData.plantId}
									className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all bg-white disabled:bg-gray-50 disabled:cursor-not-allowed ${!formData.storageLocationId ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
								>
									<option value="" disabled>
										{formData.plantId ? "Pilih Lokasi Simpan..." : "Pilih Pabrik dulu..."}
									</option>
									{storageLocations.map((loc: { id: number; name: string }) => (
										<option key={loc.id} value={loc.id} className="text-gray-900">
											{loc.name}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-1.5 lg:col-span-2">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
									AREA (FUNCLOC)
								</label>
								<select
									onBlur={handleBlur}
									name="funcLocId"
									value={formData.funcLocId}
									onChange={handleChange}
									className={`w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none transition-all bg-white focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3] ${formData.funcLocId ? "text-gray-900" : "text-gray-400"}`}
								>
									<option value="">Pilih functional location...</option>
									{funcLocs.map((fl) => (
										<option key={fl.id} value={fl.id} className="text-gray-900">
											{fl.name}
										</option>
									))}
								</select>
							</div>

							{/* Garis Pemisah Visual */}
							<div className="col-span-full border-t border-gray-100 my-1"></div>

							{/* Baris 4: Spesifikasi Khusus */}
							<div className="space-y-1.5">
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
								<input
									type="number"
									name="year"
									value={formData.year}
									placeholder="Contoh: 2020"
									onChange={handleChange}
									min="1950"
									max="2100"
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0556B3] outline-none transition-all"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
									NILAI PEROLEHAN{" "}
									<span className="text-gray-400 lowercase font-normal">
										(Rp, opsional)
									</span>
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
										Rp
									</span>
									<input
										type="text"
										name="originalValue"
										value={formData.originalValue}
										onChange={handleChange}
										placeholder="0"
										className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0556B3] outline-none transition-all"
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
							type="submit"
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

			{/* MODAL IMPORT DATA MASSAL */}
			{showImportModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden scale-in-center">
						{/* Modal Header */}
						<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
							<h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
								<FileSpreadsheet className="w-5 h-5 text-[#0556B3]" />
								Import dari Excel Massal
							</h3>
							<button
								onClick={() => {
									setShowImportModal(false);
									setImportFile(null);
								}}
								className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Modal Body */}
						<div className="p-6">
							<p className="text-sm text-gray-600 mb-5 leading-relaxed">
								Gunakan fitur ini untuk meregistrasikan banyak peralatan sekaligus.
								Silakan pilih format file dan unggah dokumen Anda.
							</p>

							{/* Pilihan Format */}
							<div className="mb-5">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
									TIPE FORMAT DATA <span className="text-red-500">*</span>
								</label>
								<select className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#0556B3] focus:border-[#0556B3] outline-none transition-all bg-white font-medium text-gray-800">
									<option value="excel">Microsoft Excel (.xlsx, .xls)</option>
									<option value="csv">Comma Separated Values (.csv)</option>
								</select>
							</div>

							{/* Download Template */}
							<div className="mb-5 bg-blue-50/60 border border-blue-100 rounded p-3.5 flex items-center justify-between gap-3">
								<div className="flex items-center gap-2.5">
									<FileSpreadsheet className="w-5 h-5 text-[#0556B3] shrink-0" />
									<div>
										<p className="text-xs font-bold text-gray-800">
											Format Template Excel
										</p>
										<p className="text-[10px] text-gray-500 mt-0.5">
											Gunakan format ini untuk mengisi data peralatan secara massal
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={handleDownloadTemplate}
									className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-[#0556B3] px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap"
								>
									<Download className="w-3.5 h-3.5" />
									Download Template
								</button>
							</div>

							{/* Drag & Drop Area */}
							<div className="border-2 border-dashed border-gray-300 rounded p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0556B3] cursor-pointer transition-all bg-gray-50/30">
								<UploadCloud className="w-12 h-12 text-[#0556B3] mb-3" />
								<span className="text-base font-bold text-gray-900">
									Tarik & lepas file Anda di sini
								</span>
								<span className="text-xs text-gray-500 mt-1 mb-5">
									Atau klik tombol di bawah untuk mencari file dari komputer
								</span>

								{/* Hidden File Input */}
								<input
									type="file"
									accept=".xlsx, .xls, .csv"
									className="hidden"
									id="import-file-upload"
									onChange={(e) => {
										if (e.target.files && e.target.files.length > 0) {
											setImportFile(e.target.files[0]);
										}
									}}
								/>

								<button
									type="button"
									onClick={() => document.getElementById("import-file-upload")?.click()}
									className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
								>
									Pilih File Dokumen
								</button>
							</div>

							{/* Preview File yang dipilih */}
							{importFile && (
								<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
									<div className="flex items-center gap-3 overflow-hidden">
										<FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
										<div>
											<p className="text-sm font-bold text-blue-800 truncate">
												{importFile.name}
											</p>
											<p className="text-[10px] text-blue-600 font-medium">
												{(importFile.size / 1024).toFixed(1)} KB
											</p>
										</div>
									</div>
									<button
										onClick={() => setImportFile(null)}
										className="text-blue-700 hover:text-blue-900 p-1.5 hover:bg-blue-100 rounded transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								</div>
							)}
						</div>

						{/* Modal Footer */}
						<div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
							<button
								onClick={() => {
									setShowImportModal(false);
									setImportFile(null);
								}}
								className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded transition-colors shadow-sm"
							>
								Batal
							</button>
							<button
								disabled={isImporting}
								onClick={() => {
									if (!importFile) {
										alert("Harap pilih file terlebih dahulu sebelum memproses import!");
										return;
									}

									// Simulasi Loading Import
									setIsImporting(true);
									setTimeout(() => {
										setIsImporting(false);
										alert(`File ${importFile.name} berhasil disiapkan untuk di-import!`);
										setShowImportModal(false);
										setImportFile(null);
									}, 2000);
								}}
								className="px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
							>
								{isImporting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								{isImporting ? "Memproses..." : "Proses Import dari Excel"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* FULLSCREEN SPINNER OVERLAY (MUTAR-MUTAR) */}
			{(isSubmitting || isImporting) && (
				<div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white p-8 rounded shadow-xl flex flex-col items-center border border-gray-100">
						<Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
						<h2 className="text-lg font-bold text-gray-900">
							{isSubmitting ? "Menyimpan Data..." : "Memproses Dokumen..."}
						</h2>
						<p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
					</div>
				</div>
			)}
		</div>
	);
}
