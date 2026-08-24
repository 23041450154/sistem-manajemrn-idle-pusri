"use client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
	Search,
	Eye,
	Edit,
	AlertCircle,
	X,
	Check,
	Save,
	Clock,
	UploadCloud,
	Paperclip,
	RefreshCw,
	XCircle,
	CheckCircle2,
	ChevronRight,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Download,
	Info,
} from "lucide-react";

import AnalogTimePicker from "@/components/AnalogTimePicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import {
	getConditions,
	getEquipments,
	validateEquipment,
	getObjectTypes,
	getApprovals,
	getAttachmentsByEquipmentId,
	uploadEquipmentAttachment,
} from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";
import {
	type EquipmentStatus,
	statusBadgeStyle,
	statusName,
	statusText,
} from "@/lib/equipment-status";

// Tipe Data
type AssetState = EquipmentStatus | "REJECTED";
type ApprovalState =
	| "NONE"
	| "PENDING_REVIEW"
	| "IN_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "NEED_REVISION";

interface Asset {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: AssetState;
	statusPersetujuan: ApprovalState;
	spesifikasi: string;
	lampiran: string[];
	lokasiPenyimpanan: string;
	area: string;
	vendor: string;
	tahunDibuat: string;
	nilaiPerolehan: string;
	pemohon: string;
}

