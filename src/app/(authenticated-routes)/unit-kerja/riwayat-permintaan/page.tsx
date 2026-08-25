import { getReuseRequests } from "@/action/api";
import RiwayatPermintaanClient, {
	type ReuseRequestItem,
} from "./riwayat-permintaan-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — fetch + mapping murni di server; flag ?submitted jadi prop. */
export default async function RiwayatPermintaanPage({
	searchParams,
}: {
	searchParams: Promise<{ submitted?: string }>;
}) {
	const { submitted } = await searchParams;
	const rawData = await getReuseRequests().catch(() => []);

	const items: ReuseRequestItem[] = (rawData || []).map((r: any) => {
		let targetPlantStr = "Plant PUSRI IB";
		if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
		else if (r.target_plant && typeof r.target_plant === "object")
			targetPlantStr =
				r.target_plant.name || r.target_plant.plant || "Plant PUSRI IB";
		else if (typeof r.targetPlant === "string") targetPlantStr = r.targetPlant;

		let installLocStr = "Area Pabrik Utama";
		if (typeof r.installation_location === "string")
			installLocStr = r.installation_location;
		else if (
			r.installation_location &&
			typeof r.installation_location === "object"
		)
			installLocStr = r.installation_location.name || "Area Pabrik Utama";

		const statusUpper = String(
			r.status || r.approval_status || r.approvalStatus || "PENDING",
		).toUpperCase();

		let finalStatus: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" =
			"PENDING";
		if (statusUpper.includes("APPROVED") || statusUpper.includes("DISETUJUI")) {
			finalStatus = "APPROVED";
		} else if (
			statusUpper.includes("REJECT") ||
			statusUpper.includes("DITOLAK")
		) {
			finalStatus = "REJECTED";
		} else if (statusUpper.includes("REVIEW")) {
			finalStatus = "IN_REVIEW";
		}

		const rawDate =
			r.start_date ||
			r.startDate ||
			r.reuse_date ||
			r.reuseDate ||
			r.created_at ||
			r.createdAt;

		let cleanDate = new Date().toISOString().split("T")[0];
		if (rawDate) {
			const s = String(rawDate);
			cleanDate = s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
		}

		return {
			id: String(r.id),
			request_number: String(
				r.request_number || r.requestNumber || `REQ-REUSE-${r.id}`,
			),
			equipment_id: String(r.equipment_id || r.equipmentId || ""),
			equipment_code: String(
				r.equipment_code || r.equipmentCode || r.equipment?.equipment_code || "-",
			),
			equipment_name: String(
				r.equipment_name || r.equipmentName || r.equipment?.name || "-",
			),
			installation_location: installLocStr,
			requesting_unit: installLocStr,
			target_plant: targetPlantStr,
			start_date: cleanDate,
			end_date:
				r.end_date || r.endDate
					? String(r.end_date || r.endDate).split("T")[0]
					: undefined,
			justification:
				typeof r.justification === "string"
					? r.justification
					: "Kebutuhan operasional unit kerja.",
			estimated_cost_avoidance:
				Number(r.estimated_cost_avoidance || r.estimatedCostAvoidance) || undefined,
			contact_person:
				typeof r.contact_person === "string" ? r.contact_person : "-",
			contact_npp: String(r.contact_npp || r.contactNpp || "-"),
			contact_phone: String(r.contact_phone || r.contactPhone || "-"),
			status: finalStatus,
			created_at: cleanDate,
		};
	});

	return (
		<RiwayatPermintaanClient
			items={items}
			isJustSubmitted={submitted === "true"}
		/>
	);
}
