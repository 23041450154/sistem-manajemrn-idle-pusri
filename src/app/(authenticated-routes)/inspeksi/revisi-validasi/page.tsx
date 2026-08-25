import {
	getApprovals,
	getConditions,
	getEquipments,
	getObjectTypes,
} from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";
import { EQUIPMENT_STATUS, statusName } from "@/lib/equipment-status";
import RevisiValidasiClient, { type Asset } from "./revisi-validasi-client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

// REJECTED bukan anggota EQUIPMENT_STATUS tapi bagian sah dari union AssetState.
const ASSET_STATES = [...EQUIPMENT_STATUS, "REJECTED"] as readonly string[];

/** String status apa pun -> union AssetState; di luar daftar jatuh ke REGISTERED. */
const assetState = (raw: string): Asset["statusAset"] =>
	ASSET_STATES.includes(raw) ? (raw as Asset["statusAset"]) : "REGISTERED";

/** Server Component — resolusi status persetujuan (approval) & filter NEED_REVISION di server. */
export default async function RevisiValidasiPage() {
	const [data, objTypes, approvalsRes, user, conditionsData] = await Promise.all([
		getEquipments().catch(() => []),
		getObjectTypes().catch(() => []),
		getApprovals().catch(() => []),
		getCurrentUserAction().catch(() => null),
		getConditions().catch(() => []),
	]);

	const conditions = Array.isArray(conditionsData) ? conditionsData : [];
	const approvalsData = Array.isArray(approvalsRes)
		? approvalsRes
		: approvalsRes?.data || [];
	const currentUserNPP = user?.user?.npp || "NPP2304145";

	const mappedData = (Array.isArray(data) ? data : []).map(
		(item: any): Asset => {
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
						(o: any) => o.id === otId || o.id === Number(otId),
					);
					if (found) objectTypeName = found.name;
				}
			}

			return {
				id: item.id?.toString() || "-",
				kodeAlat: item.equipment_code,
				namaAlat: item.name,
				plant: item.plant?.name || "-",
				jenisAlat: objectTypeName,
				tanggalRegistrasi: item.created_at
					? new Date(item.created_at).toISOString().split("T")[0]
					: "-",
				statusAset: assetState(statusName(item.status?.name)),
				statusPersetujuan: "NONE", // Default, will override below
				spesifikasi: item.notes || "Belum ada spesifikasi",
				lampiran: [],
				lokasiPenyimpanan:
					item.storage_location?.name ||
					item.storageLocation?.name ||
					"Belum ditentukan",
				area:
					typeof item.func_loc === "string"
						? item.func_loc
						: item.func_loc?.name || item.funcloc?.name || "-",
				vendor: item.vendor || "-",
				tahunDibuat: item.year?.toString() || "-",
				nilaiPerolehan: item.original_value
					? `Rp ${Number(item.original_value).toLocaleString("id-ID")}`
					: "Rp 0",
				pemohon: (() => {
					const p = item.created_by_npp || currentUserNPP;
					return /^\d/.test(p) ? `NPP${p}` : p;
				})(),
			};
		},
	);

	// Correcting status mapping based on API
	const mappedWithApproval = mappedData.map((item) => {
		let statusAset = assetState(item.statusAset);
		let statusPersetujuan: Asset["statusPersetujuan"] = "NONE";

		if (statusAset === "REGISTERED") {
			statusPersetujuan = "NONE";
		} else if (statusAset === "VALIDATED") {
			const app = approvalsData.find(
				(a: any) =>
					a.equipment_id === Number(item.id) ||
					a.equipment?.id === Number(item.id),
			);
			if (app) {
				if (app.approval_status === "REVISION_REQUIRED") {
					statusPersetujuan = "NEED_REVISION";
				} else if (app.approval_status === "IN_REVIEW") {
					statusPersetujuan = "IN_REVIEW";
				} else if (app.approval_status === "APPROVED") {
					statusPersetujuan = "APPROVED";
					statusAset = "READY_TO_USE";
				} else if (app.approval_status === "REJECTED") {
					statusPersetujuan = "REJECTED";
					statusAset = "REJECTED";
				} else {
					statusPersetujuan = "PENDING_REVIEW";
				}
			} else {
				statusPersetujuan = "PENDING_REVIEW";
			}
		} else if (statusAset === "READY_TO_USE") {
			statusPersetujuan = "APPROVED";
		} else if (statusAset === "REJECTED") {
			statusPersetujuan = "REJECTED";
		}

		return { ...item, statusAset, statusPersetujuan };
	});

	// Sort data by ID descending (newest first)
	mappedWithApproval.sort((a, b) => Number(b.id) - Number(a.id));

	// KUSUS HANYA ASSET YANG BERSTATUS NEED_REVISION
	const assets: Asset[] = mappedWithApproval.filter(
		(a) => a.statusPersetujuan === "NEED_REVISION",
	);

	return <RevisiValidasiClient assets={assets} conditions={conditions} />;
}
