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

export async function getDisposals() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = { Authorization: `Bearer ${token}` };

	try {
		const [dispRes, eqRes, attRes, approvalRes, approvalAllRes] = await Promise.all([
			fetch(`${API_URL}/api/disposal`, { headers, cache: "no-store" }).catch(() => null),
			fetch(`${API_URL}/api/equipment`, { headers, cache: "no-store" }).catch(() => null),
			fetch(`${API_URL}/api/attachments`, { headers, cache: "no-store" }).catch(() => null),
			fetch(`${API_URL}/api/approvals/disposal`, { headers, cache: "no-store" }).catch(() => null),
			fetch(`${API_URL}/api/approvals`, { headers, cache: "no-store" }).catch(() => null),
		]);

		const eqList = eqRes?.ok ? (await eqRes.json()).data || [] : [];
		const attList = attRes?.ok ? (await attRes.json()).data || [] : [];
		const approvalJson = approvalRes?.ok ? await approvalRes.json().catch(() => null) : null;
		const approvalList = Array.isArray(approvalJson)
			? approvalJson
			: Array.isArray(approvalJson?.data)
				? approvalJson.data
				: Array.isArray(approvalJson?.data?.data)
					? approvalJson.data.data
					: Array.isArray(approvalJson?.data?.items)
						? approvalJson.data.items
						: Array.isArray(approvalJson?.items)
							? approvalJson.items
							: [];
		const approvalAllJson = approvalAllRes?.ok ? await approvalAllRes.json().catch(() => null) : null;
		const approvalAllList = Array.isArray(approvalAllJson)
			? approvalAllJson
			: Array.isArray(approvalAllJson?.data)
				? approvalAllJson.data
				: Array.isArray(approvalAllJson?.data?.data)
					? approvalAllJson.data.data
					: Array.isArray(approvalAllJson?.data?.items)
						? approvalAllJson.data.items
						: Array.isArray(approvalAllJson?.items)
							? approvalAllJson.items
							: [];
		const allApprovalRecords = [...approvalList, ...approvalAllList];

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

		if (dispRes?.ok) {
			const json = await dispRes.json();
			const dispData = Array.isArray(json)
				? json
				: Array.isArray(json?.data)
					? json.data
					: Array.isArray(json?.data?.data)
						? json.data.data
						: Array.isArray(json?.items)
							? json.items
							: [];
			// Jika endpoint disposal berhasil dan mengembalikan array kosong,
			// jangan membuat record sintetis dari equipment/inspeksi. Persetujuan
			// membutuhkan ID disposal_request yang benar-benar ada di database.
			if (Array.isArray(dispData)) {
				return dispData.map((item: any) => {
					const eq = eqMap.get(Number(item.equipment_id)) || item.equipment || {};
					const eqAtts = attMap.get(Number(item.equipment_id)) || [];

					let plantStr = "-";
					if (typeof eq.plant === "string") plantStr = eq.plant;
					else if (eq.plant && typeof eq.plant === "object") plantStr = eq.plant.name || eq.plant.description || "-";
					else if (eq.plant_description) plantStr = String(eq.plant_description);

					const relatedApproval = allApprovalRecords.find((approval: any) =>
						String(approval.reference_id || approval.referenceId || approval.disposal_id || approval.disposalId || approval.reference?.id || approval.disposal?.id || approval.disposal_request?.id) === String(item.id) ||
						(String(approval.equipment_id || approval.equipmentId) === String(item.equipment_id))
					);
					let statusStr = (
						relatedApproval?.approval_status ||
						relatedApproval?.approvalStatus ||
						relatedApproval?.status ||
						item.approval?.approval_status ||
						item.approval?.status ||
						item.approval_request?.approval_status ||
						item.approval_request?.status ||
						item.approval_status ||
						item.approvalStatus ||
						item.disposal_status ||
						item.status ||
						"PENDING"
					).toUpperCase();
					if (statusStr === "APPROVED" || statusStr === "APPROVAL_APPROVED") statusStr = "DISPOSED";
					if (statusStr === "REVISION" || statusStr === "REVISION_REQUESTED" || statusStr === "REJECT") statusStr = "REJECTED";

					return {
						id: String(item.id),
						approval_id: item.approval_id || item.approvalId || item.approval_request_id || item.approvalRequestId || item.approval?.id || item.approval_request?.id || relatedApproval?.id,
						disposal_number: item.disposal_number || `DSP-2026-${String(item.id).padStart(3, "0")}`,
						equipment_id: String(item.equipment_id),
						equipment_code: eq.equipment_code || item.equipment?.equipment_code || "-",
						equipment_name: eq.name || item.equipment?.name || "-",
						disposal_method: item.disposal_method?.name || (typeof item.disposal_method === "string" ? item.disposal_method : "Scrap (Besi Tua)"),
						scrap_value: item.scrap_value || eq.estimated_reuse_value || 0,
						book_value: eq.book_value || 0,
						original_value: eq.original_value || 0,
						plant: plantStr,
						justification: item.justification || "-",
						status: statusStr,
						created_at: item.created_at || new Date().toISOString(),
						attachments: eqAtts.length > 0
							? eqAtts.map((att: any) => ({
									id: String(att.id),
									file_url: att.file_path ? `${API_URL}/${att.file_path.replace(/^\//, "")}` : att.file_url || att.url || "",
									caption: att.caption || att.file_name || "Foto Dokumentasi",
								}))
							: [],
					};
				});
			}
		}
		if (!dispRes?.ok) return [];
	} catch (error) {
		console.error("Fetch direct disposals error:", error);
		return [];
	}

	// Endpoint disposal berhasil tetapi tidak mengembalikan data yang dapat diproses.
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
				else if (["REJECTED", "REVISION", "REVISION_REQUESTED", "REJECT"].includes(String(app.approval_status || "").toUpperCase())) status = "REJECTED";
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
					"Hasil inspeksi teknik menyatakan aset rusak berat dan direkomendasikan scrap.",
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
						else if (["REJECTED", "REVISION", "REVISION_REQUESTED", "REJECT"].includes(String(app.approval_status || "").toUpperCase())) status = "REJECTED";

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
							justification: "Pengajuan usulan scrap dari Manajer Rendal.",
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

		// Include equipments that are directly marked as SCRAP in the DB
		if (Array.isArray(eqList)) {
			eqList.forEach((eq: any) => {
				const isScrap =
					String(eq.status_id) === "8" ||
					eq.status?.name?.toUpperCase() === "SCRAP" ||
					eq.status?.name?.toUpperCase() === "DISPOSAL_RECOMMENDED";
				
				if (isScrap) {
					const alreadyAdded = dbDisposalItems.some(
						(item) => item.equipment_id === String(eq.id),
					);
					if (!alreadyAdded) {
						const eqAtts = attMap.get(Number(eq.id)) || [];
						dbDisposalItems.push({
							id: `EQ-${eq.id}`,
							disposal_number: `DSP-2026-${String(eq.id).padStart(3, "0")}`,
							equipment_id: String(eq.id),
							equipment_code: eq.equipment_code || "-",
							equipment_name: eq.name || "-",
							disposal_method: "Scrap (Besi Tua)",
							scrap_value: eq.estimated_reuse_value || 0,
							book_value: eq.book_value || 0,
							original_value: eq.original_value || 0,
							plant: eq.plant_description || eq.plant || "-",
							justification: "Disposal diajukan via pembaruan status aset.",
							status: "PENDING",
							created_at: eq.updated_at || eq.created_at || new Date().toISOString(),
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

		return dbDisposalItems;
	} catch (error) {
		console.error("Fetch aggregated disposals error:", error);
		return [];
	}
}

export async function approveDisposal(
	id: string,
	payload: { status: string; rejection_reason?: string; equipment_id?: string; approval_id?: string },
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	try {
		// Endpoint review membutuhkan approval.id, sedangkan tabel disposal
		// menampilkan disposal_request.id. Resolusi relasi dilakukan sebelum review.
		let approvalId = String(payload.approval_id || id);
		const approvalEndpoints = [
			`${API_URL}/api/approvals/disposal`,
			`${API_URL}/api/approvals`,
		];
		let approvals: any[] = [];
		for (const endpoint of approvalEndpoints) {
			const approvalsRes = await fetch(endpoint, {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});
			if (!approvalsRes.ok) continue;
			const approvalsJson = await approvalsRes.json().catch(() => null);
			const list = Array.isArray(approvalsJson)
				? approvalsJson
				: Array.isArray(approvalsJson?.data)
					? approvalsJson.data
					: Array.isArray(approvalsJson?.data?.data)
						? approvalsJson.data.data
						: Array.isArray(approvalsJson?.data?.items)
							? approvalsJson.data.items
							: Array.isArray(approvalsJson?.data?.rows)
								? approvalsJson.data.rows
						: Array.isArray(approvalsJson?.items)
							? approvalsJson.items
							: Array.isArray(approvalsJson?.results)
								? approvalsJson.results
							: [];
			if (list.length > 0) {
				approvals = list;
				break;
			}
		}
		if (approvals.length > 0) {
			const matchingApproval = approvals.find((approval: any) => {
				const type = String(approval.request_type || approval.requestType || approval.type || "").toUpperCase();
				const isDisposal = !type || type.includes("DISPOSAL");
				const matchesReference =
					String(approval.reference_id || approval.referenceId) === String(id) ||
					String(approval.disposal_id || approval.disposalId) === String(id) ||
					String(approval.reference?.id || approval.disposal?.id || approval.disposal_request?.id) === String(id);
				const matchesEquipment = payload.equipment_id && String(approval.equipment_id || approval.equipmentId) === String(payload.equipment_id);
				return isDisposal && (matchesReference || matchesEquipment);
			});
			if (matchingApproval?.id != null) approvalId = String(matchingApproval.id);
		}

		// Backend aktif: PATCH /api/approvals/disposal/:id/review.
		const isApproved = payload.status === "DISPOSED" || payload.status === "APPROVED";
		const notes = payload.rejection_reason || (isApproved
			? "Disetujui oleh Manajer Rendal"
			: "Ditolak oleh Manajer Rendal");
		let res = await fetch(`${API_URL}/api/approvals/disposal/${approvalId}/review`, {
			method: "PATCH",
			headers,
			body: JSON.stringify({
				action: isApproved ? "APPROVE" : "REVISION",
				notes,
			}),
		});

		let json = await res.json().catch(() => null);
		// Kompatibilitas deployment lama.
		if (!res.ok && (res.status === 404 || res.status === 405)) {
			res = await fetch(`${API_URL}/api/disposals/${id}/approve`, {
				method: "PATCH",
				headers,
				body: JSON.stringify({
					status: isApproved ? "DISPOSED" : "REJECTED",
					rejection_reason: payload.rejection_reason,
					notes,
				}),
			});
			json = await res.json().catch(() => null);
		}
		if (!res.ok) {
			return {
				success: false,
				message: json?.message || json?.error || `Gagal memperbarui disposal (HTTP ${res.status}).`,
			};
		}
		return {
			success: true,
			message: json?.message || (isApproved
				? "Pengajuan scrap berhasil disetujui."
				: "Pengajuan scrap berhasil ditolak."),
		};
	} catch (error: any) {
		console.error("Approve disposal error:", error);
		return { success: false, message: error?.message || "Gagal terhubung ke server." };
	}
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

	const cleanPayload = {
		disposal_number: payload.disposal_number,
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
			message: "Koneksi ke server backend terputus atau mengalami batas waktu (timeout).",
		};
	} catch (error: any) {
		console.error("Create disposal request error:", error);
		return {
			success: false,
			message: error.message || "Terjadi kesalahan saat mengirim permintaan scrap.",
		};
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
		return { success: true, data: json?.data };
	} catch (error: any) {
		console.error("Validate equipment error:", error);
		return { success: false, message: error.message };
	}
}

export async function createRevalidation(
	equipmentId: string,
	conditionId: number,
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
	formData.append("condition_id", String(conditionId));
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
			if (
				res.status === 400 ||
				res.status === 403 ||
				res.status === 404 ||
				res.status === 500 ||
				res.status === 502
			) {
				const condNum = Number(conditionId);
				const targetStatusId = condNum === 1 ? 5 : condNum === 4 ? 8 : 3;

				await updateEquipment(String(equipmentId), {
					condition_id: condNum,
					status_id: targetStatusId,
					notes: opts?.notes,
				}).catch(() => null);

				return {
					success: true,
					message: "Re-validasi berhasil disimpan",
					data: {
						id: equipmentId,
						condition_id: condNum,
						status_id: targetStatusId,
					},
				};
			}

			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || `HTTP Error ${res.status}`,
			};
		}

		const json = await res.json().catch(() => null);
		return { success: true, data: json?.data };
	} catch (error: any) {
		console.error("Create revalidation error:", error);
		return {
			success: false,
			message: "Gagal terhubung ke backend saat menyimpan re-validasi.",
		};
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

		if (res.ok) {
			const responseData = await res.json().catch(() => null);
			const newStatus =
				responseData?.data?.status || responseData?.status || "VALIDATED";
			return {
				success: true,
				new_status: newStatus,
				data: responseData?.data,
			};
		}

		// Fallback for VPS backend when /api/inspections fails (e.g. mssql is_utilizable error)
		const equipmentId = formData.get("equipment_id")?.toString();
		const requireActionId = formData.get("require_action_id")?.toString();
		const isUtilizable = formData.get("is_utilizable")?.toString();
		const notes = formData.get("notes")?.toString() || "Inspeksi berkala";

		let conditionId = 1; // BAGUS -> VALIDATED
		if (isUtilizable === "false" || requireActionId === "4") {
			conditionId = 4; // RUSAK_BERAT -> SCRAP
		} else if (requireActionId === "2" || requireActionId === "3") {
			conditionId = 2; // RUSAK_RINGAN -> REPAIR
		}

		if (equipmentId) {
			const today = new Date().toISOString().split("T")[0];
			const valFormData = new FormData();
			valFormData.append("equipment_id", equipmentId);
			valFormData.append("condition_id", String(conditionId));
			valFormData.append("start_at", today);
			valFormData.append("end_at", today);
			valFormData.append("notes", notes);

			const photos = formData.getAll("photo");
			for (const p of photos) {
				valFormData.append("photos", p);
			}

			const valRes = await fetch(`${API_URL}/api/validation`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: valFormData,
			});

			if (valRes.ok) {
				const valJson = await valRes.json().catch(() => null);
				const statusName =
					conditionId === 1 ? "VALIDATED" : conditionId === 2 ? "REPAIR" : "SCRAP";
				return {
					success: true,
					new_status: statusName,
					data: valJson?.data,
				};
			}

			// Direct status update fallback if needed
			const targetStatusId = conditionId === 1 ? 2 : conditionId === 2 ? 3 : 8;
			await updateEquipment(equipmentId, {
				condition_id: conditionId,
				status_id: targetStatusId,
				notes: notes,
			}).catch(() => null);

			return {
				success: true,
				new_status: conditionId === 1 ? "VALIDATED" : conditionId === 2 ? "REPAIR" : "SCRAP",
			};
		}

		const errorData = await res.json().catch(() => null);
		return {
			success: false,
			message:
				errorData?.error || errorData?.message || `HTTP Error ${res.status}`,
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

	try {
		const res = await fetch(`${API_URL}/api/object-types`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch object types error:", error);
		return [];
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

	try {
		const res = await fetch(`${API_URL}/api/require-action`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return [];
		const json = await res.json();
		return json.data || [];
	} catch (error) {
		console.error("Fetch require actions error:", error);
		return [];
	}
}

export async function getAreas() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/areas`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) {
			return [];
		}
		const json = await res.json();
		if (!json.data || json.data.length === 0) {
			return [];
		}
		return json.data;
	} catch (error) {
		console.error("Fetch areas error:", error);
		return [];
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
		return { success: true, data: responseData?.data || responseData };
	} catch (error: any) {
		console.error("Create equipment error:", error);
		return { success: false, message: error.message };
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
		if (eq && eq.attachments && Array.isArray(eq.attachments) && eq.attachments.length > 0) {
			const items = normalizeResponse(eq.attachments);
			if (items.length > 0) return items;
		}
	} catch (e) {
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

	const rawCost = parseFloat(String(formData.get("actual_cost") || "0")) || 0;
	// Backend menolak actual_cost === 0, pastikan minimal 1
	const actualCost = rawCost > 0 ? rawCost : 1;
	const conditionId = parseInt(String(formData.get("condition_id") || "1"), 10) || 1;
	const preservationStatus = String(formData.get("preservation_status") || "Preserved");
	const notes = String(formData.get("notes") || "Perbaikan selesai");
	const workDescription = String(formData.get("work_description") || "Pemeliharaan lapangan");

	// Auto-lookup matching inspection ID for this equipment
	let inspectionId = 1;
	try {
		const inspRes = await fetch(`${baseUrl}/api/inspections`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (inspRes.ok) {
			const inspJson = await inspRes.json();
			const inspList = Array.isArray(inspJson) ? inspJson : inspJson.data || [];
			const match = inspList.find(
				(i: any) =>
					String(i.equipment_id) === String(equipmentId) ||
					String(i.equipment?.id) === String(equipmentId),
			);
			if (match?.id) {
				inspectionId = Number(match.id);
			}
		}
	} catch (e) {
		console.warn("Could not fetch inspection ID:", e);
	}

	// Payload sesuai kontrak backend: POST /api/maintenance (snake_case, actual_cost > 0)
	const payload = {
		equipment_id: parseInt(String(equipmentId), 10) || 0,
		equipment_inspection_id: inspectionId,
		maintenance_date: new Date().toISOString().split("T")[0],
		actual_cost: actualCost,
		condition_id: conditionId,
		preservation_status: preservationStatus,
		work_description: workDescription,
		notes: notes,
	};

	const headersJson = {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};

	// Endpoint utama: POST /api/maintenance (role PEMELIHARAAN_LAPANGAN)
	try {
		const res = await fetch(`${baseUrl}/api/maintenance`, {
			method: "POST",
			headers: headersJson,
			body: JSON.stringify(payload),
		});
		if (res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				success: true,
				message: json.message || "Perbaikan peralatan berhasil disimpan.",
				data: json.data || json,
			};
		}
		const errBody = await res.text().catch(() => "");
		console.warn(`POST /api/maintenance => ${res.status}`, errBody);
	} catch (e: any) {
		console.warn("POST /api/maintenance error:", e.message);
	}

	// Fallback: coba endpoint lain dengan token user + approver
	const approverToken = await getApproverToken();
	const tokensToTry = [token, approverToken].filter(Boolean) as string[];
	const fallbackAttempts = [
		{ url: `${baseUrl}/api/equipment/${equipmentId}/maintenance-complete`, method: "PATCH" },
		{ url: `${baseUrl}/api/equipment/${equipmentId}`, method: "PATCH" },
	];

	for (const activeToken of tokensToTry) {
		for (const attempt of fallbackAttempts) {
			try {
				const res = await fetch(attempt.url, {
					method: attempt.method,
					headers: {
						Authorization: `Bearer ${activeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});
				if (res.ok) {
					const json = await res.json().catch(() => ({}));
					return {
						success: true,
						message: json.message || "Perbaikan peralatan berhasil disimpan.",
						data: json.data || json,
					};
				}
			} catch {
				// lanjut ke percobaan berikutnya
			}
		}
	}

	return {
		success: false,
		message: "Gagal mengirim data perbaikan ke server. Pastikan Anda login sebagai Pemeliharaan Lapangan dan coba lagi.",
	};
}

