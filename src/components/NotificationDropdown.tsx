"use client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Bell,
	CheckCircle2,
	Wrench,
	Clock,
	HandCoins,
	Trash2,
	CheckCheck,
	Loader2,
	RefreshCw,
	Inbox,
	FileText,
} from "lucide-react";
import { normalizeRole } from "@/lib/roles";
import {
	getEquipments,
	getApprovals,
	getReuseRequests,
	getDisposals,
	getEquipmentRepairs,
} from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import { formatDate } from "@/lib/utils";

export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	timestamp: string;
	href: string;
	category: "validation" | "repair" | "reuse" | "disposal" | "system";
	badgeText?: string;
	badgeColor?: string;
}

function formatRelativeTime(iso?: string | null): string {
	if (!iso) return "Baru saja";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Baru saja";

	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffSeconds < 60) return "Baru saja";
	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours} jam lalu`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) return "Kemarin";
	if (diffDays < 7) return `${diffDays} hari lalu`;

	return formatDate(iso);
}

export function NotificationDropdown({ role }: { role?: string }) {
	const userRole = normalizeRole(role);
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [readIds, setReadIds] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const storageKey = `idle_notif_read_${userRole}`;

	// Load read notification IDs from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) {
					setReadIds(new Set(parsed));
				}
			}
		} catch (e) {
			console.error("Gagal membaca status notifikasi:", e);
		}
	}, [storageKey]);

	// Fetch dynamic notifications directly from database records based on role
	const fetchNotifications = useCallback(async () => {
		setIsLoading(true);
		try {
			const items: NotificationItem[] = [];

			switch (userRole) {
				case "INSPEKSI_TEKNIK": {
					const [equipments, approvalsData] = await Promise.all([
						getEquipments().catch(() => []),
						getApprovals("validation").catch(() => []),
					]);

					const approvalsList = Array.isArray(approvalsData)
						? approvalsData
						: (approvalsData as any)?.data || [];

					// 1. Data peralatan dari DB yang berstatus REGISTERED (menunggu validasi kelayakan pertama)
					if (Array.isArray(equipments)) {
						equipments.forEach((item: any) => {
							const rawStatus = typeof item.status === "object" ? item.status?.name : item.status;
							const norm = statusName(rawStatus || item.statusAset || "");

							if (norm === "REGISTERED") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Peralatan";
								const plant =
									item.plant_description ||
									(typeof item.plant === "object" ? item.plant?.name : item.plant) ||
									"-";

								items.push({
									id: `insp-reg-${item.id}`,
									title: `Menunggu Validasi: ${code}`,
									message: `Peralatan ${name} (${plant}) baru didaftarkan dan memerlukan pemeriksaan kelayakan teknis.`,
									timestamp: item.created_at || new Date().toISOString(),
									href: "/inspeksi/validasi",
									category: "validation",
									badgeText: "Validasi Awal",
									badgeColor: "#0556B3",
								});
							}

							// 2. Data peralatan dari DB yang berstatus REPAIR_COMPLETED (menunggu validasi ulang)
							if (norm === "REPAIR_COMPLETED") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Peralatan";
								items.push({
									id: `insp-repair-${item.id}`,
									title: `Perbaikan Selesai: ${code}`,
									message: `Peralatan ${name} telah selesai diperbaiki oleh tim Pemeliharaan dan siap divalidasi ulang.`,
									timestamp: item.updated_at || item.created_at || new Date().toISOString(),
									href: "/inspeksi/validasi-ulang",
									category: "repair",
									badgeText: "Validasi Ulang",
									badgeColor: "#059669",
								});
							}
						});
					}

					// 3. Catatan revisi validasi dari Manajer yang tersimpan di DB
					approvalsList.forEach((app: any) => {
						const approvalStatus = String(
							app.approval_status || app.status || "",
						).toUpperCase();
						if (
							approvalStatus === "REVISION_REQUIRED" ||
							approvalStatus === "REVISION"
						) {
							const code =
								app.equipment?.equipment_code ||
								app.equipment_code ||
								`EQ-${app.equipment_id || app.id}`;
							const name = app.equipment?.name || app.equipment_name || "Aset";
							const notes = app.notes || app.review_notes || "Perlu perbaikan catatan temuan lapangan.";

							items.push({
								id: `insp-rev-${app.id}`,
								title: `Revisi Validasi: ${code}`,
								message: `Catatan Manajer: "${notes}" untuk aset ${name}.`,
								timestamp: app.updated_at || app.created_at || new Date().toISOString(),
								href: "/inspeksi/validasi",
								category: "validation",
								badgeText: "Perlu Revisi",
								badgeColor: "#B45309",
							});
						}
					});
					break;
				}

				case "MANAJER_RENDAL": {
					const [valApps, reuseApps, dispApps] = await Promise.all([
						getApprovals("validation").catch(() => []),
						getApprovals("reuse").catch(() => []),
						getApprovals("disposal").catch(() => []),
					]);

					const toList = (v: any) => (Array.isArray(v) ? v : v?.data || []);

					// 1. Antrean persetujuan validasi dari database
					toList(valApps).forEach((app: any) => {
						const status = String(
							app.approval_status || app.status || "",
						).toUpperCase();
						const step = String(
							app.current_step || app.currentStep || "",
						).toUpperCase();
						if (status === "PENDING" && (!step || step === "MANAJER_RENDAL")) {
							const code =
								app.equipment?.equipment_code ||
								app.equipment_code ||
								`EQ-${app.equipment_id || app.id}`;
							const name = app.equipment?.name || app.equipment_name || "Aset";
							const reqNum = app.request_number || app.requestNumber || `VAL-${app.id}`;

							items.push({
								id: `mgr-val-${app.id}`,
								title: `Persetujuan Validasi (${reqNum})`,
								message: `Hasil validasi teknis ${code} (${name}) menunggu keputusan Anda.`,
								timestamp: app.created_at || new Date().toISOString(),
								href: "/manajer/approve",
								category: "validation",
								badgeText: "Validasi",
								badgeColor: "#0556B3",
							});
						}
					});

					// 2. Antrean persetujuan peminjaman/reuse dari database
					toList(reuseApps).forEach((app: any) => {
						const status = String(
							app.approval_status || app.status || "",
						).toUpperCase();
						const step = String(
							app.current_step || app.currentStep || "",
						).toUpperCase();
						if (status === "PENDING" && (!step || step === "MANAJER_RENDAL")) {
							const code =
								app.equipment?.equipment_code ||
								app.equipment_code ||
								`EQ-${app.equipment_id || app.id}`;
							const name = app.equipment?.name || app.equipment_name || "Aset";
							const reqNum = app.request_number || app.requestNumber || `REQ-${app.id}`;

							items.push({
								id: `mgr-reuse-${app.id}`,
								title: `Persetujuan Peminjaman (${reqNum})`,
								message: `Permohonan reuse alat ${code} (${name}) menunggu persetujuan Manajer.`,
								timestamp: app.created_at || new Date().toISOString(),
								href: "/manajer/peminjaman",
								category: "reuse",
								badgeText: "Peminjaman",
								badgeColor: "#059669",
							});
						}
					});

					// 3. Antrean persetujuan scrap/disposal dari database
					toList(dispApps).forEach((app: any) => {
						const status = String(
							app.approval_status || app.status || "",
						).toUpperCase();
						const step = String(
							app.current_step || app.currentStep || "",
						).toUpperCase();
						if (status === "PENDING" && (!step || step === "MANAJER_RENDAL")) {
							const code =
								app.equipment?.equipment_code ||
								app.equipment_code ||
								`EQ-${app.equipment_id || app.id}`;
							const name = app.equipment?.name || app.equipment_name || "Aset";
							const dispNum = app.disposal_number || app.disposalNumber || `DSP-${app.id}`;

							items.push({
								id: `mgr-disp-${app.id}`,
								title: `Persetujuan Usulan Scrap (${dispNum})`,
								message: `Usulan penghapusan aset ${code} (${name}) menunggu verifikasi Manajer.`,
								timestamp: app.created_at || new Date().toISOString(),
								href: "/manajer/scrap",
								category: "disposal",
								badgeText: "Scrap",
								badgeColor: "#475569",
							});
						}
					});
					break;
				}

				case "RENDAL_PEMELIHARAAN": {
					const [equipments, reuseRequests] = await Promise.all([
						getEquipments().catch(() => []),
						getReuseRequests("all").catch(() => []),
					]);

					if (Array.isArray(equipments)) {
						equipments.forEach((item: any) => {
							const rawStatus = typeof item.status === "object" ? item.status?.name : item.status;
							const norm = statusName(rawStatus || item.statusAset || "");

							// 1. Data peralatan berstatus REVALIDATION (evaluasi hasil validasi ulang)
							if (norm === "REVALIDATION") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Equipment";
								items.push({
									id: `rdl-reval-${item.id}`,
									title: `Evaluasi Validasi Ulang: ${code}`,
									message: `Peralatan ${name} telah selesai divalidasi ulang dan menunggu evaluasi Rendal.`,
									timestamp: item.updated_at || item.created_at || new Date().toISOString(),
									href: "/rendal/validasi-ulang",
									category: "repair",
									badgeText: "Validasi Ulang",
									badgeColor: "#0556B3",
								});
							}

							// 2. Data peralatan berstatus DISPOSAL_RECOMMENDED
							if (norm === "DISPOSAL_RECOMMENDED") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Equipment";
								items.push({
									id: `rdl-scrap-${item.id}`,
									title: `Rekomendasi Scrap: ${code}`,
									message: `Peralatan ${name} direkomendasikan untuk diajukan penghapusan (scrap) ke Manajer.`,
									timestamp: item.updated_at || item.created_at || new Date().toISOString(),
									href: "/rendal/scrap",
									category: "disposal",
									badgeText: "Usulan Scrap",
									badgeColor: "#B45309",
								});
							}

							// 3. Data peralatan baru terdaftar (REGISTERED)
							if (norm === "REGISTERED") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Equipment";
								const plant =
									item.plant_description ||
									(typeof item.plant === "object" ? item.plant?.name : item.plant) ||
									"-";
								items.push({
									id: `rdl-reg-${item.id}`,
									title: `Aset Baru Terdaftar: ${code}`,
									message: `Peralatan ${name} (${plant}) tercatat di sistem idle dan menunggu validasi.`,
									timestamp: item.created_at || new Date().toISOString(),
									href: "/rendal/idle",
									category: "system",
									badgeText: "Registrasi",
									badgeColor: "#64748B",
								});
							}
						});
					}

					// 4. Data permohonan reuse dari unit kerja di database
					if (Array.isArray(reuseRequests)) {
						reuseRequests.forEach((req: any) => {
							const status = String(
								req.status || req.approval_status || "",
							).toUpperCase();
							if (status.includes("PENDING") || status.includes("REVIEW")) {
								const code =
									req.equipment_code ||
									req.equipment?.equipment_code ||
									`EQ-${req.equipment_id || req.id}`;
								const reqNum = req.request_number || req.requestNumber || `REQ-${req.id}`;
								const loc = req.installation_location || req.installationLocation || "Unit Kerja";

								items.push({
									id: `rdl-reuse-${req.id}`,
									title: `Permintaan Reuse: ${reqNum}`,
									message: `Permohonan reuse alat ${code} untuk lokasi ${loc} menunggu peninjauan Rendal.`,
									timestamp: req.created_at || req.requested_at || new Date().toISOString(),
									href: "/rendal/idle",
									category: "reuse",
									badgeText: "Menunggu Review",
									badgeColor: "#059669",
								});
							}
						});
					}
					break;
				}

				case "PEMELIHARAAN_LAPANGAN": {
					const [equipments, repairs] = await Promise.all([
						getEquipments().catch(() => []),
						getEquipmentRepairs().catch(() => []),
					]);

					if (Array.isArray(equipments)) {
						equipments.forEach((item: any) => {
							const rawStatus = typeof item.status === "object" ? item.status?.name : item.status;
							const norm = statusName(rawStatus || item.statusAset || "");

							if (norm === "REPAIR") {
								const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
								const name = item.name || item.namaAlat || "Equipment";
								const plant =
									item.plant_description ||
									(typeof item.plant === "object" ? item.plant?.name : item.plant) ||
									"-";

								// Cari detail repair bila ada di DB
								const matchingRepair = Array.isArray(repairs)
									? repairs.find(
											(r: any) =>
												String(r.equipment_id) === String(item.id) ||
												String(r.equipment?.id) === String(item.id),
										)
									: null;

								const workDesc = matchingRepair?.work_description || matchingRepair?.notes;

								items.push({
									id: `mnt-rep-${item.id}`,
									title: `Perintah Perbaikan: ${code}`,
									message: workDesc
										? `Aset ${name} (${plant}): ${workDesc}`
										: `Peralatan ${name} (${plant}) dialokasikan untuk pemeliharaan/perbaikan.`,
									timestamp: item.updated_at || item.created_at || new Date().toISOString(),
									href: "/pemeliharaan/perbaikan-alat",
									category: "repair",
									badgeText: "Perbaikan",
									badgeColor: "#B45309",
								});
							}
						});
					}
					break;
				}

				case "UNIT_KERJA_OPERASI": {
					const [myRequests, equipments] = await Promise.all([
						getReuseRequests("mine").catch(() => []),
						getEquipments().catch(() => []),
					]);

					// 1. Status pengajuan peminjaman milik unit kerja yang login dari DB
					if (Array.isArray(myRequests)) {
						myRequests.forEach((req: any) => {
							const rawStatus = String(
								req.status || req.approval_status || "",
							).toUpperCase();
							const code =
								req.equipment_code ||
								req.equipment?.equipment_code ||
								`EQ-${req.equipment_id || req.id}`;
							const name = req.equipment_name || req.equipment?.name || "Aset";
							const reqNum = req.request_number || req.requestNumber || `REQ-${req.id}`;

							if (rawStatus.includes("APPROV")) {
								items.push({
									id: `uk-req-app-${req.id}`,
									title: `Pengajuan Disetujui: ${reqNum}`,
									message: `Permohonan peminjaman ${code} (${name}) telah disetujui Rendal. Siap dimobilisasi.`,
									timestamp: req.updated_at || req.created_at || new Date().toISOString(),
									href: "/unit-kerja/riwayat-permintaan",
									category: "reuse",
									badgeText: "Disetujui",
									badgeColor: "#059669",
								});
							} else if (rawStatus.includes("REJECT")) {
								items.push({
									id: `uk-req-rej-${req.id}`,
									title: `Pengajuan Ditolak: ${reqNum}`,
									message: `Permohonan peminjaman ${code} (${name}) tidak disetujui.`,
									timestamp: req.updated_at || req.created_at || new Date().toISOString(),
									href: "/unit-kerja/riwayat-permintaan",
									category: "reuse",
									badgeText: "Ditolak",
									badgeColor: "#DC2626",
								});
							} else if (rawStatus.includes("PENDING") || rawStatus.includes("REVIEW")) {
								items.push({
									id: `uk-req-pen-${req.id}`,
									title: `Pengajuan Direview: ${reqNum}`,
									message: `Permohonan peminjaman ${code} (${name}) sedang dalam peninjauan Rendal.`,
									timestamp: req.created_at || new Date().toISOString(),
									href: "/unit-kerja/riwayat-permintaan",
									category: "reuse",
									badgeText: "Dalam Review",
									badgeColor: "#B45309",
								});
							}
						});
					}

					// 2. Data peralatan yang BENAR-BENAR BERSTATUS READY_TO_USE (bukan repair / perbaikan / scrap / pending)
					if (Array.isArray(equipments)) {
						const strictlyReadyList = equipments.filter((item: any) => {
							const rawStatus = typeof item.status === "object" ? item.status?.name : item.status;
							const norm = statusName(rawStatus || item.statusAset || "");
							// Strict check: HANYA READY_TO_USE, tidak boleh status repair, perbaikan, revalidasi, dll.
							return norm === "READY_TO_USE";
						});

						strictlyReadyList.slice(0, 5).forEach((item: any) => {
							const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
							const name = item.name || item.namaAlat || "Equipment";
							const plant =
								item.plant_description ||
								(typeof item.plant === "object" ? item.plant?.name : item.plant) ||
								"-";

							items.push({
								id: `uk-ready-${item.id}`,
								title: `Aset Siap Pakai: ${code}`,
								message: `Peralatan ${name} (${plant}) dalam kondisi siap pakai (Ready to Use) dan dapat diajukan peminjaman.`,
								timestamp: item.updated_at || item.created_at || new Date().toISOString(),
								href: "/unit-kerja/daftar-aset",
								category: "reuse",
								badgeText: "Ready to Use",
								badgeColor: "#059669",
							});
						});
					}
					break;
				}

				case "ADMIN": {
					const [equipments, valApps] = await Promise.all([
						getEquipments().catch(() => []),
						getApprovals("validation").catch(() => []),
					]);

					// 1. Data aset baru terdaftar
					if (Array.isArray(equipments)) {
						const newEquips = equipments.filter((e: any) => {
							const rawStatus = typeof e.status === "object" ? e.status?.name : e.status;
							return statusName(rawStatus || e.statusAset || "") === "REGISTERED";
						});

						newEquips.slice(0, 5).forEach((item: any) => {
							const code = item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
							const name = item.name || item.namaAlat || "Equipment";
							items.push({
								id: `admin-reg-${item.id}`,
								title: `Registrasi Aset Baru: ${code}`,
								message: `Peralatan ${name} berhasil tercatat di database sistem idle.`,
								timestamp: item.created_at || new Date().toISOString(),
								href: "/admin/equipment",
								category: "system",
								badgeText: "Registrasi",
								badgeColor: "#0556B3",
							});
						});
					}

					// 2. Ringkasan antrean persetujuan yang sedang berjalan di sistem
					const valList = Array.isArray(valApps) ? valApps : (valApps as any)?.data || [];
					valList.slice(0, 3).forEach((app: any) => {
						const code =
							app.equipment?.equipment_code ||
							app.equipment_code ||
							`EQ-${app.equipment_id || app.id}`;
						const status = String(app.approval_status || app.status || "").toUpperCase();
						items.push({
							id: `admin-val-${app.id}`,
							title: `Approval Validasi: ${code}`,
							message: `Status proses validasi di database: ${status}.`,
							timestamp: app.updated_at || app.created_at || new Date().toISOString(),
							href: "/admin/equipment",
							category: "validation",
							badgeText: status,
							badgeColor: status === "PENDING" ? "#B45309" : "#0556B3",
						});
					});
					break;
				}
			}

			// Urutkan semua notifikasi dari rekaman tanggal terbaru di database
			items.sort((a, b) => {
				const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
				const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
				return timeB - timeA;
			});

			setNotifications(items);
		} catch (err) {
			console.error("Gagal memuat data notifikasi dari database:", err);
		} finally {
			setIsLoading(false);
		}
	}, [userRole]);

	// Fetch on mount, pathname change, and auto-poll every 30 seconds
	useEffect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, [fetchNotifications, pathname]);

	// Close on click outside or escape key
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const markAsRead = (id: string) => {
		setReadIds((prev) => {
			const next = new Set(prev);
			next.add(id);
			try {
				localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
			} catch (e) {
				console.error("Gagal menyimpan status baca notifikasi:", e);
			}
			return next;
		});
	};

	const markAllAsRead = () => {
		const allIds = notifications.map((n) => n.id);
		const next = new Set(allIds);
		setReadIds(next);
		try {
			localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
		} catch (e) {
			console.error("Gagal menyimpan status baca notifikasi:", e);
		}
	};

	const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
	const filteredNotifications =
		activeTab === "unread"
			? notifications.filter((n) => !readIds.has(n.id))
			: notifications;

	const getCategoryIcon = (category: NotificationItem["category"]) => {
		switch (category) {
			case "validation":
				return <Clock className="w-4 h-4 text-[#0556B3]" />;
			case "repair":
				return <Wrench className="w-4 h-4 text-[#B45309]" />;
			case "reuse":
				return <HandCoins className="w-4 h-4 text-[#059669]" />;
			case "disposal":
				return <Trash2 className="w-4 h-4 text-[#475569]" />;
			case "system":
			default:
				return <FileText className="w-4 h-4 text-[#0A356A]" />;
		}
	};

	const getCategoryBg = (category: NotificationItem["category"]) => {
		switch (category) {
			case "validation":
				return "bg-blue-50";
			case "repair":
				return "bg-amber-50";
			case "reuse":
				return "bg-emerald-50";
			case "disposal":
				return "bg-slate-100";
			case "system":
			default:
				return "bg-indigo-50";
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Bell Trigger Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="p-1.5 text-gray-500 hover:text-[#0A356A] hover:bg-gray-100 rounded-lg transition-colors relative focus:outline-none"
				aria-label="Buka notifikasi aktivitas"
				aria-expanded={isOpen}
			>
				<Bell className="w-5 h-5" />
				{unreadCount > 0 && (
					<span
						className="absolute top-0 right-0 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#DC2626] rounded-full border-2 border-white tabular-nums animate-in zoom-in-50 duration-200"
						title={`${unreadCount} notifikasi belum dibaca`}
					>
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown Popover */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
					{/* Header */}
					<div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between">
						<div className="flex items-center gap-2">
							<h3 className="text-[14px] font-bold text-[#0F172A]">Notifikasi</h3>
							{unreadCount > 0 && (
								<span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-[#0556B3] rounded-full tabular-nums">
									{unreadCount} baru
								</span>
							)}
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={fetchNotifications}
								disabled={isLoading}
								className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors disabled:opacity-50"
								title="Segarkan notifikasi dari database"
							>
								<RefreshCw
									className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
								/>
							</button>

							{unreadCount > 0 && (
								<button
									type="button"
									onClick={markAllAsRead}
									className="text-[11px] font-medium text-[#0556B3] hover:underline inline-flex items-center gap-1"
								>
									<CheckCheck className="w-3 h-3" />
									Tandai dibaca
								</button>
							)}
						</div>
					</div>

					{/* Tabs */}
					<div className="px-4 pt-2 border-b border-gray-100 bg-gray-50/70 flex gap-2">
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={`pb-2 text-[12px] font-semibold border-b-2 transition-colors ${
								activeTab === "all"
									? "border-[#0556B3] text-[#0556B3]"
									: "border-transparent text-gray-500 hover:text-gray-800"
							}`}
						>
							Semua ({notifications.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("unread")}
							className={`pb-2 text-[12px] font-semibold border-b-2 transition-colors ${
								activeTab === "unread"
									? "border-[#0556B3] text-[#0556B3]"
									: "border-transparent text-gray-500 hover:text-gray-800"
							}`}
						>
							Belum Dibaca ({unreadCount})
						</button>
					</div>

					{/* Notifications List */}
					<div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
						{isLoading && notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
								<Loader2 className="w-6 h-6 animate-spin text-[#0556B3] mb-2" />
								<p className="text-[12px]">Memuat data notifikasi dari database...</p>
							</div>
						) : filteredNotifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-10 px-4 text-center">
								<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
									{activeTab === "unread" ? (
										<CheckCircle2 className="w-5 h-5 text-[#059669]" />
									) : (
										<Inbox className="w-5 h-5" />
									)}
								</div>
								<p className="text-[13px] font-semibold text-gray-700">
									{activeTab === "unread"
										? "Semua notifikasi telah dibaca"
										: "Belum ada notifikasi"}
								</p>
								<p className="text-[11px] text-gray-500 mt-0.5 max-w-[240px]">
									{activeTab === "unread"
										? "Tidak ada antrean atau notifikasi baru yang belum dibuka."
										: "Aktivitas baru dari database sesuai peran Anda akan muncul di sini."}
								</p>
							</div>
						) : (
							filteredNotifications.map((notif) => {
								const isRead = readIds.has(notif.id);
								return (
									<Link
										key={notif.id}
										href={notif.href}
										onClick={() => {
											markAsRead(notif.id);
											setIsOpen(false);
										}}
										className={`block p-3.5 transition-colors hover:bg-gray-50 text-left ${
											!isRead ? "bg-blue-50/30" : ""
										}`}
									>
										<div className="flex items-start gap-3">
											{/* Icon Circle */}
											<div
												className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${getCategoryBg(
													notif.category,
												)}`}
											>
												{getCategoryIcon(notif.category)}
											</div>

											{/* Content */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-1 mb-0.5">
													<p
														className={`text-[12px] truncate ${
															!isRead
																? "font-bold text-[#0F172A]"
																: "font-semibold text-gray-800"
														}`}
													>
														{notif.title}
													</p>
													{!isRead && (
														<span className="w-2 h-2 rounded-full bg-[#0556B3] shrink-0"></span>
													)}
												</div>

												<p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
													{notif.message}
												</p>

												<div className="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-100/60">
													<span className="text-[10px] text-gray-400 tabular-nums">
														{formatRelativeTime(notif.timestamp)}
													</span>
													{notif.badgeText && (
														<span
															className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
															style={{
																backgroundColor: `${notif.badgeColor || "#64748B"}15`,
																color: notif.badgeColor || "#64748B",
															}}
														>
															{notif.badgeText}
														</span>
													)}
												</div>
											</div>
										</div>
									</Link>
								);
							})
						)}
					</div>

					{/* Footer */}
					{notifications.length > 0 && (
						<div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
							<p className="text-[11px] text-gray-500">
								Menampilkan data langsung dari database sesuai peran Anda
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
