import {
	getDisposals,
	getApprovals,
	getEquipments,
	getInspections,
} from "@/action/api";
import RendalLaporanClient, { type AuditLogEntry } from "./laporan-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

function buildAuditLogs(
	equipments: any[],
	approvals: any[],
	inspections: any[],
	disposals: any[],
): AuditLogEntry[] {
	const logs: AuditLogEntry[] = [];

	// Equipment registrations
	equipments.forEach((eq: any) => {
		logs.push({
			id: `eq-create-${eq.id}`,
			timestamp: eq.created_at || new Date().toISOString(),
			actor: eq.created_by_npp || eq.updated_by_npp || "System",
			actorRole: "Rendal Pemeliharaan",
			action: "Registrasi Aset",
			actionType: "CREATE",
			module: "Equipment",
			entityCode: eq.equipment_code || "-",
			entityName: eq.name || "-",
			description: `Aset ${eq.name} didaftarkan dengan kode ${eq.equipment_code}`,
			newValue: eq.status?.name || "REGISTERED",
		});

		if (eq.updated_at && eq.updated_at !== eq.created_at) {
			logs.push({
				id: `eq-update-${eq.id}`,
				timestamp: eq.updated_at,
				actor: eq.updated_by_npp || eq.created_by_npp || "System",
				actorRole: "Rendal Pemeliharaan",
				action: "Update Data Aset",
				actionType: "UPDATE",
				module: "Equipment",
				entityCode: eq.equipment_code || "-",
				entityName: eq.name || "-",
				description: `Data aset ${eq.name} diperbarui`,
				oldValue: "-",
				newValue: eq.status?.name || "-",
			});
		}
	});

	// Inspections
	inspections.forEach((ins: any) => {
		logs.push({
			id: `ins-${ins.id}`,
			timestamp: ins.created_at || ins.inspection_date || new Date().toISOString(),
			actor: ins.inspector_npp || ins.inspector?.name || "Inspektor",
			actorRole: "Inspeksi Teknik",
			action: "Inspeksi Teknik",
			actionType: "INSPECT",
			module: "Inspection",
			entityCode: ins.equipment?.equipment_code || `EQ-${ins.equipment_id}`,
			entityName: ins.equipment?.name || "-",
			description: `Hasil inspeksi: ${ins.mechanical_condition || "N/A"} / ${ins.electrical_condition || "N/A"}`,
			newValue: ins.require_action?.name || ins.notes || "VALIDATED",
		});
	});

	// Approvals
	approvals.forEach((app: any) => {
		let actionType: AuditLogEntry["actionType"] = "REVIEW";
		let actionLabel = "Pengajuan Dibuat";
		if (app.approval_status === "APPROVED") {
			actionType = "APPROVE";
			actionLabel = "Persetujuan Disetujui";
		} else if (app.approval_status === "REVISION_REQUIRED") {
			actionType = "REJECT";
			actionLabel = "Permintaan Revisi";
		} else if (app.approval_status === "IN_REVIEW") {
			actionType = "REVIEW";
			actionLabel = "Sedang Direview";
		}

		logs.push({
			id: `app-${app.id}`,
			timestamp: app.updated_at || app.request_date || new Date().toISOString(),
			actor: app.reviewer_npp || app.approved_by || "Manajer Rendal",
			actorRole: "Manajer Rendal",
			action: actionLabel,
			actionType,
			module: "Approval",
			entityCode: app.equipment_code || `EQ-${app.equipment_id}`,
			entityName: app.equipment_name || "-",
			description: `Pengajuan ${app.request_number}: ${actionLabel}`,
			oldValue: "PENDING",
			newValue: app.approval_status || "PENDING",
		});
	});

	// Disposals
	disposals.forEach((disp: any) => {
		logs.push({
			id: `disp-${disp.id}`,
			timestamp: disp.created_at || new Date().toISOString(),
			actor: "Rendal Pemeliharaan",
			actorRole: "Rendal Pemeliharaan",
			action:
				disp.status === "DISPOSED" ? "Disposal Disetujui" : "Pengajuan Disposal",
			actionType: disp.status === "DISPOSED" ? "APPROVE" : "CREATE",
			module: "Disposal",
			entityCode: disp.equipment_code || "-",
			entityName: disp.equipment_name || "-",
			description: `${disp.disposal_number}: ${disp.justification?.slice(0, 80) || "Pengajuan disposal aset"}`,
			oldValue: "PENDING",
			newValue: disp.status || "PENDING",
		});
	});

	// Sort by timestamp descending
	logs.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

	return logs;
}

/** Server Component — read-only: semua fetch + derivasi log di server. */
export default async function RendalLaporanPage() {
	const [eq, validationApps, revalApps, disposalApps, reuseApps, ins, disps] =
		await Promise.all([
			getEquipments().catch(() => []),
			// Audit trail mencakup semua jenis approval, jadi keempat grup diambil.
			getApprovals("validation").catch(() => []),
			getApprovals("revalidation").catch(() => []),
			getApprovals("disposal").catch(() => []),
			getApprovals("reuse").catch(() => []),
			getInspections().catch(() => []),
			getDisposals().catch(() => []),
		]);

	const apps = [
		...(validationApps as any[]),
		...(revalApps as any[]),
		...(disposalApps as any[]),
		...(reuseApps as any[]),
	];

	const logs = buildAuditLogs(eq as any[], apps, ins as any[], disps as any[]);

	return <RendalLaporanClient logs={logs} />;
}
