package constants

// Tipe request approval. Nilai disimpan ke database dalam bahasa Inggris/uppercase.
const (
	RequestTypeEquipmentRegistration = "EQUIPMENT_REGISTRATION"
	RequestTypeReuse                 = "REUSE"
	RequestTypeDisposal              = "DISPOSAL"
)

// Status approval (dipakai oleh approval_request maupun approval_step).
// Enum backend tetap bahasa Inggris; label ramah pengguna dihasilkan via ApprovalStatusLabel.
const (
	ApprovalStatusPending          = "PENDING"
	ApprovalStatusInReview         = "IN_REVIEW"
	ApprovalStatusRevisionRequired = "REVISION_REQUIRED"
	ApprovalStatusApproved         = "APPROVED"
)

// approvalStatusLabels memetakan enum backend ke label frontend.
// Label ini TIDAK pernah disimpan ke database, hanya untuk response API.
var approvalStatusLabels = map[string]string{
	ApprovalStatusPending:          "Menunggu Review",
	ApprovalStatusInReview:         "Sedang Direview",
	ApprovalStatusRevisionRequired: "Perlu Revisi",
	ApprovalStatusApproved:         "Disetujui",
}

// ApprovalStatusLabel mengembalikan label frontend untuk sebuah status enum.
// Jika status tidak dikenal, nilai aslinya dikembalikan apa adanya.
func ApprovalStatusLabel(status string) string {
	if label, ok := approvalStatusLabels[status]; ok {
		return label
	}
	return status
}
