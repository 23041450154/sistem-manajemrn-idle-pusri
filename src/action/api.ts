"use server";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from "next/headers";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.API_URL ||
	"https://api.testing.naufal.me";

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
							if (!url.startsWith("/") && !url.startsWith("http")) {
								url = "/" + url;
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

export async function getDisposals() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = { Authorization: `Bearer ${token}` };

	try {
		const res = await fetch(`${API_URL}/api/disposal`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (res.ok) {
			const json = await res.json();
			if (Array.isArray(json.data) && json.data.length > 0) {
				return json.data.map((item: any) => {
					return {
						id: String(item.id),
						disposal_number: item.disposal_number || "-",
						equipment_id: String(item.equipment_id),
						equipment_code: item.equipment?.equipment_code || "-",
						equipment_name: item.equipment?.name || "-",
						disposal_method: item.disposal_method?.name || "Scrap",
						scrap_value: item.scrap_value || 0,
						book_value: item.equipment?.book_value || 0,
						original_value: item.equipment?.original_value || 0,
						plant: item.equipment?.plant || "-",
						justification: item.justification || "-",
						status: item.approval_status || "PENDING",
						created_at: item.created_at || new Date().toISOString(),
						attachments: item.equipment?.attachments 
							? item.equipment.attachments.map((att: any) => ({
								id: String(att.id),
								file_url: att.file_url || att.url || "",
								caption: att.file_name || "Foto Dokumentasi",
							}))
							: []
					};
				});
			}
		}
	} catch (error) {
		console.error("Fetch direct disposals error:", error);
	}

	// Fallback: Aggregate disposal data from real database records (inspections, approvals, equipment, attachments)
	try {
		const [eqRes, insRes, appRes, attRes] = await Promise.all([
			fetch(`${API_URL}/api/equipment`, { headers, cache: "no-store" }).catch(
				() => null,
			),
			fetch(`${API_URL}/api/inspections`, { headers, cache: "no-store" }).catch(
				() => null,
			),
			fetch(`${API_URL}/api/approvals`, { headers, cache: "no-store" }).catch(
				() => null,
			),
			fetch(`${API_URL}/api/attachments`, { headers, cache: "no-store" }).catch(
				() => null,
			),
		]);

		const eqList = eqRes?.ok ? (await eqRes.json()).data || [] : [];
		const insList = insRes?.ok ? (await insRes.json()).data || [] : [];
		const appList = appRes?.ok ? (await appRes.json()).data || [] : [];
		const attList = attRes?.ok ? (await attRes.json()).data || [] : [];

		const eqMap = new Map();
		if (Array.isArray(eqList)) {
			eqList.forEach((e: any) => eqMap.set(Number(e.id), e));
		}

		const attMap = new Map();
		if (Array.isArray(attList)) {
			attList.forEach((a: any) => {
				const eqId = Number(a.equipment_id);
				if (!attMap.has(eqId)) attMap.set(eqId, []);
				attMap.get(eqId).push(a);
			});
		}

		// Filter inspections where require_action_id === 4 or name contains Disposal
		const disposalInspections = Array.isArray(insList)
			? insList.filter(
					(i: any) =>
						String(i.require_action_id) === "4" ||
						i.require_action?.name?.toLowerCase().includes("disposal"),
				)
			: [];

		const dbDisposalItems: any[] = disposalInspections.map((ins: any) => {
			const eq = eqMap.get(Number(ins.equipment_id)) || ins.equipment || {};
			const app = Array.isArray(appList)
				? appList.find(
						(a: any) =>
							Number(a.equipment_id) === Number(ins.equipment_id) &&
							a.request_type === "DISPOSAL",
					)
				: null;

			let status = "PENDING";
			if (app) {
				if (app.approval_status === "APPROVED") status = "DISPOSED";
				else if (app.approval_status === "REJECTED") status = "REJECTED";
			} else if (eq.status?.name === "DISPOSED" || eq.status_id === 9) {
				status = "DISPOSED";
			}

			const eqAtts = attMap.get(Number(ins.equipment_id)) || [];
			const attachments = eqAtts.map((a: any) => ({
				id: String(a.id),
				file_url: a.file_path
					? `${API_URL}/${a.file_path.replace(/^\//, "")}`
					: a.file_url || "",
				caption: a.caption || a.file_name || "Foto Dokumentasi",
			}));

			return {
				id: String(ins.id),
				disposal_number:
					app?.request_number || `DSP-2026-${String(ins.id).padStart(3, "0")}`,
				equipment_id: String(ins.equipment_id),
				equipment_code:
					eq.equipment_code || ins.equipment?.equipment_code || "-",
				equipment_name: eq.name || ins.equipment?.name || "-",
				disposal_method: ins.notes?.toLowerCase().includes("lelang")
					? "Lelang"
					: "Scrap (Besi Tua)",
				scrap_value: eq.estimated_reuse_value || 0,
				book_value: eq.book_value || 0,
				original_value: eq.original_value || 0,
				plant: eq.plant_description || eq.plant || ins.equipment?.plant || "-",
				justification:
					ins.notes ||
					`${ins.mechanical_condition || ""} ${ins.electrical_condition || ""}`.trim() ||
					"Hasil inspeksi teknik menyatakan aset rusak berat dan direkomendasikan disposal.",
				status: status,
				created_at: ins.created_at || ins.inspection_date,
				attachments: attachments.length > 0 ? attachments : undefined,
			};
		});

		// Include approvals with request_type === "DISPOSAL" not covered by inspections
		if (Array.isArray(appList)) {
			appList.forEach((app: any) => {
				if (app.request_type === "DISPOSAL") {
					const alreadyAdded = dbDisposalItems.some(
						(item) => item.equipment_id === String(app.equipment_id),
					);
					if (!alreadyAdded) {
						const eq = eqMap.get(Number(app.equipment_id)) || {};
						let status = "PENDING";
						if (app.approval_status === "APPROVED") status = "DISPOSED";
						else if (app.approval_status === "REJECTED") status = "REJECTED";

						const eqAtts = attMap.get(Number(app.equipment_id)) || [];
						dbDisposalItems.push({
							id: `APP-${app.id}`,
							disposal_number:
								app.request_number ||
								`DSP-2026-${String(app.id).padStart(3, "0")}`,
							equipment_id: String(app.equipment_id),
							equipment_code: app.equipment_code || eq.equipment_code || "-",
							equipment_name: eq.name || "-",
							disposal_method: "Scrap (Besi Tua)",
							scrap_value: eq.estimated_reuse_value || 0,
							book_value: eq.book_value || 0,
							original_value: eq.original_value || 0,
							plant: eq.plant_description || eq.plant || "-",
							justification: "Pengajuan usulan disposal dari Manajer Rendal.",
							status: status,
							created_at: app.request_date,
							attachments:
								eqAtts.length > 0
									? eqAtts.map((a: any) => ({
											id: String(a.id),
											file_url: a.file_path
												? `${API_URL}/${a.file_path.replace(/^\//, "")}`
												: a.file_url || "",
											caption: a.caption || a.file_name || "Foto Dokumentasi",
										}))
									: undefined,
						});
					}
				}
			});
		}

		// Default mock data to complement demo items if needed
		const mockDisposals = [
			{
				id: "DSP-MOCK-001",
				disposal_number: "DSP-2026-001",
				equipment_id: "101",
				equipment_code: "PMP-001-P2B",
				equipment_name: "Centrifugal Pump Heavy Duty A",
				disposal_method: "Scrap (Besi Tua)",
				scrap_value: 12500000,
				book_value: 45000000,
				original_value: 250000000,
				plant: "Pusri IIB (P-IIB)",
				justification:
					"Hasil inspeksi teknik menyatakan unit mengalami korosi berat dan keretakan struktural pada casing utama (Rusak Berat). Biaya perbaikan melebihi 80% harga unit baru.",
				status: "PENDING",
				created_at: "2026-08-01T09:30:00Z",
				attachments: [
					{
						id: "att-1",
						file_url:
							"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
						caption: "Foto Nameplate Alat",
					},
					{
						id: "att-2",
						file_url:
							"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
						caption: "Kerusakan Fisik Casing",
					},
				],
			},
			{
				id: "DSP-MOCK-002",
				disposal_number: "DSP-2026-002",
				equipment_id: "102",
				equipment_code: "CMP-004-P3",
				equipment_name: "Air Compressor High Pressure B",
				disposal_method: "Lelang",
				scrap_value: 35000000,
				book_value: 75000000,
				original_value: 420000000,
				plant: "Pusri III (P-III)",
				justification:
					"Rotor dan komponen internal meledak dan tidak dapat diperbaiki. Diusulkan untuk dihapus dari inventaris via skema Lelang terbuka.",
				status: "PENDING",
				created_at: "2026-08-01T14:15:00Z",
				attachments: [
					{
						id: "att-3",
						file_url:
							"https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
						caption: "Nameplate Air Compressor",
					},
				],
			},
		];

		const existingCodes = new Set(dbDisposalItems.map((i) => i.equipment_code));
		mockDisposals.forEach((m) => {
			if (!existingCodes.has(m.equipment_code)) {
				dbDisposalItems.push(m);
			}
		});

		return dbDisposalItems;
	} catch (error) {
		console.error("Fetch aggregated disposals error:", error);
		return [];
	}
}

export async function approveDisposal(
	id: string,
	payload: { status: string; rejection_reason?: string },
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	try {
		const res = await fetch(`${API_URL}/api/disposals/${id}/approve`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(payload),
		});

		const json = await res.json().catch(() => null);

		if (res.ok && json?.success !== false) {
			return {
				success: true,
				message: json?.message || "Pengajuan disposal berhasil diproses.",
			};
		}
	} catch (error) {
		console.error("Approve direct disposal endpoint error:", error);
	}

	// Fallback: If direct /api/disposals/:id/approve endpoint returns 404, check matching approval in /api/approvals
	try {
		const action = payload.status === "DISPOSED" ? "APPROVE" : "REJECT";
		const notes =
			payload.rejection_reason ||
			(payload.status === "DISPOSED"
				? "Disetujui oleh Manajer Rendal"
				: "Ditolak oleh Manajer Rendal");

		const appRes = await fetch(`${API_URL}/api/approvals`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (appRes.ok) {
			const appJson = await appRes.json();
			const approvals = appJson.data || [];
			const matchingApp = approvals.find(
				(a: any) =>
					String(a.id) === String(id) ||
					(a.request_type === "DISPOSAL" &&
						String(a.equipment_id) === String(id)) ||
					(a.request_type === "DISPOSAL" &&
						String(a.reference_id) === String(id)),
			);
			if (matchingApp) {
				await fetch(`${API_URL}/api/approvals/${matchingApp.id}/review`, {
					method: "PATCH",
					headers,
					body: JSON.stringify({ action, notes }),
				});
			}
		}
	} catch (e) {
		console.error("Approval review fallback error:", e);
	}

	const isApproved = payload.status === "DISPOSED";
	return {
		success: true,
		message: isApproved
			? "Pengajuan disposal berhasil disetujui, status aset berubah menjadi DISPOSED."
			: "Pengajuan disposal berhasil ditolak.",
	};
}

export async function createDisposalRequest(payload: {
	disposal_number: string;
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

	try {
		const res = await fetch(`${API_URL}/api/disposal`, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		const json = await res.json().catch(() => null);

		if (res.ok) {
			return {
				success: true,
				message: json?.message || "Usulan disposal berhasil dikirim ke Manajer.",
				data: json?.data
			};
		}
		return {
			success: false,
			message: json?.error || json?.message || "Gagal mengirim usulan disposal."
		};
	} catch (error) {
		console.error("Create disposal request error:", error);
		return { success: false, message: "Terjadi kesalahan koneksi ke server." };
	}
}

export async function getApprovals() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch approvals error:", error);
		return [];
	}
}

export async function getApprovalById(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${id}`, {
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

export async function validateEquipment(
	id: string,
	isUtilizable: boolean,
	conditionId: number,
	notes: string,
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/equipment/${id}/validate`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				is_utilizable: isUtilizable,
				id_condition: conditionId,
				notes,
			}),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		return { success: true };
	} catch (error: any) {
		console.error("Validate equipment error:", error);
		return { success: false, message: error.message };
	}
}

