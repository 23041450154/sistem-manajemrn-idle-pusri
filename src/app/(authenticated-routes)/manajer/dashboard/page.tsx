import Link from "next/link";
import { CheckSquare, Trash2, ArrowUpRight } from "lucide-react";
import {
	getEquipments,
	getApprovals,
	getReuseRequests,
	getDisposals,
	getFinancialSummary,
	getFinancialMonthlyTrend,
} from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import { statusName } from "@/lib/equipment-status";
import ManajerDashboardClient from "./manajer-dashboard-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export default async function ManajerDashboardPage() {
	const [equipments, validationApprovals, reuseRequests, disposals, financialSummary, financialTrend] = await Promise.all([
		getEquipments().catch(() => []),
		getApprovals("validation").catch(() => []),
		getReuseRequests("all").catch(() => []),
		getDisposals().catch(() => []),
		getFinancialSummary().catch(() => null),
		getFinancialMonthlyTrend().catch(() => []),
	]);

	const equipmentList = Array.isArray(equipments) ? equipments : [];
	const equipmentMap = new Map<string, any>();
	equipmentList.forEach((eq: any) => {
		if (eq.id != null) equipmentMap.set(String(eq.id), eq);
	});

	const normalizedValidations = (Array.isArray(validationApprovals) ? validationApprovals : []).map((item: any) => {
		const equipmentId = item.equipment_id || item.equipment?.id;
		const eq = (equipmentId != null && equipmentMap.get(String(equipmentId))) || item.equipment;
		let approvalStatus = item.approval_status;
		let statusAset = statusName(item.equipment_status || eq?.status?.name || eq?.status || "VALIDATED");

		// Jika aset sudah READY_TO_USE di database, otomatis approval sudah APPROVED (riwayat persetujuan)
		if (statusAset === "READY_TO_USE" && (!approvalStatus || approvalStatus === "PENDING")) {
			approvalStatus = "APPROVED";
		}
		if (approvalStatus === "APPROVED") {
			statusAset = "READY_TO_USE";
		}

		return {
			...item,
			equipment: eq || item.equipment,
			approval_status: approvalStatus || "PENDING",
			equipment_status: statusAset,
			equipment_name: item.equipment_name || eq?.name || "Equipment",
			equipment_code: item.equipment_code || eq?.equipment_code || "-",
		};
	});

	return (
		<div className="page-container">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard Manajer Rendal</h1>
					<p className="page-subtitle">
						Pusat persetujuan manajerial, monitoring kesiapan utilisasi, dan tata kelola aset idle.
					</p>
				</div>
				<div className="header-actions">
					<Link
						href="/manajer/approve"
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<CheckSquare className="w-4 h-4" />
						Persetujuan Validasi
					</Link>
					<Link
						href="/manajer/peminjaman"
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<ArrowUpRight className="w-4 h-4" />
						Persetujuan Peminjaman
					</Link>
					<Link
						href="/manajer/scrap"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						<Trash2 className="w-4 h-4" />
						Persetujuan Scrap
					</Link>
				</div>
			</div>

			{/* Manajer Executive Dashboard Content */}
			<ManajerDashboardClient
				equipments={equipmentList}
				validationApprovals={normalizedValidations}
				reuseRequests={Array.isArray(reuseRequests) ? reuseRequests : []}
				disposals={Array.isArray(disposals) ? disposals : []}
				financialSummary={financialSummary}
				financialTrend={Array.isArray(financialTrend) ? financialTrend : []}
			/>
		</div>
	);
}
