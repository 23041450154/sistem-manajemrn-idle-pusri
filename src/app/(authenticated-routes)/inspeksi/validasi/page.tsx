import {
	getApprovals,
	getConditions,
	getEquipments,
	getObjectTypes,
	getPlants,
	getRequireActions,
} from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";
import {
	EQUIPMENT_STATUS,
	statusName,
	formatPlantDisplay,
	formatCondition,
} from "@/lib/equipment-status";
import ManajemenInspeksiClient, { type Asset } from "./validasi-client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Peta status_id -> nama, cerminan tabel status backend (GET /api/status).
// Hanya dipakai sebagai fallback bila payload tidak menyertakan relasi `status`.
const STATUS_BY_ID: Record<number, string> = {
	1: "REGISTERED",
	2: "VALIDATED",
	3: "REPAIR",
	4: "REPAIR_COMPLETED",
	5: "REVALIDATION",
	6: "READY_TO_USE",
	7: "REUSED",
	8: "SCRAP",
};

// REJECTED & REVALIDASI (ejaan lama) bukan anggota EQUIPMENT_STATUS tapi bagian
// sah dari nilai yang bisa dibawa data backend — wajib masuk daftar agar filter
// validasiOnly tetap bisa mengenalinya.
const ASSET_STATES = [
	...EQUIPMENT_STATUS,
	"REJECTED",
	"REVALIDASI",
] as readonly string[];

/** String status apa pun -> union AssetState; di luar daftar jatuh ke REGISTERED. */
/** Ejaan lama "REVALIDASI" dipetakan ke kanonik REVALIDATION sebelum narrowing. */
const normalizeLegacyStatus = (raw: string) =>
	raw === "REVALIDASI" ? "REVALIDATION" : raw;

const assetState = (raw: string): Asset["statusAset"] =>
	ASSET_STATES.includes(raw) ? (raw as Asset["statusAset"]) : "REGISTERED";

/** Server Component — resolusi status persetujuan & filter cakupan halaman di server.
 * Detail per-aset (validasi/lampiran/approval steps) tetap dimuat client saat modal dibuka. */
export default async function ValidasiPage() {
	const [
		data,
		objTypes,
		approvalsRes,
		user,
		conditionsData,
		requireActionsData,
		plantsData,
	] = await Promise.all([
		getEquipments().catch(() => []),
		getObjectTypes().catch(() => []),
		getApprovals().catch(() => []),
		getCurrentUserAction().catch(() => null),
		getConditions().catch(() => []),
		getRequireActions().catch(() => []),
		getPlants().catch(() => []),
	]);

	const conditions = Array.isArray(conditionsData) ? conditionsData : [];
	const requireActions = Array.isArray(requireActionsData)
		? requireActionsData
		: [];
	const approvalsData = Array.isArray(approvalsRes)
		? approvalsRes
		: approvalsRes?.data || [];
	const plants = Array.isArray(plantsData) ? plantsData : [];
	const currentUserNPP = user?.user?.npp || "NPP2304145";

	const mappedData = (Array.isArray(data) ? data : []).map((item: any) => {
		let objectTypeName = "Belum Ditentukan";
		if (item.object_type?.name) {
			objectTypeName = item.object_type.name;
		} else if (item.objectType?.name) {
			objectTypeName = item.objectType.name;
		} else {
			const otId = item.id_object_type || item.object_type_id || item.objectTypeId;
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
			plant: formatPlantDisplay(
				item.plant,
				item.storage_location,
				item.plant_description,
			),
			jenisAlat: objectTypeName,
			tanggalRegistrasi: item.created_at
				? new Date(item.created_at).toISOString().split("T")[0]
				: "-",
			/* ponytail: status_id fallback hanya dipakai bila backend tidak mengirim relasi status.
			   Sumber kebenaran = tabel status (GET /api/status). */
			statusAset: (
				item.status?.name ||
				STATUS_BY_ID[item.status_id] ||
				"REGISTERED"
			).toUpperCase(),
			statusPersetujuan: "NONE", // Default, will override below
			spesifikasi: item.notes || "Belum ada spesifikasi",
			lampiran: [] as string[],
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
			kondisi: formatCondition(item.condition),
			pemohon: (() => {
				const p = item.created_by_npp || currentUserNPP;
				return /^\d/.test(p) ? `NPP${p}` : p;
			})(),
		};
	});

	// Correcting status mapping based on API
	const mappedWithApproval = mappedData.map((item): Asset => {
		let statusAset = assetState(
			normalizeLegacyStatus(statusName(item.statusAset)),
		);
		let statusPersetujuan: Asset["statusPersetujuan"] = "NONE";

		const app = approvalsData.find(
			(a: any) =>
				a.equipment_id === Number(item.id) || a.equipment?.id === Number(item.id),
		);

		if (app) {
			if (app.approval_status === "REVISION_REQUIRED") {
				statusPersetujuan = "NEED_REVISION";
			} else if (app.approval_status === "IN_REVIEW") {
				statusPersetujuan = "IN_REVIEW";
			} else if (app.approval_status === "APPROVED") {
				statusPersetujuan = "APPROVED";
				if (statusAset === "VALIDATED") statusAset = "READY_TO_USE";
			} else if (app.approval_status === "REJECTED") {
				statusPersetujuan = "REJECTED";
				statusAset = "REJECTED";
			} else if (String(statusAset) === "READY_TO_USE" || String(statusAset) === "REUSED") {
				statusPersetujuan = "APPROVED";
			} else {
				statusPersetujuan = "PENDING_REVIEW";
			}
		} else {
			// statusAset sudah kanonik (statusName), jadi cukup cek nama backend.
			if (statusAset === "REGISTERED") {
				statusPersetujuan = "NONE";
			} else if (
				statusAset === "READY_TO_USE" ||
				statusAset === "REUSED" ||
				statusAset === "REPAIR"
			) {
				statusPersetujuan = "APPROVED";
			} else if (
				statusAset === "VALIDATED" ||
				statusAset === "REVALIDATION" ||
				statusAset === "SCRAP" ||
				statusAset === "DISPOSAL_RECOMMENDED"
			) {
				statusPersetujuan = "PENDING_REVIEW";
			} else if (statusAset === "REJECTED") {
				statusPersetujuan = "REJECTED";
			}
		}

		const approvalId = app ? String(app.id) : undefined;
		return { ...item, statusAset, statusPersetujuan, approvalId };
	});

	// Sort data by ID descending (newest first)
	mappedWithApproval.sort((a, b) => Number(b.id) - Number(a.id));

	return (
		<ManajemenInspeksiClient
			assets={mappedWithApproval}
			conditions={conditions}
			requireActions={requireActions}
			plants={plants}
		/>
	);
}
