"use server";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from "next/headers";
import {
	type ApprovalKind,
	type DisposalDisplayStatus,
	disposalDisplayStatus,
} from "@/lib/approvals";
import { API_URL } from "@/config/api";
import { revalidateApp } from "@/lib/revalidate";

/**
 * Upload attachment ke POST /api/attachments/upload (multipart).
 * Menggantikan fetch manual dari client yang sebelumnya mem-parse cookie
 * dan menduplikasi base URL. Token dibaca dari cookie httpOnly di server.
 */
export async function uploadAttachment(
	equipmentId: string | number,
	file: File,
	category: string,
): Promise<{ success: boolean; message?: string }> {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const fd = new FormData();
		fd.append("equipment_id", String(equipmentId));
		fd.append("file", file);
		fd.append("category", category);

		const res = await fetch(`${API_URL}/api/attachments/upload`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: fd,
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			return {
				success: false,
				message: err?.message || `Gagal upload attachment (HTTP ${res.status})`,
			};
		}
		revalidateApp();
		return { success: true };
	} catch (error) {
		console.error("Upload attachment error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getEquipments() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/equipment`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		const data = json.data || [];
		if (Array.isArray(data)) {
			data.forEach((eq: any) => {
				if (eq.attachments && Array.isArray(eq.attachments)) {
					eq.attachments.forEach((att: any) => {
						let url = att.file_url || att.fileUrl || att.url || "";
						if (url) {
							url = url.replace(/\\/g, "/");
							if (!url.startsWith("http")) {
								if (!url.startsWith("/")) url = "/" + url;
								url = API_URL + url;
							}
							att.file_url = url;
							att.fileUrl = url;
							att.url = url;
						}
					});
				}
			});
		}
		return data;
	} catch (error) {
		console.error("Fetch equipment error:", error);
		return [];
	}
}

export type DisposalItemDTO = {
	id: string;
	approval_id: string | null;
	disposal_number: string;
	equipment_id: string;
	equipment_code: string;
	equipment_name: string;
	disposal_method: string;
	scrap_value: number;
	book_value: number;
	original_value: number;
	plant: string;
	justification: string;
	status: DisposalDisplayStatus;
	created_at: string;
	created_by_name?: string;
	notes?: string;
	attachments?: { id: string; file_url: string; caption?: string }[];
};

/** file_url dari backend bisa relatif ("uploads/..") atau pakai backslash Windows. */
function absoluteFileUrl(raw?: string | null): string {
	let url = String(raw || "").replace(/\\/g, "/");
	if (!url) return "";
	if (url.startsWith("http")) return url;
	if (!url.startsWith("/")) url = "/" + url;
	return API_URL + url;
}

/**
 * GET /api/disposal (role RENDAL_PEMELIHARAAN | MANAJER_RENDAL).
 * Backend sudah Preload Equipment, Equipment.Attachments, DisposalMethod, dan
 * CreatedByUser, jadi satu request cukup — tidak perlu agregasi di klien.
 *
 * approval_id diambil dari GET /api/approvals/disposal karena review dilakukan
 * lewat PATCH /api/approvals/disposal/:approvalId/review, bukan lewat id disposal.
 */
export async function getDisposals(): Promise<DisposalItemDTO[]> {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = { Authorization: `Bearer ${token}` };

	try {
		const [dispRes, appRes] = await Promise.all([
			fetch(`${API_URL}/api/disposal`, { headers, cache: "no-store" }),
			fetch(`${API_URL}/api/approvals/disposal`, {
				headers,
				cache: "no-store",
			}).catch(() => null),
		]);

		if (!dispRes.ok) {
			console.error("GET /api/disposal failed:", dispRes.status);
			return [];
		}

		const list = (await dispRes.json())?.data || [];
		if (!Array.isArray(list)) return [];

		// reference_id approval == id disposal request.
		const approvalByRef = new Map<number, any>();
		if (appRes?.ok) {
			const apps = (await appRes.json())?.data || [];
			if (Array.isArray(apps)) {
				apps.forEach((a: any) => approvalByRef.set(Number(a.reference_id), a));
			}
		}

		return list.map((item: any): DisposalItemDTO => {
			const eq = item.equipment || {};
			const approval = approvalByRef.get(Number(item.id));
			const atts = Array.isArray(eq.attachments) ? eq.attachments : [];

			return {
				id: String(item.id),
				approval_id: approval ? String(approval.id) : null,
				disposal_number: item.disposal_number || `DSP-${item.id}`,
				equipment_id: String(item.equipment_id ?? eq.id ?? ""),
				equipment_code: eq.equipment_code || "-",
				equipment_name: eq.name || "-",
				disposal_method: item.disposal_method?.name || "-",
				scrap_value: Number(item.scrap_value) || 0,
				book_value: Number(eq.book_value) || 0,
				original_value: Number(eq.original_value) || 0,
				plant: eq.plant?.name || eq.plant?.description || "-",
				justification: item.justification || "-",
				// Approval adalah sumber kebenaran status; disposal.approval_status
				// hanya ikut diperbarui pada REVISION/REJECTED.
				status: disposalDisplayStatus(
					approval?.approval_status || item.approval_status,
				),
				created_at: item.created_at || new Date().toISOString(),
				created_by_name: item.created_by_user?.name,
				notes: item.notes,
				attachments: atts.map((a: any) => ({
					id: String(a.id),
					file_url: absoluteFileUrl(a.file_url),
					caption: a.description || a.file_name || "Foto Dokumentasi",
				})),
			};
		});
	} catch (error) {
		console.error("Fetch disposals error:", error);
		return [];
	}
}

