package database

import (
	"log"
	"time"

	"github.com/Ucokgreget/backend-idle/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) {
	now := time.Now()

	seedUsers(db, now)
	seedStatuses(db, now)
	seedConditions(db, now)
	seedObjectTypes(db, now)
	seedStorageLocations(db, now)
	seedIdleReasons(db, now)
	seedRequireActions(db, now)
	seedDisposalMethods(db, now)
	seedEquipments(db, now)
	seedIdleDeclarations(db, now)
	seedEquipmentInspections(db, now)
	seedDisposalRequests(db, now)
	seedReuseRequests(db, now)
	seedApprovalRequests(db, now)
	seedApprovalSteps(db, now)

	log.Println("Seeding selesai.")
}

func seedUsers(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	users := []models.User{
		{Name: "Admin Pusri", NPP: "100001", Email: "admin@pusri.co.id", Password: string(hash), Role: "ADMIN", CreatedAt: now, UpdatedAt: now},
		{Name: "Budi Santoso", NPP: "100002", Email: "budi.santoso@pusri.co.id", Password: string(hash), Role: "RENDAL_PEMELIHARAAN", CreatedAt: now, UpdatedAt: now},
		{Name: "Siti Rahayu", NPP: "100003", Email: "siti.rahayu@pusri.co.id", Password: string(hash), Role: "INSPEKSI_TEKNIK", CreatedAt: now, UpdatedAt: now},
		{Name: "Ahmad Fauzi", NPP: "100004", Email: "ahmad.fauzi@pusri.co.id", Password: string(hash), Role: "MANAJER_RENDAL", CreatedAt: now, UpdatedAt: now},
		{Name: "Dewi Lestari", NPP: "100005", Email: "dewi.lestari@pusri.co.id", Password: string(hash), Role: "UNIT_KERJA_OPERASI", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&users)
	log.Println("Seeded: users")
}

func seedStatuses(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.Status{}).Count(&count)
	if count > 0 {
		return
	}

	statuses := []models.Status{
		{Name: "REGISTERED", Description: "Aset baru didaftarkan ke sistem", CreatedAt: now, UpdatedAt: now},
		{Name: "VALIDATED", Description: "Peralatan telah diinspeksi oleh tim teknisi dan berhasil lewat uji", CreatedAt: now, UpdatedAt: now},
		{Name: "REJECTED", Description: "Peralatan telah diinspeksi oleh tim teknisi dan gagal lewat uji", CreatedAt: now, UpdatedAt: now},
		{Name: "IDLE", Description: "Peralatan tidak digunakan / menganggur", CreatedAt: now, UpdatedAt: now},
		{Name: "READY_TO_USE", Description: "Peralatan idle yang sudah dialokasikan untuk reuse", CreatedAt: now, UpdatedAt: now},
		{Name: "MAINTENANCE", Description: "Peralatan sedang dalam perawatan", CreatedAt: now, UpdatedAt: now},
		{Name: "REUSED", Description: "Peralatan sudah digunakan kembali", CreatedAt: now, UpdatedAt: now},
		{Name: "DISPOSED", Description: "Peralatan sudah dihapusbukukan / dibuang", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&statuses)
	log.Println("Seeded: statuses")
}

func seedConditions(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.Condition{}).Count(&count)
	if count > 0 {
		return
	}

	conditions := []models.Condition{
		{Name: "BAGUS", Description: "Kondisi peralatan baik, siap digunakan", CreatedAt: now, UpdatedAt: now},
		{Name: "RUSAK_RINGAN", Description: "Kerusakan minor, masih bisa diperbaiki", CreatedAt: now, UpdatedAt: now},
		{Name: "RUSAK_BERAT", Description: "Kerusakan major, perlu evaluasi kelayakan", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&conditions)
	log.Println("Seeded: conditions")
}

func seedObjectTypes(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.ObjectType{}).Count(&count)
	if count > 0 {
		return
	}

	objectTypes := []models.ObjectType{
		{Name: "Piping", Description: "Sistem perpipaan dan fitting", CreatedAt: now, UpdatedAt: now},
		{Name: "Valve", Description: "Katup dan aksesoris aliran", CreatedAt: now, UpdatedAt: now},
		{Name: "Rotating Equipment", Description: "Pompa, kompresor, blower", CreatedAt: now, UpdatedAt: now},
		{Name: "Static Equipment", Description: "Vessel, heat exchanger, tangki", CreatedAt: now, UpdatedAt: now},
		{Name: "Electrical Equipment", Description: "Motor listrik, transformer", CreatedAt: now, UpdatedAt: now},
		{Name: "Instrument", Description: "Peralatan kontrol & instrumen", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&objectTypes)
	log.Println("Seeded: object_types")
}

func seedStorageLocations(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.StorageLocation{}).Count(&count)
	if count > 0 {
		return
	}

	locations := []models.StorageLocation{
		{Name: "Pabrik III", Plant: "P-III", Description: "Area penyimpanan Pabrik III", CreatedAt: now, UpdatedAt: now},
		{Name: "Pabrik IV", Plant: "P-IV", Description: "Area penyimpanan Pabrik IV", CreatedAt: now, UpdatedAt: now},
		{Name: "Gudang Utama", Plant: "UTILITY", Description: "Gudang penyimpanan utama", CreatedAt: now, UpdatedAt: now},
		{Name: "Storage Area A", Plant: "UTILITY", Description: "Area penyimpanan A", CreatedAt: now, UpdatedAt: now},
		{Name: "Storage Area B", Plant: "UTILITY", Description: "Area penyimpanan B", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&locations)
	log.Println("Seeded: storage_locations")
}

func seedIdleReasons(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.IdleReason{}).Count(&count)
	if count > 0 {
		return
	}

	reasons := []models.IdleReason{
		{ReasonName: "Sisa Proyek", Description: "Peralatan sisa dari proyek yang sudah selesai", CreatedAt: now, UpdatedAt: now},
		{ReasonName: "Pabrik Shutdown", Description: "Pabrik atau unit dihentikan operasinya", CreatedAt: now, UpdatedAt: now},
		{ReasonName: "Modifikasi Desain", Description: "Tidak diperlukan karena perubahan desain sistem", CreatedAt: now, UpdatedAt: now},
		{ReasonName: "Decommissioning", Description: "Peralatan dari unit yang di-decommission", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&reasons)
	log.Println("Seeded: idle_reasons")
}

func seedRequireActions(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.RequireAction{}).Count(&count)
	if count > 0 {
		return
	}

	actions := []models.RequireAction{
		{Name: "Siap Pakai", Description: "Tidak memerlukan tindakan, siap digunakan kembali", CreatedAt: now, UpdatedAt: now},
		{Name: "Perbaikan Ringan", Description: "Memerlukan perbaikan minor sebelum digunakan", CreatedAt: now, UpdatedAt: now},
		{Name: "Overhaul", Description: "Memerlukan overhaul / rekondisi menyeluruh", CreatedAt: now, UpdatedAt: now},
		{Name: "Disposal", Description: "Disarankan untuk dihapusbukukan", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&actions)
	log.Println("Seeded: require_actions")
}

func seedDisposalMethods(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.DisposalMethod{}).Count(&count)
	if count > 0 {
		return
	}

	methods := []models.DisposalMethod{
		{Name: "Lelang", Description: "Dijual melalui proses lelang terbuka", CreatedAt: now, UpdatedAt: now},
		{Name: "Scrap", Description: "Dijual sebagai besi tua / scrap metal", CreatedAt: now, UpdatedAt: now},
		{Name: "Donasi", Description: "Disumbangkan ke institusi pendidikan atau pihak lain", CreatedAt: now, UpdatedAt: now},
		{Name: "Tukar Tambah", Description: "Digunakan sebagai trade-in untuk pembelian peralatan baru", CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&methods)
	log.Println("Seeded: disposal_methods")
}

func seedEquipments(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.Equipment{}).Count(&count)
	if count > 0 {
		return
	}

	idle1 := now.AddDate(-1, 0, 0)
	idle2 := now.AddDate(-2, 0, 0)
	idle3 := now.AddDate(0, -6, 0)
	idle4 := now.AddDate(0, -3, 0)
	idle5 := now.AddDate(-3, 0, 0)

	equipments := []models.Equipment{
		{
			UUID: "eq-001-pump-centrifugal", EquipmentCode: "P-IIB-PMP-001",
			Name: "Centrifugal Pump 150HP", ObjectTypeID: 3, Plant: "P-IIB",
			PlantDescription: "Pabrik Pusri IIB", StorageLocationID: 1,
			FuncLoc: "P-IIB-SYNTH-001", Vendor: "KSB Indonesia", Year: 2015,
			OriginalValue: 450000000, BookValue: 180000000, EstimatedReuseValue: 250000000,
			StatusID: 2, ConditionID: 1, IdleSince: &idle1,
			Notes: "Idle sejak upgrade pompa unit sintesa", CreatedAt: now, UpdatedAt: now, CreatedBy: 1, UpdatedBy: 1,
		},
		{
			UUID: "eq-002-heat-exchanger", EquipmentCode: "P-IIB-HEX-003",
			Name: "Shell & Tube Heat Exchanger", ObjectTypeID: 4, Plant: "P-IIB",
			PlantDescription: "Pabrik Pusri IIB", StorageLocationID: 3,
			FuncLoc: "P-IIB-UTIL-003", Vendor: "PT Bromo Steel", Year: 2012,
			OriginalValue: 800000000, BookValue: 320000000, EstimatedReuseValue: 400000000,
			StatusID: 2, ConditionID: 2, IdleSince: &idle2,
			Notes: "Diganti karena perubahan kapasitas produksi", CreatedAt: now, UpdatedAt: now, CreatedBy: 1, UpdatedBy: 1,
		},
		{
			UUID: "eq-003-motor-electric", EquipmentCode: "P-III-MOT-010",
			Name: "Electric Motor 200kW", ObjectTypeID: 5, Plant: "P-III",
			PlantDescription: "Pabrik Pusri III", StorageLocationID: 2,
			FuncLoc: "P-III-COMP-010", Vendor: "ABB Indonesia", Year: 2018,
			OriginalValue: 350000000, BookValue: 245000000, EstimatedReuseValue: 280000000,
			StatusID: 2, ConditionID: 1, IdleSince: &idle3,
			Notes: "Spare motor dari kompresor yang di-upgrade", CreatedAt: now, UpdatedAt: now, CreatedBy: 2, UpdatedBy: 2,
		},
		{
			UUID: "eq-004-control-valve", EquipmentCode: "P-IV-CVL-022",
			Name: "Control Valve 6 inch", ObjectTypeID: 2, Plant: "P-IV",
			PlantDescription: "Pabrik Pusri IV", StorageLocationID: 4,
			FuncLoc: "P-IV-AMMON-022", Vendor: "Fisher Emerson", Year: 2016,
			OriginalValue: 120000000, BookValue: 48000000, EstimatedReuseValue: 75000000,
			StatusID: 2, ConditionID: 1, IdleSince: &idle4,
			Notes: "Diganti dengan model terbaru", CreatedAt: now, UpdatedAt: now, CreatedBy: 2, UpdatedBy: 2,
		},
		{
			UUID: "eq-005-compressor", EquipmentCode: "P-IIB-CMP-005",
			Name: "Reciprocating Compressor", ObjectTypeID: 3, Plant: "P-IIB",
			PlantDescription: "Pabrik Pusri IIB", StorageLocationID: 1,
			FuncLoc: "P-IIB-SYNTH-005", Vendor: "Atlas Copco", Year: 2010,
			OriginalValue: 2500000000, BookValue: 500000000, EstimatedReuseValue: 800000000,
			StatusID: 2, ConditionID: 3, IdleSince: &idle5,
			Notes: "Rusak berat, perlu evaluasi kelayakan rekondisi", CreatedAt: now, UpdatedAt: now, CreatedBy: 1, UpdatedBy: 1,
		},
	}
	db.Create(&equipments)
	log.Println("Seeded: equipments")
}

