"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import {
	getFunctionalLocations,
	getMyEquipmentProposals,
	getObjectTypes,
	getPlants,
	getStorageLocations,
	searchSapEquipment,
} from "@/action/api";
import {
	EQUIPMENT_STATUS,
	formatPlantDisplay,
	statusName,
} from "@/lib/equipment-status";
import UsulanIdleClient, {
	type AssetState,
	type Equipment,
} from "./usulan-idle-client";

/** String status apa pun -> union AssetState; di luar daftar kanonik jatuh ke PROPOSED. */
const assetState = (raw: string): AssetState =>
	(EQUIPMENT_STATUS as readonly string[]).includes(raw)
		? (raw as AssetState)
		: "PROPOSED";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Client Component — fetch + mapping di browser, interaksi/filter di client. */
export default function UsulanIdlePage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [storageLocations, setStorageLocations] = useState<any[]>([]);
	const [funcLocs, setFuncLocs] = useState<any[]>([]);
	const [objectTypes, setObjectTypes] = useState<any[]>([]);
	const [initialEquipmentCodes, setInitialEquipmentCodes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		try {
			const [
				data,
				objTypes,
				plantsData,
				storageLocs,
				funcLocData,
				sapInitial,
			] = await Promise.all([
				getMyEquipmentProposals().catch(() => []),
				getObjectTypes().catch(() => []),
				getPlants().catch(() => []),
				getStorageLocations().catch(() => []),
				getFunctionalLocations().catch(() => []),
				searchSapEquipment(undefined, 20).catch(() => []),
			]);

			const plantsList = Array.isArray(plantsData) ? plantsData : [];

			(Array.isArray(data) ? data : []).sort((a: any, b: any) => {
				const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
				const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
				if (timeB !== timeA) return timeB - timeA;
				const idA = Number(a.id) || 0;
				const idB = Number(b.id) || 0;
				return idB - idA;
			});

			const mappedEquipments: Equipment[] = (
				Array.isArray(data) ? data : []
			).map((item: any): Equipment => {
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
					(typeof item.status === "string"
						? item.status
						: item.status?.name) || "";
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
					originalValue: item.original_value || 0,
					bookValue: item.book_value || 0,
					estimatedReuseValue: item.estimated_reuse_value || 0,
					notes: item.notes || "-",
					idleReason: item.idle_reason || "-",
					rejectionNotes: item.rejection_notes || item.rejectionNotes || "",
					inspectionPurpose:
						item.inspection_purpose || item.inspectionPurpose || "",
					attachments: item.attachments || [],
					photos: item.attachments
						? item.attachments
								.filter(
									(att: any) =>
										att.attachment_category === "equipment_photo" ||
										att.attachment_category === "photo" ||
										att.attachment_category === "proposal_document" ||
										att.category === "equipment_photo" ||
										att.category === "photo" ||
										att.category === "proposal_document",
								)
								.map((att: any) => {
									const url = att.file_url || att.fileUrl || "";
									return url.replace(/\\/g, "/");
								})
						: [],
				};
			});

			setEquipments(mappedEquipments);
			setPlants(plantsList);
			setStorageLocations(Array.isArray(storageLocs) ? storageLocs : []);
			setFuncLocs(Array.isArray(funcLocData) ? funcLocData : []);
			setObjectTypes(Array.isArray(objTypes) ? objTypes : []);
			setInitialEquipmentCodes(Array.isArray(sapInitial) ? sapInitial : []);
		} catch (err) {
			console.error("Gagal memuat master data usulan idle:", err);
		}
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
		<Suspense
			fallback={
				<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
					<div className="flex flex-col items-center gap-3">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
						Memuat data...
					</div>
				</main>
			}
		>
			<UsulanIdleClient
				equipments={equipments}
				plants={plants}
				storageLocations={storageLocations}
				funcLocs={funcLocs}
				objectTypes={objectTypes}
				initialEquipmentCodes={initialEquipmentCodes}
				onRefresh={loadData}
			/>
		</Suspense>
	);
}