/**
 * Keputusan Manajer atas usulan disposal.
 * PATCH /api/approvals/disposal/:approvalId/review — action APPROVE | REJECTED |
 * REVISION (role MANAJER_RENDAL). approvalId berasal dari DisposalItemDTO.approval_id.
 */
export async function approveDisposal(
	approvalId: string | null,
	payload: {
		status: "DISPOSED" | "REJECTED" | "REVISION";
		rejection_reason?: string;
	},
) {
	if (!approvalId) {
		return {
			success: false,
			message:
				"Pengajuan ini belum memiliki approval request di backend, tidak dapat diproses.",
		};
	}

	const action =
		payload.status === "DISPOSED"
			? "APPROVE"
			: payload.status === "REJECTED"
				? "REJECTED"
				: "REVISION";

	const notes =
		payload.rejection_reason?.trim() ||
		(action === "APPROVE" ? "Disetujui oleh Manajer Rendal" : "");

	// Backend mewajibkan catatan untuk REVISION; REJECTED tanpa alasan juga tidak berguna.
	if (action !== "APPROVE" && !notes) {
		return { success: false, message: "Catatan/alasan wajib diisi." };
	}

	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(
			`${API_URL}/api/approvals/disposal/${approvalId}/review`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ action, notes }),
			},
		);

		const json = await res.json().catch(() => null);
		if (!res.ok) {
			return {
				success: false,
				message: json?.message || `Gagal memproses disposal (HTTP ${res.status})`,
			};
		}
		revalidateApp();
		return { success: true, message: json?.message, data: json?.data };
	} catch (error) {
		console.error("Approve disposal error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

// disposal_number TIDAK dikirim: backend yang generate (DISP-<tahun>-<seq 6 digit>).
export async function createDisposalRequest(payload: {
	equipment_id: number;
	disposal_method_id: number;
	scrap_value: number;
	disposal_date: string;
	justification: string;
}) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	const cleanPayload = {
		equipment_id: Number(payload.equipment_id),
		disposal_method_id: Number(payload.disposal_method_id),
		scrap_value: Number(payload.scrap_value) || 0,
		disposal_date: payload.disposal_date
			? payload.disposal_date.split("T")[0]
			: new Date().toISOString().split("T")[0],
		justification:
			payload.justification || "Permintaan scrap dari Rendal Pemeliharaan.",
	};

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(`${API_URL}/api/disposal`, {
			method: "POST",
			headers,
			body: JSON.stringify(cleanPayload),
			signal: controller.signal,
		}).catch((err) => {
			console.error("POST /api/disposal fetch error:", err);
			return null;
		});

		clearTimeout(timeoutId);

		if (res && res.ok) {
			const json = await res.json().catch(() => null);
			return {
				success: true,
				message:
					json?.message ||
					"Permintaan scrap berhasil disimpan dan dikirim ke Manajer.",
				data: json?.data,
			};
		}

		if (res) {
			const json = await res.json().catch(() => null);
			const serverError =
				json?.message ||
				json?.error ||
				`Gagal menyimpan permintaan scrap (HTTP ${res.status}).`;
			return {
				success: false,
				message: serverError,
			};
		}

		return {
			success: false,
			message:
				"Koneksi ke server backend terputus atau mengalami batas waktu (timeout).",
		};
	} catch (error) {
		console.error("Create disposal request error:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Terjadi kesalahan saat mengirim permintaan scrap.",
		};
	}
}

/**
 * Backend memecah approval per jenis request:
 *   /api/approvals/{validation|disposal|reuse|revalidation}
 * Endpoint datar /api/approvals sudah tidak ada lagi.
 */
export async function getApprovals(kind: ApprovalKind = "validation") {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${kind}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error(`Fetch approvals (${kind}) error:`, error);
		return [];
	}
}

