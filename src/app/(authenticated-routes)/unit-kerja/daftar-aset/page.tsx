import { getEquipments, getObjectTypes, getReuseRequests } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import DaftarAsetClient, { type EquipmentItem } from "./daftar-aset-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Unit Kerja hanya melihat aset siap pakai + yang sedang diperbaiki. */
const VISIBLE_STATUSES = ["READY_TO_USE", "REPAIR"];

/** Server Component — fetch + filter visibilitas + mapping murni di server. */
export default async function DaftarAsetPage() {
	const [rawEqList, objTypes, rawReuseRequests] = await Promise.all([
		getEquipments().catch(() => []),
		getObjectTypes().catch(() => []),
		getReuseRequests().catch(() => []),
	]);

	const requestedEqIdSet = new Set<string>();
	if (Array.isArray(rawReuseRequests)) {
		rawReuseRequests.forEach((req: any) => {
			if (req.equipment_id) requestedEqIdSet.add(String(req.equipment_id));
			if (req.equipmentId) requestedEqIdSet.add(String(req.equipmentId));
			if (req.equipment?.id) requestedEqIdSet.add(String(req.equipment.id));
			if (req.equipment_code)
				requestedEqIdSet.add(String(req.equipment_code).trim().toLowerCase());
			if (req.equipmentCode)
				requestedEqIdSet.add(String(req.equipmentCode).trim().toLowerCase());
			if (req.equipment?.equipment_code)
				requestedEqIdSet.add(
					String(req.equipment.equipment_code).trim().toLowerCase(),
				);
		});
	}

	let equipments: EquipmentItem[] = [];
	if (Array.isArray(rawEqList)) {
		equipments = rawEqList
			.filter((item: any) => {
				const isVisible = VISIBLE_STATUSES.includes(
					statusName(
						typeof item.status === "object" ? item.status?.name : item.status,
					),
				);
				if (!isVisible) return false;

				const itemId = String(item.id);
				const itemCode = String(item.equipment_code || item.kodeAlat || "")
					.trim()
					.toLowerCase();
				// Sembunyikan equipment yang sudah diajukan permintaan
				if (
					requestedEqIdSet.has(itemId) ||
					(itemCode && requestedEqIdSet.has(itemCode))
				) {
					return false;
				}
				return true;
			})
			.map((item: any): EquipmentItem => {
				let catName = "Peralatan Umum";
				if (typeof item.object_type?.name === "string")
					catName = item.object_type.name;
				else if (typeof item.objectType?.name === "string")
					catName = item.objectType.name;
				else if (typeof item.object_type_name === "string")
					catName = item.object_type_name;
				else if (item.object_type_id && objTypes) {
					const found = (objTypes as any[]).find(
						(o: any) => String(o.id) === String(item.object_type_id),
					);
					if (found && typeof found.name === "string") catName = found.name;
				}

				let plantStr = "STG & Boilers";
				if (typeof item.plant === "string") {
					plantStr = item.plant;
				} else if (item.plant && typeof item.plant === "object") {
					plantStr =
						item.plant.name ||
						item.plant.plant ||
						item.plant.description ||
						"STG & Boilers";
				}

				let storageLoc = "Gudang Utama Pusri";
				if (typeof item.storage_location === "string")
					storageLoc = item.storage_location;
				else if (item.storage_location && typeof item.storage_location === "object")
					storageLoc = item.storage_location.name || "Gudang Utama Pusri";

				// Nama status kanonik dari backend (lihat lib/equipment-status).
				const normalizedStatus = statusName(
					typeof item.status === "object" ? item.status?.name : item.status,
				);

				let conditionStr = "Baik";
				if (typeof item.condition === "object")
					conditionStr = item.condition?.name || "Baik";
				else if (typeof item.condition === "string") conditionStr = item.condition;

				return {
					id: String(item.id),
					equipment_code: String(
						item.equipment_code || item.kodeAlat || `EQ-${item.id}`,
					),
					name: String(item.name || item.namaAlat || "Equipment Tanpa Nama"),
					plant: plantStr,
					object_type_name: String(catName),
					status_name: normalizedStatus,
					condition_name: conditionStr.replace(/_/g, " "),
					storage_location: String(storageLoc),
					serial_number: String(item.serial_number || "SN-2026-X89"),
					vendor: String(item.vendor || item.manufacturer || "PT Utama Engineering"),
					year_of_purchase: Number(item.year_of_purchase) || 2020,
					book_value: Number(item.book_value) || 120000000,
					specifications: String(
						item.specifications ||
							item.specification ||
							item.description ||
							"Spesifikasi standar operasional pabrik",
					),
					capacity: String(item.capacity || "-"),
					notes: item.notes || "-",
					created_at: item.created_at || "-",
					// Foto aset utk katalog (normalizeEquipment membaca field ini).
					attachments: item.attachments,
				};
			});

		equipments.sort((a, b) => {
			const priorityA = a.status_name === "READY_TO_USE" ? 0 : 1;
			const priorityB = b.status_name === "READY_TO_USE" ? 0 : 1;
			if (priorityA !== priorityB) return priorityA - priorityB;

			const timeA =
				a.created_at && a.created_at !== "-" ? new Date(a.created_at).getTime() : 0;
			const timeB =
				b.created_at && b.created_at !== "-" ? new Date(b.created_at).getTime() : 0;
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});
	}

	return <DaftarAsetClient equipments={equipments} />;
}
