"use client";

import { useEffect, useState, useCallback } from "react";
import { getScraps, getInspections } from "@/action/api";
import { extractSapNotification } from "@/lib/sap-notification";
import ManajerScrapClient from "./scrap-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Client Component — fetch + sort di browser, interaksi review approve/reject di client. */
export default function ManajerScrapPage() {
	const [scraps, setScraps] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const [data, inspectionsData] = await Promise.all([
			getScraps().catch(() => []),
			getInspections().catch(() => []),
		]);

		const inspectionByEqMap = new Map<string, any>();
		if (Array.isArray(inspectionsData)) {
			inspectionsData.forEach((ins: any) => {
				const eqId = String(ins.equipment_id);
				const existing = inspectionByEqMap.get(eqId);
				if (!existing || Number(ins.id) > Number(existing.id)) {
					inspectionByEqMap.set(eqId, ins);
				}
			});
		}

		const mapped = (Array.isArray(data) ? data : []).map((item: any) => {
			const eqId = String(item.equipment_id);
			const relatedInsp = inspectionByEqMap.get(eqId);
			const sapNum =
				item.sap_notification_number ||
				extractSapNotification(item) ||
				extractSapNotification(relatedInsp) ||
				undefined;

			return {
				...item,
				sap_notification_number: sapNum,
			};
		});

		const sorted = mapped.sort((a, b) => {
			const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
			const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});

		setScraps(sorted);
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
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />Memuat data...</div></main>
		);

	return <ManajerScrapClient scraps={scraps} onRefresh={loadData} />;
}
