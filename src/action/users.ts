"use server";

import { cookies } from "next/headers";
import { API_URL } from "@/config/api";
import { revalidateApp } from "@/lib/revalidate";
import { ROLES, type Role } from "@/lib/roles";

export type UserAccount = {
	id: number;
	name: string;
	email: string;
	npp: string;
	role: string;
	created_at: string;
	updated_at: string;
};

type UserInput = {
	name: string;
	email: string;
	npp: string;
	role: Role;
	password?: string;
};

type Result = { success: boolean; message?: string };
type ListResult = Result & { data: UserAccount[] };

async function authHeaders() {
	const token = (await cookies()).get("token")?.value;
	return token ? { Authorization: `Bearer ${token}` } : null;
}

async function failure(res: Response): Promise<Result> {
	const body = await res.json().catch(() => null);
	return {
		success: false,
		message: body?.message || `HTTP Error ${res.status}`,
	};
}

function validate(input: UserInput, creating: boolean): Result | null {
	if (input.name.trim().length < 2)
		return { success: false, message: "Nama minimal 2 karakter." };
	if (input.npp.trim().length < 2)
		return { success: false, message: "NPP minimal 2 karakter." };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
		return { success: false, message: "Email tidak valid." };
	if (!ROLES.includes(input.role))
		return { success: false, message: "Role tidak valid." };
	if (creating && (!input.password || input.password.length < 6))
		return { success: false, message: "Password minimal 6 karakter." };
	return null;
}

export async function getUsers(): Promise<ListResult> {
	const headers = await authHeaders();
	if (!headers)
		return { success: false, message: "Sesi tidak valid.", data: [] };
	try {
		const res = await fetch(`${API_URL}/api/admin/user`, {
			headers,
			cache: "no-store",
		});
		if (!res.ok) return { ...(await failure(res)), data: [] };
		const body = await res.json();
		return { success: true, data: Array.isArray(body.user) ? body.user : [] };
	} catch (error) {
		return { success: false, message: (error as Error).message, data: [] };
	}
}

export async function createUser(input: UserInput): Promise<Result> {
	const invalid = validate(input, true);
	if (invalid) return invalid;
	const headers = await authHeaders();
	if (!headers) return { success: false, message: "Sesi tidak valid." };
	try {
		const res = await fetch(`${API_URL}/api/admin/user`, {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				...input,
				name: input.name.trim(),
				email: input.email.trim(),
				npp: input.npp.trim(),
			}),
		});
		if (!res.ok) return failure(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}

export async function updateUser(
	id: number,
	input: UserInput,
): Promise<Result> {
	const invalid = validate(input, false);
	if (invalid) return invalid;
	const headers = await authHeaders();
	if (!headers) return { success: false, message: "Sesi tidak valid." };
	try {
		const res = await fetch(`${API_URL}/api/admin/user/${id}`, {
			method: "PATCH",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				name: input.name.trim(),
				email: input.email.trim(),
				npp: input.npp.trim(),
				role: input.role,
			}),
		});
		if (!res.ok) return failure(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}

export async function deleteUser(id: number): Promise<Result> {
	const headers = await authHeaders();
	if (!headers) return { success: false, message: "Sesi tidak valid." };
	try {
		const res = await fetch(`${API_URL}/api/admin/user/${id}`, {
			method: "DELETE",
			headers,
		});
		if (!res.ok) return failure(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}