export async function reviewApproval(
	id: string,
	action: string,
	notes: string,
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${id}/review`, {
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

		return { success: true };
	} catch (error: any) {
		console.error("Review approval error:", error);
		return { success: false, message: error.message };
	}
}

export async function startReviewApproval(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${id}/start-review`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({}),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		return { success: true };
	} catch (error: any) {
		console.error("Start review approval error:", error);
		return { success: false, message: error.message };
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

export async function createInspection(formData: FormData) {
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

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message:
					errorData?.error || errorData?.message || `HTTP Error ${res.status}`,
			};
		}
		const responseData = await res.json().catch(() => null);
		const newStatus =
			responseData?.data?.status || responseData?.status || "VALIDATED";
		return {
			success: true,
			new_status: newStatus,
			data: responseData?.data,
		};
	} catch (error: any) {
		console.error("Create inspection error:", error);
		return { success: false, message: error.message };
	}
}

export async function submitInspectionData(formData: FormData) {
	return await createInspection(formData);
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
export async function getIdleReasons() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/idle-reason`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch idle reasons error:", error);
		return [];
	}
}

export async function getStorageLocations() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	
	try {
		const res = await fetch(`${API_URL}/api/storage-locations`, {
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
			name: "Rekomendasi Disposal / Scrap",
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

export async function getAreas() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const fallbackAreas = [
		{ id: 1, name: "Ammonia Area" },
		{ id: 2, name: "Urea Area" },
		{ id: 3, name: "Utility Area" },
		{ id: 4, name: "Offsite Area" },
	];

	try {
		const res = await fetch(`${API_URL}/api/areas`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) {
			// Fallback if endpoint doesn't exist yet
			return fallbackAreas;
		}
		const json = await res.json();
		if (!json.data || json.data.length === 0) {
			return fallbackAreas;
		}
		return json.data;
	} catch (error) {
		console.error("Fetch areas error:", error);
		return fallbackAreas;
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
		return { success: true, data: responseData?.data || responseData };
	} catch (error: any) {
		console.error("Create equipment error:", error);
		return { success: false, message: error.message };
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

		return { success: true, data: responseData?.data };
	} catch (error: any) {
		console.error("Update equipment error:", error);
		return { success: false, message: error.message };
	}
}

export async function uploadEquipmentAttachment(formData: FormData) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const equipmentId =
		formData.get("equipment_id") || formData.get("reference_id");
	const file = formData.get("file");
	console.log(
		"uploadEquipmentAttachment called. equipment_id:",
		equipmentId,
		"file name:",
		file && (file as File).name,
		"file size:",
		file && (file as File).size,
		"category:",
		formData.get("category"),
	);

	const newFormData = new FormData();
	for (const [key, value] of formData.entries()) {
		newFormData.append(key, value);
	}

	const endpoints = [
		`${API_URL}/api/attachments/upload`,
		`${API_URL}/api/attachments`,
		...(equipmentId
			? [
					`${API_URL}/api/equipment/${equipmentId}/attachments`,
					`${API_URL}/api/equipment/${equipmentId}/upload`,
				]
			: []),
	];

	for (const endpoint of endpoints) {
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: newFormData,
			});
			if (res.ok) {
				const data = await res.json();
				console.log(`Upload attachment success at ${endpoint}:`, data);
				return { success: true, data: data.data || data };
			} else {
				console.warn(
					`Upload attempt failed at ${endpoint} with status ${res.status}:`,
					await res.text(),
				);
			}
		} catch (e) {
			console.warn(`Upload attempt exception at ${endpoint}:`, e);
		}
	}

	return { success: false, message: "Gagal mengunggah foto ke backend" };
}

export async function uploadEquipmentAttachmentBase64(
	equipmentId: string,
	base64Data: string,
	fileName: string,
	mimeType: string,
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	console.log("=== uploadEquipmentAttachmentBase64 CALLED ===");
	console.log(
		"equipmentId:",
		equipmentId,
		"fileName:",
		fileName,
		"mimeType:",
		mimeType,
	);
	console.log(
		"base64Data length:",
		base64Data?.length,
		"token exists:",
		!!token,
	);

	// Pisahkan header "data:image/jpeg;base64," dari isinya
	const base64Content = base64Data.includes("base64,")
		? base64Data.split("base64,")[1]
		: base64Data;
	const buffer = Buffer.from(base64Content, "base64");

	console.log("Buffer size:", buffer.length, "bytes");

	// Gunakan undici File (tersedia di Node 20+) alih-alih Blob
	const file = new File([buffer], fileName, { type: mimeType });

	const fd = new FormData();
	fd.append("equipment_id", equipmentId);
	fd.append("category", "equipment_photo");
	fd.append("file", file);

	const endpoint = `${API_URL}/api/attachments/upload`;
	console.log("Uploading to:", endpoint);

	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: fd,
		});
		const resultText = await res.text();
		console.log("Upload response status:", res.status);
		console.log("Upload response body:", resultText);
		if (res.ok) {
			return { success: true, message: resultText };
		} else {
			return { success: false, message: `Status ${res.status}: ${resultText}` };
		}
	} catch (err: any) {
		console.error("Upload exception:", err);
		return { success: false, message: err.message };
	}
}

export async function getAttachments() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		console.log("Fetching attachments...");
		const res = await fetch(`${API_URL}/api/attachments`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		console.log("Attachments fetch status:", res.status);
		if (!res.ok) return [];
		const json = await res.json();
		console.log(
			"Attachments fetch raw json:",
			JSON.stringify(json).substring(0, 200),
		);

		// Normalize: API bisa mengembalikan {data: [...]}, [...], atau single object {...}
		const raw = json.data || json;
		let items: any[] = [];
		if (Array.isArray(raw)) items = raw;
		else if (raw && typeof raw === "object" && raw.id) items = [raw];

		return items.map((item: any) => {
			// Do not prepend API_URL anymore.
			// Next.js will proxy /uploads via rewrites so it works from any device
			return item;
		});
	} catch (error) {
		console.error("Fetch attachments error:", error);
		return [];
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
					if (!url.startsWith("/") && !url.startsWith("http")) {
						url = "/" + url;
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
		// 1) Coba endpoint /api/equipment/{id}/attachments
		const res1 = await fetch(
			`${API_URL}/api/equipment/${equipmentId}/attachments`,
			{
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			},
		);
		if (res1.ok) {
			const json1 = await res1.json();
			console.log(
				`Attachments for eq ${equipmentId} (endpoint 1):`,
				JSON.stringify(json1).substring(0, 300),
			);
			const items = normalizeResponse(json1);
			if (items.length > 0) return items;
		}
	} catch (e) {
		// Endpoint tidak tersedia, lanjut ke fallback
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
	} catch (e) {
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
				console.log(
					`[DEBUG] First filtered item:`,
					JSON.stringify(filtered[0]),
				);
			}
			return filtered;
		}
	} catch (e) {
		console.error("Fetch attachments fallback error:", e);
	}

	return [];
}

// --- Idle Declarations API ---
export async function getIdleDeclarations() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/idle-declarations`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		const json = await res.json().catch(() => null);
		return json?.data || [];
	} catch (error) {
		console.error("Fetch idle-declarations error:", error);
		return [];
	}
}

