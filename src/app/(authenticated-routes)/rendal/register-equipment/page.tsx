"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

/** Client Component — master dropdown & nilai awal mode revisi di-fetch di browser. */
export default function RegisterEquipmentPage() {
	const searchParams = useSearchParams();
	const editId = searchParams.get("editId") ?? undefined;

	const [objs, setObjs] = useState<any[]>([]);
	const [plantsList, setPlantsList] = useState<any[]>([]);
	const [storageLocList, setStorageLocList] = useState<any[]>([]);
	const [funcLocList, setFuncLocList] = useState<any[]>([]);
	const [initialEquipmentCodes, setInitialEquipmentCodes] = useState<any[]>([]);
	const [initialData, setInitialData] = useState<RegisterInitialData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
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

			if (!alive) return;
			setObjs(objs);
			setPlantsList(plantsList);
			setStorageLocList(storageLocList);
			setFuncLocList(funcLocList);
			setInitialEquipmentCodes(initialEquipmentCodes);
			setInitialData(initialData);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, [editId]);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);

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
