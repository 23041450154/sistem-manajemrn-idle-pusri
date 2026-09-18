"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getEquipments, getRequireActions } from "@/action/api";
import FormInspeksiClient from "./form-inspeksi-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Client Component — master tindak lanjut & data aset di-fetch di browser;
 * interaksi form (upload, submit) tetap di client. */
export default function FormInspeksiPage() {
	const searchParams = useSearchParams();
	const equipmentId = searchParams.get("equipmentId") ?? undefined;

	const [requireActions, setRequireActions] = useState<any[]>([]);
	const [equipment, setEquipment] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
			const [requireActionsData, equipments] = await Promise.all([
				getRequireActions().catch(() => []),
				getEquipments().catch(() => []),
			]);

			const foundEquipment = (Array.isArray(equipments) ? equipments : []).find(
				(e: any) => String(e.id) === String(equipmentId),
			);

			if (!alive) return;
			setRequireActions(Array.isArray(requireActionsData) ? requireActionsData : []);
			setEquipment(foundEquipment ?? null);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, [equipmentId]);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);

	return (
		<FormInspeksiClient
			equipmentId={equipmentId ?? null}
			equipment={equipment ?? null}
			requireActions={requireActions}
		/>
	);
}
