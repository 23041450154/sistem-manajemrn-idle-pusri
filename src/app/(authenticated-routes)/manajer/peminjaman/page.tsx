import { getReuseRequests } from "@/action/api";
import { reuseDisplayStatus } from "@/lib/approvals";
import ManajerPeminjamanClient, {
	type ReuseRequest,
	type ReuseRequestApi,
} from "./peminjaman-client";

/** Server Component — fetch + mapping murni di server, interaksi review di client. */
export default async function ManajerPeminjamanPage() {
	// Manajer melihat semua pengajuan: GET /api/reuse-request/all.
	// Action sudah balik [] saat HTTP gagal; .catch jaring pengaman error tak terduga.
	const data = await getReuseRequests("all").catch(() => []);

	const requests: ReuseRequest[] = (
		Array.isArray(data) ? data : []
	).map((item: ReuseRequestApi) => {
		const eq = item.equipment || {};
		const rawDate =
			item.reuse_date ||
			item.requested_at ||
			item.created_at ||
			new Date().toISOString();
		const startDateStr =
			typeof rawDate === "string"
				? rawDate.split("T")[0]
				: new Date().toISOString().split("T")[0];

		return {
			id: String(item.id),
			approval_id: item.approval_id ?? null,
			request_number: item.request_number || `REQ-${item.id}`,
			equipment_id: String(item.equipment_id || eq.id || ""),
			equipment_code: eq.equipment_code || "-",
			equipment_name: eq.name || "Peralatan Idle",
			requesting_unit:
				item.installation_location ||
				item.requesting_project ||
				"Unit Operasi",
			target_plant:
				item.requesting_plant ||
				eq.plant?.name ||
				eq.plant?.description ||
				"-",
			start_date: startDateStr,
			end_date: "-",
			justification:
				item.justification ||
				item.notes ||
				"Kebutuhan operasional unit kerja",
			estimated_cost_avoidance:
				Number(item.estimated_cost_avoidance) || 0,
			contact_person: item.requested_by_user?.name || "-",
			contact_npp: item.requested_by_user?.npp || "-",
			contact_phone: "-",
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
				item.created_at || item.requested_at || (typeof rawDate === "string" ? rawDate : undefined),
			review_notes: item.notes || "",
		};
	});

	return <ManajerPeminjamanClient requests={requests} />;
}
