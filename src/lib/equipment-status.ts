/**
 * Status alur perbaikan (backend database/seeder.go).
 *
 * Sengaja berbasis NAMA, bukan status_id: urutan id murni hasil seeder dan
 * pernah bikin dashboard salah hitung (id 6 dianggap "dalam perbaikan",
 * padahal 6 = READY_TO_USE). Backend selalu Preload("Status"), jadi nama ada.
 */

export const REPAIR_FLOW = [
	"REPAIR",
	"REPAIR_COMPLETED",
	"REVALIDATION",
	"READY_TO_USE",
	"SCRAP",
] as const;

export type RepairFlowStatus = (typeof REPAIR_FLOW)[number];

/** Nama alternatif yang masih dikirim data lama / halaman lain. */
const ALIASES: Record<string, RepairFlowStatus> = {
	MAINTENANCE: "REPAIR",
	DALAM_PERBAIKAN: "REPAIR",
	REVALIDASI: "REVALIDATION",
	"READY TO USE": "READY_TO_USE",
	READY_TO_REUSE: "READY_TO_USE",
};

/** Ambil status alur perbaikan dari record equipment; null = di luar alur ini. */
export function repairFlowStatus(equipment: {
	status?: { name?: string } | string | null;
	statusAset?: string | null;
}): RepairFlowStatus | null {
	const raw = String(
		(typeof equipment.status === "string"
			? equipment.status
			: equipment.status?.name) ||
			equipment.statusAset ||
			"",
	)
		.trim()
		.toUpperCase();
	if (!raw) return null;
	const name = ALIASES[raw] ?? raw;
	return (REPAIR_FLOW as readonly string[]).includes(name)
		? (name as RepairFlowStatus)
		: null;
}

export const REPAIR_STATUS_LABEL: Record<RepairFlowStatus, string> = {
	REPAIR: "Antrean Perbaikan",
	REPAIR_COMPLETED: "Menunggu Validasi Ulang",
	REVALIDATION: "Menunggu Persetujuan Rendal",
	READY_TO_USE: "Siap Digunakan",
	SCRAP: "Rekomendasi Scrap",
};

/**
 * Status aset kanonik = isi tabel `statuses` di backend (database/seeder.go).
 * UI menampilkan nama ini apa adanya; tidak ada lagi remap DISPOSAL->SCRAP,
 * IDLE->READY TO USE, dsb. yang dulu bikin halaman saling beda sebutan.
 */
