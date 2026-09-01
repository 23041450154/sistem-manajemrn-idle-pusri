import { getApprovals, getEquipments, getPlants } from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";
import { statusName } from "@/lib/equipment-status";
import ManajerApproveClient, { type RequestAsset } from "./approve-client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Label fallback bila backend belum mengirim status_label.
const APPROVAL_STATUS_LABEL: Record<string, string> = {
	PENDING: "Menunggu Review",
	IN_REVIEW: "Sedang Direview",
	APPROVED: "Disetujui",
	REVISION_REQUIRED: "Perlu Revisi",
};

/** Server Component — fetch inbox approval + mapping murni di server.
 * Detail per-aset (steps/attachments/validasi) tetap dimuat client saat modal dibuka. */
export default async function ManajerApprovePage() {
	const [approvalsData, equipmentsData, user, plantsData] = await Promise.all([
		getApprovals().catch(() => []),
		getEquipments().catch(() => []),
		getCurrentUserAction().catch(() => null),
		getPlants().catch(() => []),
	]);

	const currentUserNPP = user?.user?.npp || "";
	const plants = Array.isArray(plantsData) ? plantsData : [];

	// Buat kamus (map) equipment berdasarkan ID untuk pencarian cepat
	const equipmentMap = new Map();
	if (Array.isArray(equipmentsData)) {
		equipmentsData.forEach((eq: any) => {
			equipmentMap.set(Number(eq.id), eq);
		});
	}

	const requests: RequestAsset[] = (
		Array.isArray(approvalsData) ? approvalsData : []
	).map((item: any): RequestAsset => {
		const equipmentId = item.equipment_id || item.equipment?.id;
		const eq = equipmentMap.get(Number(equipmentId)) || item.equipment;
		let approvalStatus = item.approval_status;
		let statusAset = statusName(
			item.equipment_status || eq?.status?.name || "VALIDATED",
		);

		// Jika aset sudah READY_TO_USE di database, otomatis anggap approval sudah APPROVED (masuk riwayat)
		if (statusAset === "READY_TO_USE" && (!approvalStatus || approvalStatus === "PENDING")) {
			approvalStatus = "APPROVED";
		}

		if (approvalStatus === "APPROVED") {
			statusAset = "READY_TO_USE";
		}

		const statusLabel =
			item.status_label || APPROVAL_STATUS_LABEL[approvalStatus] || approvalStatus;

		return {
			id: item.id.toString(),
			equipmentId: equipmentId?.toString() || "",
			nomorRequest: item.request_number,
			kodeAset: item.equipment_code || eq?.equipment_code || "-",
			objectType: item.object_type ?? eq?.object_type ?? null,
			namaAset: item.equipment_name || eq?.name || "-",
			plant: item.plant ?? eq?.plant ?? null,
			funcLoc: item.func_loc ?? eq?.func_loc ?? null,
			storage: item.storage_location ?? eq?.storage_location ?? null,
			tanggalPengajuan: item.request_date
				? new Date(item.request_date).toISOString().split("T")[0]
				: "-",
			statusAset: statusAset,
			approvalStatus: approvalStatus,
			statusLabel: statusLabel,
			inspekturNPP: (() => {
				const p = eq?.updated_by_npp || eq?.created_by_npp || currentUserNPP;
				if (!p) return "-";
				return /^\d/.test(p) ? `NPP${p}` : p;
			})(),
		};
	});

	requests.sort((a, b) => {
		const timeA =
			a.tanggalPengajuan && a.tanggalPengajuan !== "-"
				? new Date(a.tanggalPengajuan).getTime()
				: 0;
		const timeB =
			b.tanggalPengajuan && b.tanggalPengajuan !== "-"
				? new Date(b.tanggalPengajuan).getTime()
				: 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <ManajerApproveClient requests={requests} plants={plants} />;
}
