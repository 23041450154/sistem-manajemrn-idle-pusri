import { getEquipments, getRequireActions } from "@/action/api";
import FormInspeksiClient from "./form-inspeksi-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Server Component — master tindak lanjut & data aset di-fetch di server;
 * interaksi form (upload, submit) tetap di client. */
export default async function FormInspeksiPage({
	searchParams,
}: {
	searchParams: Promise<{ equipmentId?: string }>;
}) {
	const { equipmentId } = await searchParams;

	const [requireActions, equipments] = await Promise.all([
		getRequireActions().catch(() => []),
		getEquipments().catch(() => []),
	]);

	const equipment = (Array.isArray(equipments) ? equipments : []).find(
		(e: any) => String(e.id) === String(equipmentId),
	);

	return (
		<FormInspeksiClient
			equipmentId={equipmentId ?? null}
			equipment={equipment ?? null}
			requireActions={Array.isArray(requireActions) ? requireActions : []}
		/>
	);
}
