"use client";

import { useEffect, useState } from "react";
import { getEquipments, getObjectTypes, getReuseRequests } from "@/action/api";
import { useAuth } from "@/components/AuthProvider";
import { statusName } from "@/lib/equipment-status";
import UnitKerjaIdleClient, {
	type EquipmentItem,
	type ReuseRequestItem,
} from "./idle-client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama.
   Upgrade path: generate types dari swagger_dump.json backend. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Client Component — fetch katalog+riwayat di browser, filter & mapping di client. */
export default function UnitKerjaIdlePage() {
	const { user } = useAuth();
	const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
	const [reuseRequests, setReuseRequests] = useState<ReuseRequestItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
			// Action sudah balik [] saat HTTP gagal; .catch jaring pengaman error tak terduga.
			const [rawEqList, objTypes, rawRequests] = await Promise.all([
				getEquipments().catch(() => []),
				getObjectTypes().catch(() => []),
				getReuseRequests().catch(() => []),
			]);

			const mappedEquipments: EquipmentItem[] = (rawEqList || []).map(
		(item: any): EquipmentItem => {
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
			} else if (typeof item.plant_description === "string") {
				plantStr = item.plant_description;
			} else if (
				item.plant_description &&
				typeof item.plant_description === "object"
			) {
				plantStr =
					item.plant_description.name ||
					item.plant_description.plant ||
					"STG & Boilers";
			}

			let storageLoc = "Gudang Utama Pusri";
			if (typeof item.storage_location === "string")
				storageLoc = item.storage_location;
			else if (item.storage_location && typeof item.storage_location === "object")
				storageLoc = item.storage_location.name || "Gudang Utama Pusri";
			else if (typeof item.location === "string") storageLoc = item.location;

			const normalizedStatus = statusName(
				typeof item.status === "object" ? item.status?.name : item.status,
			);

			let specText =
				typeof item.specification === "string"
					? item.specification
					: typeof item.specifications === "string"
						? item.specifications
						: item.specs;
			if (!specText && typeof item.description === "string")
				specText = item.description;

			return {
				id: String(item.id),
				equipment_code: String(item.equipment_code || `EQ-2026-${item.id}`),
				name: String(item.name || item.nama || "Equipment Tanpa Nama"),
				plant: plantStr,
				plant_description: plantStr,
				object_type_name: String(catName),
				status_name: normalizedStatus,
				condition_name:
					typeof item.condition === "object"
						? String(item.condition?.name || "Baik")
						: String(item.condition || "Baik / Operasional"),
				storage_location: String(storageLoc),
				serial_number: String(item.serial_number || item.serialNumber || "-"),
				vendor: String(item.vendor || item.manufacturer || "-"),
				year_of_purchase: Number(item.year_of_purchase || item.yearOfPurchase) || (item.year_of_purchase ? Number(item.year_of_purchase) : 0),
				book_value: Number(item.book_value || item.bookValue) || 0,
				original_value: Number(item.original_value || item.originalValue) || 0,
				estimated_reuse_value: Number(item.estimated_reuse_value || item.estimatedReuseValue) || 0,
				specifications: String(
					specText ||
					item.specifications ||
					item.specification ||
					item.description ||
					"-",
				),
				capacity: String(item.capacity || "-"),
				notes: String(item.notes || "-"),
				created_at: String(item.created_at || new Date().toISOString()),
				raw_data: item,
			};
		},
	);

	const requestedEqIdSet = new Set<string>();
	if (Array.isArray(rawRequests)) {
		rawRequests.forEach((req: any) => {
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

	// Katalog unit kerja hanya menampilkan aset yang siap dipakai ulang dan belum diajukan
	const filteredEquipments = mappedEquipments.filter(
		(e) =>
			e.status_name === "READY_TO_USE" &&
			!requestedEqIdSet.has(String(e.id)) &&
			!requestedEqIdSet.has(String(e.equipment_code).trim().toLowerCase()),
	);

	// Mapped Reuse Requests
	const mappedReuseRequests: ReuseRequestItem[] = (rawRequests || []).map((r: any) => {
		let targetPlantStr = "Plant PUSRI IB";
		if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
		else if (r.target_plant && typeof r.target_plant === "object")
			targetPlantStr =
				r.target_plant.name || r.target_plant.plant || "Plant PUSRI IB";
		else if (typeof r.targetPlant === "string") targetPlantStr = r.targetPlant;
		else if (r.targetPlant && typeof r.targetPlant === "object")
			targetPlantStr = r.targetPlant.name || "Plant PUSRI IB";

		let installLocStr = "Area Ammonia P-IB";
		if (typeof r.installation_location === "string")
			installLocStr = r.installation_location;
		else if (
			r.installation_location &&
			typeof r.installation_location === "object"
		)
			installLocStr = r.installation_location.name || "Area Ammonia P-IB";
		else if (typeof r.installationLocation === "string")
			installLocStr = r.installationLocation;

		return {
			id: String(r.id),
			request_number: String(
				r.request_number || r.requestNumber || `REQ-REUSE-2026-${r.id}`,
			),
			equipment_id: String(r.equipment_id || r.equipmentId || ""),
			equipment_code: String(
				r.equipment_code ||
					r.equipmentCode ||
					r.equipment?.equipment_code ||
					"EQ-99",
			),
			equipment_name: String(
				r.equipment_name ||
					r.equipmentName ||
					r.equipment?.name ||
					"Equipment Reuse",
			),
			installation_location: String(installLocStr),
			requesting_unit: String(installLocStr),
			target_plant: String(targetPlantStr),
			start_date: String(
				r.start_date ||
					r.startDate ||
					r.reuse_date ||
					r.reuseDate ||
					new Date().toISOString().split("T")[0],
			),
			end_date: String(r.end_date || r.endDate || "-"),
			justification: typeof r.justification === "string" ? r.justification : "-",
			estimated_cost_avoidance:
				Number(r.estimated_cost_avoidance || r.estimatedCostAvoidance) || 0,
			contact_person:
				typeof r.contact_person === "string" ? r.contact_person : "-",
			contact_npp: String(r.contact_npp || r.contactNpp || ""),
			contact_phone: String(r.contact_phone || r.contactPhone || ""),
			status: (r.status ||
				r.approval_status ||
				r.approvalStatus ||
				"PENDING") as any,
			created_at: String(
				r.created_at ||
					r.createdAt ||
					r.requested_at ||
					r.requestedAt ||
					new Date().toISOString(),
			),
		};
	});

			if (!alive) return;
			setEquipments(filteredEquipments);
			setReuseRequests(mappedReuseRequests);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, []);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);

	const currentUser = user ?? null;

	return (
		<UnitKerjaIdleClient
			equipments={equipments}
			reuseRequests={reuseRequests}
			currentUser={currentUser}
		/>
	);
}