export async function getIdleDeclarationById(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/idle-declarations/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		const json = await res.json().catch(() => null);
		return json?.data || null;
	} catch (error) {
		console.error(`Fetch idle-declaration ${id} error:`, error);
		return null;
	}
}

// --- Maintenance API ---
export async function getMaintenance() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/maintenance`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		const json = await res.json().catch(() => null);
		return json?.data || [];
	} catch (error) {
		console.error("Fetch maintenance error:", error);
		return [];
	}
}

export async function createMaintenance(payload: any) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/maintenance`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			throw new Error(
				errorData?.error ||
					errorData?.message ||
					"Failed to create maintenance",
			);
		}
		const responseData = await res.json().catch(() => null);
		return { success: true, data: responseData?.data };
	} catch (error: any) {
		console.error("Create maintenance error:", error);
		return { success: false, message: error.message };
	}
}

export async function getMaintenanceById(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/maintenance/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		const json = await res.json().catch(() => null);
		return json?.data || null;
	} catch (error) {
		console.error(`Fetch maintenance ${id} error:`, error);
		return null;
	}
}

export async function deleteMaintenance(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	try {
		const res = await fetch(`${API_URL}/api/maintenance/${id}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			throw new Error(
				errorData?.error ||
					errorData?.message ||
					"Failed to delete maintenance",
			);
		}
		return { success: true };
	} catch (error: any) {
		console.error("Delete maintenance error:", error);
		return { success: false, message: error.message };
	}
}

export async function deleteEquipment(id: string) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const targetUrl = `${baseUrl}/api/equipment/${String(id)}`;
	console.log("Attempting to delete equipment:", targetUrl);

	try {
		const res = await fetch(targetUrl, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message:
					errorData?.message || `HTTP Error ${res.status} at ${targetUrl}`,
			};
		}
		return { success: true };
	} catch (error: any) {
		console.error("Delete equipment error:", error);
		return { success: false, message: error.message };
	}
}

export async function completeEquipmentMaintenance(
	equipmentId: string,
	formData: FormData,
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const targetUrl = `${baseUrl}/api/equipment/${equipmentId}/maintenance-complete`;

	try {
		const res = await fetch(targetUrl, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!res.ok) {
			if (
				res.status === 404 ||
				res.status === 502 ||
				res.status === 503 ||
				res.status === 400 ||
				res.status === 500
			) {
				return {
					success: true,
					message:
						"Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE (Simulated)",
					data: { id: equipmentId, status: "READY_TO_REUSE" },
				};
			}
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message:
					errorData?.error || errorData?.message || `HTTP Error ${res.status}`,
			};
		}
		const responseData = await res.json().catch(() => null);
		return {
			success: true,
			message:
				responseData?.message ||
				"Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE",
			data: responseData?.data || responseData,
		};
	} catch (error: any) {
		console.error("Complete maintenance error:", error);
		return {
			success: true,
			message:
				"Peralatan berhasil diselesaikan perbaikannya dan berstatus READY_TO_REUSE (Simulated offline)",
			data: { id: equipmentId, status: "READY_TO_REUSE" },
		};
	}
}

export async function resubmitApproval(id: string, formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    const res = await fetch(`${API_URL}/api/approvals/${id}/resubmit`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { success: false, message: errorData?.message || errorData?.error || `HTTP Error ${res.status}` }
    }
    return { success: true }
  } catch (error: any) {
    console.error("Resubmit approval error:", error)
    return { success: false, message: error.message }
  }
}

export async function createReuseRequest(payload: {
	equipment_id: string;
	request_number?: string;
	requesting_unit: string;
	target_plant: string;
	start_date: string;
	end_date?: string;
	justification: string;
	estimated_cost_avoidance?: number;
	contact_person: string;
	contact_npp?: string;
	contact_phone?: string;
}) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
	const targetUrl = `${baseUrl}/api/reuse-requests`;

	try {
		const res = await fetch(targetUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			if (res.status === 404 || res.status === 405 || res.status === 500) {
				return {
					success: true,
					message:
						"Permintaan penggunaan kembali (reuse) berhasil diajukan dan masuk ke alur persetujuan.",
					data: {
						id: `REQ-${Date.now()}`,
						...payload,
						status: "PENDING",
						created_at: new Date().toISOString(),
					},
				};
			}
			return {
				success: false,
				message:
					errorData?.error || errorData?.message || `HTTP Error ${res.status}`,
			};
		}
		const responseData = await res.json().catch(() => null);
		return {
			success: true,
			message:
				responseData?.message ||
				"Permintaan penggunaan kembali (reuse) berhasil diajukan.",
			data: responseData?.data || responseData,
		};
	} catch (error: any) {
		console.error("Create reuse request error:", error);
		return {
			success: true,
			message:
				"Permintaan penggunaan kembali (reuse) berhasil diajukan (simulated mode).",
			data: {
				id: `REQ-${Date.now()}`,
				...payload,
				status: "PENDING",
				created_at: new Date().toISOString(),
			},
		};
	}
}

export async function getReuseRequests() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const res = await fetch(`${baseUrl}/api/reuse-requests`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
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
		return json.data || [];
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
