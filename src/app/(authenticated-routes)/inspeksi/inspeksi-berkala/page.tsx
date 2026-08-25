import { getEquipments, getInspections } from "@/action/api";
import { inspectionQueue } from "@/lib/inspection-schedule";
import InspeksiBerkalaClient, {
	type Equipment,
	type InspectionItem,
} from "./inspeksi-berkala-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — antrean (via inspectionQueue) & riwayat inspeksi dipetakan di server. */
export default async function InspeksiAntreanPage() {
	const [resultEq, resultInsp] = await Promise.all([
		getEquipments().catch(() => []),
		getInspections().catch(() => []),
	]);

	const allInspections = Array.isArray(resultInsp) ? resultInsp : [];

	let antrean: Equipment[] = [];
	if (Array.isArray(resultEq) && resultEq.length > 0) {
		// Semua aset READY_TO_USE tetap terdaftar; yang berubah setelah diinspeksi
		// hanyalah kolom "Inspeksi Terakhir". Interval berbeda per equipment, jadi
		// tidak ada aset yang dibuang otomatis dari daftar.
		const queue = inspectionQueue(resultEq as Equipment[], allInspections);
		queue.sort((a: any, b: any) => {
			const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
			const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});
		antrean = queue;
	}

	let riwayat: InspectionItem[] = [];
	if (allInspections.length > 0) {
		riwayat = allInspections.map((ins: any): InspectionItem => {
			const eq = ins.equipment || {};
			let plantStr = "-";
			if (typeof eq.plant === "string") plantStr = eq.plant;
			else if (eq.plant?.name) plantStr = eq.plant.name;
			else if (eq.plant_description) plantStr = String(eq.plant_description);

			let typeStr = "-";
			if (typeof eq.object_type === "string") typeStr = eq.object_type;
			else if (eq.object_type?.name) typeStr = eq.object_type.name;
			else if (ins.object_type_name) typeStr = ins.object_type_name;

			// Kondisi = snapshot per-inspeksi (condition_id baru di backend).
			// Data lama sebelum migrasi belum punya snapshot → derive dari
			// require action, sesuai mapping master require_actions.
			const requireActionName =
				ins.require_action?.name || ins.require_action_name || "";
			const kondisiDariAksi: Record<string, string> = {
				"Siap Pakai": "BAGUS",
				"Perbaikan Ringan": "RUSAK_RINGAN",
				Overhaul: "RUSAK_SEDANG",
				Disposal: "RUSAK_BERAT",
			};

			return {
				id: ins.id,
				equipment_id: ins.equipment_id,
				equipment_code:
					ins.equipment_code || eq.equipment_code || `EQ-${ins.equipment_id}`,
				equipment_name: ins.equipment_name || eq.name || "Equipment Tanpa Nama",
				plant: plantStr,
				object_type: typeStr,
				inspection_date:
					ins.inspection_date || ins.created_at || new Date().toISOString(),
				notes: ins.notes || ins.summary || "Inspeksi berkala selesai.",
				condition_name:
					ins.condition?.name ||
					ins.condition_name ||
					kondisiDariAksi[requireActionName] ||
					"-",
				require_action_name:
					ins.require_action?.name || ins.require_action_name || "-",
				status_name: "Selesai",
			};
		});
		riwayat.sort((a, b) => {
			const timeA = a.inspection_date ? new Date(a.inspection_date).getTime() : 0;
			const timeB = b.inspection_date ? new Date(b.inspection_date).getTime() : 0;
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});
	}

	return <InspeksiBerkalaClient antrean={antrean} riwayat={riwayat} />;
}