export async function getApprovalById(
	id: string,
	kind: ApprovalKind = "validation",
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${kind}/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return null;
		const json = await res.json();
		return json.data || null;
	} catch (error) {
		console.error(`Fetch approval ${id} error:`, error);
		return null;
	}
}

// getValidations mengambil daftar validasi (GET /api/validation), opsional per equipment.
// Dipakai untuk menampilkan Nomor Pemeriksaan yang digenerate backend.
export async function getValidations(equipmentId?: string | number) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const url = equipmentId
		? `${API_URL}/api/validation?equipment_id=${equipmentId}`
		: `${API_URL}/api/validation`;

	try {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch validations error:", error);
		return [];
	}
}

export async function validateEquipment(
	id: string,
	_isUtilizable: boolean,
	conditionId: number,
	notes: string,
	opts?: {
		startAt?: string;
		endAt?: string;
		followupRecommendation?: string;
		photos?: File[];
	},
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	// Backend POST /api/validation menerima multipart (request.ValidationRequest),
	// termasuk photos yang disimpan sebagai attachment reference_type "validations".
	// Status lanjutan (VALIDATED / REPAIR / SCRAP) ditentukan backend dari condition_id.
	const today = new Date().toISOString().split("T")[0];
	const formData = new FormData();
	formData.append("equipment_id", String(id));
	formData.append("condition_id", String(conditionId));
	formData.append("start_at", opts?.startAt || today);
	formData.append("end_at", opts?.endAt || opts?.startAt || today);
	formData.append("notes", notes);
	if (opts?.followupRecommendation) {
		formData.append("followup_recommendation", opts.followupRecommendation);
	}
	for (const photo of opts?.photos ?? []) {
		formData.append("photos", photo);
	}

	try {
		const res = await fetch(`${API_URL}/api/validation`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		const json = await res.json().catch(() => null);
		revalidateApp();
		return { success: true, data: json?.data };
	} catch (error) {
		console.error("Validate equipment error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function createRevalidation(
	equipmentId: string,
	// Status tujuan hasil validasi ulang: REVALIDATION | REPAIR | DISPOSAL_RECOMMENDED.
	targetStatus: string,
	opts: {
		startAt?: string;
		endAt?: string;
		notes?: string;
		followupRecommendation?: string;
		photos?: File[];
	},
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const today = new Date().toISOString().split("T")[0];
	const formData = new FormData();
	formData.append("equipment_id", String(equipmentId));
	formData.append("target_status", targetStatus);
	formData.append("start_at", opts?.startAt || today);
	formData.append("end_at", opts?.endAt || opts?.startAt || today);
	if (opts?.notes) formData.append("notes", opts.notes);
	if (opts?.followupRecommendation) {
		formData.append("followup_recommendation", opts.followupRecommendation);
	}
	for (const photo of opts?.photos ?? []) {
		formData.append("photos", photo);
	}

	try {
		const res = await fetch(`${API_URL}/api/revalidation`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		const json = await res.json().catch(() => null);
		revalidateApp();
		return { success: true, data: json?.data };
	} catch (error) {
		console.error("Create revalidation error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * action yang diterima backend per jenis approval:
 *   validation   : IN_REVIEW | APPROVE | REVISION
 *   revalidation : IN_REVIEW | APPROVE | REVISION | REJECT
 *   disposal     : IN_REVIEW | APPROVE | REVISION | REJECTED
 *   reuse        : IN_REVIEW | APPROVE | REVISION   (tidak ada penolakan)
 */
export async function reviewApproval(
	id: string,
	action: string,
	notes: string,
	kind: ApprovalKind = "validation",
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${kind}/${id}/review`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, notes }),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		revalidateApp();
		return { success: true };
	} catch (error) {
		console.error("Review approval error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function startReviewApproval(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(
			`${API_URL}/api/approvals/validation/${id}/start-review`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({}),
			},
		);

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		revalidateApp();
		return { success: true };
	} catch (error) {
		console.error("Start review approval error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getInspections() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/inspections`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch inspections error:", error);
		return [];
	}
}

export async function submitInspectionData(formData: FormData) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const userStr = cookieStore.get("user")?.value;

	if (userStr && !formData.has("inspector")) {
		try {
			const user = JSON.parse(userStr);
			if (user.id) {
				formData.append("inspector", String(user.id));
			}
		} catch (e) {
			console.error("Failed to parse user cookie", e);
		}
	}

	try {
		const res = await fetch(`${API_URL}/api/inspections`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (res.ok) {
			const responseData = await res.json().catch(() => null);
			const newStatus =
				responseData?.data?.status || responseData?.status || "VALIDATED";
			revalidateApp();
			return {
				success: true,
				new_status: newStatus,
				data: responseData?.data,
			};
		}

		const errorData = await res.json().catch(() => null);
		return {
			success: false,
			message:
				errorData?.error || errorData?.message || `HTTP Error ${res.status}`,
		};
	} catch (error) {
		console.error("Create inspection error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getConditions() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/condition`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch conditions error:", error);
		return [];
	}
}

export async function getObjectTypes() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	// ponytail: fallback dipertahankan supaya form tetap terbuka saat backend down.
	// Hapus begitu /api/object-types dijamin punya seed data.
	const fallback = [
		{ id: 1, name: "Rotary Equipment" },
		{ id: 2, name: "Static Equipment" },
		{ id: 3, name: "Electrical" },
		{ id: 4, name: "Instrument" },
		{ id: 5, name: "Peralatan Umum" },
		{ id: 6, name: "Valve" },
	];

	try {
		const res = await fetch(`${API_URL}/api/object-types`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return fallback;
		const json = await res.json();
		return json.data?.length ? json.data : fallback;
	} catch (error) {
		console.error("Fetch object types error:", error);
		return fallback;
	}
}

/** Master alasan idle. Backend: GET /api/idle-reason -> { data: [{ id, reason_name, description }] } */
export async function getPlants() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/plants`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch plants error:", error);
		return [];
	}
}

export async function getStorageLocations(plantId?: number | string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const query = plantId ? `?plant_id=${encodeURIComponent(plantId)}` : "";
	try {
		const res = await fetch(`${API_URL}/api/storage-locations${query}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data && json.data.length > 0 ? json.data : [];
	} catch (error) {
		console.error("Fetch storage locations error:", error);
		return [];
	}
}

export async function getRequireActions() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const fallbackActions = [
		{
			id: 1,
			name: "Re-use Langsung",
			description: "Dapat langsung dipasang tanpa perbaikan",
		},
		{
			id: 2,
			name: "Perlu Perbaikan / Refurbish",
			description: "Membutuhkan pemeliharaan sebelum dikirim",
		},
		{
			id: 3,
			name: "Rekomendasi Scrap",
			description: "Kerusakan berat tidak layak dipelihara",
		},
	];

	try {
		const res = await fetch(`${API_URL}/api/require-action`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return fallbackActions;
		const json = await res.json();
		return json.data && json.data.length > 0 ? json.data : fallbackActions;
	} catch (error) {
		console.error("Fetch require actions error:", error);
		return fallbackActions;
	}
}

/**
 * Backend pakai tag `form:` + c.ShouldBind, jadi endpoint ini WAJIB multipart/form-data.
 * Foto ikut di request yang sama (field `photo`, repeatable) — backend simpan equipment,
 * idle declaration, dan attachment dalam satu transaksi.
 */
export async function createEquipment(formData: FormData) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	// Ensure storage_location_id is a valid integer > 0 (default to 1 if missing/invalid)
	const rawLocId = formData.get("storage_location_id")?.toString();
	const locNum = parseInt(rawLocId || "0", 10);
	if (!rawLocId || isNaN(locNum) || locNum <= 0) {
		formData.set("storage_location_id", "1");
	}

	try {
		const res = await fetch(`${API_URL}/api/equipment`, {
			method: "POST",
			// Jangan set Content-Type manual: boundary multipart harus dibuat oleh fetch.
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			throw new Error(
				errorData?.error ||
					errorData?.message ||
					`Gagal mendaftarkan equipment (HTTP ${res.status})`,
			);
		}
		const responseData = await res.json().catch(() => null);
		revalidateApp();
		return { success: true, data: responseData?.data || responseData };
	} catch (error) {
		console.error("Create equipment error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getEquipmentById(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/equipment/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return null;
		const json = await res.json();
		const item = json.data || json;
		if (item && item.attachments && Array.isArray(item.attachments)) {
			item.attachments.forEach((att: any) => {
				let url = att.file_url || att.fileUrl || att.url || "";
				if (url) {
					url = url.replace(/\\/g, "/");
					if (!url.startsWith("http")) {
						if (!url.startsWith("/")) url = "/" + url;
						url = API_URL + url;
					}
					att.file_url = url;
					att.fileUrl = url;
					att.url = url;
				}
			});
		}
		return item;
	} catch (error) {
		console.error("Fetch equipment by id error:", error);
		return null;
	}
}

export async function updateEquipment(id: string, payload: any) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/equipment/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			throw new Error(
				errorData?.error || errorData?.message || "Failed to update equipment",
			);
		}
		const responseData = await res.json().catch(() => null);

		revalidateApp();
		return { success: true, data: responseData?.data };
	} catch (error) {
		console.error("Update equipment error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function getAttachmentsByEquipmentId(equipmentId: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const normalizeResponse = (json: any): any[] => {
		const raw = json.data || json;
		let items: any[] = [];
		if (Array.isArray(raw)) items = raw;
		else if (raw && typeof raw === "object" && raw.id) items = [raw];

		return items.map((item: any) => {
			if (item && typeof item === "object") {
				let url = item.file_url || item.fileUrl || item.url || "";
				if (url) {
					url = url.replace(/\\/g, "/");
					// Path relatif dari backend: "uploads/..." atau "/uploads/..."
					// Harus diprefix dengan API_URL agar browser bisa akses static file
					if (!url.startsWith("http")) {
						if (!url.startsWith("/")) url = "/" + url;
						url = API_URL + url;
					}
					item.file_url = url;
					item.fileUrl = url;
					item.url = url;
				}
			}
			return item;
		});
	};

	const filterByEquipment = (items: any[]) => {
		return items.filter((a: any) => {
			const idMatch =
				String(a.equipment_id) === String(equipmentId) ||
				String(a.reference_id) === String(equipmentId);
			const refTable = (a.reference_table || "").toLowerCase();
			const isEquipmentRef =
				!refTable ||
				refTable.includes("equipment") ||
				refTable.includes("photo") ||
				(refTable !== "equipment_inspections" && refTable !== "inspections");
			return idMatch && isEquipmentRef;
		});
	};

	try {
		// 1) Utamakan fetch detail equipment via /api/equipment/{id} karena backend sudah mempreload attachments di sana
		const eq = await getEquipmentById(equipmentId);
		if (
			eq &&
			eq.attachments &&
			Array.isArray(eq.attachments) &&
			eq.attachments.length > 0
		) {
			const items = normalizeResponse(eq.attachments);
			if (items.length > 0) return items;
		}
	} catch {
		// Lanjut ke fallback jika gagal
	}

	try {
		// 2) Coba endpoint /api/attachments?equipment_id={id}
		const res2 = await fetch(
			`${API_URL}/api/attachments?equipment_id=${equipmentId}`,
			{
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			},
		);
		if (res2.ok) {
			const json2 = await res2.json();
			console.log(
				`Attachments for eq ${equipmentId} (endpoint 2):`,
				JSON.stringify(json2).substring(0, 300),
			);
			const items = normalizeResponse(json2);
			// Validasi: pastikan attachment memang milik equipment ini
			const filtered = filterByEquipment(items);
			if (filtered.length > 0) return filtered;
		}
	} catch {
		// Lanjut ke fallback
	}

	try {
		// 3) Fallback: fetch semua attachments, filter manual
		const res3 = await fetch(`${API_URL}/api/attachments`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (res3.ok) {
			const json3 = await res3.json();
			const items = normalizeResponse(json3);
			const filtered = filterByEquipment(items);
			console.log(
				`[DEBUG] /api/attachments returned ${items.length} items. Filtered for eq ${equipmentId} -> ${filtered.length} items.`,
			);
			if (filtered.length > 0) {
				console.log(`[DEBUG] First filtered item:`, JSON.stringify(filtered[0]));
			}
			return filtered;
		}
	} catch (e) {
		console.error("Fetch attachments fallback error:", e);
	}

	return [];
}

export async function deleteEquipment(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	// Host di-pin ke env var; path dibangun via new URL() agar tidak bisa
	// dinavigasi ke origin/path lain.
	const targetUrl = new URL(
		`/api/equipment/${encodeURIComponent(String(id))}`,
		process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "",
	);
	console.log("Attempting to delete equipment:", targetUrl.toString());

	try {
		const res = await fetch(targetUrl, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status} at ${targetUrl}`,
			};
		}
		revalidateApp();
		return { success: true };
	} catch (error) {
		console.error("Delete equipment error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
export async function getEquipmentRepairs() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/repair`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return Array.isArray(json) ? json : json.data || [];
	} catch (error) {
		console.error("Fetch equipment repairs error:", error);
		return [];
	}
}

export async function completeEquipmentRepair(
	equipmentId: string,
	payload: {
		start_at: string;
		end_at: string;
		actual_cost: number;
		preservation_status: string;
		work_description?: string;
		notes?: string;
	},
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.replace(/\/$/, "");

	// equipment_inspection_id opsional di backend: aset yang masuk REPAIR lewat validasi
	// awal tidak punya inspeksi berkala, jadi field-nya dikirim hanya kalau ada.
	const inspectionId = await findLatestInspectionId(baseUrl, token, equipmentId);

	try {
		const res = await fetch(`${baseUrl}/api/repair`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				equipment_id: Number(equipmentId) || 0,
				...(inspectionId ? { equipment_inspection_id: inspectionId } : {}),
				start_at: payload.start_at,
				end_at: payload.end_at,
				actual_cost: payload.actual_cost,
				preservation_status: payload.preservation_status,
				work_description: payload.work_description || "",
				notes: payload.notes || "",
			}),
		});
		const json = await res.json().catch(() => null);
		if (!res.ok) {
			return {
				success: false,
				message: json?.message || json?.error || `HTTP Error ${res.status}`,
			};
		}
		revalidateApp();
		return {
			success: true,
			message: json?.message || "Perbaikan peralatan berhasil disimpan.",
			data: json?.data,
		};
	} catch (error) {
		console.error("Create equipment repair error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

/* ponytail: /api/inspections tidak punya filter equipment_id, jadi ambil semua lalu
   pilih inspeksi terbaru di sisi klien. Ganti ke query param begitu backend punya. */
async function findLatestInspectionId(
	baseUrl: string,
	token: string | undefined,
	equipmentId: string,
): Promise<number | null> {
	try {
		const res = await fetch(`${baseUrl}/api/inspections`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return null;
		const json = await res.json();
		const list: any[] = Array.isArray(json) ? json : json.data || [];
		const ids = list
			.filter(
				(i) =>
					String(i.equipment_id ?? i.equipment?.id ?? "") === String(equipmentId),
			)
			.map((i) => Number(i.id))
			.filter((id) => id > 0);
		return ids.length ? Math.max(...ids) : null;
	} catch (e) {
		console.warn("Could not fetch inspection ID:", e);
		return null;
	}
}

export async function resubmitApproval(id: string, formData: FormData) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(
			`${API_URL}/api/approvals/validation/${id}/resubmit`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			},
		);

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message:
					errorData?.message || errorData?.error || `HTTP Error ${res.status}`,
			};
		}
		revalidateApp();
		return { success: true };
	} catch (error) {
		console.error("Resubmit approval error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function createReuseRequest(payload: {
	equipment_id: string | number;
	requestingProject?: string;
	requestingPlant?: string;
	installationLocation?: string;
	reuseDate?: string;
	estimatedNewPurchaseCost?: number;
	justification?: string;
	notes?: string;
	[key: string]: any;
}) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	const eqId = Number(payload.equipment_id) || Number(payload.equipmentId) || 0;
	const requestingProject =
		payload.requestingProject ||
		payload.requesting_project ||
		payload.target_plant ||
		payload.targetPlant ||
		"";
	const requestingPlant =
		payload.requestingPlant ||
		payload.requesting_plant ||
		payload.target_plant ||
		payload.targetPlant ||
		"";
	const installLoc =
		payload.installationLocation ||
		payload.installation_location ||
		payload.requesting_unit ||
		"";
	const reuseDate =
		payload.reuse_date ||
		payload.reuseDate ||
		payload.start_date ||
		payload.startDate ||
		"";
	const estimatedNewPurchaseCost =
		Number(payload.estimatedNewPurchaseCost) ||
		Number(payload.estimated_new_purchase_cost) ||
		Number(payload.estimated_cost_avoidance) ||
		Number(payload.estimatedCostAvoidance) ||
		0;
	const justification = payload.justification || "";
	const bodyData = {
		equipmentId: eqId,
		requestingProject,
		requestingPlant,
		installationLocation: installLoc,
		reuseDate,
		estimatedNewPurchaseCost,
		justification,
		notes: payload.notes || "",
	};

	try {
		let res = await fetch(`${baseUrl}/api/reuse-request`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify(bodyData),
		});

		if (!res.ok && (res.status === 404 || res.status === 405)) {
			res = await fetch(`${baseUrl}/api/reuse-requests`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify(bodyData),
			});
		}

		if (!res.ok && (res.status === 404 || res.status === 405)) {
			res = await fetch(`${baseUrl}/api/reuse`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify(bodyData),
			});
		}

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			const errMsg =
				errorData?.message ||
				errorData?.error ||
				(typeof errorData === "string" ? errorData : null) ||
				`HTTP ${res.status}: Gagal membuat pengajuan reuse`;
			console.error("Create reuse request failed:", res.status, errMsg, errorData);
			return {
				success: false,
				message: errMsg,
			};
		}
		const responseData = await res.json().catch(() => null);
		revalidateApp();
		return {
			success: true,
			message:
				responseData?.message ||
				"Permintaan penggunaan kembali (reuse) berhasil diajukan.",
			data: responseData?.data || responseData,
		};
	} catch (error) {
		console.error("Create reuse request error:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: String(error) || "Terjadi kesalahan koneksi ke server",
		};
	}
}

