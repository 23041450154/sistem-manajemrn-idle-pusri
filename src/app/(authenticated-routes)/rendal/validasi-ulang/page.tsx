import { getEquipments, getApprovals } from "@/action/api";
import { statusName as canonStatus } from "@/lib/equipment-status";
import RendalValidasiUlangClient, {
	type ValidasiUlangItem,
} from "./validasi-ulang-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — fetch + mapping murni di server, interaksi di client. */
export default async function RendalValidasiUlangPage() {
	const [data, approvalsData] = await Promise.all([
		getEquipments().catch(() => []),
		// Halaman ini menangani validasi ulang -> approval jenis REVALIDATION.
		getApprovals("revalidation").catch(() => []),
	]);

	const approvalsRaw = (approvalsData as any)?.data;
	const approvalsList: any[] = Array.isArray(approvalsData)
		? approvalsData
		: Array.isArray(approvalsRaw)
			? approvalsRaw
			: [];

	const items: ValidasiUlangItem[] = (Array.isArray(data) ? data : [])
		.filter((item: any) => {
			const statusName = canonStatus(item.status?.name || item.statusAset);
			const isRevalidation = statusName === "REVALIDATION";
			const isReadyToUse = statusName === "READY_TO_USE";
			return isRevalidation || isReadyToUse;
		})
		.map((item: any): ValidasiUlangItem => {
			const plantStr =
				typeof item.plant === "string"
					? item.plant
					: item.plant?.name || item.plant?.description || "-";
			const storageStr =
				typeof item.storage_location === "string"
					? item.storage_location
					: item.storage_location?.name || "-";
			const objectTypeStr =
				typeof item.object_type === "string"
					? item.object_type
					: item.object_type?.name || "-";
			const conditionStr =
				typeof item.condition === "string"
					? item.condition
					: item.condition?.name || "BAGUS";

			const statusName = String(
				item.status?.name || item.statusAset || "",
			).toUpperCase();
			const isReady = statusName === "READY_TO_USE";

			const matchingApproval = approvalsList.find(
				(a: any) =>
					String(a.equipment_id) === String(item.id) ||
					String(a.equipment?.id) === String(item.id),
			);

			const displayStatus = isReady ? "READY_TO_USE" : "REVALIDATION";

			const approvalStatus =
				matchingApproval?.approval_status || (isReady ? "APPROVED" : "PENDING");

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
				kondisi: conditionStr.replace(/_/g, " "),
				tanggalRevalidasi: item.updated_at
					? new Date(item.updated_at).toISOString().split("T")[0]
					: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
				statusAset: displayStatus,
				approvalId: matchingApproval?.id ? String(matchingApproval.id) : undefined,
				approvalStatus: approvalStatus,
				catatanInspeksi:
					item.notes || "Hasil validasi ulang menunjukkan kondisi alat siap pakai.",
			};
		});

	items.sort((a, b) => {
		const timeA = a.tanggalRevalidasi
			? new Date(a.tanggalRevalidasi).getTime()
			: 0;
		const timeB = b.tanggalRevalidasi
			? new Date(b.tanggalRevalidasi).getTime()
			: 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <RendalValidasiUlangClient items={items} />;
}
