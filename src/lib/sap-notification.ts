/**
 * Utility helper untuk mengelola Nomor Notifikasi SAP (SAP Maintenance Notification Number)
 * sesuai User Story US-17-FE.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Ekstrak Nomor Notifikasi SAP dari objek inspeksi, validasi, atau scrap item.
 * Mencari pada field spesifik (sap_notification_number, sap_notification_num, notification_number)
 * maupun teks catatan / justifikasi yang memuat tag `[No. Notifikasi SAP: ...]`.
 */
export function extractSapNotification(item?: any): string {
	if (!item || typeof item !== "object") return "";

	// 1. Cek properti langsung bila backend sudah mendukung kolom dedicated
	const directField =
		item.sap_notification_number ||
		item.sap_notification_num ||
		item.notification_number ||
		item.sap_notification;
	if (directField && String(directField).trim() !== "") {
		return String(directField).trim();
	}

	// 2. Cek relasi inspection/validation yang tersarang
	if (item.inspection) {
		const nested = extractSapNotification(item.inspection);
		if (nested) return nested;
	}
	if (item.equipment_inspection) {
		const nested = extractSapNotification(item.equipment_inspection);
		if (nested) return nested;
	}
	if (item.validation) {
		const nested = extractSapNotification(item.validation);
		if (nested) return nested;
	}

	// 3. Cek di dalam notes / catatan / justifikasi / ringkasan
	const text = [
		item.notes,
		item.catatan,
		item.summary,
		item.justification,
		item.followup_recommendation,
		item.alasan,
	]
		.filter((t) => typeof t === "string" && t.trim() !== "")
		.join("\n");

	if (!text) return "";

	const match = text.match(
		/(?:No\.?\s*Notifikasi\s*SAP|SAP-NOTIF|Notifikasi\s*SAP|SAP\s*Notification\s*No\.?)[:\s]+([A-Za-z0-9\-_/]+)/i,
	);
	if (match && match[1]) {
		return match[1].trim();
	}

	return "";
}

/**
 * Menggabungkan catatan inspeksi dengan Nomor Notifikasi SAP
 * dalam format standar `[No. Notifikasi SAP: XXXXXXXX]`.
 */
export function formatNotesWithSapNotification(
	notes: string,
	sapNotificationNumber?: string,
): string {
	const trimmedNotes = (notes || "").trim();
	const trimmedSap = (sapNotificationNumber || "").trim();

	// Bersihkan tag notifikasi lama jika sudah ada
	const cleanedNotes = cleanNotesWithoutSapNotification(trimmedNotes);

	if (!trimmedSap) {
		return cleanedNotes;
	}

	if (!cleanedNotes) {
		return `[No. Notifikasi SAP: ${trimmedSap}]`;
	}

	return `${cleanedNotes}\n[No. Notifikasi SAP: ${trimmedSap}]`;
}

/**
 * Membersihkan tag `[No. Notifikasi SAP: ...]` dari teks catatan agar tampilan catatan rapi.
 */
export function cleanNotesWithoutSapNotification(notes: string): string {
	if (!notes) return "";
	return notes
		.replace(
			/\s*\[?(?:No\.?\s*Notifikasi\s*SAP|SAP-NOTIF|Notifikasi\s*SAP)[:\s]+[A-Za-z0-9\-_/]+\]?\s*/gi,
			"",
		)
		.trim();
}
