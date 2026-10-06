"use client";

import { useEffect, useState, useCallback } from "react";
import { getDisposals } from "@/action/api";
import ManajerScrapClient from "./scrap-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Client Component — fetch + sort di browser, interaksi review approve/reject di client. */
export default function ManajerScrapPage() {
	const [disposals, setDisposals] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const data = await getDisposals().catch(() => []);

		const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
			const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
			const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});

		setDisposals(sorted);
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

	return <ManajerScrapClient disposals={disposals} onRefresh={loadData} />;
}
