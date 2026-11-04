"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	type EquipmentStatus,
	EQUIPMENT_STATUS,
	statusText,
	statusName,
} from "@/lib/equipment-status";
import {
	Search,
	AlertCircle,
	RefreshCw,
	Plus,
	ChevronRight,
	ChevronLeft,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Eye,
	X,
	UploadCloud,
	Paperclip,
	CheckCircle2,
	Loader2,
	Info,
	Download,
	Save,
	XCircle,
} from "lucide-react";
import {
	proposeEquipment,
	searchSapEquipment,
	type SapEquipmentRow,
} from "@/action/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import YearPicker from "@/components/YearPicker";
import AutocompleteInput, {
	type AutocompleteOption,
} from "@/components/AutocompleteInput";

export type AssetState =
	| EquipmentStatus
	| "REJECTED"
	| "PROPOSED"
	| "PROPOSAL_REJECTED";

export interface Equipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: AssetState;
	storageLocation?: string;
	funcLoc?: string;
	vendor?: string;
	year?: string | number;
	originalValue?: number;
	bookValue?: number;
	estimatedReuseValue?: number;
	notes?: string;
	idleReason?: string;
	rejectionNotes?: string;
	inspectionPurpose?: string;
	photos?: string[];
	attachments?: any[];
	createdAt?: string;
}

export interface MasterOption {
	id: string | number;
	name: string;
	code?: string;
	description?: string;
}

export interface RegisterFormData {
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

const EMPTY_FORM: RegisterFormData = {
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

interface UsulanIdleClientProps {
	equipments: Equipment[];
	plants?: MasterOption[];
	storageLocations?: MasterOption[];
	funcLocs?: MasterOption[];
	objectTypes?: MasterOption[];
	initialEquipmentCodes?: SapEquipmentRow[];
	onRefresh?: () => Promise<void> | void;
}

/** path file_url dari backend bisa "uploads/.." tanpa leading slash. */
const toPhotoUrl = (photo: string) =>
	photo.startsWith("http") || photo.startsWith("/") ? photo : `/${photo}`;

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

/** Input rupiah dengan prefix Rp + pemisah ribuan id-ID (opsional, persis rendal) */
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

export default function UsulanIdleClient({
	equipments,
	plants = [],
	storageLocations = [],
	funcLocs = [],
	objectTypes = [],
	initialEquipmentCodes = [],
	onRefresh,
}: UsulanIdleClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const actionParam = searchParams.get("action");

	// Tampilan halaman: "table" (tabel aset seperti rendal/idle) atau "form" (full page form seperti rendal/register-equipment)
	const [viewMode, setViewMode] = useState<"table" | "form">(
		actionParam === "tambah" ? "form" : "table",
	);

	useEffect(() => {
		if (actionParam === "tambah") {
			setViewMode("form");
		} else {
			setViewMode("table");
		}
	}, [actionParam]);

	const handleOpenForm = () => {
		setViewMode("form");
		router.push("/unit-kerja/usulan-idle?action=tambah");
	};

	const handleCloseForm = () => {
		setViewMode("table");
		router.push("/unit-kerja/usulan-idle");
	};

	// ==========================================
	// STATES: TABEL & FILTER (Persis Rendal Idle)
	// ==========================================
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [plantFilter, setPlantFilter] = useState("Semua");
	const [statusFilter, setStatusFilter] = useState("Semua");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Equipment;
		direction: "asc" | "desc";
	} | null>(null);

	// Modal Detail Aset
	const [detailModal, setDetailModal] = useState<Equipment | null>(null);
	const [activePhotoIdx, setActivePhotoIdx] = useState(0);
	const detailPhotos = detailModal?.photos ?? [];
	const safePhotoIdx = Math.min(
		activePhotoIdx,
		Math.max(detailPhotos.length - 1, 0),
	);

	// ==========================================
	// STATES: FORM REGISTRASI (Persis Rendal Register Equipment)
	// ==========================================
	const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [previewModal, setPreviewModal] = useState<{
		url: string;
		title?: string;
		isPdf?: boolean;
	} | null>(null);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// Autocomplete DUA ARAH dari SAP live (Persis Rendal)
	const [codeOptions, setCodeOptions] = useState<AutocompleteOption[]>(() =>
		toCodeOptions(initialEquipmentCodes),
	);
	const [nameOptions, setNameOptions] = useState<AutocompleteOption[]>(() =>
		toNameOptions(initialEquipmentCodes),
	);
	const [sapQuery, setSapQuery] = useState("");
	const autoFilledRef = useRef<{
		code: string;
		name: string;
		objectTypeId: string;
		plantId: string;
		funcLocId: string;
	} | null>(null);

	const ITEMS_PER_PAGE = 10;

	useEffect(() => {
		setCurrentPage(1);
	}, [search, plantFilter, statusFilter]);

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
		setSapQuery(value);
	};