func seedIdleDeclarations(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.IdleDeclaration{}).Count(&count)
	if count > 0 {
		return
	}

	declarations := []models.IdleDeclaration{
		{EquipmentID: 1, IdleDate: now.AddDate(-1, 0, 0), IdleReasonID: 2, ConditionID: 1, PreservationStatus: "Preserved", StorageLocationID: 1, Notes: "Pompa di-preserve dengan nitrogen blanket", DeclaredBy: 2, CreatedAt: now, UpdatedAt: now},
		{EquipmentID: 2, IdleDate: now.AddDate(-2, 0, 0), IdleReasonID: 3, ConditionID: 2, PreservationStatus: "Partially Preserved", StorageLocationID: 3, Notes: "Disimpan di yard terbuka dengan penutup", DeclaredBy: 2, CreatedAt: now, UpdatedAt: now},
		{EquipmentID: 3, IdleDate: now.AddDate(0, -6, 0), IdleReasonID: 2, ConditionID: 1, PreservationStatus: "Preserved", StorageLocationID: 2, Notes: "Motor disimpan dalam gudang tertutup", DeclaredBy: 3, CreatedAt: now, UpdatedAt: now},
		{EquipmentID: 4, IdleDate: now.AddDate(0, -3, 0), IdleReasonID: 2, ConditionID: 1, PreservationStatus: "Preserved", StorageLocationID: 4, Notes: "Control valve dalam kemasan asli", DeclaredBy: 3, CreatedAt: now, UpdatedAt: now},
		{EquipmentID: 5, IdleDate: now.AddDate(-3, 0, 0), IdleReasonID: 4, ConditionID: 3, PreservationStatus: "Not Preserved", StorageLocationID: 1, Notes: "Kompresor rusak berat sejak shutdown pabrik", DeclaredBy: 2, CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&declarations)
	log.Println("Seeded: idle_declarations")
}