export const EQUIPMENT_STATUS = [
	"REGISTERED",
	"VALIDATED",
	"REPAIR",
	"REPAIR_COMPLETED",
	"REVALIDATION",
	"READY_TO_USE",
	"REUSED",
	"DISPOSAL_RECOMMENDED",
	"SCRAP_REQUESTED",
	"SCRAP",
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[number];

/** Ejaan lama yang masih muncul di data/halaman -> nama kanonik backend. */
const STATUS_ALIASES: Record<string, EquipmentStatus> = {
	IDLE: "READY_TO_USE",
	READY_TO_REUSE: "READY_TO_USE",
	DALAM_PERBAIKAN: "REPAIR",
	MAINTENANCE: "REPAIR",
	REVALIDASI: "REVALIDATION",
	SCRAP_RECOMMENDED: "DISPOSAL_RECOMMENDED",
	SCRAP_RECOMENDED: "DISPOSAL_RECOMMENDED",
	SCRAP_REQUEST: "SCRAP_REQUESTED",
	"SCRAP REQUEST": "SCRAP_REQUESTED",
	RUSAK_BERAT: "SCRAP",
	CONDEMNED: "SCRAP",
	DISPOSED: "SCRAP",
};

/** Nama status kanonik dari nilai backend apa pun bentuknya (spasi/lowercase/alias). */
export function statusName(raw?: string | null): string {
	const key = String(raw ?? "")
		.trim()
		.toUpperCase()
		.replace(/\s+/g, "_");
	if (!key) return "";
	return STATUS_ALIASES[key] ?? key;
}

/** Teks badge: nama backend, underscore diganti spasi. Tidak mengganti istilah. */
export const statusText = (raw?: string | null) =>
	statusName(raw).replace(/_/g, " ");

/**
 * Kelompok status untuk kartu ringkasan/pie dashboard.
 * Satu definisi untuk semua role-view — menggantikan tiga salinan filter
 * magic-number (id === 1..8) yang dulu saling beda hasil.
 */
export type StatusGroup = "pending" | "repair" | "ready" | "scrap";

const STATUS_GROUP: Record<string, StatusGroup> = {
	REGISTERED: "pending",
	REPAIR: "repair",
	REPAIR_COMPLETED: "repair",
	REVALIDATION: "repair",
	REJECTED: "repair",
	VALIDATED: "ready",
	READY_TO_USE: "ready",
	REUSED: "ready",
	DISPOSAL_RECOMMENDED: "scrap",
	SCRAP_REQUESTED: "scrap",
	SCRAP_REQUEST: "scrap",
	SCRAP: "scrap",
};

/** Kelompok status equipment; null = status tidak dikenal/tidak ada. */
export function statusGroup(equipment: {
	status?: { name?: string } | string | null;
	statusAset?: string | null;
}): StatusGroup | null {
	const raw = String(
		(typeof equipment.status === "string"
			? equipment.status
			: equipment.status?.name) ||
			equipment.statusAset ||
			"",
	).trim();
	if (!raw) return null;
	return STATUS_GROUP[statusName(raw)] ?? null;
}

/**
 * Warna badge per status kanonik — DESIGN.md five-hue system.
 * Transparent fill, 1px border + text in the state hue:
 *   biru #0556B3 menunggu/proses berikutnya · amber #B45309 dalam pengerjaan
 *   hijau #059669 layak/disetujui · merah #DC2626 ditolak/tidak layak
 *   slate #475569 netral/disposal.
 */
const STATUS_BADGE_STYLE: Record<string, string> = {
	REGISTERED: "bg-[#E0F2FE] text-[#0284C7]",
	VALIDATED: "bg-[#DCFCE7] text-[#16A34A]",
	REPAIR: "bg-[#FEF3C7] text-[#B45309]",
	REPAIR_COMPLETED: "bg-[#CCFBF1] text-[#0F766E]",
	REVALIDATION: "bg-[#FEF3C7] text-[#B45309]",
	READY_TO_USE: "bg-[#E0E7FF] text-[#4F46E5]",
	REUSED: "bg-[#E0E7FF] text-[#4F46E5]",
	DISPOSAL_RECOMMENDED: "bg-[#FEF3C7] text-[#B45309]",
	SCRAP_REQUESTED: "bg-[#FEF3C7] text-[#B45309]",
	SCRAP_REQUEST: "bg-[#FEF3C7] text-[#B45309]",
	SCRAP: "bg-[#FEE2E2] text-[#DC2626]",
	REJECTED: "bg-[#FEE2E2] text-[#DC2626]",
};

export const statusBadgeStyle = (raw?: string | null) =>
	STATUS_BADGE_STYLE[statusName(raw)] ?? "bg-gray-100 text-gray-700";

export const rupiah = (value?: number | string | null) => {
	const num = Number(value);
	if (value == null || isNaN(num)) return "Rp 0";
	return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(num))}`;
};

/** Pemetaan kode SAP plant Pusri ke nama pabrik yang ramah pengguna. */
export const PLANT_NAME_MAP: Record<string, string> = {
	F001: "Pabrik IB",
	F002: "Pabrik IIB",
	F003: "Pabrik III",
	F004: "Pabrik IV",
	F005: "Pabrik V (NPK)",
	F601: "Utilitas / STG",
	F000: "Kantor Pusat",
};

/**
 * Mengambil kode plant langsung dari database (F001, F002, F003, F004, F005, F601, dsb).
 */
export function formatPlantDisplay(
	plantRaw: unknown,
	storageLocRaw?: unknown,
	plantDescRaw?: unknown,
): string {
	if (typeof plantRaw === "string" && plantRaw.trim() && plantRaw !== "-") {
		return plantRaw.trim();
	}
	if (plantRaw && typeof plantRaw === "object") {
		const obj = plantRaw as Record<string, unknown>;
		if (typeof obj.name === "string" && obj.name.trim() && obj.name !== "-") {
			return obj.name.trim();
		}
		if (typeof obj.code === "string" && obj.code.trim() && obj.code !== "-") {
			return obj.code.trim();
		}
		if (typeof obj.description === "string" && obj.description.trim() && obj.description !== "-") {
			return obj.description.trim();
		}
	}
	if (typeof plantDescRaw === "string" && plantDescRaw.trim() && plantDescRaw !== "-") {
		return plantDescRaw.trim();
	}
	return "-";
}

/**
 * Format teks kondisi alat tanpa underscore (misal: "RUSAK_RINGAN" -> "Rusak Ringan").
 */
export function formatCondition(val: unknown): string {
	if (val == null) return "-";
	let raw = "";
	if (typeof val === "string") {
		raw = val;
	} else if (typeof val === "object") {
		const obj = val as Record<string, unknown>;
		raw = String(obj.name || obj.description || "");
	}
	raw = raw.replace(/_/g, " ").trim();
	if (!raw || raw === "-") return "-";
	return raw
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}