export default function RevisiValidasiPage() {
	const [assets, setAssets] = useState<Asset[]>([]);
	const [conditions, setConditions] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const [data, objTypes, approvalsRes, user, conditionsData] =
					await Promise.all([
						getEquipments(),
						getObjectTypes(),
						getApprovals(),
						getCurrentUserAction(),
						getConditions(),
					]);
				setConditions(conditionsData);
				const approvalsData = Array.isArray(approvalsRes)
					? approvalsRes
					: approvalsRes?.data || [];
				const currentUserNPP = user?.user?.npp || "NPP2304145";
				const mappedData = data.map((item: any) => {
					let objectTypeName = "Belum Ditentukan";
					if (item.object_type?.name) {
						objectTypeName = item.object_type.name;
					} else if (item.objectType?.name) {
						objectTypeName = item.objectType.name;
					} else {
						const otId =
							item.id_object_type || item.object_type_id || item.objectTypeId;
						if (otId && objTypes) {
							const found = objTypes.find(
								(o: any) => o.id === otId || o.id === Number(otId),
							);
							if (found) objectTypeName = found.name;
						}
					}

					return {
						id: item.id?.toString() || "-",
						kodeAlat: item.equipment_code,
						namaAlat: item.name,
						plant: item.plant?.name || "-",
						jenisAlat: objectTypeName,
						tanggalRegistrasi: item.created_at
							? new Date(item.created_at).toISOString().split("T")[0]
							: "-",
						statusAset: statusName(item.status?.name) || "REGISTERED",
						statusPersetujuan: "NONE", // Default, will override below
						spesifikasi: item.notes || "Belum ada spesifikasi",
						lampiran: [],
						lokasiPenyimpanan:
							item.storage_location?.name ||
							item.storageLocation?.name ||
							"Belum ditentukan",
						area:
							typeof item.func_loc === "string"
								? item.func_loc
								: item.func_loc?.name || item.funcloc?.name || "-",
						vendor: item.vendor || "-",
						tahunDibuat: item.year?.toString() || "-",
						nilaiPerolehan: item.original_value
							? `Rp ${Number(item.original_value).toLocaleString("id-ID")}`
							: "Rp 0",
						pemohon: (() => {
							const p = item.created_by_npp || currentUserNPP;
							return /^\d/.test(p) ? `NPP${p}` : p;
						})(),
					};
				});

				// Correcting status mapping based on API
				const mappedWithApproval = mappedData.map((item: any) => {
					let statusAset = statusName(item.statusAset) || "REGISTERED";
					let statusPersetujuan: ApprovalState = "NONE";

					if (statusAset === "REGISTERED") {
						statusPersetujuan = "NONE";
					} else if (statusAset === "VALIDATED") {
						const app = approvalsData.find(
							(a: any) =>
								a.equipment_id === Number(item.id) ||
								a.equipment?.id === Number(item.id),
						);
						if (app) {
							if (app.approval_status === "REVISION_REQUIRED") {
								statusPersetujuan = "NEED_REVISION";
							} else if (app.approval_status === "IN_REVIEW") {
								statusPersetujuan = "IN_REVIEW";
							} else if (app.approval_status === "APPROVED") {
								statusPersetujuan = "APPROVED";
								statusAset = "READY_TO_USE";
							} else if (app.approval_status === "REJECTED") {
								statusPersetujuan = "REJECTED";
								statusAset = "REJECTED";
							} else {
								statusPersetujuan = "PENDING_REVIEW";
							}
						} else {
							statusPersetujuan = "PENDING_REVIEW";
						}
					} else if (statusAset === "READY_TO_USE") {
						statusPersetujuan = "APPROVED";
					} else if (statusAset === "REJECTED") {
						statusPersetujuan = "REJECTED";
					}

					return { ...item, statusAset, statusPersetujuan };
				});

				// Sort data by ID descending (newest first)
				mappedWithApproval.sort((a: any, b: any) => Number(b.id) - Number(a.id));

				// KUSUS HANYA ASSET YANG BERSTATUS NEED_REVISION
				const finalAssets = mappedWithApproval.filter(
					(a: any) => a.statusPersetujuan === "NEED_REVISION",
				);

				setAssets(finalAssets);
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// Filter States
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [plantFilter, setPlantFilter] = useState("Semua");
	const [dateFilter, setDateFilter] = useState("");

	// Modal & Form States
	const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"VALIDASI" | "DETAIL">("VALIDASI");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [attachments, setAttachments] = useState<any[]>([]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const mainElem = document.querySelector("main");
			const tableElem = document.getElementById("revisi-table-container");

			if (tableElem) {
				tableElem.scrollIntoView({
					behavior: "instant" as ScrollBehavior,
					block: "start",
				});
			} else if (mainElem) {
				mainElem.scrollTop = 220;
			}
		}, 150);

		return () => clearTimeout(timer);
	}, []);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	// Form Validasi States
	const [hasilPemeriksaan, setHasilPemeriksaan] = useState("");
	const [conditionId, setConditionId] = useState("");
	const [catatan, setCatatan] = useState("");
	const [rekomendasi, setRekomendasi] = useState("");
	const [tglPemeriksaan, setTglPemeriksaan] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [jamMulai, setJamMulai] = useState("08:00");
	const [jamSelesai, setJamSelesai] = useState("09:00");

	const handleTimeInput = (
		value: string,
		setter: React.Dispatch<React.SetStateAction<string>>,
	) => {
		const numbers = value.replace(/\D/g, "");
		if (numbers.length > 4) return;
		let formatted = numbers;
		if (numbers.length >= 3) {
			formatted = `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
		}

		if (formatted.length >= 2) {
			const h = parseInt(formatted.slice(0, 2), 10);
			if (h > 23) formatted = `23${formatted.slice(2)}`;
		}
		if (formatted.length === 5) {
			const m = parseInt(formatted.slice(3, 5), 10);
			if (m > 59) formatted = `${formatted.slice(0, 3)}59`;
		}

		setter(formatted);
	};
	const [lokasi, setLokasi] = useState("");
	const [showValidationErrors, setShowValidationErrors] = useState(false);

	// Upload States
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	// Sorting State
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Asset;
		direction: "asc" | "desc";
	} | null>(null);

	// Handler Buka Modal
	const openModal = async (
		asset: Asset,
		mode: "VALIDASI" | "DETAIL" = "VALIDASI",
	) => {
		setSelectedAsset(asset);
		setModalMode(mode);
		setIsModalOpen(true);
		setUploadedFiles([]); // Reset files
		setShowValidationErrors(false);
		setFileError(null);
		setAttachments([]);
		setPreviewImage(null);

		try {
			const attsData = await getAttachmentsByEquipmentId(asset.id);
			if (attsData && Array.isArray(attsData)) {
				setAttachments(attsData);
			}
		} catch (err) {
			console.error(err);
		}

		setHasilPemeriksaan(
			asset.statusAset === "REJECTED" ? "Tidak Layak" : "Layak",
		);
		setConditionId("");
		setCatatan("Visual fisik aman, tidak ada kebocoran, performa motor stabil.");
		setRekomendasi("Dapat dimobilisasi segera ke area yang membutuhkan.");
		setLokasi("Area Unit P-IB");
		setJamMulai("09:00");
		setJamSelesai("10:30");
		setTglPemeriksaan(new Date().toISOString().split("T")[0]);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setPreviewImage(null);
		setTimeout(() => setSelectedAsset(null), 300);
	};

	// Simpan Validasi
	const handleSave = async () => {
		setIsSubmitting(true);
		if (!selectedAsset) return;

		try {
			const isUtilizable = hasilPemeriksaan === "Layak";
			const notes = catatan || rekomendasi;
			const res = await validateEquipment(
				selectedAsset.id,
				isUtilizable,
				Number(conditionId),
				notes,
			);

			if (res.success) {
				if (uploadedFiles && uploadedFiles.length > 0) {
					try {
						const tokenMatch = document.cookie.match(/(^|;)\s*token\s*=\s*([^;]+)/);
						const token = tokenMatch ? tokenMatch[2] : "";
						const API_URL =
							process.env.NEXT_PUBLIC_API_URL || "https://api.testing.naufal.me";

						for (const file of uploadedFiles) {
							const fd = new FormData();
							fd.append("equipment_id", selectedAsset.id);
							fd.append("file", file);
							fd.append("category", "inspection_photo");

							const resUpload = await fetch(`${API_URL}/api/attachments/upload`, {
								method: "POST",
								headers: {
									Authorization: `Bearer ${token}`,
								},
								body: fd,
							});
							if (!resUpload.ok) {
								console.error("Gagal upload file:", file.name, await resUpload.text());
							} else {
								console.log("Upload berhasil:", await resUpload.json());
							}
						}
					} catch (err) {
						console.error("Error during file upload:", err);
					}
				}

				setNotification({
					type: "success",
					message: "Revisi validasi berhasil disubmit ke sistem.",
				});

				// Remove processed equipment from revisi list
				setAssets((prev) => prev.filter((a) => a.id !== selectedAsset.id));
			} else {
				setNotification({
					type: "error",
					message: `Gagal merevisi validasi: ${res.message || "Kesalahan sistem"}`,
				});
			}
		} catch (err) {
			setNotification({
				type: "error",
				message: `Terjadi kesalahan: ${err instanceof Error ? err.message : String(err)}`,
			});
		} finally {
			setIsSubmitting(false);
			closeModal();
			setTimeout(() => setNotification(null), 3000);
		}
	};

	const hitungDurasi = () => {
		if (!jamMulai || !jamSelesai) return "-";
		const [hMulai, mMulai] = jamMulai.split(":").map(Number);
		const [hSelesai, mSelesai] = jamSelesai.split(":").map(Number);

		const startMins = hMulai * 60 + mMulai;
		const endMins = hSelesai * 60 + mSelesai;
		const diff = endMins - startMins;

		if (diff <= 0) return "-";
		const h = Math.floor(diff / 60);
		const m = diff % 60;
		return `${h > 0 ? h + " Jam " : ""}${m > 0 ? m + " Menit" : ""}`;
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFileError(null);
			const files = Array.from(e.target.files);
			let hasError = false;
			const validFiles = files.filter((f) => {
				if (f.size > 5 * 1024 * 1024) {
					hasError = true;
					return false;
				}
				return true;
			});
			if (hasError) {
				setFileError("file anda lebih dari 5mb");
			}
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
			setFileError(null);
			const files = Array.from(e.dataTransfer.files);
			let hasError = false;
			const validFiles = files.filter((f) => {
				if (f.size > 5 * 1024 * 1024) {
					hasError = true;
					return false;
				}
				return true;
			});
			if (hasError) {
				setFileError("file anda lebih dari 5mb");
			}
			setUploadedFiles((prev) => [...prev, ...validFiles]);
		}
	};

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	// Filter & Sort Data
	const filteredAssets = useMemo(() => {
		const filtered = assets.filter((a) => {
			const matchSearch =
				a.kodeAlat.toLowerCase().includes(search.toLowerCase()) ||
				a.namaAlat.toLowerCase().includes(search.toLowerCase());
			const matchPlant = plantFilter === "Semua" || a.plant === plantFilter;
			const matchDate = !dateFilter || a.tanggalRegistrasi === dateFilter;

			return matchSearch && matchPlant && matchDate;
		});

		if (sortConfig !== null) {
			filtered.sort((a, b) => {
				const valA = String(a[sortConfig!.key]).toLowerCase();
				const valB = String(b[sortConfig!.key]).toLowerCase();
				if (valA < valB) {
					return sortConfig!.direction === "asc" ? -1 : 1;
				}
				if (valA > valB) {
					return sortConfig!.direction === "asc" ? 1 : -1;
				}
				return 0;
			});
		} else {
			filtered.sort((a, b) => {
				const timeA = a.tanggalRegistrasi && a.tanggalRegistrasi !== "-" ? new Date(a.tanggalRegistrasi).getTime() : 0;
				const timeB = b.tanggalRegistrasi && b.tanggalRegistrasi !== "-" ? new Date(b.tanggalRegistrasi).getTime() : 0;
				if (timeB !== timeA) return timeB - timeA;
				return (Number(b.id) || 0) - (Number(a.id) || 0);
			});
		}

		return filtered;
	}, [assets, search, plantFilter, dateFilter, sortConfig]);

	const paginatedAssets = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredAssets, currentPage]);

	const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);

	const resetFilter = () => {
		setSearchInput("");
		setSearch("");
		setPlantFilter("Semua");
		setDateFilter("");
		setCurrentPage(1);
		setSortConfig({ key: "tanggalRegistrasi", direction: "desc" });
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCurrentPage(1);
	}, [search, plantFilter, dateFilter]);

	// UI Helpers
	const getStatusAsetBadge = (status: AssetState | string) => {
		const styles: Record<string, string> = {
			REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
			VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
			REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
			SCRAP: "bg-[#FEE2E2] text-[#DC2626]",
			DISPOSAL_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
			REPAIR: "bg-[#FEF3C7] text-[#B45309]",
			"REPAIR COMPLETED": "bg-[#CCFBF1] text-[#0F766E]",
			REPAIR_COMPLETED: "bg-[#CCFBF1] text-[#0F766E]",
			REUSED: "bg-[#E0E7FF] text-[#4F46E5]",
			"READY TO USE": "bg-[#E0E7FF] text-[#4F46E5]",
			READY_TO_USE: "bg-[#E0E7FF] text-[#4F46E5]",
		};

		let displayStatus = (status || "").replace(/_/g, " ");
		if (displayStatus === "READY TO REUSE" || displayStatus === "REUSED") {
			displayStatus = "READY TO USE";
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

	const getApprovalBadge = (status: ApprovalState) => {
		const styles = {
			NONE: "bg-gray-100 text-gray-500",
			PENDING_REVIEW: "bg-[#FEF9C3] text-[#CA8A04]",
			IN_REVIEW: "bg-[#E0F2FE] text-[#0284C7]",
			APPROVED: "bg-[#DCFCE7] text-[#16A34A]",
			REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
			NEED_REVISION: "bg-[#F3E8FF] text-[#9333EA]",
		};
		const labels = {
			NONE: "-",
			PENDING_REVIEW: "Menunggu Review",
			IN_REVIEW: "Sedang Direview",
			APPROVED: "Disetujui",
			REJECTED: "Ditolak",
			NEED_REVISION: "Perlu Revisi",
		};
		return (
			<span
				className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${styles[status] || "bg-[#F3E8FF] text-[#9333EA]"}`}
			>
				{labels[status] || "Perlu Revisi"}
			</span>
		);
	};

	const getActionButton = (asset: Asset) => {
		return (
			<div className="flex items-center gap-1.5 justify-center">
				<button
					title="Revisi Validasi"
					onClick={() => openModal(asset, "VALIDASI")}
					className="text-[#334155] hover:text-[#0A356A] hover:bg-[#F2F3F4] p-1 px-2 rounded-md transition-colors flex items-center gap-1"
				>
					<Edit className="w-3.5 h-3.5" />
					<span className="text-[11px] font-bold">Revisi Validasi</span>
				</button>
			</div>
		);
	};

	const validateForm = () => {
		if (
			!hasilPemeriksaan ||
			!conditionId ||
			!lokasi ||
			!tglPemeriksaan ||
			!jamMulai ||
			!jamSelesai
		)
			return false;
		if (hasilPemeriksaan === "Tidak Layak" && !catatan.trim()) return false;
		return true;
	};

	const handleSaveClick = () => {
		if (!validateForm()) {
			setShowValidationErrors(true);
			return;
		}
		setIsConfirmOpen(true);
	};

	const handleSort = (key: keyof Asset) => {
		let direction: "asc" | "desc" = "asc";
		if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (key: keyof Asset) => {
		if (!sortConfig || sortConfig.key !== key) {
			return (
				<ArrowUpDown className="w-3 h-3 text-gray-400 ml-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[#0A356A] transition-all" />
			);
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		) : (
			<ArrowDown className="w-3.5 h-3.5 text-[#0A356A] ml-1.5" />
		);
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-white text-[#0F172A] px-5 py-3 rounded border border-[#E6E8EA] shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-[#059669]" />
					) : (
						<XCircle className="w-4 h-4 text-[#DC2626]" />
					)}
					<span className="text-[13px] font-medium">{notification.message}</span>
				</div>
			)}

			{/* Action Notification Banner */}
			{assets.length > 0 && (
				<div className="mb-4 flex items-center justify-between rounded border border-[#B45309]/30 bg-[#F2F3F4] px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
					<div className="flex items-center gap-3">
						<span
							className="inline-flex h-2.5 w-2.5 rounded-sm bg-[#B45309]"
							aria-hidden="true"
						></span>
						<span className="text-[13px] text-[#0F172A] font-medium">
							Terdapat <strong className="font-bold">{assets.length} aset</strong> yang
							memerlukan revisi validasi sesuai catatan Manajer Rendal.
						</span>
					</div>
				</div>
			)}

			{/* Main Content Area (Tabel) */}
			<div
				id="revisi-table-container"
				className="bg-white border border-gray-200 rounded overflow-hidden scroll-mt-4"
			>
				{/* Toolbar / Filters */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					{/* Search */}
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Cari Kode atau Nama Alat..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={() => setSearch(searchInput)}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded hover:bg-[#0556B3] transition-colors whitespace-nowrap"
						>
							Cari
						</button>
					</div>

					{/* Filter Group */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={plantFilter}
							onChange={(e) => setPlantFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="Semua">Semua Plant</option>
							<option value="P-1">Plant 1</option>
							<option value="P-2">Plant 2</option>
							<option value="P-3">Plant 3</option>
							<option value="P-4">Plant 4</option>
						</select>

						<input
							type="date"
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 cursor-pointer"
						/>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						<button
							onClick={resetFilter}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-[#F2F3F4]">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center w-12">
									No
								</th>
								<th
									className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("namaAlat")}
								>
									<div className="flex items-center">
										Nama Alat {getSortIcon("namaAlat")}
									</div>
								</th>
								<th
									className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("plant")}
								>
									<div className="flex items-center">Plant {getSortIcon("plant")}</div>
								</th>
								<th
									className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("jenisAlat")}
								>
									<div className="flex items-center">
										Jenis {getSortIcon("jenisAlat")}
									</div>
								</th>
								<th
									className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("tanggalRegistrasi")}
								>
									<div className="flex items-center">
										Tanggal {getSortIcon("tanggalRegistrasi")}
									</div>
								</th>
								<th
									className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase cursor-pointer group hover:bg-[#E6E8EA] transition-colors"
									title="Klik untuk mengurutkan"
									onClick={() => handleSort("statusAset")}
								>
									<div className="flex items-center">
										Aset {getSortIcon("statusAset")}
									</div>
								</th>
								<th className="px-3 py-2.5 text-[12px] font-bold text-gray-500">
									Status Persetujuan
								</th>
								<th className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase text-center whitespace-nowrap">
									Tindakan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white">
							{isLoading ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										Memuat data revisi...
									</td>
								</tr>
							) : paginatedAssets.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<CheckCircle2 className="w-6 h-6 text-[#059669] mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Tidak Ada Peralatan Perlu Revisi
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Semua validasi inspeksi telah diproses atau belum membutuhkan
												revisi.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedAssets.map((asset, index) => {
									const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
									return (
										<tr
											key={asset.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-[#F2F3F4] transition-colors group"
										>
											<td className="px-3 py-1 text-[14px] text-gray-500 font-medium text-center">
												{rowNum}
											</td>
											<td
												className="px-3 py-1 text-[14px] font-semibold text-gray-800"
												title={asset.namaAlat}
											>
												<span className="leading-tight line-clamp-2">{asset.namaAlat}</span>
											</td>
											<td className="px-3 py-1 text-[14px] text-gray-600 font-medium">
												{asset.plant}
											</td>
											<td className="px-3 py-1 text-[14px] text-gray-600 font-medium">
												{asset.jenisAlat}
											</td>
											<td className="px-3 py-1 text-[11px] text-gray-600 font-medium whitespace-nowrap">
												{asset.tanggalRegistrasi}
											</td>
											<td className="px-3 py-1 text-[14px]">
												{getStatusAsetBadge(asset.statusAset)}
											</td>
											<td className="px-3 py-1 text-[14px]">
												{getApprovalBadge(asset.statusPersetujuan)}
											</td>
											<td className="px-3 py-1 text-center">
												<div className="flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
													{getActionButton(asset)}
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
					<span className="text-[11px] font-medium text-gray-500">
						Menampilkan{" "}
						{filteredAssets.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
						- {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} dari{" "}
						{filteredAssets.length} data (10 baris/halaman)
					</span>
					<div className="flex items-center gap-1.5">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
						>
							Prev
						</button>

						<div className="flex items-center gap-1">
							{Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(
								(page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
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
								setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))
							}
							disabled={currentPage === Math.max(1, totalPages)}
							className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* MODAL FOR REVISI VALIDASI */}
			{isModalOpen && modalMode === "VALIDASI" && selectedAsset && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/50 transition-opacity"
						onClick={closeModal}
					/>

					<div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
							<div className="flex items-center gap-3">
								<h2 className="text-base font-bold text-gray-900">
									Revisi Validasi Inspeksi
								</h2>
								<span className="text-gray-300">|</span>
								<span className="text-[13px] font-semibold text-[#0A356A]">
									{selectedAsset.kodeAlat}
								</span>
							</div>
							<button
								onClick={closeModal}
								className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Body */}
						<div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
							{/* Asset Info Ribbon */}
							<div className="bg-[#F2F3F4] border border-[#E6E8EA] rounded p-2.5 mb-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-5 overflow-hidden">
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Nama Peralatan
										</span>
										<span className="font-bold text-[13px] text-[#0F172A] truncate">
											{selectedAsset.namaAlat}
										</span>
									</div>
									<div className="w-px h-5 bg-[#E6E8EA]"></div>
									<div>
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Plant
										</span>
										<span className="font-bold text-[13px] text-[#0F172A]">
											{selectedAsset.plant}
										</span>
									</div>
									<div className="w-px h-5 bg-[#E6E8EA]"></div>
									<div className="flex-1 min-w-52">
										<span className="text-[#64748B] text-[10px] font-medium block leading-none mb-1">
											Spesifikasi Singkat
										</span>
										<span
											className="text-[#334155] text-[12px] truncate block"
											title={selectedAsset.spesifikasi}
										>
											{selectedAsset.spesifikasi}
										</span>
									</div>
								</div>
								<div className="shrink-0 flex gap-2">
									{getStatusAsetBadge(selectedAsset.statusAset)}
									{getApprovalBadge(selectedAsset.statusPersetujuan)}
								</div>
							</div>

							{/* Banner Catatan Revisi dari Manager */}
							<div className="bg-[#F2F3F4] border-l-4 border-[#B45309] p-3.5 mb-4 rounded-r-lg flex gap-3">
								<AlertCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
								<div>
									<h4 className="text-[13px] font-bold text-[#0F172A]">
										Catatan Revisi dari Manajer Rendal
									</h4>
									<p className="text-[12px] text-[#0F172A] mt-1 font-medium bg-white/70 p-2 rounded border border-[#B45309]">
										&quot;Mohon perbarui dan lengkapi hasil validasi beserta foto
										pendukung tambahan sebelum pengajuan disetujui.&quot;
									</p>
								</div>
							</div>

							{/* Form Grid */}
							<div className="bg-white border border-gray-200 rounded p-4">
								{/* Row 1: Identifikasi & Waktu */}
								<div className="grid grid-cols-12 gap-3 mb-3">
									<div className="col-span-3">
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											No. Pemeriksaan
										</label>
										<input
											type="text"
											value={`INSP-${selectedAsset.kodeAlat}`}
											disabled
											className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500"
										/>
									</div>
									<div className="col-span-3">
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Tanggal *
										</label>
										<input
											type="date"
											value={tglPemeriksaan}
											onChange={(e) => setTglPemeriksaan(e.target.value)}
											className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none ${showValidationErrors && !tglPemeriksaan ? "border-[#DC2626] focus:border-[#DC2626]" : "border-gray-300 focus:border-[#0A356A]"}`}
										/>
										{showValidationErrors && !tglPemeriksaan && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Tanggal wajib diisi.
											</p>
										)}
									</div>
									<div className="col-span-2">
										<AnalogTimePicker
											value={jamMulai}
											onChange={setJamMulai}
											label="Jam Mulai *"
										/>
										{showValidationErrors && !jamMulai && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Jam Mulai wajib diisi.
											</p>
										)}
									</div>
									<div className="col-span-2">
										<AnalogTimePicker
											value={jamSelesai}
											onChange={setJamSelesai}
											label="Jam Selesai *"
										/>
										{showValidationErrors && !jamSelesai && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Jam Selesai wajib diisi.
											</p>
										)}
									</div>
									<div className="col-span-2">
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Durasi
										</label>
										<div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-[13px] text-gray-600 truncate flex items-center gap-1.5">
											<Clock className="w-3.5 h-3.5 text-gray-400" />
											{hitungDurasi()}
										</div>
									</div>
								</div>

								{/* Row 2: Lokasi & Hasil */}
								<div className="grid grid-cols-12 gap-3 mb-3">
									<div className="col-span-5">
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Lokasi Pengecekan *
										</label>
										<select
											value={lokasi}
											onChange={(e) => setLokasi(e.target.value)}
											className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none ${showValidationErrors && !lokasi ? "border-[#DC2626] focus:border-[#DC2626]" : "border-gray-300 focus:border-[#0A356A]"}`}
										>
											<option value="" disabled>
												Pilih Lokasi...
											</option>
											<option value="Area Unit 1B">Area Unit 1B</option>
											<option value="Area Unit P-IB">Area Unit P-IB</option>
											<option value="Area Ammonia">Area Ammonia</option>
											<option value="Area Urea">Area Urea</option>
											<option value="Area Utilitas">Area Utilitas</option>
											<option value="Gudang Utama">Gudang Utama</option>
											<option value="Bengkel Mekanik">Bengkel Mekanik</option>
										</select>
										{showValidationErrors && !lokasi && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Lokasi wajib dipilih.
											</p>
										)}
									</div>

									<div className="col-span-7">
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Hasil Evaluasi Kelayakan *
										</label>
										<div className="flex gap-2.5">
											<label
												className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
													hasilPemeriksaan === "Layak"
														? "border-[#059669] bg-white"
														: "border-gray-200 bg-white hover:bg-gray-50"
												} ${showValidationErrors && !hasilPemeriksaan ? "border-[#DC2626]" : ""}`}
											>
												<div
													className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Layak" ? "border-[#059669]" : showValidationErrors && !hasilPemeriksaan ? "border-[#DC2626]" : "border-gray-300"}`}
												>
													{hasilPemeriksaan === "Layak" && (
														<div className="w-1.5 h-1.5 bg-[#059669] rounded-full" />
													)}
												</div>
												<span
													className={`text-[13px] font-semibold ${hasilPemeriksaan === "Layak" ? "text-[#059669]" : "text-gray-700"}`}
												>
													Layak Digunakan
												</span>
												<input
													type="radio"
													name="hasil"
													value="Layak"
													checked={hasilPemeriksaan === "Layak"}
													onChange={(e) => setHasilPemeriksaan(e.target.value)}
													className="hidden"
												/>
											</label>

											<label
												className={`flex-1 relative border rounded-md p-1.5 cursor-pointer flex items-center justify-center gap-2 transition-all ${
													hasilPemeriksaan === "Tidak Layak"
														? "border-[#DC2626] bg-white"
														: "border-gray-200 bg-white hover:bg-gray-50"
												} ${showValidationErrors && !hasilPemeriksaan ? "border-[#DC2626]" : ""}`}
											>
												<div
													className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${hasilPemeriksaan === "Tidak Layak" ? "border-[#DC2626]" : showValidationErrors && !hasilPemeriksaan ? "border-[#DC2626]" : "border-gray-300"}`}
												>
													{hasilPemeriksaan === "Tidak Layak" && (
														<div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full" />
													)}
												</div>
												<span
													className={`text-[13px] font-semibold ${hasilPemeriksaan === "Tidak Layak" ? "text-[#DC2626]" : "text-gray-700"}`}
												>
													Tidak Layak
												</span>
												<input
													type="radio"
													name="hasil"
													value="Tidak Layak"
													checked={hasilPemeriksaan === "Tidak Layak"}
													onChange={(e) => setHasilPemeriksaan(e.target.value)}
													className="hidden"
												/>
											</label>
										</div>
										{showValidationErrors && !hasilPemeriksaan && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Hasil Evaluasi wajib dipilih.
											</p>
										)}
									</div>

									<div className="col-span-12">
										<label
											htmlFor="revision-condition"
											className="block text-[11px] font-semibold text-gray-700 mb-1"
										>
											Kondisi Aset *
										</label>
										<select
											id="revision-condition"
											value={conditionId}
											onChange={(e) => setConditionId(e.target.value)}
											required
											className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none ${showValidationErrors && !conditionId ? "border-[#DC2626] focus:border-[#DC2626]" : "border-gray-300 focus:border-[#0A356A]"}`}
										>
											<option value="" disabled>
												Pilih Kondisi...
											</option>
											{conditions.map((condition) => (
												<option key={condition.id} value={condition.id}>
													{condition.name
														.replace(/_/g, " ")
														.replace(
															/\w\S*/g,
															(txt) =>
																txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
														)}
												</option>
											))}
										</select>
										{showValidationErrors && !conditionId && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Kondisi aset wajib dipilih.
											</p>
										)}
									</div>
								</div>

								{/* Row 3: Catatan & Rekomendasi */}
								<div className="grid grid-cols-2 gap-4 mb-3">
									<div>
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Catatan Pemeriksaan Baru{" "}
											<span
												className={
													hasilPemeriksaan === "Tidak Layak" ? "text-[#DC2626]" : ""
												}
											>
												{hasilPemeriksaan === "Tidak Layak" ? "*" : ""}
											</span>
										</label>
										<textarea
											rows={2}
											value={catatan}
											onChange={(e) => setCatatan(e.target.value)}
											placeholder={
												hasilPemeriksaan === "Tidak Layak"
													? "Tuliskan alasan perbaikan (wajib)..."
													: "Tuliskan hasil pemeriksaan..."
											}
											className={`w-full bg-white border rounded-md px-3 py-1.5 text-[13px] outline-none resize-none transition-all ${
												hasilPemeriksaan === "Tidak Layak" && !catatan.trim()
													? "border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
													: "border-gray-300 focus:border-[#0A356A]"
											}`}
										/>
										{hasilPemeriksaan === "Tidak Layak" && !catatan.trim() && (
											<p className="text-[10px] text-[#DC2626] mt-0.5 font-medium">
												* Harus diisi agar bisa disimpan.
											</p>
										)}
									</div>
									<div>
										<label className="block text-[11px] font-semibold text-gray-700 mb-1">
											Rekomendasi Tindak Lanjut Baru{" "}
											<span className="text-gray-400 font-normal">(Ops)</span>
										</label>
										<textarea
											rows={2}
											value={rekomendasi}
											onChange={(e) => setRekomendasi(e.target.value)}
											placeholder="Rekomendasi perbaikan..."
											className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[13px] focus:border-[#0A356A] outline-none resize-none"
										/>
									</div>
								</div>

								{/* Row 4: Upload */}
								<div className="mt-1">
									<input
										type="file"
										multiple
										className="hidden"
										ref={fileInputRef}
										onChange={handleFileChange}
										accept=".jpg,.jpeg,.png,.pdf"
									/>
									<div
										onClick={() => fileInputRef.current?.click()}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										className={`border-2 border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
											isDragging
												? "border-[#0A356A] bg-[#F2F3F4]"
												: "border-gray-300 bg-gray-50 hover:bg-[#F2F3F4] hover:border-[#0A356A]"
										}`}
									>
										<UploadCloud
											className={`w-7 h-7 mb-1 ${isDragging ? "text-[#0A356A]" : "text-gray-400"}`}
										/>
										<div className="text-[13px] text-center">
											<span className="font-bold text-[#0A356A]">
												📎 Upload Foto Pemeriksaan
											</span>
										</div>
										<span className="text-[11px] text-gray-500 font-medium text-center">
											Format: JPG, PNG, PDF (Max 5MB)
										</span>

										{uploadedFiles.length === 0 && (
											<span className="text-[9px] font-bold text-gray-500 border border-[#E6E8EA] bg-white px-1.5 py-0.5 rounded-sm mt-1">
												Opsional
											</span>
										)}

										{uploadedFiles.length > 0 && (
											<div
												className="mt-4 w-full flex flex-wrap justify-center gap-4"
												onClick={(e) => e.stopPropagation()}
											>
												{uploadedFiles.map((file, i) => {
													const isImage = file.type.startsWith("image/");
													const previewUrl = isImage ? URL.createObjectURL(file) : null;
													return (
														<div
															key={i}
															className="relative group border border-gray-200 rounded overflow-hidden bg-white w-[150px] transition-all hover:border-[#0A356A]"
														>
															{isImage ? (
																<div className="h-28 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
																	<img
																		src={previewUrl!}
																		alt={file.name}
																		className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
																	/>
																</div>
															) : (
																<div className="h-28 w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
																	<Paperclip className="w-8 h-8 mb-2" />
																	<span className="text-[10px] font-bold">PDF / DOC</span>
																</div>
															)}
															<div className="px-2 py-1.5 border-t border-gray-100 bg-white">
																<span
																	className="block text-[10px] font-medium text-[#0A356A] truncate text-center"
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
																className="absolute top-1.5 right-1.5 bg-[#DC2626] rounded p-1 text-white hover:bg-[#DC2626] transition-colors opacity-0 group-hover:opacity-100"
																title="Hapus"
															>
																<X className="w-3.5 h-3.5" />
															</button>
														</div>
													);
												})}
											</div>
										)}
									</div>

									{fileError && (
										<p className="text-[10px] text-[#DC2626] mt-1.5 font-medium">
											* {fileError}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Footer Actions */}
						<div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2.5 shrink-0">
							<button
								onClick={closeModal}
								disabled={isSubmitting}
								className="px-4 py-1.5 text-[13px] font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-[#E6E8EA] transition-colors disabled:opacity-50"
							>
								Tutup
							</button>

							<button
								onClick={handleSaveClick}
								disabled={isSubmitting}
								className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#B45309] hover:bg-[#B45309] rounded-md transition-all disabled:opacity-50 flex items-center gap-1.5"
							>
								{isSubmitting ? (
									<>
										<RefreshCw className="w-3.5 h-3.5 animate-spin" /> Proses...
									</>
								) : (
									<>
										<Save className="w-3.5 h-3.5" /> Simpan Hasil Inspeksi
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{previewImage && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/90"
					onClick={() => setPreviewImage(null)}
				>
					<button
						className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							setPreviewImage(null);
						}}
					>
						<X className="w-6 h-6" />
					</button>
					<img
						src={previewImage}
						alt="Preview"
						className="max-w-full max-h-full object-contain rounded shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)]"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}

			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSave();
				}}
				title="Kirim Revisi Validasi?"
				description={`Hasil revisi ${selectedAsset?.kodeAlat ?? ""} akan dikirim ulang ke Manajer untuk ditinjau kembali.`}
				confirmLabel="Ya, Kirim"
				pendingLabel="Mengirim..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
