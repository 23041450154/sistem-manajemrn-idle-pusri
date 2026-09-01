import {
	getEquipments,
	getApprovals,
	getPlants,
	getObjectTypes,
	getConditions,
	getStorageLocations,
} from "@/action/api";
import {
	statusName as canonStatus,
	formatCondition,
} from "@/lib/equipment-status";
import RendalValidasiUlangClient, {
	type ValidasiUlangItem,
} from "./validasi-ulang-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

/** Server Component — fetch + mapping murni di server, interaksi di client. */
export default async function RendalValidasiUlangPage() {
	const [
		data,
		approvalsData,
		plantsData,
		objTypesData,
		conditionsData,
		storageLocationsData,
	] = await Promise.all([
		getEquipments().catch(() => []),
		// Halaman ini menangani validasi ulang -> approval jenis REVALIDATION.
		getApprovals("revalidation").catch(() => []),
		getPlants().catch(() => []),
		getObjectTypes().catch(() => []),
		getConditions().catch(() => []),
		getStorageLocations().catch(() => []),
	]);

	const plants = Array.isArray(plantsData) ? plantsData : [];
	const objTypes = Array.isArray(objTypesData) ? objTypesData : [];
	const conditions = Array.isArray(conditionsData) ? conditionsData : [];
	const storageLocations = Array.isArray(storageLocationsData)
		? storageLocationsData
		: [];

	// Map untuk lookup cepat dari database master data
	const plantMap = new Map<string | number, any>();
	plants.forEach((p: any) => {
		if (p.id != null) {
			plantMap.set(p.id, p);
			plantMap.set(Number(p.id), p);
			plantMap.set(String(p.id), p);
		}
		if (p.name) plantMap.set(p.name, p);
	});

	const objTypeMap = new Map<string | number, any>();
	objTypes.forEach((o: any) => {
		if (o.id != null) {
			objTypeMap.set(o.id, o);
			objTypeMap.set(Number(o.id), o);
			objTypeMap.set(String(o.id), o);
		}
		if (o.name) objTypeMap.set(o.name, o);
	});

	const storageLocMap = new Map<string | number, any>();
	storageLocations.forEach((s: any) => {
		if (s.id != null) {
			storageLocMap.set(s.id, s);
			storageLocMap.set(Number(s.id), s);
			storageLocMap.set(String(s.id), s);
		}
		if (s.name) storageLocMap.set(s.name, s);
	});

	const conditionMap = new Map<string | number, any>();
	conditions.forEach((c: any) => {
		if (c.id != null) {
			conditionMap.set(c.id, c);
			conditionMap.set(Number(c.id), c);
			conditionMap.set(String(c.id), c);
		}
		if (c.name) conditionMap.set(c.name, c);
	});

	const approvalsRaw = (approvalsData as any)?.data;
	const approvalsList: any[] = Array.isArray(approvalsData)
		? approvalsData
		: Array.isArray(approvalsRaw)
			? approvalsRaw
			: [];

	const approvalsEquipmentIdSet = new Set(
		approvalsList
			.map((a: any) =>
				String(a.equipment_id || a.equipment?.id || a.reference_id || ""),
			)
			.filter(Boolean),
	);

	const items: ValidasiUlangItem[] = (Array.isArray(data) ? data : [])
		.filter((item: any) => {
			const s = canonStatus(item.status?.name || item.statusAset || item.status);
			const isRevalStatus =
				s === "REVALIDATION" ||
				s === "REVALIDASI" ||
				s === "REPAIR_COMPLETED" ||
				s === "READY_TO_USE";
			const hasApproval = approvalsEquipmentIdSet.has(String(item.id));
			return isRevalStatus || hasApproval;
		})
		.map((item: any): ValidasiUlangItem => {
			// 1. Ambil plant dari database relasi / lookup master plant
			let plantStr = "-";
			if (typeof item.plant === "string" && item.plant.trim() && item.plant !== "-") {
				plantStr = item.plant;
			} else if (item.plant?.name || item.plant?.description) {
				plantStr = item.plant.name || item.plant.description;
			} else {
				const pId = item.plant_id ?? item.plantId ?? item.id_plant;
				if (pId != null && plantMap.has(pId)) {
					const p = plantMap.get(pId);
					plantStr = p.name || p.description || "-";
				}
			}

			// 2. Ambil tipe objek dari database relasi / lookup master object type
			let objectTypeStr = "-";
			if (typeof item.object_type === "string" && item.object_type.trim() && item.object_type !== "-") {
				objectTypeStr = item.object_type;
			} else if (item.object_type?.name) {
				objectTypeStr = item.object_type.name;
			} else if (item.objectType?.name) {
				objectTypeStr = item.objectType.name;
			} else {
				const otId = item.object_type_id ?? item.objectTypeId ?? item.id_object_type;
				if (otId != null && objTypeMap.has(otId)) {
					const ot = objTypeMap.get(otId);
					objectTypeStr = ot.name || "-";
				}
			}

			// 3. Ambil lokasi penyimpanan dari database relasi / lookup master storage location
			let storageStr = "-";
			if (typeof item.storage_location === "string" && item.storage_location.trim() && item.storage_location !== "-") {
				storageStr = item.storage_location;
			} else if (item.storage_location?.name || item.storage_location?.description) {
				storageStr = item.storage_location.name || item.storage_location.description;
			} else if (item.storageLocation?.name) {
				storageStr = item.storageLocation.name;
			} else {
				const slId = item.storage_location_id ?? item.storageLocationId ?? item.id_storage_location;
				if (slId != null && storageLocMap.has(slId)) {
					const sl = storageLocMap.get(slId);
					storageStr = sl.name || sl.description || "-";
				}
			}

			// 4. Ambil kondisi dari database relasi / lookup master condition
			let conditionRaw = item.condition;
			if (!conditionRaw && (item.condition_id != null || item.conditionId != null || item.id_condition != null)) {
				const cId = item.condition_id ?? item.conditionId ?? item.id_condition;
				if (conditionMap.has(cId)) {
					conditionRaw = conditionMap.get(cId);
				}
			}
			const conditionStr = formatCondition(conditionRaw) || "Bagus";

			const statusName = canonStatus(
				item.status?.name || item.statusAset || item.status || "",
			);
			const isReady = statusName === "READY_TO_USE";

			const matchingApproval = approvalsList.find(
				(a: any) =>
					String(a.equipment_id) === String(item.id) ||
					String(a.equipment?.id) === String(item.id) ||
					String(a.reference_id) === String(item.id),
			);

			const displayStatus = isReady ? "READY_TO_USE" : statusName || "REVALIDATION";

			const approvalStatus =
				matchingApproval?.approval_status ||
				matchingApproval?.status ||
				(isReady ? "APPROVED" : "PENDING");

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
				kondisi: conditionStr,
				tanggalRevalidasi: item.updated_at
					? new Date(item.updated_at).toISOString().split("T")[0]
					: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
				statusAset: displayStatus,
				approvalId: matchingApproval?.id ? String(matchingApproval.id) : undefined,
				approvalStatus: approvalStatus,
				catatanInspeksi:
					item.notes || "Hasil validasi ulang menunjukkan kondisi alat siap pakai.",
			};
		});

	items.sort((a, b) => {
		const timeA = a.tanggalRevalidasi
			? new Date(a.tanggalRevalidasi).getTime()
			: 0;
		const timeB = b.tanggalRevalidasi
			? new Date(b.tanggalRevalidasi).getTime()
			: 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return (
		<RendalValidasiUlangClient
			items={items}
			plants={plants}
			objectTypes={objTypes}
			conditions={conditions}
			storageLocations={storageLocations}
		/>
	);
}
