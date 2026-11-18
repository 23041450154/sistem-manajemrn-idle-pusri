"use client";

import { useCallback, useEffect, useState } from "react";
import { getEquipmentProposals, getEquipments } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import VerifikasiUsulanClient, {
	type ProposalItem,
} from "./verifikasi-usulan-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapProposalRow(item: any): ProposalItem {
	const plantStr =
		typeof item.plant === "string"
			? item.plant
			: item.plant?.name || item.plant?.description || "-";
	const storageStr =
		typeof item.storage_location === "string"
			? item.storage_location
			: item.storage_location?.name || "-";
	const funcLocStr =
		typeof item.func_loc === "string"
			? item.func_loc
			: item.func_loc?.name || item.func_loc?.description || "-";
	const proposerName =
		item.created_by_user?.name ||
		item.created_by_name ||
		(item.created_by_npp ? `NPP ${item.created_by_npp}` : "-");

	return {
		id: String(item.id),
		equipmentCode: String(item.equipment_code || `EQ-${item.id}`),
		equipmentName: String(item.name || "Peralatan Tanpa Nama"),
		plant: plantStr,
		funcLoc: funcLocStr,
		storageLocation: storageStr,
		idleReason: String(item.idle_reason || "-"),
		rejectionNotes: item.rejection_notes || "",
		status: statusName(
			typeof item.status === "object" ? item.status?.name : item.status,
		),
		createdAt: item.created_at
			? new Date(item.created_at).toISOString().split("T")[0]
			: "-",
		proposerName,
		attachments: Array.isArray(item.attachments) ? item.attachments : [],
	};
}

export default function VerifikasiUsulanPage() {
	const [proposals, setProposals] = useState<ProposalItem[]>([]);
	const [rejectedProposals, setRejectedProposals] = useState<ProposalItem[]>(
		[],
	);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		const [pendingRaw, allEquipments] = await Promise.all([
			getEquipmentProposals().catch(() => []),
			getEquipments().catch(() => []),
		]);

		const pendingMapped = (Array.isArray(pendingRaw) ? pendingRaw : []).map(
			mapProposalRow,
		);

		const rejectedMapped = (Array.isArray(allEquipments) ? allEquipments : [])
			.filter(
				(eq: any) =>
					statusName(
						typeof eq.status === "object" ? eq.status?.name : eq.status,
					) === "PROPOSAL_REJECTED",
			)
			.map(mapProposalRow);

		setProposals(pendingMapped);
		setRejectedProposals(rejectedMapped);
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

	if (loading) {
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);
	}

	return (
		<VerifikasiUsulanClient
			proposals={proposals}
			rejectedProposals={rejectedProposals}
			onRefresh={loadData}
		/>
	);
}
