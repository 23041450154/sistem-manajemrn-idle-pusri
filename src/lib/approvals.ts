/**
 * Pemetaan status approval backend -> status yang dipakai UI.
 *
 * Backend (constants/approval.go) memakai enum:
 *   PENDING | IN_REVIEW | REVISION_REQUIRED | APPROVED | REJECTED | WAITING | VERIFIED
 */

export type ApprovalKind =
	| "validation"
	| "scrap"
	| "reuse"
	| "revalidation";

/** Status scrap yang dipakai halaman Manajer & Rendal. */
export type ScrapDisplayStatus =
	| "PENDING"
	| "IN_REVIEW"
	| "APPROVED"
	| "DISPOSED"
	| "REJECTED"
	| "REVISION_REQUIRED";

export function scrapDisplayStatus(
	approvalStatus?: string | null,
): ScrapDisplayStatus {
	switch (String(approvalStatus || "PENDING").toUpperCase()) {
		case "APPROVED":
			return "APPROVED";
		case "DISPOSED":
			return "DISPOSED";
		case "REJECTED":
			return "REJECTED";
		case "REVISION_REQUIRED":
		case "REVISION":
			return "REVISION_REQUIRED";
		case "IN_REVIEW":
			return "IN_REVIEW";
		case "SCRAP_REQUEST":
		case "SCRAP_REQUESTED":
		case "PENDING":
		default:
			return "PENDING";
	}
}

/** Status reuse/pemakaian yang dipakai halaman Manajer. */
export type ReuseDisplayStatus =
	| "PENDING"
	| "IN_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "REVISION_REQUESTED";

export function reuseDisplayStatus(
	approvalStatus?: string | null,
): ReuseDisplayStatus {
	const raw = String(approvalStatus || "PENDING").toUpperCase();
	if (
		raw.includes("APPROV") ||
		raw.includes("SETUJU") ||
		raw.includes("REUSED") ||
		raw.includes("INSTALLED") ||
		raw.includes("SELESAI") ||
		raw.includes("COMPLETED")
	) {
		return "APPROVED";
	}
	if (raw.includes("REJECT") || raw.includes("TOLAK")) return "REJECTED";
	if (raw.includes("REVIS")) return "REVISION_REQUESTED";
	if (raw.includes("REVIEW")) return "IN_REVIEW";
	return "PENDING";
}

/** Label tampilan status pemakaian/reuse — US-10-FE transisi 'Approved for Reuse'. */
export function reuseStatusLabel(approvalStatus?: string | null): string {
	const status = reuseDisplayStatus(approvalStatus);
	switch (status) {
		case "APPROVED":
			return "Approved for Reuse";
		case "REJECTED":
			return "Ditolak";
		case "REVISION_REQUESTED":
			return "Perlu Revisi";
		case "IN_REVIEW":
			return "Sedang Direview";
		case "PENDING":
		default:
			return "Menunggu Review";
	}
}

/** Label tampilan status scrap — US-11-FE (contoh: 'Disetujui Scrap', 'Menunggu Review Scrap'). */
export function scrapStatusLabel(approvalStatus?: string | null): string {
	const status = scrapDisplayStatus(approvalStatus);
	switch (status) {
		case "APPROVED":
		case "DISPOSED":
			return "Disetujui Scrap";
		case "REJECTED":
			return "Ditolak Scrap";
		case "REVISION_REQUIRED":
			return "Perlu Revisi Scrap";
		case "IN_REVIEW":
		case "PENDING":
		default:
			return "Menunggu Review Scrap";
	}
}

/** Tampilan badge status scrap (label dan styling Tailwind) — US-11-FE AC-04. */
export function scrapStatusBadge(approvalStatus?: string | null): {
	label: string;
	style: string;
} {
	const status = scrapDisplayStatus(approvalStatus);
	switch (status) {
		case "APPROVED":
		case "DISPOSED":
			return {
				label: "Disetujui Scrap",
				style: "bg-[#DCFCE7] text-[#16A34A]",
			};
		case "REJECTED":
			return {
				label: "Ditolak Scrap",
				style: "bg-[#FEE2E2] text-[#DC2626]",
			};
		case "REVISION_REQUIRED":
			return {
				label: "Perlu Revisi Scrap",
				style: "bg-[#F3E8FF] text-[#9333EA]",
			};
		case "IN_REVIEW":
		case "PENDING":
		default:
			return {
				label: "Menunggu Review Scrap",
				style: "bg-[#FEF3C7] text-[#B45309]",
			};
	}
}

/**
 * Pemetaan metode scrap resmi BUMN (US-11-FE AC-02, AC-05):
 * 1. Penjualan Scrap / Lelang
 * 2. Pemusnahan Fisik
 * 3. Hibah (Institusi Pendidikan / Lembaga)
 * 4. Tukar Tambah (Trade-In)
 */
export function mapScrapMethodName(
	name?: string | null,
	id?: number | string | null,
): string {
	const raw = String(name || "").trim().toLowerCase();
	const numId = Number(id);

	if (raw.includes("hibah") || raw.includes("donasi") || numId === 3) {
		return "Hibah (Institusi Pendidikan / Lembaga)";
	}
	if (raw.includes("tukar") || raw.includes("trade") || numId === 4) {
		return "Tukar Tambah (Trade-In)";
	}
	if (raw.includes("pemusnahan")) {
		return "Pemusnahan Fisik";
	}
	if (numId === 1 && !raw.includes("scrap")) {
		return "Pemusnahan Fisik";
	}
	if (raw.includes("scrap") || raw.includes("lelang") || numId === 2) {
		return "Penjualan Scrap / Lelang";
	}
	if (name) {
		return name.replace(/scrap/gi, "Scrap").replace(/donasi/gi, "Hibah");
	}
	return "Penjualan Scrap / Lelang";
}
