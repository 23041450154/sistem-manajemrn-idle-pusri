package main

import (
	"log"
	"os"

	"github.com/Ucokgreget/backend-idle/database"
	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	db := database.Connect()

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

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "seed":
			database.Seed(db)
			return
		case "migrate-fresh":
			database.MigrateFresh(db)
			return
		}
	}

	router := gin.Default()

	router.Static("/uploads", "./uploads")

	routes.SetupRoutes(router, db)

	if err := router.Run(":8080"); err != nil {
		log.Fatalf("failed to start server: %s", err.Error())
	}
}
