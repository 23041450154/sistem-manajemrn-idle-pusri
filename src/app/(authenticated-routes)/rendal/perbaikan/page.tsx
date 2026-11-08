"use client";

import { useEffect, useState, useCallback } from "react";
import {
	getEquipmentRepairs,
	getEquipments,
	getPlants,
	getInspections,
	getValidations,
} from "@/action/api";
import { formatPlantDisplay, statusName } from "@/lib/equipment-status";
import {
	resolveRepairRecommendation,
	resolveInspectionEstimatedCost,
	getSavedRepairAssignments,
} from "@/lib/repair-assignment";
import RendalPerbaikanClient, {
	type PerbaikanItem,
} from "./perbaikan-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

function formatStorageLocation(loc: any): string {
	if (!loc) return "-";
	if (typeof loc === "string") {
		const s = loc.trim();
		return s && s !== "-" ? s : "-";
	}
	if (typeof loc === "object") {
		const name = loc.name || loc.description || loc.storage_location_name || "";
		if (typeof name === "string" && name.trim()) return name.trim();
	}
	return "-";
}

export default function RendalPerbaikanPage() {
	const [antreanItems, setAntreanItems] = useState<PerbaikanItem[]>([]);
	const [riwayatItems, setRiwayatItems] = useState<PerbaikanItem[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		try {
			const [repairsData, equipmentsData, plantsData, inspectionsData, validationsData] =
				await Promise.all([
					getEquipmentRepairs().catch(() => []),
					getEquipments().catch(() => []),
					getPlants().catch(() => []),
					getInspections().catch(() => []),
					getValidations().catch(() => []),
				]);

			const repairsList = Array.isArray(repairsData) ? repairsData : [];
			const equipmentsList = Array.isArray(equipmentsData) ? equipmentsData : [];
			const plantsList = Array.isArray(plantsData) ? plantsData : [];
			const inspectionsList = Array.isArray(inspectionsData) ? inspectionsData : [];
			const validationsList = Array.isArray(validationsData) ? validationsData : [];

			// Lookup maps untuk relasi cepat
			const eqMap = new Map<string, any>();
			for (const eq of equipmentsList) {
				eqMap.set(String(eq.id), eq);
			}

			const inspectionMap = new Map<string, any>();
			for (const insp of inspectionsList) {
				const eqId = String(insp.equipment_id || insp.equipment?.id || "");
				if (eqId && !inspectionMap.has(eqId)) {
					inspectionMap.set(eqId, insp);
				}
			}

			const validationMap = new Map<string, any>();
			for (const val of validationsList) {
				const eqId = String(val.equipment_id || val.equipment?.id || "");
				if (eqId && !validationMap.has(eqId)) {
					validationMap.set(eqId, val);
				}
			}

			// Local browser assignments dari US-06-FE
			const savedAssignments = getSavedRepairAssignments();

			const riwayat: PerbaikanItem[] = [];
			const antrean: PerbaikanItem[] = [];
			const processedEqIdsInRiwayat = new Set<string>();

			// 1. Olah data yang sudah tercatat di GET /api/repair backend -> Riwayat Perbaikan & Biaya
			for (const repair of repairsList) {
				const eqId = String(repair.equipment_id || repair.equipment?.id || "");
				const eqObj = eqMap.get(eqId) || repair.equipment || repair.equipment_inspection?.equipment || {};
				const inspObj = inspectionMap.get(eqId) || repair.equipment_inspection || {};
				const valObj = validationMap.get(eqId) || {};
				const localAssign = savedAssignments[eqId];

				if (eqId) {
					processedEqIdsInRiwayat.add(eqId);
				}

				const kodeAlat = String(
					repair.equipment_code ||
					eqObj.equipment_code ||
					eqObj.kode_alat ||
					`EQ-${eqId || repair.id}`,
				);

				const namaAlat = String(
					eqObj.name ||
					repair.name ||
					repair.equipment_inspection?.equipment?.name ||
					"Peralatan Pabrik",
				);

				const rawPlant =
					eqObj.plant_description ||
					eqObj.plant?.name ||
					eqObj.plant ||
					repair.plant ||
					"Pusri";
				const plantDisplay = formatPlantDisplay(rawPlant);

				const lokasiSimpan = formatStorageLocation(eqObj.storage_location);

				const currentStatus = String(
					eqObj.status?.name ||
					eqObj.status ||
					localAssign?.status ||
					"REPAIR",
				).toUpperCase();

				const actualCost = Number(
					repair.actual_cost ||
					localAssign?.refurbishmentCost ||
					eqObj.actual_cost ||
					eqObj.refurbishment_cost ||
					0,
				);

				let estimatedCost = Number(
					inspObj.estimated_refurbish_cost ||
					inspObj.estimated_cost ||
					repair.equipment_inspection?.estimated_refurbish_cost ||
					valObj.estimated_cost ||
					0,
				);

				if (estimatedCost === 0) {
					estimatedCost = resolveInspectionEstimatedCost(eqObj, valObj, inspObj);
				}

				let pelaksana: "INTERNAL" | "VENDOR" = "INTERNAL";
				let namaVendor = "";

				if (localAssign?.executor) {
					pelaksana = localAssign.executor;
					namaVendor = localAssign.vendorName || "";
				} else if (
					currentStatus.includes("VENDOR") ||
					String(repair.work_description || "").toLowerCase().includes("vendor") ||
					Boolean(eqObj.vendor && !String(eqObj.vendor).toLowerCase().includes("pusri"))
				) {
					pelaksana = "VENDOR";
					namaVendor =
						repair.vendor ||
						eqObj.vendor ||
						(repair.work_description?.match(/oleh vendor\s*(.*)/i)?.[1] || "Vendor Rekanan Luar");
				}

				const diff = estimatedCost - actualCost;
				const percent = estimatedCost > 0 ? (diff / estimatedCost) * 100 : 0;
				let statusAnggaran: PerbaikanItem["statusAnggaran"] = "SESUAI";

				if (actualCost === 0 && estimatedCost > 0) {
					statusAnggaran = "BELUM_DIANGGARKAN";
				} else if (actualCost > estimatedCost) {
					statusAnggaran = "OVER_BUDGET";
				} else if (actualCost < estimatedCost) {
					statusAnggaran = "HEMAT";
				}

				riwayat.push({
					id: `rep-${repair.id || eqId}`,
					repairId: repair.id,
					equipmentId: eqId || String(repair.id),
					kodeAlat,
					namaAlat,
					plant: plantDisplay,
					lokasiSimpan,
					statusAset: statusName(currentStatus),
					biayaRiil: actualCost,
					estimasiBiaya: estimatedCost,
					selisihBiaya: diff,
					persenSelisih: Math.round(percent * 10) / 10,
					statusAnggaran,
					pelaksana,
					namaVendor: namaVendor.trim(),
					nomorKontrak: localAssign?.contractNumber || repair.contract_number,
					rekomendasi: resolveRepairRecommendation(eqObj, valObj, inspObj),
					workDescription: repair.work_description || localAssign?.workNotes || "Perbaikan dan rekondisi peralatan",
					notes: repair.notes || "",
					startAt: repair.start_at,
					endAt: repair.end_at,
					repairAssignedAt: localAssign?.assignedAt,
					repairAssignedBy: localAssign?.assignedBy,
					history: localAssign?.history || [],
					bookValue: Number(eqObj.book_value || eqObj.bookValue || 0),
					originalValue: Number(eqObj.original_value || eqObj.originalValue || 0),
					estimatedReuseValue: Number(eqObj.estimated_reuse_value || eqObj.estimatedReuseValue || 0),
					hasAssignment: true,
				});
			}

			// 2. Olah seluruh peralatan dari GET /api/equipment
			for (const eq of equipmentsList) {
				const eqId = String(eq.id);
				const stName = String(eq.status?.name || eq.status || "").toUpperCase();
				const localAssign = savedAssignments[eqId];
				const hasSavedCost = Number(localAssign?.refurbishmentCost || 0) > 0;
				const hasEqCost = Number(eq.refurbishment_cost || eq.actual_cost || 0) > 0;

				const inspObj = inspectionMap.get(eqId) || {};
				const valObj = validationMap.get(eqId) || {};

				const kodeAlat = String(eq.equipment_code || eq.kode_alat || `EQ-${eqId}`);
				const namaAlat = String(eq.name || "Peralatan Pabrik");
				const plantDisplay = formatPlantDisplay(eq.plant_description || eq.plant?.name || eq.plant || "Pusri");
				const lokasiSimpan = formatStorageLocation(eq.storage_location);

				const rekomendasi = resolveRepairRecommendation(eq, valObj, inspObj);
				let estimatedCost = Number(
					inspObj.estimated_refurbish_cost ||
					inspObj.estimated_cost ||
					valObj.estimated_cost ||
					0,
				);
				if (estimatedCost === 0) {
					estimatedCost = resolveInspectionEstimatedCost(eq, valObj, inspObj);
				}

				// Jika sudah masuk riwayat backend dari step 1, skip
				if (processedEqIdsInRiwayat.has(eqId)) {
					continue;
				}

				const statusId = Number(eq.status_id || eq.status?.id || 0);

				// Filter ketat: status non-perbaikan (PROPOSED, PROPOSAL_REJECTED, REGISTERED, VALIDATED, READY_TO_USE, REUSED, SCRAP_RECOMMENDED, SCRAP_REQUESTED, SCRAP)
				// TIDAK BOLEH masuk ke modul perbaikan sama sekali.
				const isNonRepairStatus =
					stName === "PROPOSED" ||
					stName === "PROPOSAL_REJECTED" ||
					stName === "REGISTERED" ||
					stName === "VALIDATED" ||
					stName === "READY_TO_USE" ||
					stName === "REUSED" ||
					stName === "SCRAP_RECOMMENDED" ||
					stName === "SCRAP_REQUESTED" ||
					stName === "SCRAP" ||
					statusId === 1 ||
					statusId === 2 ||
					statusId === 3 ||
					statusId === 4 ||
					statusId === 8 ||
					statusId === 9 ||
					statusId === 10 ||
					statusId === 11 ||
					statusId === 12;

				if (isNonRepairStatus) {
					continue;
				}

				// Hanya proses peralatan yang berada dalam lifecycle perbaikan
				const isRepairStatus =
					statusId === 5 ||
					stName === "REPAIR" ||
					stName === "DALAM_PERBAIKAN" ||
					stName === "MAINTENANCE" ||
					stName === "REPAIR_VENDOR" ||
					statusId === 6 ||
					stName === "REPAIR_COMPLETED" ||
					Boolean(localAssign);

				if (!isRepairStatus) {
					continue;
				}

				// Jika alat sudah memiliki penugasan biaya riil (dari modal Rendal) atau statusnya REPAIR_VENDOR / REPAIR_COMPLETED
				if (hasSavedCost || hasEqCost || stName === "REPAIR_VENDOR" || stName === "REPAIR_COMPLETED" || localAssign) {
					const actualCost = Number(localAssign?.refurbishmentCost || eq.refurbishment_cost || eq.actual_cost || 0);
					let pelaksana: "INTERNAL" | "VENDOR" = "INTERNAL";
					let namaVendor = "";

					if (localAssign?.executor) {
						pelaksana = localAssign.executor;
						namaVendor = localAssign.vendorName || "";
					} else if (stName.includes("VENDOR") || eq.vendor) {
						pelaksana = "VENDOR";
						namaVendor = eq.vendor || "Vendor Rekanan";
					}

					const diff = estimatedCost - actualCost;
					const percent = estimatedCost > 0 ? (diff / estimatedCost) * 100 : 0;
					let statusAnggaran: PerbaikanItem["statusAnggaran"] = "SESUAI";

					if (actualCost === 0 && estimatedCost > 0) {
						statusAnggaran = "BELUM_DIANGGARKAN";
					} else if (actualCost > estimatedCost) {
						statusAnggaran = "OVER_BUDGET";
					} else if (actualCost < estimatedCost) {
						statusAnggaran = "HEMAT";
					}

					riwayat.push({
						id: `eq-${eqId}`,
						equipmentId: eqId,
						kodeAlat,
						namaAlat,
						plant: plantDisplay,
						lokasiSimpan,
						statusAset: statusName(stName || "REPAIR"),
						biayaRiil: actualCost,
						estimasiBiaya: estimatedCost,
						selisihBiaya: diff,
						persenSelisih: Math.round(percent * 10) / 10,
						statusAnggaran,
						pelaksana,
						namaVendor: namaVendor.trim(),
						nomorKontrak: localAssign?.contractNumber,
						rekomendasi,
						workDescription: localAssign?.workNotes || eq.notes || "Perbaikan dan rekondisi peralatan",
						notes: eq.notes || "",
						repairAssignedAt: localAssign?.assignedAt,
						repairAssignedBy: localAssign?.assignedBy,
						history: localAssign?.history || [],
						bookValue: Number(eq.book_value || eq.bookValue || 0),
						originalValue: Number(eq.original_value || eq.originalValue || 0),
						estimatedReuseValue: Number(eq.estimated_reuse_value || eq.estimatedReuseValue || 0),
						hasAssignment: true,
					});
				} else {
					// Masuk ke ANTREAN PERBAIKAN:
					// HANYA peralatan yang statusnya memang butuh perbaikan (REPAIR, DALAM_PERBAIKAN, MAINTENANCE)
					// dan BELUM memiliki penugasan / biaya riil.
					antrean.push({
						id: `antrean-${eqId}`,
						equipmentId: eqId,
						kodeAlat,
						namaAlat,
						plant: plantDisplay,
						lokasiSimpan,
						statusAset: statusName(stName),
						biayaRiil: 0,
						estimasiBiaya: estimatedCost,
						selisihBiaya: estimatedCost,
						persenSelisih: 0,
						statusAnggaran: "BELUM_DIANGGARKAN",
						pelaksana: "INTERNAL",
						namaVendor: "",
						rekomendasi,
						workDescription: eq.notes || "",
						notes: eq.notes || "",
						history: [],
						bookValue: Number(eq.book_value || eq.bookValue || 0),
						originalValue: Number(eq.original_value || eq.originalValue || 0),
						estimatedReuseValue: Number(eq.estimated_reuse_value || eq.estimatedReuseValue || 0),
						hasAssignment: false,
					});
				}
			}

			setAntreanItems(antrean);
			setRiwayatItems(riwayat);
			setPlants(plantsList);
		} catch (error) {
			console.error("Gagal memuat data modul perbaikan:", error);
		} finally {
			setLoading(false);
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

	return (
		<RendalPerbaikanClient
			antreanItems={antreanItems}
			riwayatItems={riwayatItems}
			plants={plants}
			loading={loading}
			onRefresh={loadData}
		/>
	);
}
