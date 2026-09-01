import { getEquipments, getReuseRequests } from "@/action/api";
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
	const [rawData, rawEquipments] = await Promise.all([
		getReuseRequests().catch(() => []),
		getEquipments().catch(() => []),
	]);

	const equipmentMap = new Map<string, any>();
	if (Array.isArray(rawEquipments)) {
		rawEquipments.forEach((eq: any) => {
			if (eq.id != null) equipmentMap.set(String(eq.id), eq);
			if (eq.equipment_code) equipmentMap.set(String(eq.equipment_code), eq);
		});
	}

	const items: ReuseRequestItem[] = (rawData || []).map((r: any) => {
		const eqId = String(r.equipment_id || r.equipmentId || r.equipment?.id || "");
		const eqFromMap = (eqId && equipmentMap.get(eqId)) || {};
		const eq = r.equipment || eqFromMap || {};

		const eqCode =
			r.equipment_code ||
			r.equipmentCode ||
			r.kodeAlat ||
			eq.equipment_code ||
			eq.equipmentCode ||
			eq.kodeAlat ||
			eq.code ||
			eqFromMap.equipment_code ||
			(eqId ? `EQ-${eqId}` : "-");

		const eqName =
			r.equipment_name ||
			r.equipmentName ||
			r.namaAlat ||
			eq.name ||
			eq.namaAlat ||
			eq.equipment_name ||
			eqFromMap.name ||
			eqFromMap.namaAlat ||
			"Peralatan Idle";

		let targetPlantStr = "Plant PUSRI IB";
		if (typeof r.target_plant === "string") targetPlantStr = r.target_plant;
		else if (typeof r.requesting_plant === "string") targetPlantStr = r.requesting_plant;
		else if (r.target_plant && typeof r.target_plant === "object")
			targetPlantStr =
				r.target_plant.name || r.target_plant.plant || "Plant PUSRI IB";
		else if (typeof r.targetPlant === "string") targetPlantStr = r.targetPlant;
		else if (eq.plant)
			targetPlantStr = typeof eq.plant === "object" ? eq.plant.name || eq.plant.description || "-" : String(eq.plant);

		let installLocStr = "Area Pabrik Utama";
		if (typeof r.installation_location === "string")
			installLocStr = r.installation_location;
		else if (typeof r.installationLocation === "string")
			installLocStr = r.installationLocation;
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

		const contactPerson =
			r.requested_by_user?.name ||
			(typeof r.contact_person === "string" && r.contact_person !== "-" ? r.contact_person : "") ||
			(typeof r.contactPerson === "string" && r.contactPerson !== "-" ? r.contactPerson : "");

		const contactNpp =
			r.requested_by_user?.npp ||
			(typeof r.contact_npp === "string" && r.contact_npp !== "-" ? r.contact_npp : "") ||
			(typeof r.contactNpp === "string" && r.contactNpp !== "-" ? r.contactNpp : "");

		const contactPhone =
			r.requested_by_user?.email ||
			(typeof r.contact_phone === "string" && r.contact_phone !== "-" ? r.contact_phone : "") ||
			(typeof r.contactPhone === "string" && r.contactPhone !== "-" ? r.contactPhone : "") ||
			(typeof r.email === "string" && r.email !== "-" ? r.email : "");

		return {
			id: String(r.id),
			request_number: String(
				r.request_number || r.requestNumber || `REQ-REUSE-${r.id}`,
			),
			equipment_id: eqId,
			equipment_code: String(eqCode),
			equipment_name: String(eqName),
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
			contact_person: contactPerson,
			contact_npp: contactNpp,
			contact_phone: contactPhone,
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
