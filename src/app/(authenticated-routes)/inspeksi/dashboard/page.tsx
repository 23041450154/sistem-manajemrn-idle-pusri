"use client";
import { useEffect, useState, useCallback } from "react";
import { getEquipments, getApprovals } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import InspeksiDashboardClient from "./dashboard-client";

/** Client Component — fetch + sort di browser, interaksi di client. */
export default function InspeksiDashboardPage() {
	const [equipments, setEquipments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const [eqData, approvalsRes] = await Promise.all([
			getEquipments().catch(() => []),
			getApprovals("validation").catch(() => []),
		]);

		const approvalsData = Array.isArray(approvalsRes)
			? approvalsRes
			: approvalsRes?.data || [];

		const mapped = (Array.isArray(eqData) ? eqData : []).map((item: any) => {
			let statusAset = statusName(item.status?.name || item.status || "REGISTERED");
			let statusPersetujuan = "NONE";

			const app = approvalsData.find(
				(a: any) =>
					a.equipment_id === Number(item.id) || a.equipment?.id === Number(item.id),
			);

			if (app) {
				if (app.approval_status === "REVISION_REQUIRED") {
					statusPersetujuan = "NEED_REVISION";
				} else if (app.approval_status === "IN_REVIEW") {
					statusPersetujuan = "IN_REVIEW";
				} else if (app.approval_status === "APPROVED") {
					statusPersetujuan = "APPROVED";
					if (statusAset === "VALIDATED") statusAset = "READY_TO_USE";
				} else if (app.approval_status === "REJECTED") {
					statusPersetujuan = "REJECTED";
					statusAset = "REJECTED";
				} else if (statusAset === "READY_TO_USE" || statusAset === "REUSED") {
					statusPersetujuan = "APPROVED";
				} else {
					statusPersetujuan = "PENDING_REVIEW";
				}
			} else {
				if (statusAset === "REGISTERED") {
					statusPersetujuan = "NONE";
				} else if (
					statusAset === "READY_TO_USE" ||
					statusAset === "REUSED" ||
					statusAset === "REPAIR"
				) {
					statusPersetujuan = "APPROVED";
				} else if (
					statusAset === "VALIDATED" ||
					statusAset === "REVALIDATION" ||
					statusAset === "SCRAP" ||
					statusAset === "DISPOSAL_RECOMMENDED"
				) {
					statusPersetujuan = "PENDING_REVIEW";
				} else if (statusAset === "REJECTED") {
					statusPersetujuan = "REJECTED";
				}
			}

			return {
				...item,
				statusAset,
				statusPersetujuan,
				approvalId: app ? String(app.id) : undefined,
			};
		});

		mapped.sort((a: any, b: any) => {
			const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
			const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});

		setEquipments(mapped);
	}, []);

	useEffect(() => {
		let alive = true;
		void (async () => {
			await loadData();
			if (!alive) return;
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, [loadData]);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);

	return <InspeksiDashboardClient equipments={equipments} onRefresh={loadData} />;
}
