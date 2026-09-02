import { getReuseRequests, getEquipments } from "@/action/api";
import { reuseDisplayStatus } from "@/lib/approvals";
import ManajerPeminjamanClient, {
	type ReuseRequest,
	type ReuseRequestApi,
} from "./peminjaman-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — fetch + mapping murni di server, interaksi review di client. */
export default async function ManajerPeminjamanPage() {
	// Manajer melihat semua pengajuan: GET /api/reuse-request/all.
	// Master equipments diambil bersamaan untuk lookup kode & nama peralatan jika relasi belum ter-preload.
	const [data, rawEquipments] = await Promise.all([
		getReuseRequests("all").catch(() => []),
		getEquipments().catch(() => []),
	]);

	const equipmentList = Array.isArray(rawEquipments) ? rawEquipments : [];
	const equipmentMap = new Map<string, any>();
	equipmentList.forEach((e: any) => {
		if (e.id != null) {
			equipmentMap.set(String(e.id), e);
		}
		if (e.equipment_code) {
			equipmentMap.set(String(e.equipment_code).trim().toLowerCase(), e);
		}
		if (e.kodeAlat) {
			equipmentMap.set(String(e.kodeAlat).trim().toLowerCase(), e);
		}
	});

	const requests: ReuseRequest[] = (Array.isArray(data) ? data : []).map(
		(item: any) => {
			const eqId = String(item.equipment_id || item.equipmentId || item.equipment?.id || "");
			const eqFromMap = (eqId && equipmentMap.get(eqId)) || {};
			const eq = item.equipment || eqFromMap || {};

			const rawDate =
				item.reuse_date ||
				item.requested_at ||
				item.created_at ||
				new Date().toISOString();
			const startDateStr =
				typeof rawDate === "string"
					? rawDate.split("T")[0]
					: new Date().toISOString().split("T")[0];

			const eqCode =
				item.equipment_code ||
				item.equipmentCode ||
				item.kodeAlat ||
				eq.equipment_code ||
				eq.equipmentCode ||
				eq.kodeAlat ||
				eq.code ||
				eqFromMap.equipment_code ||
				eqFromMap.kodeAlat ||
				(eqId ? `EQ-${eqId}` : "-");

			const eqName =
				item.equipment_name ||
				item.equipmentName ||
				item.namaAlat ||
				eq.name ||
				eq.namaAlat ||
				eq.equipment_name ||
				eqFromMap.name ||
				eqFromMap.namaAlat ||
				"Peralatan Idle";

			let plantStr = "-";
			if (typeof item.target_plant === "string") {
				plantStr = item.target_plant;
			} else if (typeof item.requesting_plant === "string") {
				plantStr = item.requesting_plant;
			} else if (eq.plant) {
				plantStr = typeof eq.plant === "object" ? eq.plant.name || eq.plant.description || "-" : String(eq.plant);
			} else if (eqFromMap.plant) {
				plantStr = typeof eqFromMap.plant === "object" ? eqFromMap.plant.name || eqFromMap.plant.description || "-" : String(eqFromMap.plant);
			}

			return {
				id: String(item.id),
				approval_id: item.approval_id ?? null,
				request_number: item.request_number || `REQ-${item.id}`,
				equipment_id: eqId,
				equipment_code: String(eqCode),
				equipment_name: String(eqName),
				requesting_unit:
					item.installation_location ||
					item.installationLocation ||
					item.requesting_project ||
					item.requesting_unit ||
					"Unit Operasi",
				target_plant: plantStr,
				start_date: startDateStr,
				end_date: item.end_date || item.endDate || "-",
				justification:
					item.justification || "Kebutuhan operasional unit kerja",
				estimated_cost_avoidance: Number(item.estimated_cost_avoidance || item.estimatedCostAvoidance) || 0,
				contact_person: item.requested_by_user?.name || item.contact_person || item.contactPerson || "",
				contact_npp: item.requested_by_user?.npp || item.contact_npp || item.contactNpp || "",
				contact_phone: item.requested_by_user?.email || item.contact_phone || item.contactPhone || item.email || "",
				// Backend mengembalikan approval_status = APPROVED setelah
				// Manager menyetujui. Variasi casing dipertahankan agar tidak
				// kembali tampil sebagai PENDING saat data dimuat ulang.
				status: reuseDisplayStatus(
					item.approval_status ||
						item.approvalStatus ||
						item.ApprovalStatus ||
						item.status,
				),
				// Gunakan waktu pengajuan untuk pengurutan tabel; tanggal reuse
				// adalah tanggal pemakaian yang dapat berada di masa depan.
				created_at:
					item.created_at ||
					item.requested_at ||
					(typeof rawDate === "string" ? rawDate : undefined),
				review_notes:
					typeof item.review_notes === "string"
						? item.review_notes.trim()
						: (typeof item.approval?.notes === "string" ? item.approval.notes.trim() : ""),
			};
		},
	);

	return <ManajerPeminjamanClient requests={requests} />;
}
