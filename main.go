package main

import (
	"log"
	"os"

	"github.com/Ucokgreget/backend-idle/database"
	_ "github.com/Ucokgreget/backend-idle/docs"
	"github.com/Ucokgreget/backend-idle/models"
	"github.com/Ucokgreget/backend-idle/routes"
	"github.com/gin-gonic/gin"
)

// @title           Backend Idle API
// @version         1.0
// @description     API documentation for Backend Idle (equipment/idle management system)
// @BasePath        /api

// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 Ketik "Bearer" diikuti spasi dan token JWT. Contoh: "Bearer eyJhbGciOi..."

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