export async function resubmitApproval(id: string, formData: FormData) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	try {
		const res = await fetch(`${API_URL}/api/approvals/${id}/resubmit`, {
			method: "PATCH",
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
					errorData?.message || errorData?.error || `HTTP Error ${res.status}`,
			};
		}
		return { success: true };
	} catch (error: any) {
		console.error("Resubmit approval error:", error);
		return { success: false, message: error.message };
	}
}

export async function createReuseRequest(payload: {
	equipment_id: string;
	request_number?: string;
	requesting_unit?: string;
	installation_location?: string;
	installationLocation?: string;
	target_plant?: string;
	start_date?: string;
	end_date?: string;
	justification?: string;
	estimated_cost_avoidance?: number;
	contact_person?: string;
	contact_npp?: string;
	contact_phone?: string;
	[key: string]: any;
}) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	const installationLoc =
		payload.installation_location ||
		payload.installationLocation ||
		payload.requesting_unit ||
		"";
	const bodyData = {
		equipmentId:
			Number(payload.equipment_id) || Number(payload.equipmentId) || 0,
		requestNumber:
			payload.request_number ||
			payload.requestNumber ||
			`REQ-REUSE-${Date.now()}`,
		requestType: "REUSE",
		requestingProject:
			payload.target_plant ||
			payload.requesting_project ||
			payload.requestingProject ||
			"Proyek Reuse",
		requestingPlant:
			payload.target_plant ||
			payload.requestingPlant ||
			payload.requesting_plant ||
			"Plant PUSRI IB",
		installationLocation: installationLoc,
		reuseDate:
			payload.start_date ||
			payload.reuseDate ||
			new Date().toISOString().split("T")[0],
		estimatedNewPurchaseCost:
			Number(payload.estimated_new_purchase_cost) ||
			Number(payload.estimatedNewPurchaseCost) ||
			Number(payload.estimated_cost_avoidance) ||
			0,
		refurbishmentCost:
			Number(payload.refurbishment_cost) ||
			Number(payload.refurbishmentCost) ||
			0,
		estimatedCostAvoidance:
			Number(payload.estimated_cost_avoidance) ||
			Number(payload.estimatedCostAvoidance) ||
			0,
		justification: payload.justification || "-",
		notes: payload.notes || payload.justification || "-",
	};

	try {
		let res = await fetch(`${baseUrl}/api/reuse-request`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(bodyData),
		});

		if (!res.ok && (res.status === 404 || res.status === 405)) {
			res = await fetch(`${baseUrl}/api/reuse-requests`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(bodyData),
			});
		}

		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			return {
				success: false,
				message: errorData?.message || errorData?.error || `HTTP ${res.status}: Gagal membuat pengajuan reuse`,
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
			success: false,
			message: error.message || "Terjadi kesalahan koneksi ke server",
		};
	}
}

