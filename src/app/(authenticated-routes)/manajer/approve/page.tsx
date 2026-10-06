"use client";

import { useEffect, useState } from "react";
import { getApprovals, getEquipments, getPlants } from "@/action/api";
import { useAuth } from "@/components/AuthProvider";
import { statusName } from "@/lib/equipment-status";
import ManajerApproveClient, { type RequestAsset } from "./approve-client";

/* ponytail: payload API legacy tetap untyped sampai backend mengekspor DTO bersama. */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Label fallback bila backend belum mengirim status_label.
const APPROVAL_STATUS_LABEL: Record<string, string> = {
	PENDING: "Menunggu Review",
	IN_REVIEW: "Sedang Direview",
	APPROVED: "Disetujui",
	REVISION_REQUIRED: "Perlu Revisi",
};

/** Client Component — fetch inbox approval + mapping murni di browser.
 * Detail per-aset (steps/attachments/validasi) tetap dimuat client saat modal dibuka. */
export default function ManajerApprovePage() {
	const { user } = useAuth();
	const [requests, setRequests] = useState<RequestAsset[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const currentUserNPP = user?.npp || "";

	useEffect(() => {
		let alive = true;
		void (async () => {
			const [approvalsData, equipmentsData, plantsData] = await Promise.all([
				getApprovals().catch(() => []),
				getEquipments().catch(() => []),
				getPlants().catch(() => []),
			]);

			const plantList = Array.isArray(plantsData) ? plantsData : [];

			// Buat kamus (map) equipment berdasarkan ID untuk pencarian cepat
			const equipmentMap = new Map();
			if (Array.isArray(equipmentsData)) {
				equipmentsData.forEach((eq: any) => {
					equipmentMap.set(Number(eq.id), eq);
				});
			}

			const mapped: RequestAsset[] = (
				Array.isArray(approvalsData) ? approvalsData : []
			).map((item: any): RequestAsset => {
				const equipmentId = item.equipment_id || item.equipment?.id;
				const eq = equipmentMap.get(Number(equipmentId)) || item.equipment;
				let approvalStatus = item.approval_status;
				let statusAset = statusName(
					item.equipment_status || eq?.status?.name || "VALIDATED",
				);

				// Jika aset sudah READY_TO_USE di database, otomatis anggap approval sudah APPROVED (masuk riwayat)
				if (statusAset === "READY_TO_USE" && (!approvalStatus || approvalStatus === "PENDING")) {
					approvalStatus = "APPROVED";
				}

				if (approvalStatus === "APPROVED") {
					statusAset = "READY_TO_USE";
				}

				const statusLabel =
					item.status_label || APPROVAL_STATUS_LABEL[approvalStatus] || approvalStatus;

				return {
					id: item.id.toString(),
					equipmentId: equipmentId?.toString() || "",
					nomorRequest: item.request_number,
					kodeAset: item.equipment_code || eq?.equipment_code || "-",
					objectType: item.object_type ?? eq?.object_type ?? null,
					namaAset: item.equipment_name || eq?.name || "-",
					plant: item.plant ?? eq?.plant ?? null,
					funcLoc: item.func_loc ?? eq?.func_loc ?? null,
					storage: item.storage_location ?? eq?.storage_location ?? null,
					tanggalPengajuan: item.request_date
						? new Date(item.request_date).toISOString().split("T")[0]
						: "-",
					statusAset: statusAset,
					approvalStatus: approvalStatus,
					statusLabel: statusLabel,
					inspekturNPP: (() => {
						const p = eq?.updated_by_npp || eq?.created_by_npp || currentUserNPP;
						if (!p) return "-";
						return /^\d/.test(p) ? `NPP${p}` : p;
					})(),
				};
			});

			mapped.sort((a, b) => {
				const timeA =
					a.tanggalPengajuan && a.tanggalPengajuan !== "-"
						? new Date(a.tanggalPengajuan).getTime()
						: 0;
				const timeB =
					b.tanggalPengajuan && b.tanggalPengajuan !== "-"
						? new Date(b.tanggalPengajuan).getTime()
						: 0;
				if (timeB !== timeA) return timeB - timeA;
				return (Number(b.id) || 0) - (Number(a.id) || 0);
			});

			if (!alive) return;
			setPlants(plantList);
			setRequests(mapped);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, [currentUserNPP]);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />Memuat data...</div></main>
		);

	return <ManajerApproveClient requests={requests} plants={plants} />;
}
