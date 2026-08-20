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

export const rupiah = (value: number) =>
	`Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;