func seedEquipmentInspections(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.EquipmentInspection{}).Count(&count)
	if count > 0 {
		return
	}

	inspections := []models.EquipmentInspection{
		{EquipmentID: 1, InspectionDate: now.AddDate(0, -2, 0), Inspector: "Dewi Lestari", RequireActionID: 1, MechanicalCondition: "Baik", ElectricalCondition: "N/A", EstimatedRefurbishCost: 0, Notes: "Pompa dalam kondisi baik, siap digunakan", CreatedAt: now, UpdatedAt: now, CreatedBy: 5},
		{EquipmentID: 2, InspectionDate: now.AddDate(0, -1, 0), Inspector: "Dewi Lestari", RequireActionID: 2, MechanicalCondition: "Korosi ringan pada shell", ElectricalCondition: "N/A", EstimatedRefurbishCost: 75000000, Notes: "Perlu sandblasting dan re-coating", CreatedAt: now, UpdatedAt: now, CreatedBy: 5},
		{EquipmentID: 3, InspectionDate: now.AddDate(0, -1, 0), Inspector: "Dewi Lestari", RequireActionID: 1, MechanicalCondition: "Baik", ElectricalCondition: "Baik", EstimatedRefurbishCost: 0, Notes: "Motor listrik siap pakai, insulation test OK", CreatedAt: now, UpdatedAt: now, CreatedBy: 5},
		{EquipmentID: 5, InspectionDate: now.AddDate(0, -3, 0), Inspector: "Dewi Lestari", RequireActionID: 4, MechanicalCondition: "Bearing rusak, cylinder liner aus", ElectricalCondition: "Motor penggerak rusak", EstimatedRefurbishCost: 1200000000, Notes: "Biaya rekondisi tidak ekonomis, disarankan disposal", CreatedAt: now, UpdatedAt: now, CreatedBy: 5},
	}
	db.Create(&inspections)
	log.Println("Seeded: equipment_inspections")
}

