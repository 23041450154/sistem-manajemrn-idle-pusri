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

/** Status disposal/scrap yang dipakai halaman Manajer & Rendal. */
export type DisposalDisplayStatus =
	| "PENDING"
	| "IN_REVIEW"
	| "APPROVED"
	| "DISPOSED"
	| "REJECTED"
	| "REVISION_REQUIRED";

export function disposalDisplayStatus(
	approvalStatus?: string | null,
): DisposalDisplayStatus {
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
