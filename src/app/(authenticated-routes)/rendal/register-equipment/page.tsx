import {
	getEquipmentCodes,
	getEquipments,
	getFunctionalLocations,
	getObjectTypes,
	getPlants,
	getStorageLocations,
} from "@/action/api";
import RegisterEquipmentClient, {
	type RegisterInitialData,
} from "./register-equipment-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — master dropdown & nilai awal mode revisi di-fetch di server. */
export default async function RegisterEquipmentPage({
	searchParams,
}: {
	searchParams: Promise<{ editId?: string }>;
}) {
	const { editId } = await searchParams;

	const [
		objs,
		plantsList,
		storageLocList,
		funcLocList,
		equipments,
		initialEquipmentCodes,
	] = await Promise.all([
		getObjectTypes().catch(() => []),
		getPlants().catch(() => []),
		getStorageLocations().catch(() => []),
		getFunctionalLocations().catch(() => []),
		getEquipments().catch(() => [] as any[]),
		getEquipmentCodes().catch(() => []),
	]);

	let initialData: RegisterInitialData | null = null;
	if (editId) {
		const found = equipments.find((item: any) => String(item.id) === editId);
		if (found) {
			initialData = {
				equipmentCode: found.equipment_code || "",
				name: found.name || "",
				funcLocId: String(
					found.func_loc_id || found.id_func_loc || found.func_loc?.id || "",
				),
				plantId: String(found.id_plant || ""),
				objectTypeId: String(
					found.object_type_id ||
						found.id_object_type ||
						found.object_type?.id ||
						"",
				),
				vendor: found.vendor || "",
				year: found.year ? String(found.year) : "",
				originalValue: found.original_value
					? Number(found.original_value).toLocaleString("id-ID")
					: "",
				bookValue: found.book_value
					? Number(found.book_value).toLocaleString("id-ID")
					: "",
				estimatedReuseValue: found.estimated_reuse_value
					? Number(found.estimated_reuse_value).toLocaleString("id-ID")
					: "",
				idleReason: found.idle_declaration?.idle_reason || found.idle_reason || "",
				storageLocationId: String(
					found.storage_location_id ||
						found.id_storage_location ||
						found.storage_location?.id ||
						"",
				),
				notes: found.notes || "",
			};
		}
	}

	return (
		<RegisterEquipmentClient
			editId={editId ?? null}
			objectTypes={objs}
			plants={plantsList}
			storageLocations={storageLocList}
			funcLocs={funcLocList}
			initialEquipmentCodes={initialEquipmentCodes}
			initialData={initialData}
		/>
	);
}