func seedDisposalRequests(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.DisposalRequest{}).Count(&count)
	if count > 0 {
		return
	}

	disposalDate := now.AddDate(0, -2, 0)
	disposals := []models.DisposalRequest{
		{DisposalNumber: "DSP-2026-001", EquipmentID: 5, DisposalMethodID: 2, ScrapValue: 150000000, DisposalDate: &disposalDate, ApprovedBy: 4, Justification: "Biaya rekondisi melebihi nilai buku, tidak ekonomis untuk diperbaiki", ApprovalStatus: "APPROVED", CreatedAt: now, UpdatedAt: now, CreatedBy: 2},
	}
	db.Create(&disposals)
	log.Println("Seeded: disposal_requests")
}

func seedReuseRequests(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.ReuseRequest{}).Count(&count)
	if count > 0 {
		return
	}

	reuseDate1 := now.AddDate(0, 1, 0)
	reuseDate2 := now.AddDate(0, 2, 0)
	reuses := []models.ReuseRequest{
		{RequestNumber: "REU-2026-001", EquipmentID: 1, RequestingProject: "Revamp Unit Utilitas P-III", RequestingPlant: "P-III", InstallationLocation: "Cooling Water System", ReuseDate: &reuseDate1, EstimatedNewPurchaseCost: 500000000, RefurbishmentCost: 25000000, EstimatedCostAvoidance: 475000000, ApprovalStatus: "PENDING", Justification: "Spesifikasi pompa sesuai kebutuhan proyek revamp", Notes: "Pompa dalam kondisi baik berdasarkan hasil inspeksi", RequestedBy: 3, RequestedAt: now, CreatedAt: now, UpdatedAt: now},
		{RequestNumber: "REU-2026-002", EquipmentID: 3, RequestingProject: "Penambahan Kapasitas Kompresor P-IV", RequestingPlant: "P-IV", InstallationLocation: "Compressor House", ReuseDate: &reuseDate2, EstimatedNewPurchaseCost: 400000000, RefurbishmentCost: 0, EstimatedCostAvoidance: 400000000, ApprovalStatus: "PENDING", Justification: "Motor 200kW sesuai kebutuhan penggerak kompresor baru", Notes: "Motor siap pakai tanpa perlu refurbishment", RequestedBy: 2, RequestedAt: now, CreatedAt: now, UpdatedAt: now},
	}
	db.Create(&reuses)
	log.Println("Seeded: reuse_requests")
}

