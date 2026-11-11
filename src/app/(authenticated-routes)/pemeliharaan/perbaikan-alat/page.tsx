"use client";
import { useEffect, useState, useCallback } from "react";
import { getEquipments } from "@/action/api";
import { repairFlowStatus, formatCondition } from "@/lib/equipment-status";
import PerbaikanAlatClient, {
	type MaintenanceEquipment,
} from "./perbaikan-alat-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Lampiran equipment bisa berupa dokumen; galeri hanya menampilkan berkas gambar. */
const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?.*)?$/i;

/** Client Component — fetch sekali di browser, mapping murni, lalu pass ke client. */
export default function PerbaikanAlatPage() {
	const [equipments, setEquipments] = useState<MaintenanceEquipment[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		// Action sudah balik [] saat HTTP gagal; .catch hanya jaring pengaman error tak terduga.
		const data = await getEquipments().catch(() => []);

		const equipments: MaintenanceEquipment[] = (
			Array.isArray(data) ? data : []
		).flatMap((item: any): MaintenanceEquipment[] => {
			// Periksa apakah aset ditugaskan ke pihak ketiga (vendor) atau internal
			let assignment: any = null;
			if (typeof window !== "undefined") {
				try {
					const raw = localStorage.getItem("idle_repair_assignments");
					if (raw) {
						const map = JSON.parse(raw);
						assignment = map[String(item.id)];
					}
				} catch {}
			}

			const rawStatus = (typeof item.status === "string" ? item.status : item.status?.name) || "";
			const stUpper = rawStatus.toUpperCase();
			const statusId = Number(item.status_id || item.status?.id || 0);

			// Status non-perbaikan tidak boleh masuk ke modul pemeliharaan
			const isNonRepairStatus =
				stUpper === "PROPOSED" ||
				stUpper === "PROPOSAL_REJECTED" ||
				stUpper === "REGISTERED" ||
				stUpper === "REUSED" ||
				stUpper === "SCRAP_RECOMMENDED" ||
				stUpper === "SCRAP_REQUESTED" ||
				stUpper === "SCRAP" ||
				statusId === 1 ||
				statusId === 2 ||
				statusId === 3 ||
				statusId === 9 ||
				statusId === 10 ||
				statusId === 11 ||
				statusId === 12;

			if (isNonRepairStatus) {
				return [];
			}

			const effectiveExecutor =
				assignment?.executor ||
				item.repair_executor ||
				(rawStatus === "REPAIR_VENDOR" || String(item.notes || "").includes("[Instruksi Kerja Vendor")
					? "VENDOR"
					: "INTERNAL");

			// Jika perbaikan ditugaskan ke Vendor, pekerjaan tidak masuk ke antrean bengkel internal Pemeliharaan Lapangan
			if (effectiveExecutor === "VENDOR" || rawStatus === "REPAIR_VENDOR") {
				return [];
			}

			// Prioritaskan status asli dari backend; jangan biarkan assignment localStorage menimpa status yang sudah selesai/naik
			const resolvedStatusName =
				stUpper === "REPAIR_COMPLETED" || statusId === 6
					? "REPAIR_COMPLETED"
					: rawStatus || assignment?.status || "REPAIR";

			const effectiveItem = { ...item, status: resolvedStatusName };
			const status = repairFlowStatus(effectiveItem);
			if (!status) return [];

			const pick = (val: any, fallback = "-") =>
				typeof val === "string" ? val : val?.name || val?.description || fallback;

			const stamp = item.updated_at || item.created_at;
			const money = (val: any) => Number(val) || 0;
			const dateOnly = (val: any) =>
				val ? new Date(val).toISOString().split("T")[0] : "—";

			return [
				{
					id: String(item.id),
					kodeAlat: item.equipment_code || "-",
					namaAlat: pick(item.name),
					tipeObjek: pick(item.object_type),
					plant: pick(item.plant),
					lokasiPenyimpanan: pick(item.storage_location),
					kondisi: formatCondition(item.condition),
					terakhirDiperbarui: (stamp ? new Date(stamp) : new Date())
						.toISOString()
						.split("T")[0],
					status,
					funcLoc: pick(item.func_loc),
					vendor: pick(item.vendor),
					tahun: Number(item.year) || 0,
					nilaiPerolehan: money(item.original_value),
					nilaiBuku: money(item.book_value),
					estimasiNilaiGunaUlang: money(item.estimated_reuse_value),
					idleSejak: dateOnly(item.idle_since),
					alasanIdle: pick(item.idle_reason),
					catatan: pick(item.notes, ""),
					updated_at: stamp || undefined,
					foto: (Array.isArray(item.attachments) ? item.attachments : [])
						.map((a: any) => a?.file_url || a?.fileUrl || a?.url || "")
						.filter((url: string) => IMAGE_FILE.test(url)),
				},
			];
		});

		equipments.sort((a, b) => {
			const timeA = new Date(a.updated_at || a.terakhirDiperbarui || 0).getTime();
			const timeB = new Date(b.updated_at || b.terakhirDiperbarui || 0).getTime();
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});

		setEquipments(equipments);
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

	return <PerbaikanAlatClient equipments={equipments} onRefresh={loadData} />;
}
