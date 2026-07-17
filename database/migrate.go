package database

import (
	"log"

	"github.com/Ucokgreget/backend-idle/models"
	"gorm.io/gorm"
)

func MigrateFresh(db *gorm.DB) {
	log.Println("Dropping all tables...")

	db.Migrator().DropTable(
		&models.ApprovalStep{},
		&models.ApprovalRequest{},
		&models.ReuseRequest{},
		&models.DisposalRequest{},
		&models.EquipmentInspection{},
		&models.EquipmentAttachment{},
		&models.IdleDeclaration{},
		&models.Equipment{},
		&models.DisposalMethod{},
		&models.RequireAction{},
		&models.IdleReason{},
		&models.StorageLocation{},
		&models.ObjectType{},
		&models.Condition{},
		&models.Status{},
		&models.User{},
	)

	log.Println("Re-creating tables...")

	db.AutoMigrate(
		&models.User{},
		&models.Status{},
		&models.Condition{},
		&models.ObjectType{},
		&models.StorageLocation{},
		&models.IdleReason{},
		&models.RequireAction{},
		&models.DisposalMethod{},
		&models.Equipment{},
		&models.IdleDeclaration{},
		&models.EquipmentInspection{},
		&models.DisposalRequest{},
		&models.ReuseRequest{},
		&models.ApprovalRequest{},
		&models.ApprovalStep{},
		&models.EquipmentAttachment{},
	)

	log.Println("Seeding data...")
	Seed(db)

	log.Println("migrate-fresh selesai.")
}