func seedApprovalRequests(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.ApprovalRequest{}).Count(&count)
	if count > 0 {
		return
	}

	approvals := []models.ApprovalRequest{
		{RequestNumber: "APR-2026-001", RequestType: "REUSE", ReferenceID: 1, EquipmentID: 1, Requester: 3, RequestDate: now, Justification: "Penggunaan kembali pompa idle untuk proyek revamp P-III", CurrentStep: "Manajer Rendal", ApprovalStatus: "IN_REVIEW", CreatedAt: now, UpdatedAt: now, CreatedBy: 3, UpdatedBy: 3},
		{RequestNumber: "APR-2026-002", RequestType: "DISPOSAL", ReferenceID: 1, EquipmentID: 5, Requester: 2, RequestDate: now.AddDate(0, -2, 0), Justification: "Disposal kompresor rusak berat via scrap", CurrentStep: "Completed", ApprovalStatus: "APPROVED", CreatedAt: now, UpdatedAt: now, CreatedBy: 2, UpdatedBy: 4},
	}
	db.Create(&approvals)
	log.Println("Seeded: approval_requests")
}

func seedApprovalSteps(db *gorm.DB, now time.Time) {
	var count int64
	db.Model(&models.ApprovalStep{}).Count(&count)
	if count > 0 {
		return
	}

	approvalDate1 := now.AddDate(0, 0, -2)
	approvalDate2 := now.AddDate(0, -2, -5)
	approvalDate3 := now.AddDate(0, -2, -3)
	approvalDate4 := now.AddDate(0, -2, 0)

	steps := []models.ApprovalStep{
		{ApprovalRequestId: 1, StepOrder: 1, ApprovalRole: "MANAJER_RENDAL", ApprovalName: "Ahmad Fauzi", ApprovalStatus: "APPROVED", ApprovalDate: &approvalDate1, ApprovalNotes: "Setuju, spesifikasi sesuai", CreatedBy: 3, UpdatedBy: 2},
		{ApprovalRequestId: 1, StepOrder: 2, ApprovalRole: "MANAJER_RENDAL", ApprovalName: "Ahmad Fauzi", ApprovalStatus: "PENDING", ApprovalDate: nil, ApprovalNotes: "", CreatedBy: 3, UpdatedBy: 3},
		{ApprovalRequestId: 2, StepOrder: 1, ApprovalRole: "MANAJER_RENDAL", ApprovalName: "Ahmad Fauzi", ApprovalStatus: "APPROVED", ApprovalDate: &approvalDate2, ApprovalNotes: "Setuju disposal", CreatedBy: 2, UpdatedBy: 2},
		{ApprovalRequestId: 2, StepOrder: 2, ApprovalRole: "MANAJER_RENDAL", ApprovalName: "Ahmad Fauzi", ApprovalStatus: "APPROVED", ApprovalDate: &approvalDate3, ApprovalNotes: "Approved, biaya rekondisi tidak ekonomis", CreatedBy: 2, UpdatedBy: 4},
		{ApprovalRequestId: 2, StepOrder: 3, ApprovalRole: "MANAJER_OPERASI", ApprovalName: "Ahmad Fauzi", ApprovalStatus: "APPROVED", ApprovalDate: &approvalDate4, ApprovalNotes: "Approved", CreatedBy: 2, UpdatedBy: 4},
	}
	db.Create(&steps)
	log.Println("Seeded: approval_steps")
}
