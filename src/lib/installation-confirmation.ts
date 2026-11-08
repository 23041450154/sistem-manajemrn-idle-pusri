/**
 * US-10-FE: Modul Konfirmasi Pemasangan Alat & Transisi Status REUSED.
 * Memfasilitasi konfirmasi fisik alat telah diterima dan dioperasikan di plant oleh Unit Kerja Operasi,
 * pencatatan tanggal operasi, kondisi fisik, foto terpasang, serta persistensi audit trail.
 */

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */

export interface InstallationConfirmation {
	requestId: string;
	equipmentId: string;
	requestNumber?: string;
	equipmentCode?: string;
	equipmentName?: string;
	installationLocation?: string;
	targetPlant?: string;
	installedAt: string; // Tanggal Mulai Dioperasikan / Terpasang (YYYY-MM-DD)
	physicalNotes?: string; // Catatan Kondisi Fisik Saat Diterima (Opsional)
	photoUrl?: string; // Unggah Foto Alat Terpasang (Opsional - data URL or CDN)
	photoName?: string;
	confirmedAt: string; // Timestamp ISO konfirmasi
	confirmedBy?: string; // User Name / NPP
	status: "INSTALLED";
}

export interface ConfirmInstallationPayload {
	requestId: string | number;
	equipmentId: string | number;
	requestNumber?: string;
	equipmentCode?: string;
	equipmentName?: string;
	installationLocation?: string;
	targetPlant?: string;
	installedAt: string;
	physicalNotes?: string;
	photoFile?: File | null;
	photoUrl?: string;
	confirmedBy?: string;
}

const STORAGE_KEY = "idle_installation_confirmations";

/**
 * Mengambil seluruh data konfirmasi pemasangan yang tersimpan di browser persistent storage.
 */
export function getSavedInstallations(): Record<string, InstallationConfirmation> {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch (e) {
		console.warn("Gagal membaca idle_installation_confirmations dari storage:", e);
		return {};
	}
}

/**
 * Mengambil data konfirmasi pemasangan berdasarkan ID permohonan atau ID equipment.
 */
export function getSavedInstallation(
	requestIdOrEquipmentId: string | number,
): InstallationConfirmation | null {
	const all = getSavedInstallations();
	const key = String(requestIdOrEquipmentId);
	if (all[key]) return all[key];

	// Cari jika key yang dikirim adalah equipmentId atau requestId sebaliknya
	for (const item of Object.values(all)) {
		if (String(item.requestId) === key || String(item.equipmentId) === key) {
			return item;
		}
	}
	return null;
}

/**
 * Menyimpan data konfirmasi pemasangan ke browser persistent storage.
 * Tersimpan dengan key requestId dan equipmentId agar lookup dari kedua arah instan.
 */
export function saveInstallationConfirmation(
	confirmation: InstallationConfirmation,
): void {
	if (typeof window === "undefined") return;
	try {
		const existing = getSavedInstallations();
		const reqKey = String(confirmation.requestId);
		const eqKey = String(confirmation.equipmentId);

		existing[reqKey] = confirmation;
		if (eqKey && eqKey !== reqKey) {
			existing[eqKey] = confirmation;
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
	} catch (e) {
		console.warn("Gagal menyimpan konfirmasi pemasangan ke localStorage:", e);
	}
}

/**
 * Memeriksa apakah permohonan atau alat tertentu sudah dikonfirmasi terpasang.
 */
export function isEquipmentInstalled(
	requestIdOrEquipmentId: string | number,
): boolean {
	return Boolean(getSavedInstallation(requestIdOrEquipmentId));
}