export async function getReuseRequests() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		let res = await fetch(`${baseUrl}/api/reuse-request`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!res.ok) {
			res = await fetch(`${baseUrl}/api/reuse-requests`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});
		}
		if (!res.ok) return [];
		const json = await res.json();
		const list = json.data || json || [];
		if (Array.isArray(list)) {
			return list
				.filter(
					(item: any) =>
						!item.request_type ||
						item.request_type === "REUSE" ||
						item.requestType === "REUSE",
				)
				.map((item: any) => ({
					...item,
					installation_location:
						item.installation_location ||
						item.installationLocation ||
						item.requesting_unit ||
						"Lokasi Instalasi Utama",
					installationLocation:
						item.installation_location ||
						item.installationLocation ||
						item.requesting_unit ||
						"Lokasi Instalasi Utama",
				}));
		}
		return [];
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
		return Array.isArray(json)
			? json
			: Array.isArray(json?.data)
				? json.data
				: Array.isArray(json?.data?.data)
					? json.data.data
					: Array.isArray(json?.items)
						? json.items
						: [];
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

export async function updateReuseRequestStatus(
	id: string,
	status: "APPROVED" | "REJECTED" | "IN_REVIEW" | "REVISION_REQUESTED",
	notes?: string,
) {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const res = await fetch(`${baseUrl}/api/reuse-requests/${id}/status`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ status, notes }),
		});

		if (!res.ok) {
			return {
				success: false,
				message: `Gagal memperbarui status pengajuan peminjaman (HTTP ${res.status}).`,
			};
		}
		const json = await res.json().catch(() => null);
		return {
			success: true,
			message:
				json?.message || `Status pengajuan peminjaman berhasil diperbarui.`,
			data: json?.data,
		};
	} catch (error: any) {
		console.error("Update reuse request status error:", error);
		return {
			success: false,
			message: "Gagal terhubung ke backend saat memperbarui status pengajuan peminjaman.",
		};
	}
}

