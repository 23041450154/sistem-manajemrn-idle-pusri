// Master data (client SPA). Fetch dari browser ke BE same-origin; cookie `token`
// (HttpOnly) otomatis terkirim via apiFetch(credentials:include).
import { findMasterEntity, type MasterEntity } from "@/lib/master-entities";
import { apiFetch } from "@/lib/api-client";
import { revalidateApp } from "@/lib/revalidate";

/** Safely extract a string from a value that may be a nested object. */
function str(val: unknown): string | undefined {
	if (val == null) return undefined;
	if (typeof val === "string") return val;
	if (typeof val === "number") return String(val);
	if (typeof val === "object" && val !== null) {
		const obj = val as Record<string, unknown>;
		if (typeof obj.name === "string") return obj.name;
		if (typeof obj.description === "string") return obj.description;
	}
	return String(val);
}

export type MasterItem = {
	id: number;
	name: string;
	description?: string;
	plant_id?: number;
	plant?: { id: number; name: string };
};

type Result = { success: boolean; message?: string };

function resolve(slug: string): MasterEntity {
	const entity = findMasterEntity(slug);
	if (!entity) throw new Error(`Master entity tidak dikenal: ${slug}`);
	return entity;
}

async function fail(res: Response): Promise<Result> {
	const body = await res.json().catch(() => null);
	return {
		success: false,
		message: body?.message || `HTTP Error ${res.status}`,
	};
}

export async function getMasterItems(slug: string): Promise<MasterItem[]> {
	const entity = resolve(slug);
	try {
		const res = await apiFetch(entity.listPath, { cache: "no-store" });
		if (!res.ok) return [];
		const json = await res.json();
		// idle_reason memakai reason_name; normalisasi ke `name` untuk UI.
		// Sebagian endpoint (functional-locations) mengembalikan array polos
		// tanpa pembungkus {data} — dukung keduanya.
		const rows: Record<string, unknown>[] = Array.isArray(json)
			? json
			: json.data || [];
		// Defensively coerce name/description to strings — the API sometimes
		// returns nested relation objects instead of scalars.
		return rows.map((row) => ({
			...row,
			name: str(row[entity.nameField] ?? row.name) ?? "",
			description: str(row.description),
		})) as MasterItem[];
	} catch (error) {
		console.error(`Fetch master ${slug} error:`, error);
		return [];
	}
}

export async function createMasterItem(
	slug: string,
	input: { name: string; description?: string; plantId?: number },
): Promise<Result> {
	const entity = resolve(slug);
	if (!entity.adminPath)
		return { success: false, message: `${entity.label} bersifat read-only.` };
	if (!input.name?.trim())
		return { success: false, message: "Nama wajib diisi." };
	if (entity.needsPlant && !input.plantId)
		return { success: false, message: "Plant wajib dipilih." };

	const body: Record<string, unknown> = {
		[entity.nameField]: input.name.trim(),
		description: input.description?.trim() || "-",
	};
	if (entity.needsPlant) body.plant_id = input.plantId;

	try {
		const res = await apiFetch(entity.adminPath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) return await fail(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}

export async function updateMasterItem(
	slug: string,
	id: number | string,
	input: { name?: string; description?: string; plantId?: number },
): Promise<Result> {
	const entity = resolve(slug);
	if (!entity.adminPath)
		return { success: false, message: `${entity.label} bersifat read-only.` };

	const body: Record<string, unknown> = {};
	if (input.name?.trim()) body[entity.nameField] = input.name.trim();
	if (input.description !== undefined)
		body.description = input.description.trim();
	if (entity.needsPlant && input.plantId) body.plant_id = input.plantId;

	try {
		const res = await apiFetch(`${entity.adminPath}/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) return await fail(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}

export async function deleteMasterItem(
	slug: string,
	id: number | string,
): Promise<Result> {
	const entity = resolve(slug);
	if (!entity.adminPath)
		return { success: false, message: `${entity.label} bersifat read-only.` };

	try {
		const res = await apiFetch(`${entity.adminPath}/${id}`, { method: "DELETE" });
		if (!res.ok) return await fail(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}