/**
 * Daftar pengajuan reuse.
 * Manajer/Admin memakai GET /api/reuse-request/all (role MANAJER_RENDAL, ADMIN);
 * role lain memakai GET /api/reuse-request yang hanya berisi pengajuan sendiri.
 *
 * approval_id disisipkan dari GET /api/approvals/reuse (reference_id == id reuse
 * request) karena keputusan dilakukan via /api/approvals/reuse/:approvalId/review.
 */
export async function getReuseRequests(scope: "mine" | "all" = "mine") {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const headers = { Authorization: `Bearer ${token}` };

	try {
		const [res, appRes] = await Promise.all([
			fetch(`${baseUrl}/api/reuse-request${scope === "all" ? "/all" : ""}`, {
				headers,
				cache: "no-store",
			}),
			scope === "all"
				? fetch(`${baseUrl}/api/approvals/reuse`, {
						headers,
						cache: "no-store",
					}).catch(() => null)
				: null,
		]);

		let list: any[] = [];
		if (res.ok) {
			const json = await res.json().catch(() => null);
			list = Array.isArray(json) ? json : json?.data || [];
		} else if (res.status === 404 || res.status === 405) {
			const resFallback = await fetch(
				`${baseUrl}/api/reuse-requests${scope === "all" ? "/all" : ""}`,
				{ headers, cache: "no-store" },
			).catch(() => null);
			if (resFallback?.ok) {
				const json = await resFallback.json().catch(() => null);
				list = Array.isArray(json) ? json : json?.data || [];
			}
		}

		if (!Array.isArray(list)) return [];

		const approvalByRef = new Map<string, any>();
		if (appRes?.ok) {
			const appJson = await appRes.json().catch(() => null);
			const apps = Array.isArray(appJson)
				? appJson
				: appJson?.data?.items || appJson?.data?.data || appJson?.data || [];
			if (Array.isArray(apps)) {
				apps.forEach((a: any) => {
					if (a.reference_id != null) approvalByRef.set(String(a.reference_id), a);
					if (a.referenceId != null) approvalByRef.set(String(a.referenceId), a);
					if (a.referenceID != null) approvalByRef.set(String(a.referenceID), a);
					if (a.ReferenceID != null) approvalByRef.set(String(a.ReferenceID), a);
				});
			}
		}

		return list.map((item: any) => {
			const approval = approvalByRef.get(String(item.id));
			const requestNumber = String(
				item.request_number ?? item.requestNumber ?? "",
			).replace(/^-+(?=REU-)/i, "");

			const foundApprovalId =
				approval?.id ??
				approval?.ID ??
				item.approval_id ??
				item.approvalId ??
				item.approval?.id ??
				null;

			return {
				...item,
				// Backend dapat menghasilkan nomor dengan dash awal ("-REU-").
				// Hilangkan hanya untuk tampilan tanpa mengubah data backend.
				...(requestNumber ? { request_number: requestNumber } : {}),
				// Jangan gunakan ID reuse sebagai fallback: endpoint review membutuhkan
				// ID ApprovalRequest, bukan ID ReuseRequest.
				approval_id: foundApprovalId ? String(foundApprovalId) : null,
				approval_status:
					// ReuseRequest diperbarui dalam transaksi yang sama saat approval
					// diputuskan. Prioritaskan nilainya agar tabel tidak tertahan pada
					// daftar approval yang belum tersinkron.
					item.approval_status ||
					item.approvalStatus ||
					item.ApprovalStatus ||
					item.status ||
					approval?.approval_status ||
					approval?.approvalStatus ||
					approval?.ApprovalStatus ||
					approval?.status ||
					approval?.Status ||
					"PENDING",
			};
		});
	} catch (error) {
		console.error("Fetch reuse requests error:", error);
		return [];
	}
}

