"use client";
import { useEffect, useState, useCallback } from "react";
import {
	getEquipments,
	getObjectTypes,
	getPlants,
	getInspections,
	getValidations,
} from "@/action/api";
import {
	EQUIPMENT_STATUS,
	formatPlantDisplay,
	statusName,
} from "@/lib/equipment-status";
import {
	resolveRepairRecommendation,
	resolveInspectionEstimatedCost,
	getSavedRepairAssignment,
} from "@/lib/repair-assignment";
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

/** Client Component — fetch + mapping di browser, interaksi/filter di client. */
export default function RendalIdlePage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const [data, objTypes, plantsData, inspectionsData, validationsData] =
			await Promise.all([
				getEquipments().catch(() => []),
				getObjectTypes().catch(() => []),
				getPlants().catch(() => []),
				getInspections().catch(() => []),
				getValidations().catch(() => []),
			]);

		const plants = Array.isArray(plantsData) ? plantsData : [];
		const inspectionsList = Array.isArray(inspectionsData) ? inspectionsData : [];
		const validationsList = Array.isArray(validationsData) ? validationsData : [];

		(Array.isArray(data) ? data : []).sort((a: any, b: any) => {
		const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
		const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
		if (timeB !== timeA) return timeB - timeA;
		const idA = Number(a.id) || 0;
		const idB = Number(b.id) || 0;
		return idB - idA;
	});

	const equipments: Equipment[] = (Array.isArray(data) ? data : [])
			.filter((item: any) => {
				const s = (
					typeof item.status === "string"
						? item.status
						: item.status?.name || ""
				).toUpperCase();
				// Aset yang masih berstatus usulan (PROPOSED / PROPOSAL_REJECTED) belum masuk ke inventaris resmi Rendal
				return (
					s !== "PROPOSED" &&
					s !== "PROPOSAL_REJECTED" &&
					s !== "MENUNGGU VERIFIKASI"
				);
			})
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

			// Cari temuan inspeksi dan validasi terkait untuk referensi Rendal
			const eqInsps = inspectionsList.filter(
				(ins: any) => String(ins.equipment_id || ins.equipment?.id || "") === String(item.id),
			);
			const latestInspection = eqInsps.length > 0 ? eqInsps[eqInsps.length - 1] : null;

			const eqValids = validationsList.filter(
				(v: any) => String(v.equipment_id || v.equipment?.id || "") === String(item.id),
			);
			const latestValidation = eqValids.length > 0 ? eqValids[eqValids.length - 1] : null;

			const rekomendasiInspeksi = resolveRepairRecommendation(item, latestValidation, latestInspection);
			const estimasiBiayaInspeksi = resolveInspectionEstimatedCost(item, latestValidation, latestInspection);

			// Muat penugasan perbaikan lokal bila ada
			const savedAssignment = getSavedRepairAssignment(item.id);
			const effectiveExecutor =
				savedAssignment?.executor ||
				item.repair_executor ||
				(rawStatus === "REPAIR_VENDOR" ? "VENDOR" : undefined);
			const effectiveVendorName =
				savedAssignment?.vendorName ||
				item.repair_executor_vendor ||
				(effectiveExecutor === "VENDOR" ? item.vendor : undefined);
			const effectiveRefurbishmentCost =
				savedAssignment?.refurbishmentCost ??
				(Number(item.refurbishment_cost || item.actual_cost) || undefined);
			const effectiveContractNo =
				savedAssignment?.contractNumber || item.contract_number || item.po_number;
			const effectiveWorkNotes = savedAssignment?.workNotes || item.work_notes;

			let effectiveStatus: AssetState | string = statusStr;
			if (savedAssignment?.status === "REPAIR_VENDOR" || effectiveExecutor === "VENDOR" || rawStatus === "REPAIR_VENDOR") {
				effectiveStatus = "REPAIR_VENDOR";
			} else if (savedAssignment?.status === "REPAIR") {
				effectiveStatus = "REPAIR";
			}

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
				statusAset: effectiveStatus as AssetState,
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
				kondisi: typeof item.condition === "object" ? item.condition?.name : item.condition || "-",
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
				// Properti US-06-FE
				rekomendasiInspeksi,
				estimasiBiayaInspeksi,
				refurbishmentCost: effectiveRefurbishmentCost,
				repairExecutor: effectiveExecutor,
				repairExecutorVendor: effectiveVendorName,
				contractNumber: effectiveContractNo,
				workNotes: effectiveWorkNotes,
				repairAssignedAt: savedAssignment?.assignedAt,
				repairAssignedBy: savedAssignment?.assignedBy,
				repairHistory: savedAssignment?.history,
			};
			});

			setEquipments(equipments);
			setPlants(plants);
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
		<RendalIdleClient
			equipments={equipments}
			plants={plants}
			onRefresh={loadData}
		/>
	);
}
