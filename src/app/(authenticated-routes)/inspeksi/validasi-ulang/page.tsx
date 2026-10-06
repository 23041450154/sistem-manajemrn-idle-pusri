"use client";
import { useEffect, useState, useCallback } from "react";
import {
	getEquipments,
	getPlants,
	getStorageLocations,
	getConditions,
	getObjectTypes,
} from "@/action/api";
import {
	statusName,
	formatPlantDisplay,
	formatCondition,
} from "@/lib/equipment-status";
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

/** Client Component — fetch + filter visibilitas + mapping murni di browser.
 * Pengganti salinan filter magic-number status_id === 4/5/6/8. */
export default function ValidasiUlangPage() {
	const [items, setItems] = useState<RevalidasiItem[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [storageLocations, setStorageLocations] = useState<any[]>([]);
	const [conditions, setConditions] = useState<any[]>([]);
	const [objectTypes, setObjectTypes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const [
				data,
				plantsData,
				storageLocationsData,
				conditionsData,
				objTypesData,
			] = await Promise.all([
				getEquipments().catch(() => []),
				getPlants().catch(() => []),
				getStorageLocations().catch(() => []),
				getConditions().catch(() => []),
				getObjectTypes().catch(() => []),
			]);

			const computedPlants = Array.isArray(plantsData) ? plantsData : [];
			const computedStorageLocations = Array.isArray(storageLocationsData)
				? storageLocationsData
				: [];
			const computedConditions = Array.isArray(conditionsData)
				? conditionsData
				: [];
			const computedObjectTypes = Array.isArray(objTypesData) ? objTypesData : [];

			const computedItems: RevalidasiItem[] = (Array.isArray(data) ? data : [])
		.filter((item: any) => {
			const s = statusName(String(item.status?.name || item.statusAset || ""));
			return INCLUDED_STATUSES.includes(s);
		})
		.map((item: any): RevalidasiItem => {
			const plantStr = formatPlantDisplay(
				item.plant,
				item.storage_location,
				item.plant_description,
			);
			const storageStr =
				typeof item.storage_location === "string"
					? item.storage_location
					: item.storage_location?.name || "-";
			const objectTypeStr =
				typeof item.object_type === "string"
					? item.object_type
					: item.object_type?.name || "-";
			const conditionStr = formatCondition(item.condition);

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
				kondisiSebelumnya: conditionStr,
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

			computedItems.sort((a, b) => {
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

			setItems(computedItems);
			setPlants(computedPlants);
			setStorageLocations(computedStorageLocations);
			setConditions(computedConditions);
			setObjectTypes(computedObjectTypes);
	}, []);

	useEffect(() => {
		let alive = true;
		void (async () => {
			await loadData();
			if (!alive) return;
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, [loadData]);

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
		<InspeksiValidasiUlangClient
			items={items}
			plants={plants}
			storageLocations={storageLocations}
			conditions={conditions}
			objectTypes={objectTypes}
			onRefresh={loadData}
		/>
	);
}
