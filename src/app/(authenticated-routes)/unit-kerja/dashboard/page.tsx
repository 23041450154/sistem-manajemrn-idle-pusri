import { getEquipments, getObjectTypes, getReuseRequests } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
// Data di-fetch server-side; interaksi ada di ./dashboard-client.
import UnitKerjaDashboardContent from "./dashboard-client";

/** ponytail: API rows are untyped JSON; every field is narrowed at the mapping boundary below.
 * Upgrade path: generate types from the backend OpenAPI/Prisma schema. */
type ApiRow = Record<string, unknown>;

const str = (...vals: unknown[]): string => {
	for (const v of vals) {
		if (typeof v === "string" && v) return v;
		if (typeof v === "number") return String(v);
		if (v && typeof v === "object") {
			const name = (v as ApiRow).name ?? (v as ApiRow).plant;
			if (typeof name === "string" && name) return name;
		}
	}
	return "-";
};

export interface EquipmentItem {
	id: string;
	equipment_code: string;
	name: string;
	plant: string;
	category: string;
	status_name: string;
}

export interface ReuseRequestItem {
	id: string;
	request_number: string;
	equipment_code: string;
	equipment_name: string;
	installation_location: string;
	status: string;
}

/** Server Component — satu fetch di server, hasil dipetakan lalu diteruskan ke client. */
export default async function UnitKerjaDashboardPage() {
	const [rawEqList, rawRequests, rawObjTypes] = await Promise.all([
		getEquipments().catch(() => []),
		getReuseRequests().catch(() => []),
		getObjectTypes().catch(() => []),
	]);

	const objTypes = Array.isArray(rawObjTypes) ? rawObjTypes : [];
	const equipmentById = new Map<string, ApiRow>(
		(rawEqList || []).map((item: ApiRow) => [String(item.id), item]),
	);

	const mappedEquipments: EquipmentItem[] = (rawEqList || []).map(
		(item: any) => {
			let objectTypeName = "Lainnya";
			if (item.object_type?.name) {
				objectTypeName = item.object_type.name;
			} else if (item.objectType?.name) {
				objectTypeName = item.objectType.name;
			} else {
				const otId = item.id_object_type || item.object_type_id || item.objectTypeId;
				if (otId && objTypes.length > 0) {
					const found = objTypes.find(
						(o: any) => o.id === otId || o.id === Number(otId),
					);
					if (found) objectTypeName = found.name;
				}
			}

			return {
				id: String(item.id),
				equipment_code: str(item.equipment_code, `EQ-${item.id}`),
				name: str(item.name, item.nama),
				plant: str(item.plant),
				category: objectTypeName,
				status_name: statusName(str(item.status, "")),
			};
		},
	);

	const reqList: ReuseRequestItem[] = (rawRequests || []).map((r: ApiRow) => {
		const equipment = (r.equipment ?? {}) as ApiRow;
		const equipmentId = String(
			r.equipment_id ?? r.equipmentId ?? equipment.id ?? "",
		);
		// Response reuse kadang hanya membawa relasi equipment kosong.
		// Utamakan data master equipment dari /api/equipment berdasarkan ID.
		const masterEquipment = equipmentById.get(equipmentId) ?? equipment;
		return {
			id: String(r.id),
			request_number: str(r.request_number, r.requestNumber, `REQ-${r.id}`),
			equipment_code: str(
				masterEquipment.equipment_code,
				masterEquipment.equipmentCode,
				r.equipment_code,
				r.equipmentCode,
				equipment.equipment_code,
			),
			equipment_name: str(
				masterEquipment.name,
				masterEquipment.nama,
				r.equipment_name,
				r.equipmentName,
				equipment.name,
			),
			installation_location: str(r.installation_location, r.installationLocation),
			status: str(r.status, r.approval_status, r.approvalStatus, "PENDING"),
		};
	});

	return (
		<UnitKerjaDashboardContent
			equipments={mappedEquipments.filter((e) => e.status_name === "READY_TO_USE")}
			reuseRequests={reqList}
		/>
	);
}
