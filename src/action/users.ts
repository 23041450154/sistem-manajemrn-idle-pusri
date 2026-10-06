// Admin users (client SPA). Fetch dari browser; cookie `token` (HttpOnly)
// otomatis terkirim via apiFetch. Sesi invalid -> BE balas 401 -> failure().
import { apiFetch } from "@/lib/api-client";
import { revalidateApp } from "@/lib/revalidate";
import { ROLES, type Role } from "@/lib/roles";

export type UserAccount = {
	id: number;
	name: string;
	email: string;
	npp: string;
	preferred_username?: string;
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
	// Username SSO (NEXA). Wajib agar user bisa login SSO. Kosong = NPP-only.
	preferred_username?: string;
};

type Result = { success: boolean; message?: string };
type ListResult = Result & { data: UserAccount[] };

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
	// Password opsional (user SSO-only tak butuh). Kalau diisi, minimal 6.
	if (input.password && input.password.length < 6)
		return { success: false, message: "Password minimal 6 karakter." };
	// preferred_username opsional; kalau diisi minimal 2.
	if (input.preferred_username && input.preferred_username.trim().length < 2)
		return { success: false, message: "Username SSO minimal 2 karakter." };
	// Saat membuat: minimal salah satu jalur login harus ada (password ATAU SSO).
	if (
		creating &&
		!input.password &&
		!(input.preferred_username && input.preferred_username.trim())
	)
		return {
			success: false,
			message: "Isi Password (login NPP) atau Username SSO minimal salah satu.",
		};
	return null;
}

export async function getUsers(): Promise<ListResult> {
	try {
		const res = await apiFetch(`/api/admin/user`, { cache: "no-store" });
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
	try {
		const res = await apiFetch(`/api/admin/user`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: input.name.trim(),
				email: input.email.trim(),
				npp: input.npp.trim(),
				role: input.role,
				...(input.password ? { password: input.password } : {}),
				preferred_username: (input.preferred_username ?? "").trim(),
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
	try {
		const res = await apiFetch(`/api/admin/user/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: input.name.trim(),
				email: input.email.trim(),
				npp: input.npp.trim(),
				role: input.role,
				preferred_username: (input.preferred_username ?? "").trim(),
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
	try {
		const res = await apiFetch(`/api/admin/user/${id}`, { method: "DELETE" });
		if (!res.ok) return failure(res);
		revalidateApp();
		return { success: true };
	} catch (error) {
		return { success: false, message: (error as Error).message };
	}
}
