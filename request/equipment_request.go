package request

type CreateEquipmentRequest struct {
	EquipmentCode     string  `json:"equipment_code" validate:"required"`
	Name              string  `json:"name" validate:"required"`
	ObjectTypeID      int     `json:"id_object_type" validate:"required"`
	Plant             string  `json:"plant" validate:"required"`
	PlantDescription  string  `json:"plant_description"`
	StorageLocationID int     `json:"id_storage_location"`
	FuncLoc           string  `json:"func_loc"`
	Vendor            string  `json:"vendor"`
	Year              int     `json:"year"`
	OriginalValue     float64 `json:"original_value"`
	BookValue         float64 `json:"book_value"`
	ConditionID       int     `json:"id_condition" validate:"required"`
	Notes             string  `json:"notes"`
}
