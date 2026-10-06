"use client";

import { useEffect, useState } from "react";
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

export default function ManajerDashboardPage() {
	const [equipmentList, setEquipmentList] = useState<any[]>([]);
	const [normalizedValidations, setNormalizedValidations] = useState<any[]>([]);
	const [reuseRequests, setReuseRequests] = useState<any[]>([]);
	const [disposals, setDisposals] = useState<any[]>([]);
	const [financialSummary, setFinancialSummary] = useState<any>(null);
	const [financialTrend, setFinancialTrend] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
			const [equipments, validationApprovals, reuseRequestsData, disposalsData, financialSummaryData, financialTrendData] = await Promise.all([
				getEquipments().catch(() => []),
				getApprovals("validation").catch(() => []),
				getReuseRequests("all").catch(() => []),
				getDisposals().catch(() => []),
				getFinancialSummary().catch(() => null),
				getFinancialMonthlyTrend().catch(() => []),
			]);

			const list = Array.isArray(equipments) ? equipments : [];
			const equipmentMap = new Map<string, any>();
			list.forEach((eq: any) => {
				if (eq.id != null) equipmentMap.set(String(eq.id), eq);
			});

			const normalized = (Array.isArray(validationApprovals) ? validationApprovals : []).map((item: any) => {
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

			if (!alive) return;
			setEquipmentList(list);
			setNormalizedValidations(normalized);
			setReuseRequests(Array.isArray(reuseRequestsData) ? reuseRequestsData : []);
			setDisposals(Array.isArray(disposalsData) ? disposalsData : []);
			setFinancialSummary(financialSummaryData);
			setFinancialTrend(Array.isArray(financialTrendData) ? financialTrendData : []);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, []);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />Memuat data...</div></main>
		);

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
				reuseRequests={reuseRequests}
				disposals={disposals}
				financialSummary={financialSummary}
				financialTrend={financialTrend}
			/>
		</div>
	);
}
