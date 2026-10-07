/**
 * Ubah file_url attachment jadi URL yang bisa dipakai browser.
 *
 * Backend mengunci GET /uploads/* dengan token, jadi <img> tidak bisa memuat
 * path mentah. Semua lewat /api/proxy-image: server yang memasang token.
 * basePath (/idle) wajib ikut karena <img src> tidak lewat router Next.
 *
 * ponytail: modul ini sengaja tanpa import (tanpa next/*, tanpa API_URL) supaya
 * bisa diuji langsung dengan Node — lihat scripts/check-file-url.mjs. Efeknya,
 * tiap URL yang memuat "/uploads/" diperlakukan sebagai berkas backend;
 * /api/proxy-image sendiri yang menolak host di luar backend, jadi tidak ada
 * celah baru.
 * Upgrade path: kalau nanti ada CDN dengan path /uploads/, batasi lagi ke origin
 * backend (bandingkan dengan new URL(API_URL).origin).
 */

/** basePath deployment; dibaca per panggilan supaya tidak terpaku saat modul dimuat. */
function basePath(): string {
	return (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

export function fileUrl(raw?: string | null): string {
	const url = String(raw || "").replace(/\\/g, "/").trim();
	if (!url) return "";
	// Sudah URL proxy: jangan dibungkus dua kali.
	if (url.includes("/api/proxy-image?")) return url;

	// URL absolut dari backend juga kena proteksi token, jadi lewat proxy juga.
	const uploadsAt = url.indexOf("/uploads/");
	if (/^https?:\/\//i.test(url)) {
		if (uploadsAt === -1) return url;
		const path = url.slice(uploadsAt).split(/[?#]/)[0];
		return `${basePath()}/api/proxy-image?url=${encodeURIComponent(path)}`;
	}

	const path = url.startsWith("/") ? url : "/" + url;
	return `${basePath()}/api/proxy-image?url=${encodeURIComponent(path)}`;
}

/** Terapkan fileUrl ke semua attachment dalam satu payload (equipment/inspeksi). */
export function proxyAttachmentUrls(container: unknown): void {
	if (!container || typeof container !== "object") return;
	const attachments = (container as { attachments?: unknown }).attachments;
	if (!Array.isArray(attachments)) return;

	for (const att of attachments) {
		if (!att || typeof att !== "object") continue;
		const row = att as Record<string, unknown>;
		const url = fileUrl(
			(row.file_url || row.fileUrl || row.url) as string | undefined,
		);
		if (!url) continue;
		row.file_url = url;
		row.fileUrl = url;
		row.url = url;
	}
}
