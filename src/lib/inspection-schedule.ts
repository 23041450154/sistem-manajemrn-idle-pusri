/* ponytail: tidak ada perhitungan jatuh tempo di sini. Interval inspeksi berbeda
   per equipment dan tidak ada di backend (models/equipment_model.go tak punya kolom
   interval / next_inspection_date), jadi modul ini hanya melaporkan fakta yang ada:
   kapan sebuah aset terakhir diinspeksi. Inspektor yang memutuskan kapan perlu
   diperiksa lagi.
   Upgrade path: kalau backend menambah interval per equipment / object_type,
   tambahkan filter jatuh tempo di sini — jangan menebak angkanya di UI. */

/* Hanya READY_TO_USE. Itu satu-satunya status yang diterima CreateInspection
   (controllers/inspection_controller.go: "Equipment tidak siap digunakan"), dan
   status IDLE tidak ada di database/seeder.go. */
const INSPECTABLE_STATUS = "READY_TO_USE";

type StatusLike = string | { name?: string | null } | null | undefined;

export function statusName(status: StatusLike): string {
	if (typeof status === "string") return status;
	return status?.name ?? "";
}

export interface InspectionLike {
	equipment_id?: string | number | null;
	equipment?: { id?: string | number | null } | null;
	inspection_date?: string | null;
	created_at?: string | null;
}

export interface EquipmentLike {
	id: string | number;
	status?: StatusLike;
}

export interface LastInspection {
	/** ISO tanggal inspeksi terakhir, atau null kalau belum pernah diinspeksi. */
	last_inspection_date: string | null;
}

/** Timestamp inspeksi terbaru per equipment id. */
function latestInspectionByEquipment(
	inspections: InspectionLike[],
): Map<string, number> {
	const latest = new Map<string, number>();

	for (const ins of inspections) {
		const rawId = ins.equipment_id ?? ins.equipment?.id;
		if (rawId === null || rawId === undefined || rawId === "") continue;

		const at = Date.parse(ins.inspection_date || ins.created_at || "");
		if (Number.isNaN(at)) continue;

		const key = String(rawId);
		const prev = latest.get(key);
		if (prev === undefined || at > prev) latest.set(key, at);
	}

	return latest;
}

/**
 * Antrean inspeksi: aset READY_TO_USE yang belum pernah dilakukan tindakan inspeksi.
 * Aset yang sudah pernah diinspeksi otomatis berpindah ke tab Riwayat Inspeksi.
 */
export function inspectionQueue<T extends EquipmentLike>(
	equipments: T[],
	inspections: InspectionLike[],
): Array<T & LastInspection> {
	const latest = latestInspectionByEquipment(inspections);

	return equipments
		.filter((eq) => {
			if (statusName(eq.status) !== INSPECTABLE_STATUS) return false;
			const hasInspection = latest.has(String(eq.id));
			return !hasInspection;
		})
		.map((eq) => {
			const last = latest.get(String(eq.id));
			return {
				...eq,
				last_inspection_date:
					last === undefined ? null : new Date(last).toISOString(),
			};
		});
}
