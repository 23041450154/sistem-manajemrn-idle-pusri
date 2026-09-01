import { getEquipments, getObjectTypes, getPlants } from "@/action/api";
import {
	EQUIPMENT_STATUS,
	formatPlantDisplay,
	statusGroup,
	statusName,
} from "@/lib/equipment-status";
import RendalIdleClient, {
	type AssetState,
	type Equipment,
} from "./idle-client";

/** String status apa pun -> union AssetState; di luar daftar kanonik jatuh ke REGISTERED. */
const assetState = (raw: string): AssetState =>
	(EQUIPMENT_STATUS as readonly string[]).includes(raw)
		? (raw as AssetState)
		: "REGISTERED";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

/** Server Component — fetch + mapping di server, interaksi/filter di client. */
export default async function RendalIdlePage() {
	const [data, objTypes, plantsData] = await Promise.all([
		getEquipments().catch(() => []),
		getObjectTypes().catch(() => []),
		getPlants().catch(() => []),
	]);

	const plants = Array.isArray(plantsData) ? plantsData : [];

	(Array.isArray(data) ? data : []).sort((a: any, b: any) => {
		const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
		const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
		if (timeB !== timeA) return timeB - timeA;
		const idA = Number(a.id) || 0;
		const idB = Number(b.id) || 0;
		return idB - idA;
	});

	const equipments: Equipment[] = (Array.isArray(data) ? data : [])
		.map((item: any): Equipment => {
			let objectTypeName = "Belum Ditentukan";
			if (item.object_type?.name) {
				objectTypeName = item.object_type.name;
			} else if (item.objectType?.name) {
				objectTypeName = item.objectType.name;
			} else {
				const otId =
					item.id_object_type || item.object_type_id || item.objectTypeId;
				if (otId && objTypes) {
					const found = (objTypes as any[]).find(
						(o) => o.id === otId || o.id === Number(otId),
					);
					if (found) objectTypeName = found.name;
				}
			}

			const rawStatus =
				(typeof item.status === "string" ? item.status : item.status?.name) || "";
			const statusStr = assetState(statusName(rawStatus));

			const plantFormatted = formatPlantDisplay(
				item.plant,
				item.storage_location,
				item.plant_description,
			);

			return {
				id: item.id?.toString() || "-",
				kodeAlat: item.equipment_code || item.kodeAlat || `EQ-${item.id}`,
				namaAlat: item.name || item.namaAlat || "Equipment Tanpa Nama",
				plant: plantFormatted,
				jenisAlat: objectTypeName,
				tanggalRegistrasi: item.created_at
					? new Date(item.created_at).toISOString().split("T")[0]
					: "-",
				createdAt: item.created_at || "",
				statusAset: statusStr,
				storageLocation:
					(typeof item.storage_location === "object"
						? item.storage_location?.name
						: item.storage_location) || "Belum Ditentukan",
				funcLoc:
					typeof item.func_loc === "string"
						? item.func_loc
						: item.func_loc?.name || "-",
				vendor: item.vendor || "-",
				year: item.year || item.year_of_purchase || "-",
				// ponytail: fallback book_value dihapus — nilai perolehan ≠ nilai buku.
				// bookValue & estimatedReuseValue ditampilkan di modal Detail Aset Idle.
				originalValue: item.original_value || 0,
				bookValue: item.book_value || 0,
				estimatedReuseValue: item.estimated_reuse_value || 0,
				notes: item.notes || "-",
				idleReason: item.idle_reason || "-",
				photos: item.attachments
					? item.attachments
							.filter(
								(att: any) =>
									att.attachment_category === "equipment_photo" ||
									att.attachment_category === "photo" ||
									att.category === "equipment_photo" ||
									att.category === "photo",
							)
							.map((att: any) => {
								const url = att.file_url || att.fileUrl || "";
								return url.replace(/\\/g, "/");
							})
					: [],
			};
		});

	return <RendalIdleClient equipments={equipments} plants={plants} />;
}
