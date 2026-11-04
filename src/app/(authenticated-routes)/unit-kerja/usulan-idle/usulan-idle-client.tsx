"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
	PlusCircle,
	History,
	UploadCloud,
	Paperclip,
	Eye,
	Download,
	X,
	CheckCircle2,
	AlertCircle,
	Clock,
	Send,
	Search,
	ChevronRight,
	RefreshCw,
	Loader2,
	Wrench,
	Info,
	FileText,
} from "lucide-react";
import {
	createEquipment,
	searchSapEquipment,
	type SapEquipmentRow,
} from "@/action/api";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import AutocompleteInput, {
	type AutocompleteOption,
} from "@/components/AutocompleteInput";
import { formatPlantDisplay } from "@/lib/equipment-status";

interface MasterOption {
	id: string | number;
	name: string;
	code?: string;
	description?: string;
}

interface UsulanIdleClientProps {
	objectTypes: MasterOption[];
	plants: MasterOption[];
	storageLocations: MasterOption[];
	funcLocs: MasterOption[];
	initialEquipmentCodes?: SapEquipmentRow[];
	initialEquipments?: any[];
	onRefresh?: () => Promise<void>;
}

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

export default function UsulanIdleClient({
	objectTypes,
	plants,
	storageLocations,
	funcLocs,
	initialEquipmentCodes = [],
	initialEquipments = [],
	onRefresh,
}: UsulanIdleClientProps) {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<"form" | "riwayat">("form");

	// User plant info (fallback to PUSRI IIB jika tidak terdefinisi)
	const userPlantDisplay = useMemo(() => {
		const rawPlant = (user as any)?.plant || (user as any)?.unit_kerja || "";
		if (rawPlant) return String(rawPlant);
		return "PUSRI IIB (Pabrik IIB)";
	}, [user]);

	// Form State
	const [formData, setFormData] = useState({
		equipmentCode: "",
		name: "",
		plantId: "",
		funcLocId: "",
		objectTypeId: "",
		storageLocationId: "",
		idleReason: "",
		notes: "",
	});

	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// Dialogs & Modals
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [previewModal, setPreviewModal] = useState<{
		url: string;
		title?: string;
		isPdf?: boolean;
	} | null>(null);
	const [detailAsset, setDetailAsset] = useState<any | null>(null);

	// Notification
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	// Autocomplete SAP options
	const [sapRows, setSapRows] = useState<SapEquipmentRow[]>(initialEquipmentCodes);
	const codeOptions = useMemo(() => toCodeOptions(sapRows), [sapRows]);
	const nameOptions = useMemo(() => toNameOptions(sapRows), [sapRows]);

	const sapDebounceRef = useRef<NodeJS.Timeout | null>(null);
	const autoFilledRef = useRef<{
		code: string;
		name: string;
		objectTypeId: string;
		plantId: string;
		funcLocId: string;
	} | null>(null);

	const handleSapQueryChange = useCallback((query: string) => {
		if (sapDebounceRef.current) clearTimeout(sapDebounceRef.current);
		if (!query.trim()) return;

		sapDebounceRef.current = setTimeout(async () => {
			try {
				const results = await searchSapEquipment(query, 20);
				if (Array.isArray(results) && results.length > 0) {
					setSapRows((prev) => {
						const seen = new Set(prev.map((r) => r.equipment));
						const merged = [...prev];
						for (const r of results) {
							if (!seen.has(r.equipment)) {
								seen.add(r.equipment);
								merged.push(r);
							}
						}
						return merged;
					});
				}
			} catch (err) {
				console.error("Gagal cari SAP:", err);
			}
		}, 300);
	}, []);

	// Resolver Helper
	const resolveMastersFromSapRow = useCallback(
		(row: SapEquipmentRow) => {
			let matchedPlantId = "";
			if (row.maintenance_plant) {
				const qPlant = row.maintenance_plant.toLowerCase().trim();
				const p = plants.find((item) => {
					const code = (item.code || "").toLowerCase().trim();
					const name = (item.name || "").toLowerCase().trim();
					return (
						code === qPlant ||
						name === qPlant ||
						name.includes(qPlant) ||
						code.includes(qPlant)
					);
				});
				if (p) matchedPlantId = String(p.id);
			}

			let matchedFuncLocId = "";
			if (row.functional_location) {
				const qFL = row.functional_location.toLowerCase().trim();
				const fl = funcLocs.find((item) => {
					const name = (item.name || "").toLowerCase().trim();
					const desc = (item.description || "").toLowerCase().trim();
					return name === qFL || desc === qFL || name.includes(qFL);
				});
				if (fl) matchedFuncLocId = String(fl.id);
			}

			let matchedObjTypeId = "";
			if (row.object_type) {
				const qObj = row.object_type.toLowerCase().trim();
				const ot = objectTypes.find((item) => {
					const name = (item.name || "").toLowerCase().trim();
					const code = (item.code || "").toLowerCase().trim();
					return name === qObj || code === qObj || name.includes(qObj);
				});
				if (ot) matchedObjTypeId = String(ot.id);
			}

			return { matchedPlantId, matchedFuncLocId, matchedObjTypeId };
		},
		[plants, funcLocs, objectTypes],
	);

	// Bidirectional: User memilih / mengetik Kode Aset
	const handleEquipmentCodeChange = (
		val: string,
		option?: AutocompleteOption,
	) => {
		const raw = option?.raw as SapEquipmentRow | undefined;
		if (raw) {
			const { matchedPlantId, matchedFuncLocId, matchedObjTypeId } =
				resolveMastersFromSapRow(raw);

			setFormData((prev) => ({
				...prev,
				equipmentCode: raw.equipment,
				name: raw.description || prev.name,
				plantId: matchedPlantId || prev.plantId,
				funcLocId: matchedFuncLocId || prev.funcLocId,
				objectTypeId: matchedObjTypeId || prev.objectTypeId,
			}));

			autoFilledRef.current = {
				code: raw.equipment,
				name: raw.description || "",
				plantId: matchedPlantId,
				funcLocId: matchedFuncLocId,
				objectTypeId: matchedObjTypeId,
			};
		} else {
			setFormData((prev) => {
				const prevAuto = autoFilledRef.current;
				const shouldClear =
					prevAuto &&
					prevAuto.code === prev.equipmentCode &&
					val !== prev.equipmentCode;

				if (shouldClear) {
					autoFilledRef.current = null;
					return {
						...prev,
						equipmentCode: val,
						name: prev.name === prevAuto.name ? "" : prev.name,
						plantId: prev.plantId === prevAuto.plantId ? "" : prev.plantId,
						funcLocId:
							prev.funcLocId === prevAuto.funcLocId ? "" : prev.funcLocId,
						objectTypeId:
							prev.objectTypeId === prevAuto.objectTypeId
								? ""
								: prev.objectTypeId,
					};
				}
				return { ...prev, equipmentCode: val };
			});
		}
	};

	// Bidirectional: User memilih / mengetik Nama Peralatan
	const handleNameChange = (val: string, option?: AutocompleteOption) => {
		const raw = option?.raw as SapEquipmentRow | undefined;
		if (raw) {
			const { matchedPlantId, matchedFuncLocId, matchedObjTypeId } =
				resolveMastersFromSapRow(raw);

			setFormData((prev) => ({
				...prev,
				name: raw.description,
				equipmentCode: raw.equipment || prev.equipmentCode,
				plantId: matchedPlantId || prev.plantId,
				funcLocId: matchedFuncLocId || prev.funcLocId,
				objectTypeId: matchedObjTypeId || prev.objectTypeId,
			}));

			autoFilledRef.current = {
				code: raw.equipment || "",
				name: raw.description,
				plantId: matchedPlantId,
				funcLocId: matchedFuncLocId,
				objectTypeId: matchedObjTypeId,
			};
		} else {
			setFormData((prev) => {
				const prevAuto = autoFilledRef.current;
				const shouldClear =
					prevAuto && prevAuto.name === prev.name && val !== prev.name;

				if (shouldClear) {
					autoFilledRef.current = null;
					return {
						...prev,
						name: val,
						equipmentCode:
							prev.equipmentCode === prevAuto.code ? "" : prev.equipmentCode,
						plantId: prev.plantId === prevAuto.plantId ? "" : prev.plantId,
						funcLocId:
							prev.funcLocId === prevAuto.funcLocId ? "" : prev.funcLocId,
						objectTypeId:
							prev.objectTypeId === prevAuto.objectTypeId
								? ""
								: prev.objectTypeId,
					};
				}
				return { ...prev, name: val };
			});
		}
	};

	// Upload Files Handlers
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
			e.target.value = "";
		}
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

	// Reset Form
	const handleReset = () => {
		setFormData({
			equipmentCode: "",
			name: "",
			plantId: "",
			funcLocId: "",
			objectTypeId: "",
			storageLocationId: "",
			idleReason: "",
			notes: "",
		});
		setUploadedFiles([]);
		setFileError(null);
		setShowValidationErrors(false);
		setTouched({});
		autoFilledRef.current = null;
	};

	// Validasi & Trigger Submit
	const handleInitiateSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.equipmentCode.trim() ||
			!formData.name.trim() ||
			!formData.plantId ||
			!formData.funcLocId ||
			!formData.idleReason.trim()
		) {
			setShowValidationErrors(true);
			setNotification({
				type: "error",
				message: "Harap lengkapi semua field wajib bertanda bintang (*).",
			});
			return;
		}

		// AC-04: Form tidak dapat dikirim tanpa minimal 1 file lampiran
		if (uploadedFiles.length === 0) {
			setFileError("Wajib melampirkan minimal 1 Berita Acara / Foto pendukung.");
			setShowValidationErrors(true);
			setNotification({
				type: "error",
				message:
					"Wajib melampirkan minimal 1 Berita Acara atau Foto kondisi fisik peralatan.",
			});
			return;
		}

		setIsConfirmOpen(true);
	};

	// Submit ke Backend API
	const handleSubmit = async () => {
		setIsSubmitting(true);
		setNotification(null);

		try {
			const fallbackObjTypeId =
				formData.objectTypeId || (objectTypes.length > 0 ? String(objectTypes[0].id) : "1");
			const fallbackStorageId =
				formData.storageLocationId ||
				(storageLocations.length > 0 ? String(storageLocations[0].id) : "1");

			const fd = new FormData();
			fd.append("equipment_code", formData.equipmentCode.trim());
			fd.append("name", formData.name.trim());
			fd.append("id_plant", formData.plantId);
			fd.append("id_func_loc", formData.funcLocId);
			fd.append("id_object_type", fallbackObjTypeId);
			fd.append("id_storage_location", fallbackStorageId);
			fd.append("idle_reason", formData.idleReason.trim());
			fd.append(
				"notes",
				formData.notes.trim() ||
					`Usulan alat idle dari ${userPlantDisplay} - ${formData.idleReason.trim()}`,
			);
			fd.append("vendor", "Pusri Operasi");
			fd.append("year", String(new Date().getFullYear()));

			uploadedFiles.forEach((f) => {
				fd.append("photos", f);
			});

			const res = await createEquipment(fd);

			if (res && res.success) {
				setNotification({
					type: "success",
					message:
						"Usulan peralatan idle berhasil dikirimkan ke Rendal Pemeliharaan!",
				});
				handleReset();
				if (onRefresh) {
					await onRefresh();
				}
				setActiveTab("riwayat");
			} else {
				setNotification({
					type: "error",
					message:
						res.message || "Gagal mengirimkan usulan. Pastikan data telah sesuai.",
				});
			}
		} catch (err: any) {
			console.error("Submit usulan error:", err);
			setNotification({
				type: "error",
				message: err.message || "Terjadi kesalahan saat mengirim usulan.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Riwayat Usulan Filter & Search
	const [searchQuery, setSearchQuery] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [plantFilter, setPlantFilter] = useState<string>("Semua");
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	// Reset pagination when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, statusFilter, plantFilter, activeTab]);

	// Plant filter options
	const plantOptions = useMemo(() => {
		const dbPlants = (plants || [])
			.map((p: any) => (typeof p === "string" ? p : p?.name || p?.code || ""))
			.filter((v: string) => v && v !== "-");
		const itemPlants = initialEquipments
			.map((e) =>
				typeof e.plant === "object"
					? e.plant?.name || e.plant?.code || ""
					: String(e.plant || ""),
			)
			.filter((v) => v && v !== "-");
		return [...new Set([...dbPlants, ...itemPlants])].sort();
	}, [plants, initialEquipments]);

	// Status helper untuk Usulan Unit Kerja
	const getUsulanStatusInfo = (item: any) => {
		const raw = String(
			item.status?.name || item.statusAset || item.status || "",
		).toUpperCase();

		if (
			raw === "REGISTERED" ||
			raw === "PENDING" ||
			raw === "PENDING_RENDAL_REVIEW"
		) {
			return {
				label: "Menunggu Review Rendal",
				badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200",
				icon: Clock,
				type: "PENDING",
			};
		}
		if (
			raw === "VALIDATED" ||
			raw === "READY_TO_USE" ||
			raw === "READY_TO_REUSE" ||
			raw === "APPROVED"
		) {
			return {
				label: "Disetujui (Resmi Idle)",
				badgeStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
				icon: CheckCircle2,
				type: "APPROVED",
			};
		}
		if (raw === "REJECTED" || raw === "DITOLAK" || raw === "CANCELLED") {
			return {
				label: "Ditolak Rendal",
				badgeStyle: "bg-red-50 text-red-700 border border-red-200",
				icon: X,
				type: "REJECTED",
			};
		}
		return {
			label: raw.replace(/_/g, " "),
			badgeStyle: "bg-blue-50 text-[#0556B3] border border-blue-200",
			icon: Clock,
			type: "OTHER",
		};
	};

	// Filter data riwayat usulan
	const filteredRiwayat = useMemo(() => {
		return initialEquipments.filter((item: any) => {
			const info = getUsulanStatusInfo(item);
			if (statusFilter !== "ALL" && info.type !== statusFilter) {
				return false;
			}

			const plantStr = String(
				item.plant?.name || item.plant?.code || item.plant || "",
			);
			if (plantFilter !== "Semua" && plantStr !== plantFilter) {
				return false;
			}

			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			const namaAlat = String(
				item.name || item.namaAlat || item.description || "",
			).toLowerCase();
			const kodeAlat = String(
				item.equipment_code || item.kodeAlat || "",
			).toLowerCase();
			const plant = plantStr.toLowerCase();
			const funcLoc = String(
				item.func_loc?.name || item.funcLoc || "",
			).toLowerCase();

			return (
				namaAlat.includes(q) ||
				kodeAlat.includes(q) ||
				plant.includes(q) ||
				funcLoc.includes(q)
			);
		});
	}, [initialEquipments, searchQuery, statusFilter, plantFilter]);

	// Counts
	const stats = useMemo(() => {
		let pending = 0;
		let approved = 0;
		let rejected = 0;

		initialEquipments.forEach((item) => {
			const info = getUsulanStatusInfo(item);
			if (info.type === "PENDING") pending++;
			else if (info.type === "APPROVED") approved++;
			else if (info.type === "REJECTED") rejected++;
		});

		return {
			total: initialEquipments.length,
			pending,
			approved,
			rejected,
		};
	}, [initialEquipments]);

	// Pagination
	const totalPages = Math.ceil(filteredRiwayat.length / ITEMS_PER_PAGE) || 1;
	const paginatedRiwayat = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredRiwayat.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredRiwayat, currentPage]);

	const handleResetFilter = () => {
		setSearchQuery("");
		setSearchInput("");
		setPlantFilter("Semua");
		setStatusFilter("ALL");
		setCurrentPage(1);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Breadcrumb */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Unit Kerja Operasi</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Usulan Peralatan Idle</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Pengusulan Peralatan Idle
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Laporkan mesin/peralatan tidak terpakai dari area pabrik Anda agar diverifikasi menjadi aset idle.
						</p>
					</div>
					<div className="flex items-center gap-2">
						{onRefresh && (
							<button
								type="button"
								onClick={async () => {
									if (onRefresh) await onRefresh();
								}}
								className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
							>
								<RefreshCw className="w-3.5 h-3.5" />
								Muat Ulang
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Navigation Tabs (Style seragam tombol / tab terpadu) */}
			<div className="flex items-center gap-2 mb-4">
				<button
					type="button"
					onClick={() => setActiveTab("form")}
					className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all shadow-sm ${
						activeTab === "form"
							? "bg-[#0A356A] text-white"
							: "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-[#0A356A]"
					}`}
				>
					<PlusCircle className="w-4 h-4" />
					Form Usulan
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("riwayat")}
					className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all shadow-sm ${
						activeTab === "riwayat"
							? "bg-[#0A356A] text-white"
							: "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-[#0A356A]"
					}`}
				>
					<History className="w-4 h-4" />
					Riwayat Usulan
					{stats.total > 0 && (
						<span
							className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
								activeTab === "riwayat"
									? "bg-white text-[#0A356A]"
									: "bg-gray-100 text-gray-700"
							}`}
						>
							{stats.total}
						</span>
					)}
				</button>
			</div>

			{/* Notification Banner */}
			{notification && (
				<div
					className={`mb-4 flex items-center justify-between rounded-lg px-4 py-2.5 text-[13px] border animate-in fade-in slide-in-from-top-2 ${
						notification.type === "success"
							? "bg-green-50 border-green-200 text-green-800"
							: "bg-red-50 border-red-200 text-red-800"
					}`}
				>
					<div className="flex items-center gap-2">
						{notification.type === "success" ? (
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
						) : (
							<AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
						)}
						<span className="font-medium">{notification.message}</span>
					</div>
					<button
						type="button"
						onClick={() => setNotification(null)}
						className="text-gray-400 hover:text-gray-600 p-1"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* ========================================================= */}
			{/* TAB 1: FORMULIR PENGUSULAN ALAT IDLE                     */}
			{/* ========================================================= */}
			{activeTab === "form" && (
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					{/* Header Box Form */}
					<div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50">
						<div className="flex items-center gap-2.5">
							<Info className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
							<div>
								<h2 className="text-base sm:text-lg font-bold text-gray-900">
									Form Pengusulan Alat Berpotensi Idle
								</h2>
								<p className="text-[12px] text-gray-500 mt-0.5">
									Isi informasi teknis peralatan yang nganggur di unit kerja Anda. Verifikasi akhir akan dilakukan oleh Rendal Pemeliharaan.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm shrink-0">
							<span className="text-[11px] font-medium text-gray-500">Area Pabrik:</span>
							<span className="text-[12px] font-bold text-[#0A356A]">{userPlantDisplay}</span>
						</div>
					</div>

					<form onSubmit={handleInitiateSubmit} className="p-5 sm:p-6 space-y-5">
						{/* Section Header: Informasi Peralatan */}
						<div>
							<div className="border-b border-gray-100 pb-2.5 mb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider flex items-center gap-1.5">
									<Wrench className="w-4 h-4" /> Informasi Peralatan (SAP Trisula)
								</h3>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
								{/* Baris 1: Kode Aset */}
								<div className="space-y-1.5">
									<div className="flex justify-between items-end">
										<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
											KODE ASET / TAG <span className="text-red-500">*</span>
										</label>
										<span className="text-[9px] font-medium text-gray-400">
											Cari via Kode SAP
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
										options={codeOptions}
										placeholder="Ketik kode aset (misal F1N-FT201)..."
										hasError={
											(showValidationErrors || touched.equipmentCode) &&
											!formData.equipmentCode
										}
										emptyMessage="Tidak ada kode aset yang cocok di SAP."
									/>
									{(showValidationErrors || touched.equipmentCode) &&
										!formData.equipmentCode && (
											<p className="text-[10px] text-red-500 mt-1 font-medium">
												* Kode Aset wajib diisi.
											</p>
										)}
								</div>

								{/* Baris 1: Nama Peralatan */}
								<div className="space-y-1.5">
									<div className="flex justify-between items-end">
										<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
											NAMA PERALATAN <span className="text-red-500">*</span>
										</label>
										<span className="text-[9px] font-medium text-gray-400">
											Cari via Nama Alat
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
										options={nameOptions}
										placeholder="Ketik nama alat (misal FLOW TRANSMITTER)..."
										hasError={
											(showValidationErrors || touched.name) && !formData.name
										}
										emptyMessage="Tidak ada nama peralatan yang cocok di SAP."
									/>
									{(showValidationErrors || touched.name) && !formData.name && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Nama Peralatan wajib diisi.
										</p>
									)}
								</div>

								{/* Baris 2: Pabrik / Plant */}
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
										PABRIK / PLANT <span className="text-red-500">*</span>
									</label>
									<AutocompleteInput
										mode="select"
										name="plantId"
										showOnFocus
										value={formData.plantId}
										onChange={(val) =>
											setFormData((prev) => ({ ...prev, plantId: val }))
										}
										options={plants}
										placeholder="Pilih atau cari pabrik / plant..."
										emptyMessage="Pabrik tidak ditemukan."
									/>
									{(showValidationErrors || touched.plantId) &&
										!formData.plantId && (
											<p className="text-[10px] text-red-500 mt-1 font-medium">
												* Pabrik / Plant wajib dipilih.
											</p>
										)}
								</div>

								{/* Baris 2: Functional Location */}
								<div className="space-y-1.5">
									<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
										FUNCTIONAL LOCATION <span className="text-red-500">*</span>
									</label>
									<AutocompleteInput
										mode="select"
										name="funcLocId"
										showOnFocus
										value={formData.funcLocId}
										onChange={(val) =>
											setFormData((prev) => ({ ...prev, funcLocId: val }))
										}
										options={funcLocs}
										placeholder="Pilih atau cari area / funcloc..."
										emptyMessage="Area tidak ditemukan."
									/>
									{(showValidationErrors || touched.funcLocId) &&
										!formData.funcLocId && (
											<p className="text-[10px] text-red-500 mt-1 font-medium">
												* Functional Location wajib dipilih.
											</p>
										)}
								</div>
							</div>
						</div>

						{/* Section: Alasan Pengusulan Idle */}
						<div className="space-y-1.5 pt-1">
							<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
								ALASAN PENGUSULAN IDLE <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								value={formData.idleReason}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, idleReason: e.target.value }))
								}
								placeholder="Jelaskan mengapa peralatan ini tidak lagi digunakan di area pabrik Anda (misal: Unit pompa cadangan tidak terpakai pasca overhaul, penggantian sistem baru, dsb.)..."
								className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all placeholder:text-gray-400 ${
									(showValidationErrors || touched.idleReason) &&
									!formData.idleReason.trim()
										? "border-red-400 bg-red-50/20"
										: "border-gray-300"
								}`}
							/>
							{(showValidationErrors || touched.idleReason) &&
								!formData.idleReason.trim() && (
									<p className="text-[10px] text-red-500 mt-1 font-medium">
										* Alasan Pengusulan Idle wajib diisi.
									</p>
								)}
						</div>

						{/* Section: Upload Berkas Lampiran (WAJIB - AC-04) */}
						<div className="space-y-1.5 pt-1">
							<div className="flex items-center justify-between mb-1">
								<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
									UPLOAD FILE / ATTACHMENT <span className="text-red-500">*</span>
								</label>
								<span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
									Wajib Lampirkan Berita Acara / Foto
								</span>
							</div>

							<input
								type="file"
								multiple
								ref={fileInputRef}
								onChange={handleFileChange}
								accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.webp"
								className="hidden"
							/>

							{/* Dropzone Container Single Box (Tetap di dalam kotak per feedback user) */}
							<div
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragging(true);
								}}
								onDragLeave={(e) => {
									e.preventDefault();
									setIsDragging(false);
								}}
								onDrop={handleDrop}
								className={`border-2 border-dashed rounded-lg p-5 transition-all ${
									isDragging
										? "border-[#0A356A] bg-blue-50/70"
										: "border-gray-300 bg-gray-50/60 hover:border-[#0A356A]"
								}`}
							>
								{/* Dropzone Click Area */}
								<div
									onClick={() => fileInputRef.current?.click()}
									className="flex flex-col items-center justify-center text-center cursor-pointer py-2 hover:opacity-80 transition-opacity"
								>
									<UploadCloud
										className={`w-8 h-8 mb-1.5 ${
											isDragging ? "text-[#0A356A] animate-bounce" : "text-gray-400"
										}`}
									/>
									<span className="text-[13px] font-bold text-[#0A356A]">
										Klik atau tarik berkas Berita Acara / Foto kondisi di sini
									</span>
									<span className="text-[11px] text-gray-500 font-medium mt-0.5">
										Format: PDF, DOCX, XLSX, DWG, JPG, PNG (Maks 10MB per file)
									</span>
									<span className="text-[10px] text-gray-400 mt-1">
										Lampirkan minimal 1 dokumen pendukung resmi
									</span>
								</div>

								{/* List File Terlampir (Di dalam kotak, full-width rows) */}
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
														onClick={() => {
															if (isImage || isPdf) {
																setPreviewModal({
																	url: previewUrl,
																	title: file.name,
																	isPdf,
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
								<p className="text-[10px] text-red-500 font-medium mt-1">
									* {fileError}
								</p>
							)}
						</div>

						{/* Form Actions (Standar proper form buttons) */}
						<div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={handleReset}
								className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0A356A] hover:bg-[#062854] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Mengirimkan...</span>
									</>
								) : (
									<>
										<Send className="w-4 h-4" />
										<span>Kirim Usulan ke Rendal</span>
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* ========================================================= */}
			{/* TAB 2: RIWAYAT & PELACAKAN STATUS USULAN ALAT IDLE        */}
			{/* ========================================================= */}
			{activeTab === "riwayat" && (
				<div className="space-y-4">
					{/* Summary Stat Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div
							onClick={() => setStatusFilter("ALL")}
							className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
								statusFilter === "ALL"
									? "border-[#0A356A] ring-1 ring-[#0A356A]"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
								Total Usulan
							</p>
							<p className="text-xl font-bold text-gray-900 mt-0.5">
								{stats.total}
							</p>
						</div>

						<div
							onClick={() => setStatusFilter("PENDING")}
							className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
								statusFilter === "PENDING"
									? "border-amber-500 ring-1 ring-amber-500"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
								<Clock className="w-3.5 h-3.5" /> Menunggu Review
							</p>
							<p className="text-xl font-bold text-amber-700 mt-0.5">
								{stats.pending}
							</p>
						</div>

						<div
							onClick={() => setStatusFilter("APPROVED")}
							className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
								statusFilter === "APPROVED"
									? "border-emerald-500 ring-1 ring-emerald-500"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
								<CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
							</p>
							<p className="text-xl font-bold text-emerald-700 mt-0.5">
								{stats.approved}
							</p>
						</div>

						<div
							onClick={() => setStatusFilter("REJECTED")}
							className={`p-3.5 rounded-xl border bg-white cursor-pointer transition-all ${
								statusFilter === "REJECTED"
									? "border-red-500 ring-1 ring-red-500"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<p className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
								<X className="w-3.5 h-3.5" /> Ditolak Rendal
							</p>
							<p className="text-xl font-bold text-red-700 mt-0.5">
								{stats.rejected}
							</p>
						</div>
					</div>

					{/* Card Tabel Terpadu (Sesuai gaya rendal/idle & unit-kerja/daftar-aset) */}
					<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
						{/* Toolbar / Filters */}
						<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
							{/* Search */}
							<div className="flex w-full lg:w-auto gap-2">
								<div className="relative flex-1 lg:w-80">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
									<input
										type="text"
										placeholder="Cari nama, kode aset, plant, atau funcloc..."
										value={searchInput}
										onChange={(e) => {
											setSearchInput(e.target.value);
											setSearchQuery(e.target.value);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") setSearchQuery(searchInput);
										}}
										className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
									/>
								</div>
								<button
									onClick={() => setSearchQuery(searchInput)}
									className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
								>
									Cari
								</button>
							</div>

							{/* Filter Group */}
							<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
								<select
									value={plantFilter}
									onChange={(e) => setPlantFilter(e.target.value)}
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
								>
									<option value="Semua">Semua Plant</option>
									{plantOptions.map((p) => (
										<option key={p} value={p}>
											{p}
										</option>
									))}
								</select>

								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[140px] cursor-pointer"
								>
									<option value="ALL">Semua Status</option>
									<option value="PENDING">Menunggu Review</option>
									<option value="APPROVED">Disetujui</option>
									<option value="REJECTED">Ditolak</option>
								</select>

								<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

								<button
									onClick={handleResetFilter}
									className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
									title="Reset semua filter"
								>
									<RefreshCw className="w-3.5 h-3.5" />
									Reset
								</button>
							</div>
						</div>

						{/* Table */}
						<div className="w-full overflow-x-auto">
							<table className="w-full table-fixed text-left border-collapse">
								<colgroup>
									<col className="w-[4%]" />
									<col className="w-[24%]" />
									<col className="w-[14%]" />
									<col className="w-[10%]" />
									<col className="w-[15%]" />
									<col className="w-[14%]" />
									<col className="w-[13%]" />
									<col className="w-[6%]" />
								</colgroup>
								<thead className="bg-gray-50/95 backdrop-blur-sm">
									<tr className="border-b border-gray-300">
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
											No
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Nama Peralatan
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Kode Alat / Tag
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Plant
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Func. Location
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
											Status Usulan
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left">
											Catatan Rendal
										</th>
										<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
											Aksi
										</th>
									</tr>
								</thead>
								<tbody className="bg-white text-[12px]">
									{paginatedRiwayat.length === 0 ? (
										<tr>
											<td
												colSpan={8}
												className="px-5 py-12 text-center text-gray-500"
											>
												<div className="flex flex-col items-center">
													<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
													<p className="text-[13px] font-medium text-gray-900">
														Data Tidak Ditemukan
													</p>
													<p className="text-[11px] text-gray-500 mt-1">
														{searchQuery ||
														statusFilter !== "ALL" ||
														plantFilter !== "Semua"
															? "Tidak ada usulan peralatan yang sesuai dengan filter pencarian."
															: "Belum ada usulan peralatan idle yang diajukan."}
													</p>
												</div>
											</td>
										</tr>
									) : (
										paginatedRiwayat.map((item: any, idx: number) => {
											const statusInfo = getUsulanStatusInfo(item);
											const StatusIcon = statusInfo.icon;
											const namaAlat =
												item.name || item.namaAlat || item.description || "-";
											const kodeAlat =
												item.equipment_code || item.kodeAlat || "-";
											const plantName = formatPlantDisplay(
												item.plant?.name || item.plant?.code || item.plant,
											);
											const funcloc =
												item.func_loc?.name || item.funcLoc || "-";
											const catatan =
												item.notes ||
												item.idle_reason ||
												item.alasanPengusulan ||
												"-";

											return (
												<tr
													key={item.id || idx}
													className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
												>
													<td className="px-2 py-2 text-gray-500 font-medium text-center truncate">
														{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
													</td>
													<td
														className="px-2 py-2 font-semibold text-gray-800 text-left"
														title={namaAlat}
													>
														<span className="leading-tight line-clamp-2 block text-left">
															{namaAlat}
														</span>
													</td>
													<td
														className="px-2 py-2 font-semibold text-[#0A356A] text-left truncate"
														title={kodeAlat}
													>
														{kodeAlat}
													</td>
													<td
														className="px-2 py-2 text-gray-600 font-medium text-left truncate"
														title={plantName}
													>
														{plantName}
													</td>
													<td
														className="px-2 py-2 text-gray-600 font-medium text-left truncate"
														title={funcloc}
													>
														{funcloc}
													</td>
													<td className="px-2 py-2 text-center truncate">
														<span
															className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeStyle}`}
														>
															<StatusIcon className="w-3 h-3" />
															{statusInfo.label}
														</span>
													</td>
													<td
														className="px-2 py-2 text-gray-600 font-medium text-left truncate"
														title={catatan}
													>
														{catatan}
													</td>
													<td className="px-2 py-2 text-center">
														<div className="flex justify-center items-center opacity-90 group-hover:opacity-100 transition-opacity">
															<button
																onClick={() => setDetailAsset(item)}
																className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-[#0A356A] hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
																title="Lihat Detail"
															>
																<Eye className="w-3 h-3" />
																<span>Detail</span>
															</button>
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Footer (Sesuai standar rendal/idle) */}
						{filteredRiwayat.length > 0 && (
							<div className="px-5 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
								<span className="text-[11px] font-medium text-gray-500">
									Menampilkan{" "}
									{filteredRiwayat.length === 0
										? 0
										: (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
									-{" "}
									{Math.min(
										currentPage * ITEMS_PER_PAGE,
										filteredRiwayat.length,
									)}{" "}
									dari {filteredRiwayat.length} data ({ITEMS_PER_PAGE}{" "}
									baris/halaman)
								</span>
								<div className="flex items-center gap-1.5">
									<button
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
										className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
									>
										Sebelumnya
									</button>
									<div className="flex items-center gap-1">
										{Array.from({ length: totalPages }, (_, i) => i + 1).map(
											(page) => (
												<button
													key={page}
													onClick={() => setCurrentPage(page)}
													className={`min-w-[24px] h-6 px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
														currentPage === page
															? "bg-[#0A356A] text-white"
															: "text-gray-600 hover:bg-gray-100"
													}`}
												>
													{page}
												</button>
											),
										)}
									</div>
									<button
										onClick={() =>
											setCurrentPage((p) => Math.min(totalPages, p + 1))
										}
										disabled={currentPage === totalPages}
										className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
									>
										Selanjutnya
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ========================================================= */}
			{/* MODAL DETAIL USULAN ALAT (Style seragam modal rendal/idle) */}
			{/* ========================================================= */}
			{detailAsset && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
					onClick={() => setDetailAsset(null)}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
					>
						{/* Modal Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Eye className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Detail Usulan Alat Idle
									</h2>
									<p className="text-xs text-blue-100 font-medium mt-0.5">
										{detailAsset.equipment_code || detailAsset.kodeAlat || "-"}
									</p>
								</div>
							</div>
							<button
								onClick={() => setDetailAsset(null)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
							{/* Status Usulan Saat Ini */}
							<div className="flex items-center justify-between pb-3 border-b border-gray-100">
								<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
									Status Usulan:
								</span>
								{(() => {
									const info = getUsulanStatusInfo(detailAsset);
									const Icon = info.icon;
									return (
										<span
											className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${info.badgeStyle}`}
										>
											<Icon className="w-3 h-3" />
											{info.label}
										</span>
									);
								})()}
							</div>

							{/* Section 1: Informasi & Spesifikasi Aset */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Informasi & Spesifikasi Aset
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Nama Peralatan
										</p>
										<p className="text-sm font-bold text-gray-900">
											{detailAsset.name ||
												detailAsset.namaAlat ||
												detailAsset.description ||
												"-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Kode Aset / Tag
										</p>
										<p className="text-sm font-mono font-bold text-[#0A356A]">
											{detailAsset.equipment_code ||
												detailAsset.kodeAlat ||
												"-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Plant
										</p>
										<p className="text-sm font-medium text-gray-800">
											{formatPlantDisplay(
												detailAsset.plant?.name ||
													detailAsset.plant?.code ||
													detailAsset.plant,
											)}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Functional Location
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailAsset.func_loc?.name ||
												detailAsset.funcLoc ||
												"-"}
										</p>
									</div>
								</div>
							</div>

							{/* Section 2: Alasan & Catatan Rendal */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Alasan & Catatan Verifikasi
								</h3>
								<div className="space-y-3">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
											Alasan Pengusulan Idle:
										</p>
										<div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-xs leading-relaxed">
											{detailAsset.idle_reason ||
												detailAsset.notes ||
												"Tidak ada rincian alasan."}
										</div>
									</div>

									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
											Catatan dari Rendal Pemeliharaan:
										</p>
										<div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
											{detailAsset.notes &&
											detailAsset.notes !== detailAsset.idle_reason
												? detailAsset.notes
												: "Belum ada catatan evaluasi dari Rendal Pemeliharaan."}
										</div>
									</div>
								</div>
							</div>

							{/* Section 3: Berkas Lampiran Pendukung */}
							{Array.isArray(detailAsset.attachments) &&
								detailAsset.attachments.length > 0 && (
									<div>
										<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-2.5">
											Berkas Lampiran Pendukung ({detailAsset.attachments.length})
										</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{detailAsset.attachments.map((att: any, i: number) => {
												const url = att.file_url || att.url || "";
												const isImg =
													att.file_type?.startsWith("image/") ||
													/\.(jpg|jpeg|png|webp)$/i.test(url);
												const isPdf =
													att.file_type === "application/pdf" ||
													/\.pdf$/i.test(url);

												return (
													<div
														key={i}
														onClick={() => {
															if (isPdf) {
																setPreviewModal({
																	url,
																	title: att.file_name || "Dokumen PDF",
																	isPdf: true,
																});
															} else if (isImg) {
																setPreviewModal({
																	url,
																	title: att.file_name || "Foto Alat",
																	isPdf: false,
																});
															} else {
																window.open(url, "_blank");
															}
														}}
														className="p-2.5 border border-gray-200 rounded-lg hover:border-[#0A356A] cursor-pointer bg-white flex items-center justify-between transition-all hover:shadow-sm"
													>
														<div className="flex items-center gap-2 min-w-0 flex-1">
															<Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
															<span className="truncate font-medium text-gray-700 text-[11px]">
																{att.file_name || `Lampiran ${i + 1}`}
															</span>
														</div>
														<span className="text-[11px] font-semibold text-[#0A356A] bg-blue-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
															Lihat
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}
						</div>

						{/* Modal Footer */}
						<div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
							<button
								type="button"
								onClick={() => setDetailAsset(null)}
								className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ========================================================= */}
			{/* MODAL LIGHTBOX PREVIEW (IMAGE & PDF EMBEDDED)             */}
			{/* ========================================================= */}
			{previewModal && (
				<div
					className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm"
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

			{/* Confirm Submit Dialog */}
			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSubmit();
				}}
				title="Kirim Usulan Alat Idle ke Rendal?"
				description={`Peralatan ${formData.equipmentCode} (${formData.name}) akan didaftarkan sebagai usulan alat berpotensi idle dan masuk antrean verifikasi Rendal Pemeliharaan.`}
				confirmLabel="Ya, Kirim Usulan"
				pendingLabel="Mengirimkan..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