export async function getFunctionalLocations() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const res = await fetch(`${baseUrl}/api/functional-locations`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		// Backend GetAllFuncLoc mengembalikan array mentah, bukan { data: [...] }.
		return Array.isArray(json) ? json : json.data || [];
	} catch (error) {
		console.error("Fetch functional locations error:", error);
		return [];
	}
}

export async function getDisposalMethods() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const res = await fetch(`${baseUrl}/api/disposal-method`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch disposal methods error:", error);
		return [];
	}
}

/**
 * Keputusan Manajer atas pengajuan reuse.
 * PATCH /api/approvals/reuse/:approvalId/review — action IN_REVIEW | APPROVE |
 * REVISION (role MANAJER_RENDAL). Backend reuse TIDAK punya aksi penolakan;
 * penolakan dinyatakan sebagai REVISION beserta catatan.
 *
 * approvalId berasal dari field approval_id hasil getReuseRequests("all").
 */
export async function updateReuseRequestStatus(
	approvalId: string | null,
	status: "APPROVED" | "REJECTED" | "IN_REVIEW" | "REVISION_REQUESTED",
	notes?: string,
	reuseRequestId?: string | number,
) {
	const action =
		status === "APPROVED"
			? "APPROVE"
			: status === "IN_REVIEW"
				? "IN_REVIEW"
				: "REVISION";
	const trimmedNotes = (notes || "").trim();

	if (action === "REVISION" && !trimmedNotes) {
		return { success: false, message: "Catatan/alasan wajib diisi." };
	}
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const headers = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	const approvalBody = JSON.stringify({
		action,
		notes: trimmedNotes || "Disetujui oleh Manajer Rendal",
	});

	try {
		// Selalu cari ulang ApprovalRequest berdasarkan ReferenceID (ID reuse),
		// karena endpoint review tidak menerima ID ReuseRequest.
		let resolvedApprovalId = approvalId;
		if (reuseRequestId != null) {
			const approvalListRes = await fetch(`${baseUrl}/api/approvals/reuse`, {
				headers,
				cache: "no-store",
			});
			const approvalListJson = await approvalListRes.json().catch(() => null);
			if (!approvalListRes.ok) {
				return {
					success: false,
					message:
						approvalListJson?.message ||
						approvalListJson?.error ||
						`Gagal mengambil data approval reuse (HTTP ${approvalListRes.status}).`,
				};
			}
			const approvals = Array.isArray(approvalListJson)
				? approvalListJson
				: approvalListJson?.data?.items ||
					approvalListJson?.data?.data ||
					approvalListJson?.data ||
					[];
			const matchedApproval = Array.isArray(approvals)
				? approvals.find(
						(approval: any) =>
							String(
								approval.reference_id ??
									approval.referenceId ??
									approval.referenceID ??
									approval.ReferenceID ??
									"",
							) === String(reuseRequestId),
					)
				: null;

			if (matchedApproval) {
				resolvedApprovalId = String(matchedApproval.id ?? matchedApproval.ID ?? "");
			} else if (!resolvedApprovalId) {
				return {
					success: false,
					message:
						"Approval request untuk pengajuan reuse ini tidak ditemukan di backend.",
				};
			}
		}

		if (!resolvedApprovalId) {
			return {
				success: false,
				message: "ID approval untuk pengajuan ini tidak ditemukan.",
			};
		}

		const reviewIds = [resolvedApprovalId];
		// Beberapa versi handler VPS mencari ApprovalRequest berdasarkan
		// ReferenceID. Coba ID reuse hanya jika primary key approval memberi 404.
		if (reuseRequestId != null && String(reuseRequestId) !== resolvedApprovalId) {
			reviewIds.push(String(reuseRequestId));
		}

		let lastError: { message?: string; error?: string } | null = null;
		let lastStatus = 0;
		for (const reviewId of reviewIds) {
			const res = await fetch(
				`${baseUrl}/api/approvals/reuse/${reviewId}/review`,
				{ method: "PATCH", headers, body: approvalBody },
			);
			const json = await res.json().catch(() => null);
			if (res.ok) {
				revalidateApp();
				return {
					success: true,
					message:
						json?.message || "Status pengajuan peminjaman berhasil diperbarui.",
					data: json?.data,
				};
			}

			lastError = json;
			lastStatus = res.status;
			const message = String(json?.message || json?.error || "").toLowerCase();
			if (res.status !== 404 && !message.includes("not found")) break;
		}

		return {
			success: false,
			message:
				lastError?.message ||
				lastError?.error ||
				`Gagal memproses approval reuse (HTTP ${lastStatus}).`,
		};
	} catch (error) {
		console.error("Review reuse request error:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Gagal terhubung ke server.",
		};
	}
}

