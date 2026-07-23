package request

import "mime/multipart"

type CreateInspectionRequest struct {
	EquipmentID            int                   `form:"equipment_id"`
	InspectorID            string                `form:"inspector"`
	RequireActionID        int                   `form:"require_action_id"`
	MechanicalCondition    string                `form:"mechanical_condition"`
	ElectricalCondition    string                `form:"electrical_condition"`
	EstimatedRefurbishCost float64               `form:"estimated_refurbish_cost"`
	Notes                  string                `form:"notes"`
	Photo                  *multipart.FileHeader `form:"photo"`
}