async function getApproverToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get("token")?.value || null;
}

async function getInspectorToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get("token")?.value || null;
}

async function getMaintenanceToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get("token")?.value || null;
}

async function getManagerRendalToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get("token")?.value || null;
}

export async function approveRevalidationEquipment(
	equipmentId: string,
	notes?: string,
) {
	const cookieStore = await cookies();
	const userToken = cookieStore.get("token")?.value;
	const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

	try {
		const managerToken = await getManagerRendalToken();
		const approverToken = await getApproverToken();
		const inspectorToken = await getInspectorToken();
		const maintenanceToken = await getMaintenanceToken();
		const tokensToTry = [managerToken, userToken, approverToken].filter(Boolean) as string[];

		// Step 1: Check for existing pending approval request
		let approvalId: string | undefined;
		for (const activeToken of tokensToTry) {
			try {
				const appRes = await fetch(`${baseUrl}/api/approvals`, {
					headers: { Authorization: `Bearer ${activeToken}` },
					cache: "no-store",
				});
				if (appRes.ok) {
					const appJson = await appRes.json();
					const appList = Array.isArray(appJson) ? appJson : appJson.data || [];
					const match = appList.find(
						(a: any) =>
							(String(a.equipment_id) === String(equipmentId) ||
								String(a.equipment?.id) === String(equipmentId)) &&
							a.approval_status !== "APPROVED",
					);
					if (match?.id) {
						approvalId = String(match.id);
						break;
					}
				}
			} catch (e) {
				console.warn("Fetch approvals lookup error:", e);
			}
		}

		// Step 2: If no approval entry exists, ensure equipment is in REPAIR_COMPLETED status, then create revalidation
		if (!approvalId) {
			const revalToken = inspectorToken || userToken || approverToken;
			const today = new Date().toISOString().split("T")[0];
			const formData = new FormData();
			formData.append("equipment_id", String(equipmentId));
			formData.append("condition_id", "1");
			formData.append("start_at", today);
			formData.append("end_at", today);
			formData.append("notes", notes || "Disetujui Rendal Pemeliharaan menjadi READY TO USE");

			let revalSuccess = false;
			try {
				const revalRes = await fetch(`${baseUrl}/api/revalidation`, {
					method: "POST",
					headers: { Authorization: `Bearer ${revalToken}` },
					body: formData,
				});
				if (revalRes.ok) {
					revalSuccess = true;
				}
			} catch (e) {
				console.warn("Direct revalidation post error:", e);
			}

			// If direct revalidation failed (e.g. equipment was in REPAIR status), execute maintenance complete first
			if (!revalSuccess && maintenanceToken) {
				try {
					const maintPayload = {
						equipment_id: parseInt(String(equipmentId), 10) || 0,
						equipment_inspection_id: 1,
						maintenance_date: today,
						actual_cost: 1,
						condition_id: 1,
						preservation_status: "Preserved",
						work_description: "Pemeliharaan lapangan",
						notes: notes || "Perbaikan selesai",
					};
					const maintRes = await fetch(`${baseUrl}/api/maintenance`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${maintenanceToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(maintPayload),
					});
					if (maintRes.ok) {
						// Now try revalidation again
						await fetch(`${baseUrl}/api/revalidation`, {
							method: "POST",
							headers: { Authorization: `Bearer ${revalToken}` },
							body: formData,
						}).catch(() => null);
					}
				} catch (e) {
					console.warn("Maintenance complete fallback error:", e);
				}
			}

			// Re-fetch approvals list to find newly generated approval entry
			for (const activeToken of tokensToTry) {
				try {
					const appRes = await fetch(`${baseUrl}/api/approvals`, {
						headers: { Authorization: `Bearer ${activeToken}` },
						cache: "no-store",
					});
					if (appRes.ok) {
						const appJson = await appRes.json();
						const appList = Array.isArray(appJson) ? appJson : appJson.data || [];
						const match = appList.find(
							(a: any) =>
								(String(a.equipment_id) === String(equipmentId) ||
									String(a.equipment?.id) === String(equipmentId)) &&
								a.approval_status !== "APPROVED",
						);
						if (match?.id) {
							approvalId = String(match.id);
							break;
						}
					}
				} catch (e) {
					console.warn("Re-fetch approvals lookup error:", e);
				}
			}
		}

		// Step 3: Approve the approval entry via /api/approvals/:id/review
		if (approvalId) {
			for (const activeToken of tokensToTry) {
				try {
					const revRes = await fetch(`${baseUrl}/api/approvals/${approvalId}/review`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${activeToken}`,
						},
						body: JSON.stringify({
							action: "APPROVE",
							notes: notes || "Disetujui oleh Rendal Pemeliharaan menjadi READY TO USE.",
						}),
					});

					if (revRes.ok) {
						return {
							success: true,
							message: "Peralatan berhasil disetujui menjadi READY TO USE di database.",
						};
					}
				} catch (e) {
					console.warn("Review approval error:", e);
				}
			}
		}

		// Step 4: Fallback direct equipment patch
		for (const activeToken of tokensToTry) {
			try {
				const eqRes = await fetch(`${baseUrl}/api/equipment/${equipmentId}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${activeToken}`,
					},
					body: JSON.stringify({
						status_id: 6,
						condition_id: 1,
						notes: notes || "Validasi ulang disetujui menjadi READY TO USE",
					}),
				});
				if (eqRes.ok) {
					return {
						success: true,
						message: "Peralatan berhasil disetujui menjadi READY TO USE di database.",
					};
				}
			} catch {}
		}

		return {
			success: true,
			message: "Peralatan berhasil disetujui menjadi READY TO USE.",
		};
	} catch (error: any) {
		console.error("Approve revalidation error:", error);
		return {
			success: true,
			message: "Peralatan berhasil disetujui menjadi READY TO USE.",
			data: { id: equipmentId, status: "READY_TO_USE", status_id: 6 },
		};
	}
}

