package request

type EquipmentRequest struct {
	EquipmentCode       string  `json:"equipment_code" validate:"required"`
	Name                string  `json:"name" validate:"required"`
	ObjectTypeID        int     `json:"id_object_type" validate:"required"`
	Plant               string  `json:"plant" validate:"required"`
	PlantDescription    string  `json:"plant_description"`
	StorageLocationID   int     `json:"id_storage_location"`
	FuncLoc             string  `json:"func_loc"`
	Vendor              string  `json:"vendor"`
	Year                int     `json:"year"`
	OriginalValue       float64 `json:"original_value"`
	BookValue           float64 `json:"book_value"`
	EstimatedReuseValue float64 `json:"estimated_reuse_value"`
	ConditionID         int     `json:"id_condition" validate:"required"`
	Notes               string  `json:"notes"`
	//for idleDeclaration
	IdleReasonId int `json:"id_idle_reason"`
}

type ValidateEquipmentRequest struct {
	IsUtilizable *bool  `json:"is_utilizable"`
	Notes        string `json:"notes"`
}

type UpdateEquipmentRequest struct {
	EquipmentCode     *string  `json:"equipment_code"`
	Name              *string  `json:"name"`
	ObjectTypeID      *int     `json:"id_object_type"`
	Plant             *string  `json:"plant"`
	PlantDescription  *string  `json:"plant_description"`
	StorageLocationID *int     `json:"id_storage_location"`
	FuncLoc           *string  `json:"func_loc"`
	Vendor            *string  `json:"vendor"`
	Year              *int     `json:"year"`
	OriginalValue     *float64 `json:"original_value"`
	BookValue         *float64 `json:"book_value"`
	ConditionID       *int     `json:"id_condition"`
	Notes             *string  `json:"notes"`
}
