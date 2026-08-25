import { getEquipments } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import InspeksiValidasiUlangClient, {
	type RevalidasiItem,
} from "./validasi-ulang-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Status yang tampil di halaman ini (nama kanonik hasil statusName()). */
const INCLUDED_STATUSES = [
	"REPAIR_COMPLETED",
	"REVALIDATION",
	"REVALIDASI", // ejaan lama yang masih ada di data lama
	"READY_TO_USE",
	"SCRAP",
	"DISPOSAL_VERIFIED",
	"DISPOSAL_RECOMMENDED",
];

/** Server Component — fetch + filter visibilitas + mapping murni di server.
 * Pengganti salinan filter magic-number status_id === 4/5/6/8. */
export default async function ValidasiUlangPage() {
	const data = await getEquipments().catch(() => []);

	const items: RevalidasiItem[] = (Array.isArray(data) ? data : [])
		.filter((item: any) => {
			const s = statusName(String(item.status?.name || item.statusAset || ""));
			return INCLUDED_STATUSES.includes(s);
		})
		.map((item: any): RevalidasiItem => {
			const plantStr =
				typeof item.plant === "string"
					? item.plant
					: item.plant?.name || item.plant?.description || "-";
			const storageStr =
				typeof item.storage_location === "string"
					? item.storage_location
					: item.storage_location?.name || "-";
			const objectTypeStr =
				typeof item.object_type === "string"
					? item.object_type
					: item.object_type?.name || "-";
			const conditionStr =
				typeof item.condition === "string"
					? item.condition
					: item.condition?.name || "-";

			return {
				id: String(item.id),
				kodeAlat: item.equipment_code || item.kodeAlat || "-",
				namaAlat:
					typeof item.name === "string"
						? item.name
						: item.name?.name || item.namaAlat || "-",
				tipeObjek: objectTypeStr,
				plant: plantStr,
				lokasiPenyimpanan: storageStr,
				kondisiSebelumnya: conditionStr.replace(/_/g, " "),
				tanggalSelesai: item.updated_at
					? new Date(item.updated_at).toISOString().split("T")[0]
					: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
				statusAset: statusName(String(item.status?.name || item.statusAset || "")),
				catatan: item.notes || item.description || "-",
				vendor: item.vendor || item.manufacture || "-",
				serialNumber: item.serial_number || item.no_seri || "-",
				tahun: item.year || item.tahun || "-",
				alasanIdle: item.idle_reason || item.alasan_idle || "-",
			};
		});

	items.sort((a, b) => {
		const timeA =
			a.tanggalSelesai && a.tanggalSelesai !== "-"
				? new Date(a.tanggalSelesai).getTime()
				: 0;
		const timeB =
			b.tanggalSelesai && b.tanggalSelesai !== "-"
				? new Date(b.tanggalSelesai).getTime()
				: 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <InspeksiValidasiUlangClient items={items} />;
}
