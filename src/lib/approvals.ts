/**
 * Pemetaan status approval backend -> status yang dipakai UI.
 *
 * Backend (constants/approval.go) memakai enum:
 *   PENDING | IN_REVIEW | REVISION_REQUIRED | APPROVED | REJECTED | WAITING | VERIFIED
 */

export type ApprovalKind =
	| "validation"
	| "disposal"
	| "reuse"
	| "revalidation";

/** Status disposal/scrap yang dipakai halaman Manajer. */
export type DisposalDisplayStatus =
	| "PENDING"
	| "DISPOSED"
	| "REJECTED"
	| "REVISION_REQUIRED";

/**
 * IN_REVIEW dipetakan ke PENDING karena halaman Manajer tidak punya tahap
 * "mulai review" untuk disposal — item tetap harus tampil di inbox.
 * ponytail: kalau nanti ada tombol "Mulai Review" untuk disposal, tambahkan
 * IN_REVIEW sebagai status tersendiri di sini dan di filter inbox.
 */
export function disposalDisplayStatus(
	approvalStatus?: string | null,
): DisposalDisplayStatus {
	switch (String(approvalStatus || "PENDING").toUpperCase()) {
		case "APPROVED":
		case "DISPOSED":
			return "DISPOSED";
		case "REJECTED":
			return "REJECTED";
		case "REVISION_REQUIRED":
		case "REVISION":
			return "REVISION_REQUIRED";
		case "SCRAP_REQUEST":
		case "SCRAP_REQUESTED":
		case "PENDING":
		default:
			return "PENDING";
	}
}

/** Status reuse/peminjaman yang dipakai halaman Manajer. */
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
	if (raw.includes("APPROV") || raw.includes("SETUJU")) return "APPROVED";
	if (raw.includes("REJECT") || raw.includes("TOLAK")) return "REJECTED";
	if (raw.includes("REVIS")) return "REVISION_REQUESTED";
	if (raw.includes("REVIEW")) return "IN_REVIEW";
	return "PENDING";
}
