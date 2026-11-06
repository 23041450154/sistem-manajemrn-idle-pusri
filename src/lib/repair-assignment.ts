/**
 * US-06-FE: Modul Manajemen Penugasan & Biaya Perbaikan (Refurbishment Cost).
 * Mengatur alur penugasan perbaikan (Internal Pemeliharaan Lapangan vs Vendor Pihak Ketiga),
 * resolusi rekomendasi & estimasi biaya inspeksi, serta persistensi audit trail.
 */

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type RepairExecutor = "INTERNAL" | "VENDOR";

export interface RepairAuditLogEntry {
	assignedAt: string;
	assignedBy: string;
	executor: RepairExecutor;
	vendorName?: string;
	contractNumber?: string;
	refurbishmentCost: number;
	workNotes?: string;
}

export interface RepairAssignment {
	equipmentId: string;
	refurbishmentCost: number;
	executor: RepairExecutor;
	vendorName?: string;
	contractNumber?: string;
	workNotes?: string;
	status: "REPAIR" | "REPAIR_VENDOR" | string;
	assignedAt: string;
	assignedBy: string;
	history: RepairAuditLogEntry[];
}

export const COMMON_REPAIR_VENDORS = [
	"PT ABB Indonesia",
	"PT Yokogawa Indonesia",
	"PT Ebara Indonesia",
	"PT KSB Indonesia",
	"PT Siemens Indonesia",
	"PT Schneider Electric Indonesia",
	"PT Sulzer Indonesia",
	"PT Flowserve Indonesia",
	"PT Timas Suplindo",
	"PT Barata Indonesia",
];

const STORAGE_KEY = "idle_repair_assignments";

/**
 * Mengambil seluruh data penugasan perbaikan yang tersimpan di browser storage.
 */
export function getSavedRepairAssignments(): Record<string, RepairAssignment> {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch (e) {
		console.warn("Gagal membaca idle_repair_assignments dari storage:", e);
		return {};
	}
}

/**
 * Mengambil penugasan perbaikan untuk satu peralatan tertentu.
 */
export function getSavedRepairAssignment(
	equipmentId: string | number,
): RepairAssignment | null {
	const assignments = getSavedRepairAssignments();
	return assignments[String(equipmentId)] || null;
}

/**
 * Menyimpan data penugasan perbaikan ke browser persistent storage.
 */
export function saveRepairAssignment(assignment: RepairAssignment): void {
	if (typeof window === "undefined") return;
	try {
		const existing = getSavedRepairAssignments();
		const current = existing[assignment.equipmentId];
		const updatedHistory = current?.history ? [...current.history] : [];

		const newEntry: RepairAuditLogEntry = {
			assignedAt: assignment.assignedAt,
			assignedBy: assignment.assignedBy,
			executor: assignment.executor,
			vendorName: assignment.vendorName,
			contractNumber: assignment.contractNumber,
			refurbishmentCost: assignment.refurbishmentCost,
			workNotes: assignment.workNotes,
		};

		updatedHistory.unshift(newEntry);

		existing[assignment.equipmentId] = {
			...assignment,
			history: updatedHistory,
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
	} catch (e) {
		console.warn("Gagal menyimpan idle_repair_assignments ke storage:", e);
	}
}

/**
 * Mengambil rekomendasi tindak lanjut inspeksi dari data validasi / inspeksi berkala / aset.
 */
export function resolveRepairRecommendation(
	item: any,
	validation?: any,
	inspection?: any,
): string {
	if (item?.rekomendasi_inspeksi) return String(item.rekomendasi_inspeksi);
	if (item?.rekomendasiInspeksi) return String(item.rekomendasiInspeksi);
	if (validation?.followup_recommendation)
		return String(validation.followup_recommendation);
	if (inspection?.followup_recommendation)
		return String(inspection.followup_recommendation);
	if (inspection?.recommendation) return String(inspection.recommendation);
	if (inspection?.require_action?.name)
		return String(inspection.require_action.name);

	const conditionStr = String(
		item?.condition?.name ||
			item?.condition ||
			item?.kondisi ||
			item?.inspection_condition ||
			"",
	).toUpperCase();

	if (
		conditionStr.includes("RUSAK_RINGAN") ||
		conditionStr.includes("RUSAK RINGAN")
	) {
		return "Perbaikan Ringan";
	}
	if (
		conditionStr.includes("RUSAK_SEDANG") ||
		conditionStr.includes("RUSAK SEDANG")
	) {
		return "Perbaikan Sedang / Overhaul";
	}
	if (
		conditionStr.includes("RUSAK_BERAT") ||
		conditionStr.includes("RUSAK BERAT")
	) {
		return "Perbaikan Berat / Overhaul";
	}
	if (
		conditionStr.includes("BAIK") ||
		conditionStr.includes("BAGUS") ||
		conditionStr.includes("SIAP") ||
		conditionStr.includes("NORMAL")
	) {
		return "Siap Pakai";
	}

	const st = String(item?.status?.name || item?.status || "").toUpperCase();
	if (st === "VALIDATED" || st === "READY_TO_USE") {
		return "Siap Pakai";
	}
	if (st.includes("REPAIR") || st.includes("PERBAIKAN")) {
		return "Perbaikan Ringan";
	}

	return "-";
}

/**
 * Mengambil estimasi biaya inspeksi (sebagai bahan referensi pembanding bagi Rendal).
 */
export function resolveInspectionEstimatedCost(
	item: any,
	validation?: any,
	inspection?: any,
): number {
	const raw =
		validation?.estimated_cost ??
		validation?.estimated_repair_cost ??
		inspection?.estimated_cost ??
		inspection?.estimated_repair_cost ??
		item?.estimated_repair_cost ??
		item?.estimasiBiayaInspeksi ??
		item?.estimasi_biaya_inspeksi;

	if (raw && Number(raw) > 0) {
		return Number(raw);
	}

	// Referensi fallback proporsional jika belum tercatat di data backend
	const baseVal = Number(
		item?.estimated_reuse_value ||
			item?.estimatedReuseValue ||
			item?.book_value ||
			item?.bookValue ||
			item?.original_value ||
			item?.originalValue ||
			0,
	);

	if (baseVal > 0) {
		const est = Math.round((baseVal * 0.1) / 500000) * 500000;
		return Math.max(est, 5000000);
	}

	return 15000000; // Standar referensi: Rp 15.000.000
}

/**
 * Format angka nominal ke format Rupiah display standar (mis. Rp 15.000.000).
 */
export function formatRupiah(val: number | string | null | undefined): string {
	if (val === null || val === undefined || val === "") return "Rp 0";
	const num =
		typeof val === "number"
			? val
			: Number(String(val).replace(/\D/g, ""));
	if (isNaN(num)) return "Rp 0";
	return `Rp ${new Intl.NumberFormat("id-ID").format(num)}`;
}

/**
 * Format string/angka ke format Rupiah otomatis (Rp 15.000.000).
 */
export function formatRupiahInput(val: string | number): string {
	if (val === "" || val === null || val === undefined) return "";
	const digits = String(val).replace(/\D/g, "");
	if (!digits) return "";
	const num = parseInt(digits, 10);
	if (isNaN(num)) return "";
	return `Rp ${new Intl.NumberFormat("id-ID").format(num)}`;
}

/**
 * Mengekstrak nilai angka integer dari string berformat Rupiah.
 */
export function parseRupiahInput(formatted: string): number {
	if (!formatted) return 0;
	const digits = formatted.replace(/\D/g, "");
	return parseInt(digits, 10) || 0;
}
