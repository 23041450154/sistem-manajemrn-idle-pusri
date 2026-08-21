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
	status?: { name?: string } | null;
	statusAset?: string | null;
}): RepairFlowStatus | null {
	const raw = String(equipment.status?.name || equipment.statusAset || "")
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
 * Warna badge per status kanonik. Sudah termasuk `border-*` supaya halaman yang
 * pakai varian ber-border maupun tanpa border bisa memakai map yang sama.
 */
export const STATUS_BADGE_STYLE: Record<string, string> = {
	REGISTERED: "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]",
	VALIDATED: "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]",
	REPAIR: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
	REPAIR_COMPLETED: "bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]",
	REVALIDATION: "bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]",
	READY_TO_USE: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]",
	REUSED: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]",
	DISPOSAL_RECOMMENDED: "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]",
	SCRAP: "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]",
};

export const statusBadgeStyle = (raw?: string | null) =>
	STATUS_BADGE_STYLE[statusName(raw)] ??
	"bg-gray-100 text-gray-700 border-gray-200";

export const rupiah = (value: number) =>
	`Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;
