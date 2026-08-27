import { getEquipments } from "@/action/api";
import { repairFlowStatus } from "@/lib/equipment-status";
import PerbaikanAlatClient, {
	type MaintenanceEquipment,
} from "./perbaikan-alat-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Lampiran equipment bisa berupa dokumen; galeri hanya menampilkan berkas gambar. */
const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?.*)?$/i;

/** Server Component — fetch sekali di server, mapping murni, lalu pass ke client. */
export default async function PerbaikanAlatPage() {
	// Action sudah balik [] saat HTTP gagal; .catch hanya jaring pengaman error tak terduga.
	const data = await getEquipments().catch(() => []);

	const equipments: MaintenanceEquipment[] = (
		Array.isArray(data) ? data : []
	).flatMap((item: any): MaintenanceEquipment[] => {
		const status = repairFlowStatus(item);
		if (!status) return [];

		const pick = (val: any, fallback = "-") =>
			typeof val === "string" ? val : val?.name || val?.description || fallback;

		const stamp = item.updated_at || item.created_at;
		const money = (val: any) => Number(val) || 0;
		const dateOnly = (val: any) =>
			val ? new Date(val).toISOString().split("T")[0] : "—";

		return [
			{
				id: String(item.id),
				kodeAlat: item.equipment_code || "-",
				namaAlat: pick(item.name),
				tipeObjek: pick(item.object_type),
				plant: pick(item.plant),
				lokasiPenyimpanan: pick(item.storage_location),
				kondisi: pick(item.condition).replace(/_/g, " "),
				terakhirDiperbarui: (stamp ? new Date(stamp) : new Date())
					.toISOString()
					.split("T")[0],
				status,
				funcLoc: pick(item.func_loc),
				vendor: pick(item.vendor),
				tahun: Number(item.year) || 0,
				nilaiPerolehan: money(item.original_value),
				nilaiBuku: money(item.book_value),
				estimasiNilaiGunaUlang: money(item.estimated_reuse_value),
				idleSejak: dateOnly(item.idle_since),
				alasanIdle: pick(item.idle_reason),
				catatan: pick(item.notes, ""),
				foto: (Array.isArray(item.attachments) ? item.attachments : [])
					.map((a: any) => a?.file_url || a?.fileUrl || a?.url || "")
					.filter((url: string) => IMAGE_FILE.test(url)),
			},
		];
	});

	equipments.sort((a, b) => {
		const timeA =
			a.terakhirDiperbarui && a.terakhirDiperbarui !== "—"
				? new Date(a.terakhirDiperbarui).getTime()
				: 0;
		const timeB =
			b.terakhirDiperbarui && b.terakhirDiperbarui !== "—"
				? new Date(b.terakhirDiperbarui).getTime()
				: 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <PerbaikanAlatClient equipments={equipments} />;
}
