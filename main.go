package main

import (
	"fmt"
	"os"

	"github.com/Ucokgreget/backend-idle/database"
	"github.com/Ucokgreget/backend-idle/models"
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

	if len(os.Args) > 1 && os.Args[1] == "seed" {
		database.Seed(db)
		return
	}

	router := gin.Default()

	router.GET("/hello", func(c *gin.Context) {
		c.String(200, "hello")
	})

	if err := router.Run(":8080"); err != nil {
		fmt.Println("failed to start server", err.Error())
	}
}
