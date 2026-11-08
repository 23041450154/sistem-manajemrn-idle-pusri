/**
 * US-13-FE: Modul Pengunggahan & Manajemen Berkas Dokumen Pendukung Justifikasi Kebutuhan.
 * Memfasilitasi upload berkas (Nota Dinas, TOR, Kajian Teknis), validasi format & ukuran (maks. 25 MB),
 * dan penampilan dokumen di riwayat permintaan serta modal persetujuan Manajer Rendal.
 */

/* ponytail: standard web APIs (FileReader, localStorage, native File/Blob) without external dependencies */

export interface SupportingDocumentMeta {
	requestId?: string;
	requestNumber?: string;
	equipmentId?: string;
	fileName: string;
	fileSize: number; // in bytes
	fileType?: string;
	fileUrl: string; // Base64 data URL, blob URL, or CDN/HTTP URL
	uploadedAt: string;
	uploadedBy?: string;
}

export const ALLOWED_EXTENSIONS = [
	"pdf",
	"docx",
	"doc",
	"xlsx",
	"xls",
	"dwg",
	"jpg",
	"jpeg",
	"png",
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Format bytes into readable format, e.g. "2.4 MB" or "512 KB" */
export function formatFileSize(bytes: number): string {
	if (!bytes || isNaN(bytes) || bytes <= 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extract file extension safely */
export function getFileExtension(filename: string): string {
	if (!filename) return "";
	return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

/** Client-side validation matching AC 2 exactly */
export function validateSupportingFile(file: File): { valid: boolean; error?: string } {
	if (!file) {
		return { valid: false, error: "Berkas tidak ditemukan." };
	}

	// Ukuran file maksimal adalah 25 MB
	if (file.size > MAX_FILE_SIZE_BYTES) {
		return {
			valid: false,
			error: "Ukuran file maksimal adalah 25 MB",
		};
	}

	// Format berkas didukung
	const ext = getFileExtension(file.name);
	if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
		return {
			valid: false,
			error: `Format berkas .${ext || "tidak dikenal"} tidak diizinkan. Format yang didukung: PDF, DOCX, XLSX, DWG, JPG/PNG (Maks. 25 MB).`,
		};
	}

	return { valid: true };
}

/** Read file into base64 Data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (err) => reject(err);
		reader.readAsDataURL(file);
	});
}

const STORAGE_KEY = "idle_reuse_supporting_documents";

/** Minimal valid PDF 1.4 for demo/seed data */
export const SAMPLE_SUPPORTING_DOCUMENT: SupportingDocumentMeta = {
	fileName: "Nota_Dinas_Kebutuhan_Pompa.pdf",
	fileSize: 2516582, // 2.4 MB
	fileType: "application/pdf",
	fileUrl:
		"data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAxMzUgPj4Kc3RyZWFtCkJUCi9GMSAxNiBUZgo1MCA3MjAgVGQKKE5PVEEgRElOQVMgLSBKVVNUSUZJS0FTSSBLRUJVVFVIQU4gQVNFVCBJRExFKSBUagovRjEgMTIgVGYKMCAtMzAgVGQKKERva3VtZW4gcGVuZHVrdW5nIHBlbmdhanVhbiBwZW1ha2FpYW4gcGVyYWxhdGFuIGlkbGUgcGFicmlrLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDA0MjkgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo1MDAKJSVFT0Y=",
	uploadedAt: new Date().toISOString(),
	uploadedBy: "Unit Kerja Operasi",
};

/** Ambil seluruh dokumen pendukung dari persistent storage */
export function getSavedSupportingDocuments(): Record<string, SupportingDocumentMeta> {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch (e) {
		console.warn("Gagal membaca idle_reuse_supporting_documents dari storage:", e);
		return {};
	}
}

/** Ambil dokumen pendukung berdasarkan salah satu key (requestId, equipmentId, atau requestNumber) */
export function getSavedSupportingDocument(
	...keys: (string | number | undefined | null)[]
): SupportingDocumentMeta | null {
	const all = getSavedSupportingDocuments();

	// 1. Exact match
	for (const key of keys) {
		if (key == null) continue;
		const strKey = String(key).trim();
		if (strKey && all[strKey]) return all[strKey];
	}

	// 2. Case-insensitive & normalized search
	for (const key of keys) {
		if (key == null) continue;
		const strKey = String(key).trim().toLowerCase();
		if (!strKey) continue;
		for (const [k, v] of Object.entries(all)) {
			if (k.toLowerCase() === strKey) return v;
			if (v.requestId && String(v.requestId).toLowerCase() === strKey) return v;
			if (v.requestNumber && String(v.requestNumber).toLowerCase() === strKey) return v;
			if (v.equipmentId && String(v.equipmentId).toLowerCase() === strKey) return v;
		}
	}

	// 3. Fallback demo data jika ada request contoh (misal REQ-2026-001, REU-001, atau eqId 1)
	for (const key of keys) {
		if (key == null) continue;
		const strKey = String(key).trim().toUpperCase();
		if (
			strKey === "1" ||
			strKey.includes("REQ-2026-001") ||
			strKey.includes("REU-2026-001") ||
			strKey.includes("P-IIB-PMP-001")
		) {
			return {
				...SAMPLE_SUPPORTING_DOCUMENT,
				requestId: String(key),
				requestNumber: strKey.startsWith("REQ") || strKey.startsWith("REU") ? strKey : "REQ-2026-001",
			};
		}
	}

	return null;
}

/** Simpan dokumen pendukung ke persistent storage */
export function saveSupportingDocument(doc: SupportingDocumentMeta): void {
	if (typeof window === "undefined") return;
	try {
		const existing = getSavedSupportingDocuments();
		if (doc.requestId) existing[String(doc.requestId)] = doc;
		if (doc.requestNumber) existing[String(doc.requestNumber)] = doc;
		if (doc.equipmentId) existing[String(doc.equipmentId)] = doc;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
	} catch (e) {
		console.warn("Gagal menyimpan dokumen pendukung ke localStorage:", e);
	}
}
