package models

import "time"

type Equipment struct {
	ID                  uint   `json:"id" gorm:"primaryKey"`
	UUID                string `json:"uuid" gorm:"unique"`
	EquipmentCode       string `json:"equipment_code" gorm:"unique"`
	Name                string `json:"name"`
	ObjectTypeID        int
	Plant               string `json:"plant"`
	PlantDescription    string `json:"plant_description"`
	StorageLocationID   int
	FuncLoc             string
	Vendor              string    `json:"vendor"`
	Year                int       `json:"year"`
	OriginalValue       float64   `json:"original_value"`
	BookValue           float64   `json:"book_value"`
	EstimatedReuseValue float64   `json:"estimated_reuse_value"`
	StatusID            int       `json:"status_id"`
	ConditionID         int       `json:"condition_id"`
	IdleSince           time.Time `json:"idle_since"`
	Notes               string    `json:"notes"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	CreatedBy           uint      `json:"created_by"`
	UpdatedBy           uint      `json:"updated_by"`

	Condition       Condition       `json:"condition" gorm:"foreignKey:ConditionID"`
	Status          Status          `json:"status" gorm:"foreignKey:StatusID"`
	StorageLocation StorageLocation `json:"storage_location" gorm:"foreignKey:StorageLocationID"`
	ObjectType      ObjectType      `json:"object_type" gorm:"foreignKey:ObjectTypeID"`
}

type IdleDeclaration struct {
	ID                 int       `json:"id" gorm:"primaryKey"`
	EquipmentID        int       `json:"equipment_id" gorm:"foreignKey:EquipmentID"`
	IdleDate           time.Time `json:"idle_date"`
	IdleReasonID       int       `json:"idle_reason_id" gorm:"foreignKey:IdleReasonID"`
	ConditionID        int       `json:"condition_id" gorm:"foreignKey:ConditionID"`
	PreservationStatus string    `json:"preservation_status"`
	StorageLocationID  int       `json:"storage_location_id"`
	Notes              string    `json:"notes"`
	DeclaredBy         uint      `json:"declared_by"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	IdleReason      IdleReason      `json:"idle_reason" gorm:"foreignKey:IdleReasonID"`
	Condition       Condition       `json:"condition" gorm:"foreignKey:ConditionID"`
	StorageLocation StorageLocation `json:"storage_location" gorm:"foreignKey:StorageLocationID"`
}

type ApprovalRequest struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	RequestNumber  string    `json:"request_number"`
	RequestType    string    `json:"request_type"`
	ReferenceID    uint      `json:"reference_id"`
	EquipmentID    uint      `json:"equipment_id"`
	Requester      uint      `json:"requester"`
	RequestDate    time.Time `json:"request_date"`
	Justification  string    `json:"justification"`
	CurrentStep    string    `json:"current_step"`    //ini perlu point out lebih lanjut, apakah step ini harus di tabel terpisah?
	ApprovalStatus string    `json:"approval_status"` //ini juga, biasanya ada
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	CreatedBy      uint      `json:"created_by"`
	UpdatedBy      uint      `json:"updated_by"`

	Equipment Equipment `json:"equipment" gorm:"foreignKey:EquipmentID"`
}

type ApprovalStep struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	ApprovalRequestId uint      `json:"approval_request_id"`
	StepOrder         int       `json:"step_order"`
	ApprovalRole      string    `json:"approval_role"`
	ApprovalName      string    `json:"approval_name"`
	ApprovalStatus    string    `json:"approval_status"`
	ApprovalDate      time.Time `json:"approval_date"`
	ApprovalNotes     string    `json:"approval_notes"`
	CreatedBy         uint      `json:"created_by"`
	UpdatedBy         uint      `json:"updated_by"`

	ApprovalRequest ApprovalRequest `json:"approval_request" gorm:"foreignKey:ApprovalRequestId"`
}

type ReuseRequest struct {
	ID                       uint      `json:"id" gorm:"primaryKey"`
	RequestNumber            string    `json:"request_number"`
	EquipmentID              uint      `json:"equipment_id"`
	RequestingProject        string    `json:"requesting_project"`
	RequestingPlant          string    `json:"requesting_plant"`
	InstallationLocation     string    `json:"installation_location"`
	ReuseDate                time.Time `json:"reuse_date"`
	EstimatedNewPurchaseCost float64   `json:"estimated_new_purchase_cost"`
	RefurbishmentCost        float64   `json:"refurbishment_cost"`
	EstimatedCostAvoidance   float64   `json:"estimated_cost_avoidance"`
	ApprovalStatus           string    `json:"approval_status"`
	Justification            string    `json:"justification"`
	Notes                    string    `json:"notes"`
	RequestedBy              uint      `json:"requested_by"`
	RequestedAt              time.Time `json:"requested_at"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`

	Equipment Equipment `json:"equipment" gorm:"foreignKey:EquipmentID"`
}

type EquipmentAttachment struct {
	ID                 int       `json:"id" gorm:"primaryKey"`
	ReferenceTable     string    `json:"reference_table"`
	ReferenceID        int       `json:"reference_id"`
	AttachmentCategory string    `json:"attachment_category"`
	FileName           string    `json:"file_name"`
	FileURL            string    `json:"file_url"`
	FileType           string    `json:"file_type"`
	Description        string    `json:"description"`
	IsPrimary          bool      `json:"is_primary"`
	UploadedBy         uint      `json:"uploaded_by"`
	UploadedAt         time.Time `json:"uploaded_at"`
}

type DisposalRequest struct {
	ID               int       `json:"id" gorm:"primaryKey"`
	DisposalNumber   string    `json:"disposal_number"`
	EquipmentID      int       `json:"equipment_id"`
	DisposalMethodID int       `json:"disposal_method_id"`
	ScrapValue       float64   `json:"scrap_value"`
	DisposalDate     time.Time `json:"disposal_date"`
	ApprovedBy       uint      `json:"approved_by"`
	Justification    string    `json:"justification"`
	ApprovalStatus   string    `json:"approval_status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	CreatedBy        uint      `json:"created_by"`

	DisposalMethod DisposalMethod `json:"disposal_method" gorm:"foreignKey:DisposalMethodID"`
	Equipment      Equipment      `json:"equipment" gorm:"foreignKey:EquipmentID"`
}

type EquipmentInspection struct {
	ID                     int       `json:"id" gorm:"primaryKey"`
	EquipmentID            int       `json:"equipment_id"`
	InspectionDate         time.Time `json:"inspection_date"`
	Inspector              string    `json:"inspector"`
	RequireActionID        int       `json:"require_action_id"`
	MechanicalCondition    string    `json:"mechanical_condition"`
	ElectricalCondition    string    `json:"electrical_condition"`
	EstimatedRefurbishCost float64   `json:"estimated_refurbish_cost"`
	Notes                  string    `json:"notes"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
	CreatedBy              uint      `json:"created_by"`

	RequireAction RequireAction `json:"require_action" gorm:"foreignKey:RequireActionID"`
	Equipment     Equipment     `json:"equipment" gorm:"foreignKey:EquipmentID"`
}

type RequireAction struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type DisposalMethod struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ObjectType struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type StorageLocation struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Plant       string    `json:"plant"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Status struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Condition struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type IdleReason struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	ReasonName  string    `json:"reason_name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
