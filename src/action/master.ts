"use server";

import { cookies } from "next/headers";
import { findMasterEntity, type MasterEntity } from "@/lib/master-entities";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.API_URL ||
	"https://api.testing.naufal.me";

export type MasterItem = {
	id: number;
	name: string;
	description?: string;
	plant_id?: number;
	plant?: { id: number; name: string };
};

type Result = { success: boolean; message?: string };

async function authHeaders() {
	const token = (await cookies()).get("token")?.value;
	return { Authorization: `Bearer ${token}` };
}

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
		const res = await fetch(`${API_URL}${entity.listPath}`, {
			headers: await authHeaders(),
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		// idle_reason memakai reason_name; normalisasi ke `name` untuk UI.
		return (json.data || []).map((row: Record<string, unknown>) => ({
			...row,
			name: row[entity.nameField] ?? row.name,
		}));
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
		const res = await fetch(`${API_URL}${entity.adminPath}`, {
			method: "POST",
			headers: { ...(await authHeaders()), "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return res.ok ? { success: true } : await fail(res);
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
		const res = await fetch(`${API_URL}${entity.adminPath}/${id}`, {
			method: "PATCH",
			headers: { ...(await authHeaders()), "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return res.ok ? { success: true } : await fail(res);
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
		const res = await fetch(`${API_URL}${entity.adminPath}/${id}`, {
			method: "DELETE",
			headers: await authHeaders(),
		});
		return res.ok ? { success: true } : await fail(res);
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}