/**
 * Keputusan Manajer atas approval REVALIDATION.
 * PATCH /api/approvals/revalidation/:approvalId/review — action IN_REVIEW |
 * APPROVE | REVISION | REJECT (role MANAJER_RENDAL). Saat APPROVE, backend
 * sendiri yang mengubah equipment menjadi READY_TO_USE.
 *
 * approvalId berasal dari GET /api/approvals/revalidation (field approvalId di
 * halaman validasi ulang).
 */
export async function approveRevalidationEquipment(
	approvalId: string | undefined,
	notes?: string,
) {
	if (!approvalId) {
		return {
			success: false,
			message:
				"Aset ini belum punya pengajuan validasi ulang di backend, jadi belum bisa disetujui.",
		};
	}

	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const res = await fetch(
			`${baseUrl}/api/approvals/revalidation/${approvalId}/review`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					action: "APPROVE",
					notes: notes || "Disetujui menjadi READY TO USE.",
				}),
			},
		);

		const json = await res.json().catch(() => null);
		if (!res.ok) {
			return {
				success: false,
				message:
					json?.message || `Gagal menyetujui validasi ulang (HTTP ${res.status})`,
			};
		}
		revalidateApp();
		return { success: true, message: json?.message, data: json?.data };
	} catch (error) {
		console.error("Approve revalidation error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
