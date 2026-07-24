package request

type ReviewApprovalRequest struct {
	// Action: "APPROVE" atau "REVISION"
	Action string `json:"action"`
	Notes  string `json:"notes"`
}