	const applySapRow = (raw: SapEquipmentRow) => {
		const objectTypeId = String(
			objectTypes.find((o) => o.name === raw.object_type || o.code === raw.object_type)?.id ?? "",
		);
		const plantId = String(
			plants.find((p) => p.name === raw.maintenance_plant || p.code === raw.maintenance_plant)?.id ?? "",
		);
		const funcLocId = String(
			funcLocs.find((f) => f.name === raw.functional_location || f.description === raw.functional_location)?.id ?? "",
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

	// File Upload Handlers (Persis Rendal)
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

	const handleResetForm = () => {
		setFormData(EMPTY_FORM);
		setUploadedFiles([]);
		setFileError(null);
		setShowValidationErrors(false);
		setTouched({});
		autoFilledRef.current = null;
	};

	// Submit ke Backend API
	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();

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
			setNotification({
				type: "error",
				message: "Harap lengkapi semua field wajib bertanda bintang (*).",
			});
			return;
		}

		setIsSubmitting(true);
		setShowValidationErrors(false);

		try {
			const fd = new FormData();
			fd.append("equipment_code", formData.equipmentCode);
			fd.append("name", formData.name);
			fd.append("id_object_type", formData.objectTypeId);
			fd.append("id_plant", formData.plantId);
			fd.append("id_storage_location", formData.storageLocationId);
			fd.append("id_func_loc", formData.funcLocId);
			fd.append("vendor", formData.vendor);
			fd.append(
				"year",
				String(Number(formData.year) || new Date().getFullYear()),
			);
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
			for (const file of uploadedFiles) {
				fd.append("photo", file);
				fd.append("photos", file);
			}

			const res = await proposeEquipment(fd);

			if (res && res.success) {
				setNotification({
					type: "success",
					message: "Berhasil! Usulan peralatan idle telah dikirimkan ke sistem.",
				});
				handleResetForm();
				handleCloseForm();
				if (onRefresh) {
					await onRefresh();
				}
			} else {
				setNotification({
					type: "error",
					message:
						res?.message || "Gagal menyimpan data: Pastikan field sudah sesuai.",
				});
			}
		} catch (err: any) {
			console.error("Submit usulan error:", err);
			setNotification({
				type: "error",
				message: err.message || "Terjadi kesalahan saat menyimpan data peralatan.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Opsi filter Plant dari master plants + equipment yang ada
	const plantOptions = useMemo(() => {
		const dbPlants = (plants || [])
			.map((p: any) => (typeof p === "string" ? p : p?.name || p?.code || ""))
			.filter((v: string) => v && v !== "-");
		const itemPlants = equipments
			.map((e) => e.plant)
			.filter((v) => v && v !== "-");
		return [...new Set([...dbPlants, ...itemPlants])].sort();
	}, [plants, equipments]);

	const handleResetFilters = () => {
		setSearch("");
		setSearchInput("");
		setPlantFilter("Semua");
		setStatusFilter("Semua");
		setCurrentPage(1);
		setSortConfig(null);
	};

	// Filter & Sort Logic (Persis rendal/idle)
	const filteredData = useMemo(() => {
		const result = equipments.filter((item) => {
			const query = search.toLowerCase().trim();
			const matchSearch =
				!query ||
				item.kodeAlat?.toLowerCase().includes(query) ||
				item.namaAlat?.toLowerCase().includes(query) ||
				item.plant?.toLowerCase().includes(query) ||
				item.funcLoc?.toLowerCase().includes(query);
			const matchPlant = plantFilter === "Semua" || item.plant === plantFilter;
			const matchStatus =
				statusFilter === "Semua" ||
				item.statusAset === statusFilter ||
				statusName(item.statusAset) === statusName(statusFilter);
			return matchSearch && matchPlant && matchStatus;
		});

		if (sortConfig) {
			result.sort((a, b) => {
				if (sortConfig.key === "tanggalRegistrasi") {
					const timeA = a.createdAt
						? new Date(a.createdAt).getTime()
						: a.tanggalRegistrasi && a.tanggalRegistrasi !== "-"
							? new Date(a.tanggalRegistrasi).getTime()
							: 0;
					const timeB = b.createdAt
						? new Date(b.createdAt).getTime()
						: b.tanggalRegistrasi && b.tanggalRegistrasi !== "-"
							? new Date(b.tanggalRegistrasi).getTime()
							: 0;
					if (timeA !== timeB)
						return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
				}
				if (sortConfig.key === "originalValue") {
					const valA = Number(a.originalValue) || 0;
					const valB = Number(b.originalValue) || 0;
					return sortConfig.direction === "asc" ? valA - valB : valB - valA;
				}
				const valA = String(a[sortConfig.key] || "").toLowerCase();
				const valB = String(b[sortConfig.key] || "").toLowerCase();
				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		} else {
			result.sort((a, b) => {
				const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				if (timeB !== timeA) return timeB - timeA;
				const idA = Number(a.id) || 0;
				const idB = Number(b.id) || 0;
				return idB - idA;
			});
		}
		return result;
	}, [equipments, search, plantFilter, statusFilter, sortConfig]);

	const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
	const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

	const paginatedData = useMemo(() => {
		const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
		return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredData, safeCurrentPage]);

	const handleSort = (key: keyof Equipment) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: keyof Equipment) => {
		if (!sortConfig || sortConfig.key !== key)
			return (
				<ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />
			);
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		) : (
			<ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		);
	};

	const getStatusBadge = (status: AssetState | string) => {
		const styles: Record<string, string> = {
			PROPOSED: "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]",
			"MENUNGGU VERIFIKASI": "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]",
			PROPOSAL_REJECTED: "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]",
			"PROPOSAL REJECTED": "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]",
			REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
			VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
			REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
			SCRAP: "bg-[#FEE2E2] text-[#DC2626]",
			DISPOSAL_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
			"DISPOSAL RECOMMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"DISPOSAL RECOMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"SCRAP RECOMENDED": "bg-[#FEF3C7] text-[#B45309]",
			"SCRAP RECOMMENDED": "bg-[#FEF3C7] text-[#B45309]",
			SCRAP_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
			SCRAP_RECOMENDED: "bg-[#FEF3C7] text-[#B45309]",
			REPAIR: "bg-[#FEF3C7] text-[#B45309]",
			"REPAIR COMPLETED": "bg-[#CCFBF1] text-[#0F766E]",
			REPAIR_COMPLETED: "bg-[#CCFBF1] text-[#0F766E]",
			REVALIDATION: "bg-[#FEF3C7] text-[#B45309]",
			REUSED: "bg-[#E0E7FF] text-[#4F46E5]",
			"READY TO USE": "bg-[#E0E7FF] text-[#4F46E5]",
			READY_TO_USE: "bg-[#E0E7FF] text-[#4F46E5]",
		};

		let displayStatus = (status || "").replace(/_/g, " ");
		if (
			status === "DISPOSAL_RECOMMENDED" ||
			displayStatus === "DISPOSAL RECOMMENDED" ||
			displayStatus === "DISPOSAL RECOMENDED" ||
			displayStatus === "SCRAP RECOMMENDED"
		) {
			displayStatus = "SCRAP RECOMENDED";
		}

		const style = styles[displayStatus] || styles[status] || styles.SCRAP;
		return (
			<span
				className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style}`}
			>
				{displayStatus}
			</span>
		);
	};

	// =========================================================================
	// TAMPILAN 1: FORMULIR REGISTRASI ASET FULL PAGE (Persis Rendal Register)
	// (TIDAK ADA POP UP, halaman penuh dengan 2 panel persis Rendal)
	// =========================================================================
	if (viewMode === "form") {
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

				{/* Header Title & Tombol Kembali */}
				<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
					<div>
						<button
							type="button"
							onClick={handleCloseForm}
							className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A356A] transition-colors mb-2.5"
						>
							<ChevronLeft className="w-4 h-4" />
							Kembali
						</button>
						<h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">
							Registrasi Peralatan Idle
						</h1>
						<p className="text-gray-500 text-sm mt-0.5">
							Daftarkan aset atau peralatan yang saat ini tidak digunakan.
						</p>
					</div>
				</div>

				{/* Grid Formulir Dua Panel (Persis Rendal Register Equipment) */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
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
					className="grid grid-cols-1 lg:grid-cols-12 gap-5"
				>
					{/* PANEL KIRI: Data Utama & Spesifikasi (Lebar 8 Kolom) */}
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
								{/* Baris 1: Nama Peralatan */}
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

								{/* Baris 1: Kode Aset / Tag */}
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

								{/* Baris 2: Pabrik / Plant */}
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

								{/* Baris 2: Area (Funcloc) */}
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

								{/* Baris 3: Kategori (Tipe) */}
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

								{/* Baris 3: Lokasi Penyimpanan */}
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

								{/* Garis Pemisah Visual */}
								<div className="col-span-full border-t border-gray-100 my-1"></div>

								{/* Baris 4: Vendor / Merk */}
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
										placeholder="Masukkan vendor / merk..."
										className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${(showValidationErrors || touched.vendor) && !formData.vendor ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}
									/>
									{(showValidationErrors || touched.vendor) && !formData.vendor && (
										<p className="text-[10px] text-red-500 mt-1 font-medium">
											* Vendor / merk wajib diisi.
										</p>
									)}
								</div>

								{/* Baris 4: Tahun Perolehan */}
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

								{/* Baris 5: Nilai Aset */}
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

						{/* Banner Bawah */}
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

					{/* PANEL KANAN: Kondisi, File, & Submit (Lebar 4 Kolom) */}
					<div className="lg:col-span-4 flex flex-col gap-5">
						<div className="bg-white rounded shadow-sm border border-gray-200 flex flex-col h-full">
							{/* Judul Panel */}
							<div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50 rounded-t">
								<AlertCircle className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
								<h2 className="text-lg font-bold text-gray-900">Kondisi & Berkas</h2>
							</div>

							<div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
								{/* Alasan Idle */}
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

								{/* Catatan Tambahan */}
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

										{/* Daftar Berkas Terlampir */}
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

						{/* Action Buttons */}
						<div className="flex items-center justify-end gap-3 mt-1">
							<button
								type="button"
								onClick={handleCloseForm}
								className="px-5 py-2.5 rounded border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
							>
								Batal
							</button>
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

				{/* Fullscreen Spinner Saat Submit */}
				{isSubmitting && (
					<div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
						<div className="bg-white p-8 rounded shadow-xl flex flex-col items-center border border-gray-100">
							<Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
							<h2 className="text-lg font-bold text-gray-900">Menyimpan Data...</h2>
							<p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
						</div>
					</div>
				)}

				{/* Confirm Submit Dialog (Persis Rendal) */}
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

				{/* Lightbox Preview Modal (Persis Rendal) */}
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
			</div>
		);
	}

	// =========================================================================
	// TAMPILAN 2: TABEL DATA ASET IDLE (Persis Rendal Idle)
	// =========================================================================
	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Header (Persis rendal/idle) */}
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
							Daftar seluruh aset idle yang telah diregistrasi beserta status proses
							validasinya.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={async () => {
								if (onRefresh) {
									await onRefresh();
								} else {
									router.refresh();
								}
							}}
							className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Muat Ulang
						</button>
						<button
							type="button"
							onClick={handleOpenForm}
							className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A356A] hover:bg-[#062854] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
						>
							<Plus className="w-4 h-4" />
							Daftarkan Peralatan
						</button>
					</div>
				</div>
			</div>

			{/* Alert Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[120] bg-gray-900 text-white px-5 py-3 rounded shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					) : (
						<XCircle className="w-4 h-4 text-red-400 shrink-0" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
					<button
						type="button"
						onClick={() => setNotification(null)}
						className="text-gray-400 hover:text-white ml-2 p-1"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			{/* Notification Banner (Persis rendal/idle) */}
			{filteredData.length > 0 && (
				<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span className="flex h-2.5 w-2.5 relative">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
						</span>
						<span className="text-[13px] text-blue-800 font-medium">
							Terdapat{" "}
							<strong className="font-bold">{filteredData.length} usulan aset</strong>{" "}
							di sistem.
						</span>
					</div>
				</div>
			)}

			{/* Card Tabel Terpadu (Persis rendal/idle) */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
				{/* Toolbar / Filters */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Search */}
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Cari nama, kode aset, atau plant..."
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setSearch(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") setSearch(searchInput);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={() => setSearch(searchInput)}
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
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[130px] cursor-pointer"
						>
							<option value="Semua">Semua Status</option>
							{EQUIPMENT_STATUS.map((s) => (
								<option key={s} value={s}>
									{s === "DISPOSAL_RECOMMENDED"
										? "SCRAP RECOMENDED"
										: statusText(s)}
								</option>
							))}
							<option value="REJECTED">REJECTED</option>
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						<button
							onClick={handleResetFilters}
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
							<col className="w-[22%]" />
							<col className="w-[12%]" />
							<col className="w-[8%]" />
							<col className="w-[15%]" />
							<col className="w-[11%]" />
							<col className="w-[11%]" />
							<col className="w-[11%]" />
							<col className="w-[6%]" />
						</colgroup>
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
									No
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("namaAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Nama Peralatan {getSortIcon("namaAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("kodeAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Kode Alat {getSortIcon("kodeAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Plant {getSortIcon("plant")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-left"
									title="Functional location aset"
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Func. Location
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("jenisAlat")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Tipe Objek {getSortIcon("jenisAlat")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-left"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("tanggalRegistrasi")}
								>
									<div className="flex items-center justify-start gap-0.5 truncate">
										Tgl Registrasi {getSortIcon("tanggalRegistrasi")}
									</div>
								</th>
								<th
									className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors text-center"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("statusAset")}
								>
									<div className="flex items-center justify-center gap-0.5 truncate">
										Status {getSortIcon("statusAset")}
									</div>
								</th>
								<th className="px-2 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-center">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="bg-white text-[12px]">
							{paginatedData.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Data Tidak Ditemukan
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Tidak ada peralatan yang sesuai dengan filter pencarian.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedData.map((item, index) => (
									<tr
										key={item.id || index}
										className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
									>
										<td className="px-2 py-2 text-gray-500 font-medium text-center truncate">
											{(safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}
										</td>
										<td
											className="px-2 py-2 font-semibold text-gray-800 text-left"
											title={item.namaAlat}
										>
											<span className="leading-tight line-clamp-2 block text-left">
												{item.namaAlat}
											</span>
										</td>
										<td
											className="px-2 py-2 font-semibold text-[#0A356A] text-left truncate"
											title={item.kodeAlat}
										>
											{item.kodeAlat}
										</td>
										<td
											className="px-2 py-2 text-gray-600 font-medium text-left truncate"
											title={item.plant}
										>
											{item.plant}
										</td>
										<td
											className="px-2 py-2 text-gray-600 font-medium text-left truncate"
											title={item.funcLoc || "-"}
										>
											{item.funcLoc || "-"}
										</td>
										<td
											className="px-2 py-2 text-gray-600 font-medium text-left truncate"
											title={item.jenisAlat}
										>
											{item.jenisAlat}
										</td>
										<td className="px-2 py-2 text-gray-600 font-medium text-left truncate">
											{item.tanggalRegistrasi}
										</td>
										<td className="px-2 py-2 text-center truncate">
											{getStatusBadge(item.statusAset)}
										</td>
										<td className="px-2 py-2 text-center">
											<div className="flex justify-center items-center opacity-90 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => {
														setDetailModal(item);
														setActivePhotoIdx(0);
													}}
													className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-[#0A356A] hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-bold transition-all shadow-sm"
													title="Lihat Detail"
												>
													<Eye className="w-3 h-3" />
													<span>Detail</span>
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer (Persis rendal/idle) */}
				{filteredData.length > 0 && (
					<div className="px-5 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
						<span className="text-[11px] font-medium text-gray-500">
							Menampilkan{" "}
							{filteredData.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
							- {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
							{filteredData.length} data ({ITEMS_PER_PAGE} baris/halaman)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={safeCurrentPage === 1}
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
												safeCurrentPage === page
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
								disabled={safeCurrentPage === totalPages}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Selanjutnya
							</button>
						</div>
					</div>
				)}
			</div>

			{/* ========================================================= */}
			{/* MODAL DETAIL INFORMASI ASET (Persis rendal/idle)          */}
			{/* ========================================================= */}
			{detailModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Eye className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white leading-tight">
										Detail Aset Idle
									</h2>
									<p className="text-xs text-blue-100 font-medium mt-0.5">
										{detailModal.kodeAlat}
									</p>
								</div>
							</div>
							<button
								onClick={() => setDetailModal(null)}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
							{/* Section 1: Informasi Dasar */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Informasi & Spesifikasi Aset
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Nama Alat
										</p>
										<p className="text-sm font-bold text-gray-900">
											{detailModal.namaAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Kode Alat
										</p>
										<p className="text-sm font-bold text-gray-900">
											{detailModal.kodeAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Plant
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.plant}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Jenis Alat
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.jenisAlat}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Vendor / Merk
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.vendor || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Tahun Perolehan
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.year || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Section 2: Lokasi & Nilai Aset */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Lokasi & Nilai Aset
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Lokasi Penyimpanan
										</p>
										<p className="text-sm font-semibold text-gray-800">
											{detailModal.storageLocation || "-"}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Area (FuncLoc)
										</p>
										<p className="text-sm font-semibold text-gray-800">
											{detailModal.funcLoc || "-"}
										</p>
									</div>
									<div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3.5">
										{[
											["Nilai Perolehan", detailModal.originalValue],
											["Nilai Buku", detailModal.bookValue],
											["Estimasi Pakai Ulang", detailModal.estimatedReuseValue],
										].map(([label, value]) => (
											<div key={label as string}>
												<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
													{label}
												</p>
												<p className="text-sm font-bold text-emerald-700">
													{value ? `Rp ${Number(value).toLocaleString("id-ID")}` : "Rp 0"}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Section 3: Kondisi & Status */}
							<div className="border-b border-gray-100 pb-4">
								<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
									Kondisi & Status
								</h3>
								<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Status Aset
										</p>
										<div className="mt-0.5">{getStatusBadge(detailModal.statusAset)}</div>
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Tanggal Registrasi
										</p>
										<p className="text-sm font-medium text-gray-800">
											{detailModal.tanggalRegistrasi}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Alasan Idle
										</p>
										<p className="text-sm font-medium text-gray-800 leading-relaxed">
											{detailModal.idleReason || "Tidak ada alasan idle."}
										</p>
									</div>
									<div className="col-span-2">
										<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
											Catatan Tambahan
										</p>
										<p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed whitespace-pre-line">
											{detailModal.notes || "Tidak ada catatan tambahan."}
										</p>
									</div>
									{detailModal.rejectionNotes && (
										<div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
											<span className="text-[11px] font-bold text-red-700 block uppercase tracking-wider mb-0.5">
												Alasan Penolakan oleh Rendal
											</span>
											<p className="text-xs text-red-800 leading-relaxed">
												{detailModal.rejectionNotes}
											</p>
										</div>
									)}
									{detailModal.inspectionPurpose && (
										<div className="col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
											<span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider mb-0.5">
												Tujuan Tim Inspeksi Ditugaskan
											</span>
											<p className="text-xs text-emerald-800 leading-relaxed">
												{detailModal.inspectionPurpose}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Section 4: Foto Peralatan */}
							{detailPhotos.length > 0 && (
								<div className="border-b border-gray-100 pb-4">
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3">
										Foto Peralatan
									</h3>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<a
										href={toPhotoUrl(detailPhotos[safePhotoIdx])}
										target="_blank"
										rel="noopener noreferrer"
										className="group relative block border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-[#0A356A] transition-all shadow-sm"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={toPhotoUrl(detailPhotos[safePhotoIdx])}
											alt={`Foto ${safePhotoIdx + 1}`}
											className="w-full h-56 object-contain bg-white"
										/>
										<span className="absolute bottom-2 right-2 text-[10px] font-bold text-gray-500 bg-white/85 px-2 py-0.5 rounded pointer-events-none">
											Foto {safePhotoIdx + 1}/{detailPhotos.length}
										</span>
									</a>

									{detailPhotos.length > 1 && (
										<div className="grid grid-cols-4 gap-2 mt-2.5">
											{detailPhotos.map((photo, index) => {
												const isActive = index === safePhotoIdx;
												return (
													<button
														key={index}
														type="button"
														onClick={() => setActivePhotoIdx(index)}
														title={`Lihat Foto ${index + 1}`}
														className={`relative border rounded-lg overflow-hidden aspect-video bg-gray-100 transition-all ${isActive ? "border-[#0556B3] ring-2 ring-[#0556B3]/30" : "border-gray-200 hover:border-[#0A356A]"}`}
													>
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={toPhotoUrl(photo)}
															alt={`Thumbnail Foto ${index + 1}`}
															className="w-full h-full object-cover"
														/>
													</button>
												);
											})}
										</div>
									)}
								</div>
							)}

							{/* Section 5: Dokumen Lampiran Pendukung */}
							{Array.isArray(detailModal.attachments) &&
								detailModal.attachments.length > 0 && (
									<div>
										<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-2.5">
											Berkas Lampiran Pendukung ({detailModal.attachments.length})
										</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{detailModal.attachments.map((att: any, i: number) => {
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

						<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end bg-gray-50">
							<button
								onClick={() => setDetailModal(null)}
								className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
